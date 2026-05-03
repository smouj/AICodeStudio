# AICodeStudio Deployment Guide

## Two Deployment Modes

AICodeStudio supports two deployment modes. Choose the one that fits your needs.

### Mode A: Static Demo (GitHub Pages)

A static demo suitable for showcasing the IDE. Server-side features (Docker, Terminal PTY, real LSP, Git server operations, database queries) are **not available** in this mode.

```bash
# Build for GitHub Pages
npm run build:static

# The output will be in the `out/` directory.
# Deploy the `out/` directory to GitHub Pages.
```

Configuration for GitHub Pages:
- `next.config.ts` uses `output: "export"` and `basePath: "/AICodeStudio"`
- The `BUILD_MODE=static` environment variable triggers this mode

What works in static demo mode:
- Monaco Editor (full)
- Virtual File System
- AI Chat (if provider is configured in the browser)
- Extensions marketplace (read-only, via Open VSX API)
- Theme switching
- PWA installation

What does NOT work in static demo mode:
- Docker management
- Terminal (real PTY)
- LSP (real language servers)
- Git server operations (push/pull/commit via API)
- Database queries
- Collaboration rooms

### Mode B: Full IDE Server

A complete IDE experience with all features enabled via environment flags.

```bash
# Build for server deployment
npm run build:server

# Start the server
npm start
# Or with custom env:
AICODE_ENABLE_DOCKER=true DOCKER_HOST=unix:///var/run/docker.sock npm start
```

## Environment Variables

See `.env.example` for the full list of configuration options.

### Required for Full Server Mode
| Variable | Description |
|----------|-------------|
| `WORKSPACE_DIR` | Root directory for file/git operations (sandbox boundary) |
| `DATABASE_URL` | Prisma database URL (default: `file:./db/aicodestudio.db`) |

### Optional Feature Flags
| Variable | Default | Description |
|----------|---------|-------------|
| `AICODE_ENABLE_DOCKER` | `false` | Enable Docker integration |
| `DOCKER_HOST` | — | Docker daemon URL (required if Docker enabled) |
| `AICODE_ENABLE_TERMINAL` | `false` | Enable real PTY terminal |
| `AICODE_ENABLE_LSP` | `false` | Enable real language servers |
| `AICODE_DB_WRITE_ENABLED` | `false` | Allow write operations on database |
| `AICODE_DB_ROW_LIMIT` | `1000` | Maximum rows returned by SELECT |
| `AICODE_DB_TIMEOUT_MS` | `5000` | Query timeout in milliseconds |

## Docker Deployment

If you want to run AICodeStudio inside Docker:

```dockerfile
FROM node:20-slim
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY . .
RUN npx prisma generate
RUN npm run build:server
EXPOSE 3000
ENV NODE_ENV=production
CMD ["node", ".next/standalone/server.js"]
```

## Health Check

The `/api/capabilities` endpoint returns the current server status and can be used as a health check:

```bash
curl http://localhost:3000/api/capabilities
```

Response includes:
- `version`: Current app version
- `mode`: "server" or "static-demo"
- `capabilities`: Status of each feature
