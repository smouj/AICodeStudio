<p align="center">
  <img src="public/logo.png" alt="AICodeStudio Logo" width="120" height="120" />
</p>

<h1 align="center">
  <code>AICodeStudio</code>
</h1>

<p align="center">
  <strong>Next-Generation AI-Powered IDE</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/version-1.0.0-00e5ff?style=for-the-badge&logo=code&logoColor=00e5ff&labelColor=0d1117" alt="Version" />
  <img src="https://img.shields.io/badge/license-MIT-00e5ff?style=for-the-badge&logo=open-source-initiative&logoColor=00e5ff&labelColor=0d1117" alt="License" />
  <img src="https://img.shields.io/badge/Next.js-16-00e5ff?style=for-the-badge&logo=next.js&logoColor=00e5ff&labelColor=0d1117" alt="Next.js" />
  <img src="https://img.shields.io/badge/TypeScript-5-00e5ff?style=for-the-badge&logo=typescript&logoColor=00e5ff&labelColor=0d1117" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Monaco_Editor-✓-00e5ff?style=for-the-badge&logo=visual-studio-code&logoColor=00e5ff&labelColor=0d1117" alt="Monaco" />
</p>

<p align="center">
  <img src="https://img.shields.io/badge/OpenClaw-Connected-3fb950?style=flat-square&labelColor=0d1117" alt="OpenClaw" />
  <img src="https://img.shields.io/badge/Hermes-Ready-f0883e?style=flat-square&labelColor=0d1117" alt="Hermes" />
  <img src="https://img.shields.io/badge/GitHub-Integrated-8b949e?style=flat-square&logo=github&labelColor=0d1117" alt="GitHub" />
  <img src="https://img.shields.io/badge/AI_Powered-✓-00e5ff?style=flat-square&labelColor=0d1117" alt="AI" />
</p>

<p align="center">
  <a href="#features">Features</a> ·
  <a href="#quick-start">Quick Start</a> ·
  <a href="#architecture">Architecture</a> ·
  <a href="#ai-providers">AI Providers</a> ·
  <a href="#contributing">Contributing</a>
</p>

---

<img src="public/screenshot.png" alt="AICodeStudio Screenshot" width="100%" />

---

## Features

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

### GitHub Integration
- **Clone Repositories** — Clone any GitHub repository directly from the IDE with a single input
- **Trending Repos** — Discover trending open-source projects without leaving the editor
- **Source Control** — Built-in Git status panel with change tracking, staging, and commit workflow

### Developer Experience
- **Integrated Terminal** — Full terminal emulator with command history, `help` system, and common shell commands
- **Output & Problems Panel** — Dedicated panels for build output, diagnostics, and debug sessions
- **Extensions Marketplace** — Browse and install extensions to enhance your workflow
- **Settings Panel** — Configure editor preferences including font size, tab size, minimap, and more

### Design Philosophy
- **Two-Color System** — Dark charcoal (`#0d1117`) base with electric cyan (`#00e5ff`) accent for a striking, focused aesthetic
- **ASCII Art Background** — Subtle ASCII banner in the welcome screen adds a hacker-era modernist touch
- **Minimalist UI** — Every pixel serves a purpose; no visual noise, no distractions
- **Custom Scrollbars** — Thin, translucent cyan-tinted scrollbars that match the overall theme

---

## Quick Start

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

## Architecture

```
AICodeStudio/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── page.tsx            # Main IDE entry point
│   │   ├── layout.tsx          # Root layout with metadata
│   │   └── globals.css         # Global styles & theme
│   ├── components/
│   │   ├── ide/
│   │   │   ├── ide-main.tsx    # Main IDE layout orchestrator
│   │   │   ├── activity-bar.tsx# Left icon bar (Explorer, Search, Git, AI, GitHub, Extensions)
│   │   │   ├── sidebar-panel.tsx# Sidebar panel router
│   │   │   ├── file-tree.tsx   # File explorer with tree view
│   │   │   ├── search-panel.tsx# Search across files
│   │   │   ├── git-panel.tsx   # Source control panel
│   │   │   ├── ai-chat.tsx     # AI assistant chat (OpenClaw + Hermes)
│   │   │   ├── github-panel.tsx# GitHub integration panel
│   │   │   ├── extensions-panel.tsx# Extensions marketplace
│   │   │   ├── editor-area.tsx # Monaco Editor with tabs
│   │   │   ├── terminal-panel.tsx# Integrated terminal
│   │   │   ├── bottom-panel.tsx# Terminal/Output/Problems/Debug tabs
│   │   │   ├── status-bar.tsx  # Bottom status bar
│   │   │   └── command-palette.tsx# Command palette overlay
│   │   └── ui/                 # shadcn/ui component library
│   ├── store/
│   │   └── ide-store.ts        # Zustand global state
│   └── lib/                    # Utilities
├── prisma/                     # Database schema
├── public/                     # Static assets
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
| Database | Prisma ORM (SQLite) |

---

## AI Providers

### OpenClaw

OpenClaw provides deep code understanding and generation capabilities:

```typescript
// Configure in AI Settings
{
  provider: 'openclaw',
  endpoint: 'https://api.openclaw.dev/v1',
  model: 'openclaw-4',
  apiKey: 'your-api-key'
}
```

**Capabilities:**
- Code explanation and documentation generation
- Intelligent refactoring suggestions
- Bug detection and fix proposals
- Performance optimization recommendations

### Hermes

Hermes offers fast, concise code analysis:

```typescript
// Configure in AI Settings
{
  provider: 'hermes',
  endpoint: 'https://api.hermes.ai/v1',
  model: 'hermes-pro',
  apiKey: 'your-api-key'
}
```

**Capabilities:**
- Rapid code review findings
- Architecture pattern suggestions
- Security vulnerability scanning
- Dependency analysis

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+Shift+P` | Open Command Palette |
| `Ctrl+Shift+F` | Search in Files |
| `Ctrl+Shift+G` | Source Control |
| `Ctrl+Shift+A` | AI Assistant |
| `Ctrl+Shift+X` | Extensions |
| `Ctrl+`` ` | Toggle Terminal |
| `Ctrl+,` | Open Settings |

---

## Color System

AICodeStudio uses a strict two-color design system:

| Token | Hex | Usage |
|-------|-----|-------|
| Base | `#0d1117` | Background, panels, surfaces |
| Accent | `#00e5ff` | Active states, highlights, borders, interactive elements |
| Text Primary | `#e6edf3` | Headings, active text |
| Text Secondary | `#8b949e` | Body text, labels |
| Text Muted | `#5a6270` | Placeholders, disabled text |
| Text Dim | `#3d4450` | Metadata, hints |

---

## Contributing

We welcome contributions from the community! Here's how you can help:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### Development Guidelines

- Follow the existing code style and naming conventions
- Ensure all components are typed with TypeScript
- Test your changes across different screen sizes
- Keep the two-color design system consistent
- Write clear, descriptive commit messages

---

## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

<p align="center">
  <code>Built with 💎 and </><span style="color: #00e5ff;">electric cyan</span></code>
</p>
