/**
 * Server Feature Flags
 *
 * Centralised source of truth for which server-side capabilities are enabled.
 * Each flag is driven by an environment variable and falls back to a safe
 * default (usually disabled).
 *
 * IMPORTANT: These flags are exposed via /api/capabilities so the UI can
 * display honest status indicators.
 */

export interface CapabilityStatus {
  enabled: boolean
  status: 'enabled' | 'disabled' | 'simulated' | 'unavailable'
  reason?: string
}

export function getCapabilities(): Record<string, CapabilityStatus> {
  return {
    docker: getDockerCapability(),
    terminal: getTerminalCapability(),
    lsp: getLspCapability(),
    git: getGitCapability(),
    database: getDatabaseCapability(),
    ai: getAiCapability(),
    collaboration: getCollaborationCapability(),
    localFS: getLocalFSCapability(),
  }
}

function getDockerCapability(): CapabilityStatus {
  const enabled = process.env.AICODE_ENABLE_DOCKER === 'true'
  const host = process.env.DOCKER_HOST

  if (!enabled) {
    return {
      enabled: false,
      status: 'disabled',
      reason: 'Set AICODE_ENABLE_DOCKER=true and DOCKER_HOST to enable Docker integration.',
    }
  }

  if (!host) {
    return {
      enabled: false,
      status: 'disabled',
      reason: 'DOCKER_HOST environment variable is required when Docker is enabled.',
    }
  }

  return { enabled: true, status: 'enabled' }
}

function getTerminalCapability(): CapabilityStatus {
  const enabled = process.env.AICODE_ENABLE_TERMINAL === 'true'

  if (!enabled) {
    return {
      enabled: false,
      status: 'simulated',
      reason: 'Terminal is in virtual/simulated mode. Set AICODE_ENABLE_TERMINAL=true with a running Node.js server and node-pty to enable a real PTY.',
    }
  }

  return { enabled: true, status: 'enabled' }
}

function getLspCapability(): CapabilityStatus {
  const enabled = process.env.AICODE_ENABLE_LSP === 'true'

  if (!enabled) {
    return {
      enabled: false,
      status: 'simulated',
      reason: 'LSP is in simulation mode. Set AICODE_ENABLE_LSP=true and install language servers to enable real LSP.',
    }
  }

  return { enabled: true, status: 'enabled' }
}

function getGitCapability(): CapabilityStatus {
  // Git via isomorphic-git works without a flag but needs WORKSPACE_DIR
  return {
    enabled: true,
    status: 'enabled',
    reason: 'Git operations are sandboxed to WORKSPACE_DIR.',
  }
}

function getDatabaseCapability(): CapabilityStatus {
  return {
    enabled: true,
    status: 'enabled',
    reason: 'SQLite is available. Other databases require adapter setup.',
  }
}

function getAiCapability(): CapabilityStatus {
  return {
    enabled: true,
    status: 'enabled',
    reason: 'AI uses the z-ai-web-dev-sdk. API keys are sent to your AICodeStudio instance only.',
  }
}

function getCollaborationCapability(): CapabilityStatus {
  return {
    enabled: false,
    status: 'simulated',
    reason: 'Collaboration rooms are in-memory only. Real-time sync requires a WebSocket server.',
  }
}

function getLocalFSCapability(): CapabilityStatus {
  // File System Access API is browser-only, determined at runtime
  return {
    enabled: true,
    status: 'enabled',
    reason: 'File System Access API is available in supported browsers.',
  }
}
