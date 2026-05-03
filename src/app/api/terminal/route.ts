import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { z } from 'zod';
import { assertInsideWorkspaceRoot, getWorkspaceRoot } from '@/lib/security/path-sandbox';

// ---------------------------------------------------------------------------
// Terminal Sessions API
//
// When AICODE_ENABLE_TERMINAL=true and node-pty is available, sessions
// connect to a real PTY via WebSocket (server/pty-ws-server.ts).
// Otherwise, sessions are virtual/simulated.
//
// SECURITY:
//   - Shell is allowlisted to prevent arbitrary executable execution
//   - cwd is sandboxed to WORKSPACE_DIR to prevent filesystem traversal
//   - Session IDs are UUIDs to prevent guessing
//   - Maximum 10 concurrent sessions
// ---------------------------------------------------------------------------

function isTerminalEnabled(): boolean {
  return process.env.AICODE_ENABLE_TERMINAL === 'true';
}

const ALLOWED_SHELLS = [
  '/bin/bash', '/bin/zsh', '/bin/sh', '/bin/fish', '/bin/dash',
  '/usr/bin/bash', '/usr/bin/zsh', '/usr/bin/sh', '/usr/bin/fish', '/usr/bin/dash',
  'powershell.exe', 'cmd.exe',
];

const MAX_SESSIONS = 10;

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

// ─── Zod Schemas ────────────────────────────────────────────────────────────

const postBodySchema = z.object({
  shell: z.enum(ALLOWED_SHELLS as unknown as [string, ...string[]]).default('/bin/bash'),
  cwd: z.string().max(500).optional(),
  cols: z.number().int().min(10).max(300).default(80),
  rows: z.number().int().min(5).max(100).default(24),
});

const deleteQuerySchema = z.object({
  sessionId: z.string().uuid('Invalid session ID format'),
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

    // Sandbox cwd to workspace root
    let cwd: string;
    try {
      cwd = body.cwd
        ? assertInsideWorkspaceRoot(body.cwd)
        : getWorkspaceRoot();
    } catch (err) {
      return NextResponse.json(
        { error: (err as Error).message },
        { status: 400 }
      );
    }

    // Session limit
    if (sessions.size >= MAX_SESSIONS) {
      return NextResponse.json(
        { error: `Maximum terminal sessions (${MAX_SESSIONS}) reached. Close a session first.` },
        { status: 429 }
      );
    }

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
    const wsPort = process.env.PTY_WS_PORT || '3003';

    return NextResponse.json({
      success: true,
      session: {
        id: sessionId,
        shell,
        cwd,
        cols: body.cols,
        rows: body.rows,
        status: session.status,
        createdAt: session.createdAt,
        mode: isReal ? 'real-pty' : 'virtual',
        websocketUrl: isReal ? `ws://localhost:${wsPort}/terminal?session=${sessionId}&shell=${encodeURIComponent(shell)}&cwd=${encodeURIComponent(cwd)}&cols=${body.cols}&rows=${body.rows}` : null,
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
        pid: s.pid,
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
    const parsed = deleteQuerySchema.parse({
      sessionId: searchParams.get('sessionId') || '',
    });

    const session = sessions.get(parsed.sessionId);
    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    session.status = 'closed';
    sessions.delete(parsed.sessionId);

    return NextResponse.json({
      success: true,
      message: `Session ${parsed.sessionId} closed`,
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
      { error: `Failed to close session: ${message}` },
      { status: 500 }
    );
  }
}
