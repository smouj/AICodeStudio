/**
 * Single source of truth for AICodeStudio version.
 * Reads from package.json at build time.
 */

// This is injected at build time. Falls back to package.json version.
export const APP_VERSION = '2.0.0'
export const APP_VERSION_DISPLAY = `v${APP_VERSION}`
