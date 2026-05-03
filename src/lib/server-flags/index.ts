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

  // Check TLS safety (mirrors docker/route.ts isDockerTlsSafe logic)
  const isSafeTransport = host.startsWith('unix://') || host.startsWith('/') || host.startsWith('https://')

  if (isSafeTransport) {
    return { enabled: true, status: 'enabled', reason: 'Docker is enabled with a secure connection.' }
  }

  // Unencrypted TCP — check if localhost vs remote
  const isTcp = host.startsWith('tcp://') || host.startsWith('http://')
  if (!isTcp) {
    // Unknown protocol — could be a parseable host:port
    return { enabled: true, status: 'enabled', reason: 'Docker is enabled.' }
  }

  try {
    const url = new URL(host.startsWith('tcp://') ? host.replace('tcp://', 'http://') : host)
    const isLocal = url.hostname === 'localhost' || url.hostname === '127.0.0.1' || url.hostname === '::1'

    if (!isLocal) {
      // Non-localhost unencrypted TCP is ALWAYS blocked
      return {
        enabled: false,
        status: 'unavailable',
        reason: `Docker is using unencrypted TCP on ${url.host} (non-localhost). This is blocked for security. Use HTTPS, SSH tunnel, or a Unix socket.`,
      }
    }

    // Localhost unencrypted TCP requires explicit opt-in
    if (process.env.AICODE_DOCKER_ALLOW_UNSAFE !== 'true') {
      return {
        enabled: false,
        status: 'unavailable',
        reason: `Docker is using unencrypted TCP on ${url.host}. Set AICODE_DOCKER_ALLOW_UNSAFE=true to acknowledge the risk, or use a Unix socket / HTTPS.`,
      }
    }

    return {
      enabled: true,
      status: 'enabled',
      reason: 'Docker is enabled with unencrypted localhost TCP (AICODE_DOCKER_ALLOW_UNSAFE=true). Consider using a Unix socket or HTTPS for production.',
    }
  } catch {
    return {
      enabled: false,
      status: 'unavailable',
      reason: 'Cannot parse DOCKER_HOST URL. Use tcp://, unix://, or https:// format.',
    }
  }
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
