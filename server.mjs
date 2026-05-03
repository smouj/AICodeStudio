#!/usr/bin/env node

/**
 * AICodeStudio — Full Server Mode
 *
 * Starts the Next.js server alongside the PTY WebSocket server.
 * This is the entry point for "server mode" deployments that
 * support real terminals, Docker, database, etc.
 *
 * Usage:
 *   node server.mjs
 *
 * Environment:
 *   PORT               — HTTP port (default 3000)
 *   PTY_WS_PORT        — WebSocket port for PTY (default 3003)
 *   AICODE_ENABLE_TERMINAL — Must be "true" to start PTY server
 *   AICODE_ENABLE_DOCKER   — Set "true" + DOCKER_HOST for Docker
 *   WORKSPACE_DIR      — Root directory for file operations
 */

import { spawn } from 'child_process'
import { createServer } from 'http'

const HTTP_PORT = parseInt(process.env.PORT || '3000', 10)

console.log('[AICodeStudio] Starting in server mode...')
console.log(`[AICodeStudio] HTTP port: ${HTTP_PORT}`)

// ─── Start Next.js ──────────────────────────────────────────────────────────

const nextProcess = spawn('node', ['node_modules/.bin/next', 'start', '-p', String(HTTP_PORT)], {
  stdio: 'inherit',
  env: { ...process.env },
})

nextProcess.on('error', (err) => {
  console.error('[AICodeStudio] Failed to start Next.js:', err.message)
  process.exit(1)
})

nextProcess.on('exit', (code) => {
  console.log(`[AICodeStudio] Next.js exited with code ${code}`)
  process.exit(code || 0)
})

// ─── Start PTY WebSocket server (optional) ─────────────────────────────────

if (process.env.AICODE_ENABLE_TERMINAL === 'true') {
  console.log('[AICodeStudio] Terminal PTY enabled, starting WebSocket server...')

  const ptyProcess = spawn('node', ['--experimental-strip-types', 'server/pty-ws-server.ts'], {
    stdio: 'inherit',
    env: { ...process.env },
  })

  ptyProcess.on('error', (err) => {
    console.warn('[AICodeStudio] PTY server failed to start:', err.message)
    console.warn('[AICodeStudio] Terminal will use virtual/simulated mode instead.')
  })

  ptyProcess.on('exit', (code) => {
    if (code !== 0) {
      console.warn(`[AICodeStudio] PTY server exited with code ${code}. Terminal will use virtual mode.`)
    }
  })

  // Clean up PTY server when Next.js exits
  process.on('SIGINT', () => {
    ptyProcess.kill('SIGINT')
    nextProcess.kill('SIGINT')
  })
  process.on('SIGTERM', () => {
    ptyProcess.kill('SIGTERM')
    nextProcess.kill('SIGTERM')
  })
} else {
  console.log('[AICodeStudio] Terminal PTY disabled (virtual mode). Set AICODE_ENABLE_TERMINAL=true to enable.')
}

console.log('[AICodeStudio] Server mode ready.')
