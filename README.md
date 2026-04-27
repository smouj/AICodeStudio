<div align="center">

<img src="public/logo.svg" alt="AICodeStudio Logo" width="80" height="80" />

# AICodeStudio

**Next-Generation AI-Powered IDE**

[![License: MIT](https://img.shields.io/badge/License-MIT-00d4aa.svg?style=flat-square)](https://opensource.org/licenses/MIT)
[![Next.js](https://img.shields.io/badge/Next.js-16-000000.svg?style=flat-square&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6.svg?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61dafb.svg?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![PWA](https://img.shields.io/badge/PWA-Ready-00d4aa.svg?style=flat-square)](https://web.dev/progressive-web-apps/)
[![PRs Welcome](https://img.shields.io/badge/PRs-Welcome-00d4aa.svg?style=flat-square)](CONTRIBUTING.md)

*A free, open-source, AI-first code editor that runs in your browser. Install it as a desktop app like VSCode — no Electron required. Zero mocks, zero placeholders — everything is real and connected.*

[🌐 Live Demo](https://smouj.github.io/AICodeStudio) · [📥 Install](#-installation) · [✨ Features](#-features) · [🚀 Quick Start](#-quick-start) · [🤝 Contributing](#-contributing)

</div>

---

<img src="public/screenshot.png" alt="AICodeStudio Screenshot" width="100%" />

---

## ✨ Features

### 🤖 AI-Powered Development
- **User-Configurable AI Providers** — Add any AI provider with your own API key; your credentials stay in your browser and are never sent to our servers
- **Real AI Chat** — Direct API integration with real AI models; no simulated responses or canned fallbacks
- **Connection Testing** — Test your AI provider connection before saving to verify everything works
- **Quick Actions** — One-click AI actions: Explain Code, Find Bugs, Optimize Performance

### 📝 Professional Code Editor
- **Monaco Editor** — The same editor engine that powers VSCode
- **Configurable Settings** — Font size, tab size, minimap, word wrap, line numbers, ligatures, bracket pairs — all adjustable in real-time
- **Syntax Highlighting** — 20+ languages with custom dark theme optimized for readability
- **IntelliSense** — Smart autocompletion, parameter hints, and code navigation
- **Multiple Tabs** — Work with multiple files simultaneously with unsaved change indicators and auto-save
- **Breadcrumbs** — Navigation path bar showing file location

### 📂 Virtual File System
- **Create Files & Folders** — Build your workspace from scratch with real file operations
- **Rename & Delete** — Full file management with inline rename and delete confirmation
- **Real File Contents** — Every file stores real content; no placeholders or fake data
- **Auto-Save** — Changes are automatically persisted to the virtual file system

### 🔍 Real Search
- **Search in Files** — Searches through actual file contents in your workspace
- **Regex Support** — Use regular expressions for advanced pattern matching
- **Case Sensitive / Whole Word** — Toggle search options for precise results
- **Click to Navigate** — Click any result to open the file at that line

### 🔗 GitHub Integration
- **Clone Repositories** — Clone any public GitHub repo via the API; files are loaded into your workspace
- **Search GitHub** — Search repositories directly using the GitHub Search API
- **Trending Repos** — Fetch trending repositories from the last month via the GitHub API
- **GitHub Token Support** — Add a personal access token for higher rate limits and private repo access

### 📊 Source Control
- **Real Change Tracking** — Files are automatically tracked as modified when you edit them
- **Stage & Unstage** — Stage changes before committing, just like real Git
- **Commit** — Write commit messages and commit staged changes
- **Virtual Git Log** — View commit history with generated commit SHAs

### 💻 Integrated Terminal
- **Real File Operations** — `touch`, `mkdir`, `rm`, `mv`, `cat` operate on the actual virtual file system
- **Directory Navigation** — `cd`, `pwd`, `ls` work with the real folder structure
- **Git Commands** — `git status` and `git log` show real virtual git state
- **Command History** — Arrow up/down to navigate previous commands
- **File Tree** — `tree` command displays the workspace file tree
- **AI Status** — `ai` command shows configured provider connection status

### 📋 TODO System
- **Smart Task Management** — Create, organize, and track tasks with priority levels (High, Medium, Low)
- **AI Agent Tasks** — Tasks automatically appear when the AI agent suggests actions
- **Filter & Sort** — Filter by All / Active / Completed; clear completed tasks in one click
- **Visual Priority** — Color-coded borders and dots for instant priority recognition

### 🧩 Extensions
- **Installable Extensions** — Install and uninstall extensions with real state tracking
- **Categories** — AI, Git, Editor, DevOps, Theme, Language extensions
- **Search & Filter** — Search extensions by name or filter by installed status
- **Output Logging** — Extension installation and activation logged to the Output panel

### ⚙️ Settings
- **Real-Time Editor Settings** — Font size, tab size, minimap, word wrap, line numbers, ligatures, bracket pairs, theme
- **Applied Immediately** — Changes take effect in the editor instantly
- **Reset to Defaults** — One-click reset to default settings

### 📦 PWA Desktop Installation
- **Install as Desktop App** — Works like a native application on Windows, macOS, and Linux
- **Offline Support** — Service worker caching for core assets
- **Standalone Mode** — No browser chrome; full-screen IDE experience
- **App Shortcuts** — Quick access to New File, AI Assistant, and Terminal

### 🎨 Refined Design
- **Dark-First Theme** — Carefully crafted color system with `#00d4aa` accent on deep `#080c12` backgrounds
- **Minimalist UI** — Clean, distraction-free interface inspired by VSCode
- **ASCII Art Background** — Subtle animated ASCII backdrop on the welcome screen
- **Custom Scrollbars** — Thin, translucent scrollbars that match the theme
- **Grid Overlay** — Faint decorative grid lines for a futuristic aesthetic

---

## 📸 Screenshots

<table>
  <tr>
    <td align="center"><b>Code Editor</b></td>
    <td align="center"><b>AI Assistant</b></td>
  </tr>
  <tr>
    <td><img src="public/screenshot-editor.png" alt="Editor" width="100%" /></td>
    <td><img src="public/screenshot-ai.png" alt="AI Chat" width="100%" /></td>
  </tr>
  <tr>
    <td align="center"><b>TODO Panel</b></td>
    <td align="center"><b>GitHub Panel</b></td>
  </tr>
  <tr>
    <td><img src="public/screenshot-todos.png" alt="TODOs" width="100%" /></td>
    <td><img src="public/screenshot-github.png" alt="GitHub" width="100%" /></td>
  </tr>
</table>

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** 18+ or **Bun** 1.0+
- **npm**, **yarn**, **pnpm**, or **bun**

### Installation

```bash
# Clone the repository
git clone https://github.com/smouj/AICodeStudio.git
cd AICodeStudio

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build

```bash
# Build for production
npm run build

# Start production server
npm start
```

### Install as Desktop App

1. Open AICodeStudio in Chrome, Edge, or any Chromium-based browser
2. Click the **install icon** in the browser address bar
3. Click **Install** — AICodeStudio will launch as a standalone desktop application
4. No Electron needed — it runs as a PWA with native-like performance

---

## 🏗️ Architecture

```
src/
├── app/
│   ├── api/
│   │   └── ai/route.ts          # AI chat endpoint (real API)
│   ├── globals.css               # Global styles & theme variables
│   ├── layout.tsx                # Root layout with PWA metadata
│   └── page.tsx                  # Main entry point
├── components/
│   └── ide/
│       ├── activity-bar.tsx      # Left icon sidebar
│       ├── ai-chat.tsx           # AI chat with real API + provider config
│       ├── bottom-panel.tsx      # Terminal/Output/Problems/Debug
│       ├── command-palette.tsx   # Ctrl+Shift+P command search
│       ├── editor-area.tsx       # Monaco Editor with settings integration
│       ├── extensions-panel.tsx  # Extension marketplace (install/uninstall)
│       ├── file-tree.tsx         # Recursive file explorer with CRUD
│       ├── github-panel.tsx      # GitHub API: clone, search, trending
│       ├── git-panel.tsx         # Source control with real staging
│       ├── ide-main.tsx          # Main IDE layout orchestrator
│       ├── search-panel.tsx      # Real file content search
│       ├── settings-panel.tsx    # Editor preferences (connected to editor)
│       ├── sidebar-panel.tsx     # Sidebar panel router
│       ├── status-bar.tsx        # Dynamic status information
│       ├── terminal-panel.tsx    # Terminal with real FS commands
│       └── todos-panel.tsx       # TODO task management
├── store/
│   └── ide-store.ts             # Zustand global state with virtual FS
└── lib/
    └── utils.ts                  # Utility functions
```

---

## 🛠️ Tech Stack

| Technology | Purpose |
|---|---|
| [Next.js 16](https://nextjs.org/) | React framework with App Router |
| [React 19](https://react.dev/) | UI library with compiler |
| [TypeScript 5](https://www.typescriptlang.org/) | Type-safe development |
| [Monaco Editor](https://microsoft.github.io/monaco-editor/) | VSCode's editor engine |
| [Zustand](https://zustand.docs.pmnd.rs/) | Lightweight state management |
| [Tailwind CSS 4](https://tailwindcss.com/) | Utility-first styling |
| [shadcn/ui](https://ui.shadcn.com/) | Accessible UI components |
| [Lucide Icons](https://lucide.dev/) | Beautiful icon set |
| [PWA](https://web.dev/progressive-web-apps/) | Desktop installation support |

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Ctrl+Shift+P` | Open Command Palette |
| `Ctrl+Shift+F` | Search in Files |
| `Ctrl+Shift+G` | Source Control |
| `Ctrl+Shift+A` | AI Assistant |
| `Ctrl+Shift+X` | Extensions |
| `Ctrl+\`` | Toggle Terminal |
| `Ctrl+,` | Open Settings |
| `Ctrl+T` | Toggle Theme |

---

## 🎯 Roadmap

- [x] Virtual file system with real file operations
- [x] Real search across file contents
- [x] User-configurable AI providers
- [x] GitHub API integration for clone/search/trending
- [x] Real git staging and commit workflow
- [x] Terminal with file system commands
- [x] Configurable editor settings
- [x] Installable/uninstallable extensions
- [ ] Real file system access via File System Access API
- [ ] Live collaborative editing (CRDT-based)
- [ ] Extension marketplace with community plugins
- [ ] Real terminal integration (PTY over WebSocket)
- [ ] Language Server Protocol support
- [ ] Docker container management
- [ ] Database viewer and editor
- [ ] Git operations (push, pull, merge, rebase)
- [ ] Custom themes marketplace
- [ ] Voice-to-code AI integration

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. **Fork** the repository
2. **Create** your feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

<div align="center">

**Built with care by the AICodeStudio Team**

[⬆ Back to Top](#aicodestudio)

</div>
