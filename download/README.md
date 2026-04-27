<p align="center">
  <img src="public/logo.svg" alt="AICodeStudio" width="100" height="100" />
</p>

<h1 align="center">AICodeStudio</h1>

<p align="center">
  <strong>Next-Generation AI-Powered IDE</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/version-1.0.0-ffffff?style=for-the-badge&labelColor=000000&color=000000" alt="Version" />
  <img src="https://img.shields.io/badge/license-MIT-ffffff?style=for-the-badge&labelColor=000000&color=000000" alt="License" />
  <img src="https://img.shields.io/badge/Next.js-16-ffffff?style=for-the-badge&logo=next.js&labelColor=000000&color=000000" alt="Next.js" />
  <img src="https://img.shields.io/badge/TypeScript-5-ffffff?style=for-the-badge&logo=typescript&labelColor=000000&color=000000" alt="TypeScript" />
  <img src="https://img.shields.io/badge/PWA-Ready-ffffff?style=for-the-badge&labelColor=000000&color=000000" alt="PWA" />
</p>

<p align="center">
  <img src="https://img.shields.io/badge/OpenClaw-Integrated-3fb950?style=flat-square&labelColor=000000" alt="OpenClaw" />
  <img src="https://img.shields.io/badge/Hermes-Ready-ffd93d?style=flat-square&labelColor=000000" alt="Hermes" />
  <img src="https://img.shields.io/badge/GitHub-Connected-8b949e?style=flat-square&logo=github&labelColor=000000" alt="GitHub" />
  <img src="https://img.shields.io/badge/Monaco_Editor-Core-ffffff?style=flat-square&logo=visual-studio-code&labelColor=000000" alt="Monaco" />
</p>

<p align="center">
  <a href="#-features">Features</a> ·
  <a href="#-install">Install</a> ·
  <a href="#-quick-start">Quick Start</a> ·
  <a href="#-architecture">Architecture</a> ·
  <a href="#-ai-providers">AI Providers</a> ·
  <a href="#-contributing">Contributing</a>
</p>

---

<img src="public/social-banner.svg" alt="AICodeStudio Banner" width="100%" />

---

## ✦ Features

### Core Editor
- **Monaco Editor** — The same editor core that powers VSCode, with full syntax highlighting, IntelliSense, bracket matching, and code folding
- **Multi-tab support** — Open, edit, and switch between multiple files with tab indicators for modified state
- **Command Palette** — `Ctrl+Shift+P` to access all commands instantly, just like VSCode
- **File Explorer** — Hierarchical tree view with folder expand/collapse and file icons colored by language

### AI Integration
- **OpenClaw** — Connect to OpenClaw AI for code explanations, refactoring suggestions, and bug detection
- **Hermes** — Alternative AI provider for quick code analysis and architecture recommendations
- **Provider Switching** — Seamlessly switch between AI providers within the same chat session
- **Context-Aware Chat** — Interactive AI assistant panel with quick-action buttons and real-time responses

### TODO System
- **Task Management** — Built-in TODO panel with priority levels (low/medium/high) and completion tracking
- **Agent Integration** — AI agent tasks appear automatically in the TODO panel
- **Source Tracking** — Each task shows whether it was created by the user or the AI agent
- **Smart Filters** — Filter by all/active/completed tasks, clear completed in one click

### GitHub Integration
- **Clone Repositories** — Clone any GitHub repository directly from the IDE with a single input
- **Trending Repos** — Discover trending open-source projects without leaving the editor
- **Source Control** — Built-in Git status panel with change tracking, staging, and commit workflow

### Desktop App (PWA)
- **Install as Desktop App** — AICodeStudio is a Progressive Web App that can be installed on your desktop like VSCode
- **Standalone Mode** — Runs in its own window without browser chrome, just like a native application
- **Offline Capable** — Core functionality works even without an internet connection
- **Auto Updates** — Gets updated silently in the background

### Developer Experience
- **Integrated Terminal** — Full terminal emulator with command history, `help` system, and common shell commands
- **Output & Problems Panel** — Dedicated panels for build output, diagnostics, and debug sessions
- **Extensions Marketplace** — Browse and install extensions to enhance your workflow
- **Settings Panel** — Configure editor preferences including font size, tab size, minimap, and more

### Design Philosophy
- **Black & White** — Pure monochrome design: black surfaces with white accents. Zero color noise
- **ASCII Art Background** — Subtle ASCII banner in the welcome screen adds a hacker-era modernist touch
- **Minimalist UI** — Every pixel serves a purpose; no visual noise, no distractions
- **Custom Scrollbars** — Thin, translucent white-tinted scrollbars that match the overall theme

---

## ⚡ Install

AICodeStudio can be installed as a desktop application:

1. Open AICodeStudio in Chrome, Edge, or any Chromium-based browser
2. Click the **install icon** in the address bar (or the three-dot menu → "Install AICodeStudio")
3. The app will install and open in its own window — just like VSCode!

**Supported browsers:** Chrome, Edge, Brave, Arc, and any Chromium-based browser with PWA support.

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** >= 18
- **Bun** >= 1.0 (recommended) or npm/yarn/pnpm

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/AICodeStudio.git
cd AICodeStudio

# Install dependencies
bun install

# Start the development server
bun dev
```

The IDE will be available at `http://localhost:3000`.

### Building for Production

```bash
bun run build
bun start
```

---

## 🏗 Architecture

```
AICodeStudio/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── page.tsx            # Main IDE entry point
│   │   ├── layout.tsx          # Root layout with PWA metadata
│   │   └── globals.css         # Global styles & B&W theme
│   ├── components/
│   │   ├── ide/
│   │   │   ├── ide-main.tsx    # Main IDE layout orchestrator
│   │   │   ├── activity-bar.tsx# Left icon bar with TODO badge
│   │   │   ├── sidebar-panel.tsx# Sidebar panel router
│   │   │   ├── file-tree.tsx   # File explorer with tree view
│   │   │   ├── search-panel.tsx# Search across files
│   │   │   ├── git-panel.tsx   # Source control panel
│   │   │   ├── todos-panel.tsx # TODO task management
│   │   │   ├── ai-chat.tsx     # AI assistant (OpenClaw + Hermes)
│   │   │   ├── github-panel.tsx# GitHub integration
│   │   │   ├── extensions-panel.tsx# Extensions marketplace
│   │   │   ├── editor-area.tsx # Monaco Editor with tabs
│   │   │   ├── terminal-panel.tsx# Integrated terminal
│   │   │   ├── bottom-panel.tsx# Terminal/Output/Problems/Debug
│   │   │   ├── status-bar.tsx  # Bottom status bar
│   │   │   └── command-palette.tsx# Command palette overlay
│   │   └── ui/                 # shadcn/ui component library
│   ├── store/
│   │   └── ide-store.ts        # Zustand global state (with TODOs)
│   └── lib/                    # Utilities
├── public/
│   ├── manifest.json           # PWA manifest
│   ├── logo.svg                # Vectorized B&W logo
│   ├── social-banner.svg       # Social media banner
│   └── icons/                  # PWA icons (192px, 512px)
├── prisma/                     # Database schema
└── package.json
```

### Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 |
| Editor | Monaco Editor |
| State | Zustand |
| Styling | Tailwind CSS 4 |
| UI Components | shadcn/ui |
| Icons | Lucide React |
| PWA | next-pwa + Web App Manifest |
| Database | Prisma ORM (SQLite) |

---

## 🤖 AI Providers

### OpenClaw

```typescript
{
  provider: 'openclaw',
  endpoint: 'https://api.openclaw.dev/v1',
  model: 'openclaw-4',
  apiKey: 'your-api-key'
}
```

**Capabilities:** Code explanation, intelligent refactoring, bug detection, performance optimization

### Hermes

```typescript
{
  provider: 'hermes',
  endpoint: 'https://api.hermes.ai/v1',
  model: 'hermes-pro',
  apiKey: 'your-api-key'
}
```

**Capabilities:** Rapid code review, architecture patterns, security scanning, dependency analysis

---

## ⌨ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+Shift+P` | Command Palette |
| `Ctrl+Shift+F` | Search in Files |
| `Ctrl+Shift+G` | Source Control |
| `Ctrl+Shift+A` | AI Assistant |
| `Ctrl+Shift+X` | Extensions |
| `Ctrl+`` ` | Toggle Terminal |
| `Ctrl+,` | Settings |

---

## 🎨 Color System

AICodeStudio uses a strict black & white monochrome design system:

| Token | Hex | Usage |
|-------|-----|-------|
| Deepest | `#0a0e14` | Main background |
| Surface | `#0d1117` | Panels, cards |
| Elevated | `#161b22` | Hover states, popovers |
| Border | `rgba(255,255,255,0.06)` | Subtle dividers |
| Text | `#e6edf3` | Primary text |
| Text Secondary | `#8b949e` | Labels, descriptions |
| Text Muted | `#484f58` | Placeholder, hints |
| Text Dim | `#30363d` | Metadata |
| Accent | `#ffffff` | Active indicators, highlights |

---

## 🤝 Contributing

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

---

## 📄 License

MIT License — see the [LICENSE](LICENSE) file for details.

---

<p align="center">
  <code style="color: #fff;">Built with ◆ monochrome precision</code>
</p>
