import { create } from 'zustand'

export type SidebarPanel = 'explorer' | 'search' | 'git' | 'ai' | 'github' | 'extensions' | 'settings'
export type BottomPanel = 'terminal' | 'output' | 'problems' | 'debug'

export interface FileNode {
  name: string
  path: string
  type: 'file' | 'folder'
  children?: FileNode[]
  language?: string
  content?: string
  isExpanded?: boolean
}

export interface TabInfo {
  id: string
  path: string
  name: string
  language: string
  isModified: boolean
  content: string
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  provider: 'openclaw' | 'hermes'
  timestamp: number
}

export interface AIProvider {
  id: 'openclaw' | 'hermes'
  name: string
  status: 'connected' | 'disconnected' | 'connecting'
  model: string
  apiKey?: string
}

interface IDEState {
  // Sidebar
  activeSidebarPanel: SidebarPanel
  sidebarVisible: boolean
  sidebarWidth: number

  // Editor
  openTabs: TabInfo[]
  activeTabId: string | null

  // Bottom Panel
  bottomPanelVisible: boolean
  bottomPanelHeight: number
  activeBottomPanel: BottomPanel

  // File System
  fileTree: FileNode[]
  expandedFolders: Set<string>

  // AI
  aiProviders: AIProvider[]
  chatMessages: ChatMessage[]
  isAiLoading: boolean
  activeAiProvider: 'openclaw' | 'hermes'

  // GitHub
  gitRepos: string[]
  isGitCloning: boolean
  gitCloneUrl: string

  // Command Palette
  commandPaletteOpen: boolean

  // Theme
  theme: 'dark' | 'light'

  // Terminal
  terminalHistory: string[]

  // Actions
  setActiveSidebarPanel: (panel: SidebarPanel) => void
  toggleSidebar: () => void
  setSidebarWidth: (width: number) => void

  openFile: (file: FileNode) => void
  closeTab: (tabId: string) => void
  setActiveTab: (tabId: string) => void
  updateTabContent: (tabId: string, content: string) => void

  toggleBottomPanel: () => void
  setBottomPanelHeight: (height: number) => void
  setActiveBottomPanel: (panel: BottomPanel) => void

  toggleFolder: (path: string) => void
  setFileTree: (tree: FileNode[]) => void

  addChatMessage: (message: ChatMessage) => void
  setAiLoading: (loading: boolean) => void
  setActiveAiProvider: (provider: 'openclaw' | 'hermes') => void
  updateAiProvider: (id: string, updates: Partial<AIProvider>) => void

  setGitCloneUrl: (url: string) => void
  setIsGitCloning: (cloning: boolean) => void
  addGitRepo: (repo: string) => void

  setCommandPaletteOpen: (open: boolean) => void
  setTheme: (theme: 'dark' | 'light') => void

  addTerminalHistory: (entry: string) => void
}

const defaultFileTree: FileNode[] = [
  {
    name: 'AICodeStudio',
    path: '/AICodeStudio',
    type: 'folder',
    isExpanded: true,
    children: [
      {
        name: 'src',
        path: '/AICodeStudio/src',
        type: 'folder',
        isExpanded: true,
        children: [
          {
            name: 'app',
            path: '/AICodeStudio/src/app',
            type: 'folder',
            isExpanded: false,
            children: [
              { name: 'page.tsx', path: '/AICodeStudio/src/app/page.tsx', type: 'file', language: 'typescript' },
              { name: 'layout.tsx', path: '/AICodeStudio/src/app/layout.tsx', type: 'file', language: 'typescript' },
              { name: 'globals.css', path: '/AICodeStudio/src/app/globals.css', type: 'file', language: 'css' },
            ],
          },
          {
            name: 'components',
            path: '/AICodeStudio/src/components',
            type: 'folder',
            isExpanded: false,
            children: [
              { name: 'Editor.tsx', path: '/AICodeStudio/src/components/Editor.tsx', type: 'file', language: 'typescript' },
              { name: 'Sidebar.tsx', path: '/AICodeStudio/src/components/Sidebar.tsx', type: 'file', language: 'typescript' },
              { name: 'Terminal.tsx', path: '/AICodeStudio/src/components/Terminal.tsx', type: 'file', language: 'typescript' },
            ],
          },
          {
            name: 'lib',
            path: '/AICodeStudio/src/lib',
            type: 'folder',
            isExpanded: false,
            children: [
              { name: 'utils.ts', path: '/AICodeStudio/src/lib/utils.ts', type: 'file', language: 'typescript' },
              { name: 'ai-providers.ts', path: '/AICodeStudio/src/lib/ai-providers.ts', type: 'file', language: 'typescript' },
            ],
          },
        ],
      },
      {
        name: 'public',
        path: '/AICodeStudio/public',
        type: 'folder',
        isExpanded: false,
        children: [
          { name: 'logo.svg', path: '/AICodeStudio/public/logo.svg', type: 'file', language: 'xml' },
        ],
      },
      { name: 'package.json', path: '/AICodeStudio/package.json', type: 'file', language: 'json' },
      { name: 'tsconfig.json', path: '/AICodeStudio/tsconfig.json', type: 'file', language: 'json' },
      { name: 'README.md', path: '/AICodeStudio/README.md', type: 'file', language: 'markdown' },
      { name: '.gitignore', path: '/AICodeStudio/.gitignore', type: 'file', language: 'plaintext' },
    ],
  },
]

const sampleFileContents: Record<string, string> = {
  '/AICodeStudio/src/app/page.tsx': `import { Editor } from '@/components/Editor'
import { Sidebar } from '@/components/Sidebar'

export default function Home() {
  return (
    <main className="flex h-screen">
      <Sidebar />
      <Editor />
    </main>
  )
}`,
  '/AICodeStudio/src/app/layout.tsx': `import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'AICodeStudio',
  description: 'Next-generation AI-powered IDE',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}`,
  '/AICodeStudio/src/components/Editor.tsx': `'use client'

import { useRef, useState } from 'react'

export function Editor() {
  const [content, setContent] = useState('')
  
  return (
    <div className="flex-1 bg-[#0d1117] text-white p-4">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="w-full h-full bg-transparent outline-none font-mono"
      />
    </div>
  )
}`,
  '/AICodeStudio/src/components/Sidebar.tsx': `'use client'

export function Sidebar() {
  return (
    <aside className="w-64 bg-[#0d1117] border-r border-[#00e5ff]/20">
      <div className="p-4 text-[#00e5ff] font-mono text-sm">
        EXPLORER
      </div>
    </aside>
  )
}`,
  '/AICodeStudio/src/components/Terminal.tsx': `'use client'

import { useEffect, useRef } from 'react'

export function Terminal() {
  const termRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Terminal initialization
    console.log('Terminal mounted')
  }, [])

  return (
    <div ref={termRef} className="h-full bg-[#0d1117] text-green-400 font-mono p-2" />
  )
}`,
  '/AICodeStudio/src/lib/utils.ts': `import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}`,
  '/AICodeStudio/src/lib/ai-providers.ts': `export interface AIProvider {
  id: string
  name: string
  endpoint: string
  models: string[]
}

export const OPENCLAW: AIProvider = {
  id: 'openclaw',
  name: 'OpenClaw',
  endpoint: 'https://api.openclaw.dev/v1',
  models: ['openclaw-4', 'openclaw-3.5-turbo'],
}

export const HERMES: AIProvider = {
  id: 'hermes',
  name: 'Hermes',
  endpoint: 'https://api.hermes.ai/v1',
  models: ['hermes-pro', 'hermes-fast'],
}

export async function queryAI(
  provider: AIProvider,
  prompt: string,
  model: string
): Promise<string> {
  const response = await fetch(\`\${provider.endpoint}/chat/completions\`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: prompt }],
    }),
  })
  const data = await response.json()
  return data.choices[0].message.content
}`,
  '/AICodeStudio/package.json': `{
  "name": "aicodestudio",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start"
  },
  "dependencies": {
    "next": "^16.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  }
}`,
  '/AICodeStudio/tsconfig.json': `{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx"],
  "exclude": ["node_modules"]
}`,
  '/AICodeStudio/README.md': `# AICodeStudio

Next-generation AI-powered IDE with OpenClaw and Hermes integration.

## Features

- Monaco Editor (VSCode core)
- AI-powered code assistance
- GitHub integration
- Integrated terminal
- Extensible plugin system
`,
  '/AICodeStudio/.gitignore': `node_modules/
.next/
.env
.env.local
*.log
dist/
build/
.DS_Store`,
  '/AICodeStudio/src/app/globals.css': `@import "tailwindcss";

:root {
  --bg-primary: #0d1117;
  --accent: #00e5ff;
  --text: #e6edf3;
}

body {
  background: var(--bg-primary);
  color: var(--text);
  font-family: 'JetBrains Mono', monospace;
}`,
  '/AICodeStudio/public/logo.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <rect width="100" height="100" rx="12" fill="#0d1117"/>
  <text x="50" y="60" text-anchor="middle" fill="#00e5ff" font-size="40" font-family="monospace">&lt;/&gt;</text>
</svg>`,
}

export const useIDEStore = create<IDEState>((set, get) => ({
  // Sidebar
  activeSidebarPanel: 'explorer',
  sidebarVisible: true,
  sidebarWidth: 260,

  // Editor
  openTabs: [],
  activeTabId: null,

  // Bottom Panel
  bottomPanelVisible: true,
  bottomPanelHeight: 220,
  activeBottomPanel: 'terminal',

  // File System
  fileTree: defaultFileTree,
  expandedFolders: new Set(['/AICodeStudio', '/AICodeStudio/src']),

  // AI
  aiProviders: [
    { id: 'openclaw', name: 'OpenClaw', status: 'connected', model: 'openclaw-4' },
    { id: 'hermes', name: 'Hermes', status: 'disconnected', model: 'hermes-pro' },
  ],
  chatMessages: [],
  isAiLoading: false,
  activeAiProvider: 'openclaw',

  // GitHub
  gitRepos: [],
  isGitCloning: false,
  gitCloneUrl: '',

  // Command Palette
  commandPaletteOpen: false,

  // Theme
  theme: 'dark',

  // Terminal
  terminalHistory: [
    '$ AICodeStudio v1.0.0 — Ready',
    '$ Type "help" for available commands',
    '',
  ],

  // Actions
  setActiveSidebarPanel: (panel) =>
    set((state) => ({
      activeSidebarPanel: panel,
      sidebarVisible: state.activeSidebarPanel === panel ? !state.sidebarVisible : true,
    })),

  toggleSidebar: () => set((state) => ({ sidebarVisible: !state.sidebarVisible })),
  setSidebarWidth: (width) => set({ sidebarWidth: width }),

  openFile: (file) =>
    set((state) => {
      const existingTab = state.openTabs.find((t) => t.path === file.path)
      if (existingTab) {
        return { activeTabId: existingTab.id }
      }
      const newTab: TabInfo = {
        id: `tab-${Date.now()}`,
        path: file.path,
        name: file.name,
        language: file.language || 'plaintext',
        isModified: false,
        content: sampleFileContents[file.path] || `// ${file.name} — AICodeStudio`,
      }
      return {
        openTabs: [...state.openTabs, newTab],
        activeTabId: newTab.id,
      }
    }),

  closeTab: (tabId) =>
    set((state) => {
      const newTabs = state.openTabs.filter((t) => t.id !== tabId)
      const newActiveId =
        state.activeTabId === tabId
          ? newTabs.length > 0
            ? newTabs[newTabs.length - 1].id
            : null
          : state.activeTabId
      return { openTabs: newTabs, activeTabId: newActiveId }
    }),

  setActiveTab: (tabId) => set({ activeTabId: tabId }),

  updateTabContent: (tabId, content) =>
    set((state) => ({
      openTabs: state.openTabs.map((t) =>
        t.id === tabId ? { ...t, content, isModified: true } : t
      ),
    })),

  toggleBottomPanel: () => set((state) => ({ bottomPanelVisible: !state.bottomPanelVisible })),
  setBottomPanelHeight: (height) => set({ bottomPanelHeight: height }),
  setActiveBottomPanel: (panel) => set({ activeBottomPanel: panel, bottomPanelVisible: true }),

  toggleFolder: (path) =>
    set((state) => {
      const newExpanded = new Set(state.expandedFolders)
      if (newExpanded.has(path)) {
        newExpanded.delete(path)
      } else {
        newExpanded.add(path)
      }
      return { expandedFolders: newExpanded }
    }),

  setFileTree: (tree) => set({ fileTree: tree }),

  addChatMessage: (message) => set((state) => ({ chatMessages: [...state.chatMessages, message] })),
  setAiLoading: (loading) => set({ isAiLoading: loading }),
  setActiveAiProvider: (provider) => set({ activeAiProvider: provider }),
  updateAiProvider: (id, updates) =>
    set((state) => ({
      aiProviders: state.aiProviders.map((p) => (p.id === id ? { ...p, ...updates } : p)),
    })),

  setGitCloneUrl: (url) => set({ gitCloneUrl: url }),
  setIsGitCloning: (cloning) => set({ isGitCloning: cloning }),
  addGitRepo: (repo) => set((state) => ({ gitRepos: [...state.gitRepos, repo] })),

  setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
  setTheme: (theme) => set({ theme }),

  addTerminalHistory: (entry) => set((state) => ({ terminalHistory: [...state.terminalHistory, entry] })),
}))
