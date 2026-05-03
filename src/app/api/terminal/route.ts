import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { z } from 'zod';

// ---------------------------------------------------------------------------
// Terminal Sessions API
//
// STATUS: This is a VIRTUAL TERMINAL — session metadata is tracked in-memory
// but no real PTY process is spawned. A real PTY requires:
//   - AICODE_ENABLE_TERMINAL=true
//   - A Node.js server (not static export)
//   - node-pty installed
//   - A WebSocket server for I/O
//
// When AICODE_ENABLE_TERMINAL is not set, the API returns simulated status
// so the UI can display appropriate messaging.
// ---------------------------------------------------------------------------

function isTerminalEnabled(): boolean {
  return process.env.AICODE_ENABLE_TERMINAL === 'true';
}

// In-memory store for active PTY sessions
const sessions = new Map<string, TerminalSession>();

interface TerminalSession {
  id: string;
  createdAt: number;
  shell: string;
  cwd: string;
  status: 'active' | 'closed';
  pid?: number;
}

// ─── Zod Schemas ─────────────────────────────────────────────────────────────

const postBodySchema = z.object({
  shell: z.string().default('/bin/bash'),
  cwd: z.string().optional(),
  cols: z.number().int().min(10).max(300).default(80),
  rows: z.number().int().min(5).max(100).default(24),
});

/**
 * POST /api/terminal
 * Create a new terminal session.
 */
export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.json().catch(() => ({}));
    const body = postBodySchema.parse(rawBody);
    const shell = body.shell;
    const cwd = body.cwd || process.env.WORKSPACE_DIR || process.env.HOME || '/tmp';
    const cols = body.cols;
    const rows = body.rows;

    const sessionId = randomUUID();

    const session: TerminalSession = {
      id: sessionId,
      createdAt: Date.now(),
      shell,
      cwd,
      status: 'active',
    };

    sessions.set(sessionId, session);

    const isReal = isTerminalEnabled();

    return NextResponse.json({
      success: true,
      session: {
        id: sessionId,
        shell,
        cwd,
        cols,
        rows,
        status: session.status,
        createdAt: session.createdAt,
        mode: isReal ? 'real-pty' : 'virtual',
        websocketUrl: isReal ? `/?XTransformPort=3003&session=${sessionId}` : null,
      },
      message: isReal
        ? 'PTY session created. Connect to the WebSocket endpoint for I/O.'
        : 'Virtual terminal session created. This is a simulated terminal — no real PTY is attached. ' +
          'Set AICODE_ENABLE_TERMINAL=true with a running Node.js server and node-pty to enable a real terminal.',
    });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request', details: error.issues },
        { status: 400 }
      );
    }
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Failed to create terminal session: ${message}` },
      { status: 500 }
    );
  }
}

/**
 * GET /api/terminal
 * List all active terminal sessions.
 */
export async function GET() {
  try {
    const activeSessions = Array.from(sessions.values())
      .filter((s) => s.status === 'active')
      .map((s) => ({
        id: s.id,
        shell: s.shell,
        cwd: s.cwd,
        status: s.status,
        createdAt: s.createdAt,
      }));

    return NextResponse.json({
      success: true,
      sessions: activeSessions,
      total: activeSessions.length,
      mode: isTerminalEnabled() ? 'real-pty' : 'virtual',
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Failed to list sessions: ${message}` },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/terminal
 * Close a terminal session.
 */
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json(
        { error: 'sessionId query parameter is required' },
        { status: 400 }
      );
    }

    const session = sessions.get(sessionId);
    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    session.status = 'closed';
    sessions.delete(sessionId);

    return NextResponse.json({
      success: true,
      message: `Session ${sessionId} closed`,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Failed to close session: ${message}` },
      { status: 500 }
    );
  }
}
