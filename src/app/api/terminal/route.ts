import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';

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

/**
 * POST /api/terminal
 * Create a new PTY session.
 * In a real implementation, this would spawn a node-pty process on a dedicated
 * WebSocket server. Here we return session info so the client can connect
 * through a WebSocket mini-service.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const shell = body.shell || '/bin/bash';
    const cwd = body.cwd || process.env.HOME || '/tmp';
    const cols = body.cols || 80;
    const rows = body.rows || 24;

    const sessionId = randomUUID();

    const session: TerminalSession = {
      id: sessionId,
      createdAt: Date.now(),
      shell,
      cwd,
      status: 'active',
    };

    sessions.set(sessionId, session);

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
        // The client should connect to the WebSocket mini-service for I/O
        websocketUrl: `/?XTransformPort=3003&session=${sessionId}`,
      },
      message:
        'PTY session created. Connect to the WebSocket endpoint for I/O. ' +
        'A real PTY requires a Node.js server with node-pty — this is a placeholder.',
    });
  } catch (error: unknown) {
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
