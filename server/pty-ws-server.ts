/**
 * AICodeStudio — PTY WebSocket Server
 *
 * Spawns real terminal processes via node-pty and exposes them
 * over WebSocket connections for the browser-based terminal.
 *
 * Usage:
 *   AICODE_ENABLE_TERMINAL=true node server/pty-ws-server.mjs
 *
 * Environment:
 *   PTY_WS_PORT       — WebSocket server port (default 3003)
 *   WORKSPACE_DIR     — Root directory for sandboxing (default: cwd)
 *   AICODE_ENABLE_TERMINAL — Must be "true" to start
 *
 * Protocol:
 *   Client connects:     ws://localhost:3003/terminal?session=<uuid>
 *   Client sends:        { type: 'input', data: string }
 *                        { type: 'resize', cols: number, rows: number }
 *   Server sends:        { type: 'output', data: string }
 *                        { type: 'exit', code: number }
 */

import { WebSocketServer, WebSocket } from 'ws'
import { randomUUID } from 'crypto'
import path from 'path'

// ─── Configuration ──────────────────────────────────────────────────────────

const PORT = parseInt(process.env.PTY_WS_PORT || '3003', 10)
const WORKSPACE_ROOT = path.resolve(process.env.WORKSPACE_DIR || process.cwd())

const ALLOWED_SHELLS = [
  '/bin/bash', '/bin/zsh', '/bin/sh', '/bin/fish', '/bin/dash',
  '/usr/bin/bash', '/usr/bin/zsh', '/usr/bin/sh', '/usr/bin/fish', '/usr/bin/dash',
  'powershell.exe', 'cmd.exe',
]

const MAX_SESSIONS = 10
const MAX_INPUT_SIZE = 64 * 1024 // 64 KB per message

// ─── Session Store ──────────────────────────────────────────────────────────

interface PtySession {
  id: string
  pty: { pid: number; write: (data: string) => void; resize: (cols: number, rows: number) => void; kill: () => void; onData: (cb: (data: string) => void) => void; onExit: (cb: (e: { exitCode: number }) => void) => void }
  ws: WebSocket | null
  createdAt: number
  shell: string
  cwd: string
}

const sessions = new Map<string, PtySession>()

// ─── Path Sandboxing ────────────────────────────────────────────────────────

function assertInsideWorkspace(target: string): string {
  const resolved = path.resolve(WORKSPACE_ROOT, target)
  if (!resolved.startsWith(WORKSPACE_ROOT + path.sep) && resolved !== WORKSPACE_ROOT) {
    throw new Error(`Path traversal blocked: "${target}" resolves outside workspace root`)
  }
  return resolved
}

// ─── PTY Spawning ───────────────────────────────────────────────────────────

async function spawnPty(
  sessionId: string,
  shell: string,
  cwd: string,
  cols: number,
  rows: number,
): Promise<PtySession['pty']> {
  try {
    const pty = await import('node-pty')
    const ptyProcess = pty.spawn(shell, [], {
      name: 'xterm-256color',
      cols,
      rows,
      cwd,
      env: {
        ...process.env,
        TERM: 'xterm-256color',
        COLORTERM: 'truecolor',
      } as Record<string, string>,
    })

    return ptyProcess as PtySession['pty']
  } catch (err) {
    throw new Error(
      `Failed to spawn PTY: ${(err as Error).message}. ` +
      `Ensure node-pty is installed: npm install node-pty`
    )
  }
}

// ─── WebSocket Server ───────────────────────────────────────────────────────

const wss = new WebSocketServer({ port: PORT, path: '/terminal' })

wss.on('connection', async (ws, req) => {
  const url = new URL(req.url || '', `http://localhost:${PORT}`)
  const requestedSession = url.searchParams.get('session')
  const shell = url.searchParams.get('shell') || '/bin/bash'
  const cwdParam = url.searchParams.get('cwd') || ''
  const cols = parseInt(url.searchParams.get('cols') || '80', 10)
  const rows = parseInt(url.searchParams.get('rows') || '24', 10)

  // ── Validate shell ──
  if (!ALLOWED_SHELLS.includes(shell)) {
    ws.send(JSON.stringify({
      type: 'error',
      data: `Shell "${shell}" is not allowed. Allowed: ${ALLOWED_SHELLS.join(', ')}`,
    }))
    ws.close(4003, 'Shell not allowed')
    return
  }

  // ── Validate and sandbox cwd ──
  let cwd: string
  try {
    cwd = cwdParam ? assertInsideWorkspace(cwdParam) : WORKSPACE_ROOT
  } catch (err) {
    ws.send(JSON.stringify({
      type: 'error',
      data: (err as Error).message,
    }))
    ws.close(4003, 'CWD not allowed')
    return
  }

  // ── Session limit ──
  if (sessions.size >= MAX_SESSIONS) {
    ws.send(JSON.stringify({
      type: 'error',
      data: `Maximum terminal sessions (${MAX_SESSIONS}) reached. Close a session first.`,
    }))
    ws.close(4003, 'Max sessions reached')
    return
  }

  // ── Create session ──
  const sessionId = requestedSession || randomUUID()

  try {
    const ptyProcess = await spawnPty(sessionId, shell, cwd, cols, rows)

    const session: PtySession = {
      id: sessionId,
      pty: ptyProcess,
      ws,
      createdAt: Date.now(),
      shell,
      cwd,
    }

    sessions.set(sessionId, session)

    // Send session info
    ws.send(JSON.stringify({
      type: 'session',
      id: sessionId,
      shell,
      cwd,
      pid: ptyProcess.pid,
    }))

    // Pipe PTY output → WebSocket
    ptyProcess.onData((data: string) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'output', data }))
      }
    })

    // Handle PTY exit
    ptyProcess.onExit(({ exitCode }: { exitCode: number }) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'exit', code: exitCode }))
      }
      sessions.delete(sessionId)
    })

    // Handle WebSocket messages → PTY input
    ws.on('message', (raw: Buffer, isBinary: boolean) => {
      if (isBinary) return

      const msgStr = raw.toString()
      if (msgStr.length > MAX_INPUT_SIZE) return

      try {
        const msg = JSON.parse(msgStr)

        switch (msg.type) {
          case 'input':
            if (typeof msg.data === 'string') {
              ptyProcess.write(msg.data)
            }
            break
          case 'resize':
            if (typeof msg.cols === 'number' && typeof msg.rows === 'number') {
              ptyProcess.resize(
                Math.max(10, Math.min(300, msg.cols)),
                Math.max(5, Math.min(100, msg.rows)),
              )
            }
            break
        }
      } catch {
        // Ignore malformed messages
      }
    })

    // Clean up on disconnect
    ws.on('close', () => {
      session.ws = null
      try {
        ptyProcess.kill()
      } catch {
        // Process may already be dead
      }
      sessions.delete(sessionId)
    })

    console.log(`[PTY] Session ${sessionId} created (shell=${shell}, cwd=${cwd}, pid=${ptyProcess.pid})`)
  } catch (err) {
    ws.send(JSON.stringify({
      type: 'error',
      data: (err as Error).message,
    }))
    ws.close(1011, 'PTY spawn failed')
  }
})

// ─── Cleanup on process exit ────────────────────────────────────────────────

process.on('SIGINT', () => {
  for (const [id, session] of sessions) {
    try {
      session.pty.kill()
    } catch {
      // Ignore
    }
  }
  sessions.clear()
  wss.close()
  process.exit(0)
})

process.on('SIGTERM', () => {
  for (const [id, session] of sessions) {
    try {
      session.pty.kill()
    } catch {
      // Ignore
    }
  }
  sessions.clear()
  wss.close()
  process.exit(0)
})

console.log(`[PTY] WebSocket server running on ws://localhost:${PORT}/terminal`)
console.log(`[PTY] Workspace root: ${WORKSPACE_ROOT}`)
console.log(`[PTY] Allowed shells: ${ALLOWED_SHELLS.join(', ')}`)
console.log(`[PTY] Max sessions: ${MAX_SESSIONS}`)
