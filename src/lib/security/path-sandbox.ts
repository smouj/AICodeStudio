/**
 * Path Sandboxing Utilities
 *
 * All server-side APIs that accept file-system paths MUST use these helpers
 * to ensure the resolved path never escapes the configured workspace root.
 *
 * SECURITY: This is the primary defense against path-traversal attacks.
 */

import path from 'path'

/** Resolved workspace root – falls back to cwd if WORKSPACE_DIR is not set. */
export function getWorkspaceRoot(): string {
  return path.resolve(process.env.WORKSPACE_DIR || process.cwd())
}

/**
 * Resolve a user-supplied path relative to the workspace root and verify
 * it stays inside. Throws if the resolved path escapes the workspace.
 */
export function assertInsideWorkspaceRoot(target: string, workspaceRoot?: string): string {
  const root = workspaceRoot || getWorkspaceRoot()
  const resolved = path.resolve(root, target)

  if (!resolved.startsWith(root + path.sep) && resolved !== root) {
    throw new Error(
      `Path traversal blocked: "${target}" resolves to "${resolved}" which is outside workspace root "${root}".`
    )
  }

  return resolved
}

/**
 * Convenience: resolve + assert in one call.
 * Returns the safe, absolute path or throws.
 */
export function safeResolve(base: string, ...segments: string[]): string {
  const root = getWorkspaceRoot()
  const resolved = path.resolve(base, ...segments)

  if (!resolved.startsWith(root + path.sep) && resolved !== root) {
    throw new Error(
      `Path traversal blocked: resolved path "${resolved}" is outside workspace root "${root}".`
    )
  }

  return resolved
}
