# AICodeStudio Security Policy

## Reporting Security Vulnerabilities

If you discover a security vulnerability, please report it privately by opening a GitHub Security Advisory or contacting the maintainers directly. Do not file public issues for security bugs.

## Security Architecture

### Principle of Least Privilege
All server-side features are **disabled by default** and must be explicitly enabled via environment variables.

### Feature Flags

| Feature | Environment Variable | Default | Notes |
|---------|---------------------|---------|-------|
| Docker | `AICODE_ENABLE_DOCKER` + `DOCKER_HOST` | Disabled | Requires both to be set |
| Terminal PTY | `AICODE_ENABLE_TERMINAL` | Disabled (virtual) | Requires node-pty + Node.js server |
| LSP | `AICODE_ENABLE_LSP` | Disabled (simulated) | Requires installed language servers |
| Database Writes | `AICODE_DB_WRITE_ENABLED` | Disabled (read-only) | Only SELECT/WITH/PRAGMA allowed by default |

### Path Sandboxing
All file and git operations are sandboxed to `WORKSPACE_DIR`. Any path that resolves outside this directory is rejected. This prevents path traversal attacks.

### SQL Injection Protection
- The database API uses a SQL guard that blocks destructive statements by default.
- Only `SELECT`, `WITH`, `PRAGMA`, and `EXPLAIN` are allowed without `AICODE_DB_WRITE_ENABLED=true`.
- Row limits and timeouts are enforced.
- Table names in PRAGMA are validated with regex.

### API Key Handling
- API keys entered in the UI are **NOT persisted** to localStorage by default.
- The Zustand store's `partialize` function strips `apiKey`, `endpoint`, `githubToken`, and database credentials before saving.
- A migration (v0 → v1) automatically clears any previously persisted secrets.
- API keys are sent to your AICodeStudio instance via `/api/ai`. They are never sent to third-party servers by the application itself.

### Docker Security
- Docker integration is **disabled by default**.
- Requires explicit `AICODE_ENABLE_DOCKER=true` AND `DOCKER_HOST` to be set.
- TCP on port 2375 without TLS is **not recommended** and is strongly discouraged.
- Never expose Docker on a public-facing server without authentication, TLS, or a secure tunnel.

### Terminal Security
- By default, the terminal is **virtual/simulated** — no real shell process is spawned.
- A real PTY requires `AICODE_ENABLE_TERMINAL=true`, a Node.js server, and the `node-pty` package.
- When enabled, terminal sessions should be isolated per workspace with idle timeouts.

### Git Security
- Git operations are sandboxed to `WORKSPACE_DIR` via `assertInsideWorkspaceRoot`.
- Arbitrary `workDir` values that resolve outside the workspace are rejected.
- All inputs are validated with Zod schemas.

## Deployment Recommendations

1. **Never run AICodeStudio with Docker/Terminal enabled on a public server without authentication.**
2. Use `WORKSPACE_DIR` to restrict file system access.
3. Keep `AICODE_DB_WRITE_ENABLED` off unless you need database modifications.
4. Use HTTPS in production.
5. Rotate any API keys that may have been accidentally persisted in localStorage.
