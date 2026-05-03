# AICodeStudio Hardening Worklog

## Initial Assessment (Task 0)

### Build Status
- **Build**: PASSES (Next.js 16.1.3 / Turbopack)
- **Lint**: 6 warnings, 0 errors
  - Unused eslint-disable directives (5)
  - Missing aria-selected on treeitem (1)

### Critical Security Issues Found
1. **Git API** (`/api/git`): Accepts arbitrary `workDir` from body/query, no path sandboxing
2. **Docker API** (`/api/docker`): Falls back to `localhost:2375` (unencrypted TCP), no auth, no flag
3. **Database API** (`/api/database`): Uses `$queryRawUnsafe`/`$executeRawUnsafe`, no write protection
4. **AI API** (`/api/ai`): Accepts `apiKey` from client body and passes it to SDK
5. **Zustand Persist**: Stores `aiProviders` (with apiKey), `githubToken`, `dbConnections` (with credentials) in localStorage

### README vs Code Inconsistencies
1. **Terminal**: README promises "real PTY", code is placeholder (session in-memory, no node-pty)
2. **LSP**: Code simulates servers, diagnostics, completions, hover - not real LSP
3. **Database**: Only SQLite works via Prisma, other DBs return placeholder
4. **Version**: package.json = 2.0.0, UI shows "v1.0.0" in 7+ places

### PWA Issues
- `next.config.ts` uses `output: "standalone"` (needs server)
- README links to GitHub Pages (needs `output: "export"`)
- `manifest.json` `start_url` and `scope` are `/` (needs `/AICodeStudio` for Pages)
- No separate build scripts for static vs server mode
