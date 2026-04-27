import { create } from 'zustand'

export type SidebarPanel = 'explorer' | 'search' | 'git' | 'ai' | 'github' | 'extensions' | 'settings' | 'todos'
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

export interface TodoItem {
  id: string
  text: string
  completed: boolean
  priority: 'low' | 'medium' | 'high'
  createdAt: number
  source?: 'user' | 'agent'
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

  // TODOs
  todos: TodoItem[]

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

  // TODO actions
  addTodo: (text: string, priority?: TodoItem['priority'], source?: TodoItem['source']) => void
  toggleTodo: (id: string) => void
  removeTodo: (id: string) => void
  updateTodo: (id: string, updates: Partial<Pick<TodoItem, 'text' | 'priority'>>) => void
  clearCompletedTodos: () => void
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
  '/AICodeStudio/src/app/page.tsx': `import { Editor } from '@/components/Editor'\nimport { Sidebar } from '@/components/Sidebar'\n\nexport default function Home() {\n  return (\n    <main className="flex h-screen">\n      <Sidebar />\n      <Editor />\n    </main>\n  )\n}`,
  '/AICodeStudio/src/app/layout.tsx': `import type { Metadata } from 'next'\nimport './globals.css'\n\nexport const metadata: Metadata = {\n  title: 'AICodeStudio',\n  description: 'Next-generation AI-powered IDE',\n}\n\nexport default function RootLayout({ children }: { children: React.ReactNode }) {\n  return (\n    <html lang="en">\n      <body>{children}</body>\n    </html>\n  )\n}`,
  '/AICodeStudio/src/components/Editor.tsx': `'use client'\n\nimport { useState } from 'react'\n\nexport function Editor() {\n  const [content, setContent] = useState('')\n  return (\n    <div className="flex-1 bg-[#0d1117] text-white p-4">\n      <textarea\n        value={content}\n        onChange={(e) => setContent(e.target.value)}\n        className="w-full h-full bg-transparent outline-none font-mono"\n      />\n    </div>\n  )\n}`,
  '/AICodeStudio/src/components/Sidebar.tsx': `'use client'\n\nexport function Sidebar() {\n  return (\n    <aside className="w-64 bg-[#0d1117] border-r border-[#00e5ff]/20">\n      <div className="p-4 text-[#00e5ff] font-mono text-sm">EXPLORER</div>\n    </aside>\n  )\n}`,
  '/AICodeStudio/src/components/Terminal.tsx': `'use client'\n\nimport { useEffect, useRef } from 'react'\n\nexport function Terminal() {\n  const termRef = useRef<HTMLDivElement>(null)\n  useEffect(() => { console.log('Terminal mounted') }, [])\n  return <div ref={termRef} className="h-full bg-[#0d1117] text-green-400 font-mono p-2" />\n}`,
  '/AICodeStudio/src/lib/utils.ts': `import { type ClassValue, clsx } from 'clsx'\nimport { twMerge } from 'tailwind-merge'\n\nexport function cn(...inputs: ClassValue[]) {\n  return twMerge(clsx(inputs))\n}`,
  '/AICodeStudio/src/lib/ai-providers.ts': `export interface AIProvider {\n  id: string\n  name: string\n  endpoint: string\n  models: string[]\n}\n\nexport const OPENCLAW: AIProvider = {\n  id: 'openclaw', name: 'OpenClaw',\n  endpoint: 'https://api.openclaw.dev/v1',\n  models: ['openclaw-4', 'openclaw-3.5-turbo'],\n}\n\nexport const HERMES: AIProvider = {\n  id: 'hermes', name: 'Hermes',\n  endpoint: 'https://api.hermes.ai/v1',\n  models: ['hermes-pro', 'hermes-fast'],\n}`,
  '/AICodeStudio/package.json': `{\n  "name": "aicodestudio",\n  "version": "1.0.0",\n  "private": true,\n  "scripts": { "dev": "next dev", "build": "next build", "start": "next start" },\n  "dependencies": { "next": "^16.0.0", "react": "^19.0.0", "react-dom": "^19.0.0" }\n}`,
  '/AICodeStudio/tsconfig.json': `{\n  "compilerOptions": {\n    "target": "ES2017", "lib": ["dom", "dom.iterable", "esnext"],\n    "allowJs": true, "skipLibCheck": true, "strict": true,\n    "noEmit": true, "esModuleInterop": true, "module": "esnext",\n    "moduleResolution": "bundler", "resolveJsonModule": true,\n    "isolatedModules": true, "jsx": "preserve", "incremental": true,\n    "paths": { "@/*": ["./src/*"] }\n  },\n  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx"],\n  "exclude": ["node_modules"]\n}`,
  '/AICodeStudio/README.md': `# AICodeStudio\n\nNext-generation AI-powered IDE with OpenClaw and Hermes integration.\n\n## Features\n\n- Monaco Editor (VSCode core)\n- AI-powered code assistance\n- GitHub integration\n- Integrated terminal\n- Extensible plugin system\n`,
  '/AICodeStudio/.gitignore': `node_modules/\n.next/\n.env\n.env.local\n*.log\ndist/\nbuild/\n.DS_Store`,
  '/AICodeStudio/src/app/globals.css': `@import "tailwindcss";\n\n:root { --bg-primary: #0d1117; --accent: #00e5ff; --text: #e6edf3; }\nbody { background: var(--bg-primary); color: var(--text); font-family: 'JetBrains Mono', monospace; }`,
  '/AICodeStudio/public/logo.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">\n  <rect width="100" height="100" rx="12" fill="#0d1117"/>\n  <text x="50" y="60" text-anchor="middle" fill="#00e5ff" font-size="40" font-family="monospace">&lt;/&gt;</text>\n</svg>`,
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

  // TODOs
  todos: [
    { id: 'todo-1', text: 'Configure OpenClaw API key', completed: false, priority: 'high', createdAt: Date.now() - 86400000, source: 'agent' },
    { id: 'todo-2', text: 'Set up project file structure', completed: true, priority: 'high', createdAt: Date.now() - 172800000, source: 'agent' },
    { id: 'todo-3', text: 'Connect Hermes provider', completed: false, priority: 'medium', createdAt: Date.now() - 43200000, source: 'user' },
    { id: 'todo-4', text: 'Review code architecture', completed: false, priority: 'low', createdAt: Date.now() - 21600000, source: 'agent' },
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

  // TODO actions
  addTodo: (text, priority = 'medium', source = 'user') =>
    set((state) => ({
      todos: [...state.todos, {
        id: `todo-${Date.now()}`,
        text,
        completed: false,
        priority,
        createdAt: Date.now(),
        source,
      }],
    })),

  toggleTodo: (id) =>
    set((state) => ({
      todos: state.todos.map((t) => t.id === id ? { ...t, completed: !t.completed } : t),
    })),

  removeTodo: (id) =>
    set((state) => ({
      todos: state.todos.filter((t) => t.id !== id),
    })),

  updateTodo: (id, updates) =>
    set((state) => ({
      todos: state.todos.map((t) => t.id === id ? { ...t, ...updates } : t),
    })),

  clearCompletedTodos: () =>
    set((state) => ({
      todos: state.todos.filter((t) => !t.completed),
    })),
}))
