import { create } from 'zustand'
import { v4 as uuidv4 } from 'uuid'

export type SidebarPanel = 'explorer' | 'search' | 'git' | 'ai' | 'github' | 'extensions' | 'settings' | 'todos'
export type BottomPanel = 'terminal' | 'output' | 'problems' | 'debug'

export interface FileNode {
  name: string
  path: string
  type: 'file' | 'folder'
  children?: FileNode[]
  language?: string
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
  provider: string
  timestamp: number
}

export interface AIProvider {
  id: string
  name: string
  status: 'connected' | 'disconnected' | 'connecting' | 'error'
  model: string
  apiKey?: string
  endpoint?: string
  error?: string
}

export interface TodoItem {
  id: string
  text: string
  completed: boolean
  priority: 'low' | 'medium' | 'high'
  createdAt: number
  source?: 'user' | 'agent'
}

export interface CursorPosition {
  line: number
  column: number
}

export interface Notification {
  id: string
  type: 'info' | 'success' | 'warning' | 'error'
  message: string
  timestamp: number
}

export interface EditorSettings {
  fontSize: number
  tabSize: number
  minimap: boolean
  wordWrap: 'on' | 'off' | 'wordWrapColumn'
  autoSave: boolean
  fontLigatures: boolean
  lineNumbers: 'on' | 'off' | 'relative'
  bracketPairColorization: boolean
  theme: 'dark' | 'light'
}

export interface SearchResult {
  filePath: string
  fileName: string
  line: number
  column: number
  text: string
}

export interface OutputEntry {
  timestamp: number
  source: string
  message: string
  level: 'info' | 'warn' | 'error'
}

// Helper: get language from filename
function getLanguageFromPath(path: string): string {
  const ext = path.split('.').pop()?.toLowerCase()
  const map: Record<string, string> = {
    tsx: 'typescript', ts: 'typescript', jsx: 'javascript', js: 'javascript',
    json: 'json', css: 'css', html: 'html', md: 'markdown', svg: 'xml',
    py: 'python', rs: 'rust', go: 'go', gitignore: 'plaintext',
    yml: 'yaml', yaml: 'yaml', toml: 'ini', sh: 'shell', bash: 'shell',
    sql: 'sql', graphql: 'graphql', prisma: 'prisma', env: 'plaintext',
    txt: 'plaintext', xml: 'xml', dockerfile: 'dockerfile',
  }
  return map[ext || ''] || 'plaintext'
}

// Helper: sort file nodes (folders first, then alphabetically)
function sortFileNodes(nodes: FileNode[]): FileNode[] {
  return [...nodes].sort((a, b) => {
    if (a.type === 'folder' && b.type === 'file') return -1
    if (a.type === 'file' && b.type === 'folder') return 1
    return a.name.localeCompare(b.name)
  })
}

// Helper: generate unique IDs
function generateId(prefix: string = 'id'): string {
  return `${prefix}-${uuidv4().slice(0, 8)}`
}

interface IDEState {
  // Sidebar
  activeSidebarPanel: SidebarPanel
  sidebarVisible: boolean
  sidebarWidth: number

  // Editor
  openTabs: TabInfo[]
  activeTabId: string | null
  cursorPosition: CursorPosition
  editorSettings: EditorSettings

  // Bottom Panel
  bottomPanelVisible: boolean
  bottomPanelHeight: number
  activeBottomPanel: BottomPanel

  // Virtual File System
  fileTree: FileNode[]
  fileContents: Record<string, string>
  expandedFolders: Record<string, boolean>
  workspaceName: string

  // AI
  aiProviders: AIProvider[]
  chatMessages: ChatMessage[]
  isAiLoading: boolean
  activeAiProvider: string

  // GitHub
  gitRepos: string[]
  isGitCloning: boolean
  gitCloneUrl: string
  githubToken: string

  // Git (virtual)
  gitBranch: string
  gitStaged: string[]
  gitUnstaged: string[]
  gitCommitCount: number

  // Command Palette
  commandPaletteOpen: boolean

  // Terminal
  terminalHistory: string[]
  terminalCwd: string

  // TODOs
  todos: TodoItem[]

  // Notifications
  notifications: Notification[]

  // Output Log
  outputLog: OutputEntry[]

  // PWA
  pwaInstallPrompt: unknown | null
  pwaInstallAvailable: boolean

  // ─── Actions ────────────────────────────────────────────

  setActiveSidebarPanel: (panel: SidebarPanel) => void
  toggleSidebar: () => void
  setSidebarWidth: (width: number) => void

  openFile: (path: string) => void
  closeTab: (tabId: string) => void
  setActiveTab: (tabId: string) => void
  updateTabContent: (tabId: string, content: string) => void
  setCursorPosition: (position: CursorPosition) => void
  updateEditorSettings: (settings: Partial<EditorSettings>) => void

  toggleBottomPanel: () => void
  setBottomPanelHeight: (height: number) => void
  setActiveBottomPanel: (panel: BottomPanel) => void

  // Virtual File System actions
  createFile: (path: string, content?: string) => void
  createFolder: (path: string) => void
  deleteNode: (path: string) => void
  renameNode: (oldPath: string, newName: string) => void
  readFile: (path: string) => string | undefined
  writeFile: (path: string, content: string) => void
  toggleFolder: (path: string) => void
  isFolderExpanded: (path: string) => boolean

  addChatMessage: (message: ChatMessage) => void
  clearChatMessages: () => void
  setAiLoading: (loading: boolean) => void
  setActiveAiProvider: (provider: string) => void
  updateAiProvider: (id: string, updates: Omit<Partial<AIProvider>, 'id'>) => void
  addAiProvider: (provider: AIProvider) => void
  removeAiProvider: (id: string) => void

  setGitCloneUrl: (url: string) => void
  setIsGitCloning: (cloning: boolean) => void
  addGitRepo: (repo: string) => void
  setGithubToken: (token: string) => void

  setCommandPaletteOpen: (open: boolean) => void

  addTerminalHistory: (entry: string) => void
  clearTerminalHistory: () => void
  setTerminalCwd: (cwd: string) => void

  // TODO actions
  addTodo: (text: string, priority?: TodoItem['priority'], source?: TodoItem['source']) => void
  toggleTodo: (id: string) => void
  removeTodo: (id: string) => void
  updateTodo: (id: string, updates: Partial<Pick<TodoItem, 'text' | 'priority'>>) => void
  clearCompletedTodos: () => void

  // Notification actions
  addNotification: (type: Notification['type'], message: string) => void
  removeNotification: (id: string) => void

  // Output log actions
  addOutputEntry: (source: string, message: string, level?: OutputEntry['level']) => void
  clearOutputLog: () => void

  // Search
  searchInFiles: (query: string) => SearchResult[]

  // Git virtual actions
  stageFile: (path: string) => void
  unstageFile: (path: string) => void

  // PWA actions
  setPwaInstallPrompt: (prompt: unknown) => void
  setPwaInstallAvailable: (available: boolean) => void
}

export const useIDEStore = create<IDEState>((set, get) => ({
  // ─── Initial State ─────────────────────────────────────

  activeSidebarPanel: 'explorer',
  sidebarVisible: true,
  sidebarWidth: 260,

  openTabs: [],
  activeTabId: null,
  cursorPosition: { line: 1, column: 1 },
  editorSettings: {
    fontSize: 13,
    tabSize: 2,
    minimap: true,
    wordWrap: 'off',
    autoSave: true,
    fontLigatures: true,
    lineNumbers: 'on',
    bracketPairColorization: true,
    theme: 'dark',
  },

  bottomPanelVisible: true,
  bottomPanelHeight: 220,
  activeBottomPanel: 'terminal',

  // Virtual File System — starts empty, user creates files
  fileTree: [],
  fileContents: {},
  expandedFolders: {},
  workspaceName: '',

  // AI — starts disconnected, user configures
  aiProviders: [],
  chatMessages: [],
  isAiLoading: false,
  activeAiProvider: '',

  // GitHub
  gitRepos: [],
  isGitCloning: false,
  gitCloneUrl: '',
  githubToken: '',

  // Git (virtual)
  gitBranch: 'main',
  gitStaged: [],
  gitUnstaged: [],
  gitCommitCount: 0,

  commandPaletteOpen: false,

  terminalHistory: [],
  terminalCwd: '/',

  todos: [],

  notifications: [],

  outputLog: [],

  pwaInstallPrompt: null,
  pwaInstallAvailable: false,

  // ─── Actions ────────────────────────────────────────────

  setActiveSidebarPanel: (panel) =>
    set((state) => ({
      activeSidebarPanel: panel,
      sidebarVisible: state.activeSidebarPanel === panel ? !state.sidebarVisible : true,
    })),

  toggleSidebar: () => set((state) => ({ sidebarVisible: !state.sidebarVisible })),
  setSidebarWidth: (width) => set({ sidebarWidth: Math.max(180, Math.min(500, width)) }),

  openFile: (path) =>
    set((state) => {
      const existingTab = state.openTabs.find((t) => t.path === path)
      if (existingTab) {
        return { activeTabId: existingTab.id }
      }
      const fileName = path.split('/').pop() || 'untitled'
      const content = state.fileContents[path] ?? ''
      const newTab: TabInfo = {
        id: generateId('tab'),
        path,
        name: fileName,
        language: getLanguageFromPath(path),
        isModified: false,
        content,
      }
      return {
        openTabs: [...state.openTabs, newTab],
        activeTabId: newTab.id,
      }
    }),

  closeTab: (tabId) =>
    set((state) => {
      const closingTab = state.openTabs.find((t) => t.id === tabId)
      const newTabs = state.openTabs.filter((t) => t.id !== tabId)
      const newActiveId =
        state.activeTabId === tabId
          ? newTabs.length > 0
            ? newTabs[newTabs.length - 1].id
            : null
          : state.activeTabId
      if (closingTab?.isModified) {
        get().addNotification('info', `Closed ${closingTab.name} — unsaved changes discarded`)
      }
      return { openTabs: newTabs, activeTabId: newActiveId }
    }),

  setActiveTab: (tabId) => set({ activeTabId: tabId }),

  updateTabContent: (tabId, content) =>
    set((state) => ({
      openTabs: state.openTabs.map((t) =>
        t.id === tabId ? { ...t, content, isModified: true } : t
      ),
    })),

  setCursorPosition: (position) => set({ cursorPosition: position }),

  updateEditorSettings: (settings) =>
    set((state) => ({
      editorSettings: { ...state.editorSettings, ...settings },
    })),

  toggleBottomPanel: () => set((state) => ({ bottomPanelVisible: !state.bottomPanelVisible })),
  setBottomPanelHeight: (height) => set({ bottomPanelHeight: Math.max(100, Math.min(500, height)) }),
  setActiveBottomPanel: (panel) => set({ activeBottomPanel: panel, bottomPanelVisible: true }),

  // ─── Virtual File System ────────────────────────────────

  createFile: (path, content = '') => {
    const state = get()
    if (state.fileContents[path] !== undefined) {
      get().addNotification('warning', `File already exists: ${path}`)
      return
    }
    const fileName = path.split('/').pop() || 'untitled'
    const parentPath = path.substring(0, path.lastIndexOf('/'))

    set((state) => {
      const newContents = { ...state.fileContents, [path]: content }
      const newTree = addFileNode(state.fileTree, parentPath, {
        name: fileName,
        path,
        type: 'file',
        language: getLanguageFromPath(path),
      })
      // Auto-expand parent
      const newExpanded = { ...state.expandedFolders, [parentPath]: true }
      // Mark as unstaged change
      const newUnstaged = state.gitUnstaged.includes(path) ? state.gitUnstaged : [...state.gitUnstaged, path]
      return {
        fileTree: newTree,
        fileContents: newContents,
        expandedFolders: newExpanded,
        gitUnstaged: newUnstaged,
      }
    })
    get().addOutputEntry('FileSystem', `Created file: ${path}`)
  },

  createFolder: (path) => {
    const state = get()
    const folderName = path.split('/').pop() || 'folder'
    const parentPath = path.substring(0, path.lastIndexOf('/'))

    // Check if folder already exists in tree
    if (findNode(state.fileTree, path)) {
      get().addNotification('warning', `Folder already exists: ${path}`)
      return
    }

    set((state) => {
      const newTree = addFileNode(state.fileTree, parentPath, {
        name: folderName,
        path,
        type: 'folder',
        children: [],
      })
      const newExpanded = { ...state.expandedFolders, [path]: true, [parentPath]: true }
      return { fileTree: newTree, expandedFolders: newExpanded }
    })
    get().addOutputEntry('FileSystem', `Created folder: ${path}`)
  },

  deleteNode: (path) => {
    const state = get()
    set((s) => {
      const newContents = { ...s.fileContents }
      // Delete all files under this path
      Object.keys(newContents).forEach((key) => {
        if (key === path || key.startsWith(path + '/')) {
          delete newContents[key]
        }
      })
      const newTree = removeFileNode(s.fileTree, path)
      // Close any open tabs for deleted files
      const newTabs = s.openTabs.filter((t) => !t.path.startsWith(path) && t.path !== path)
      const newActiveId = newTabs.find((t) => t.id === s.activeTabId)
        ? s.activeTabId
        : newTabs.length > 0
          ? newTabs[newTabs.length - 1].id
          : null
      // Remove from git staging
      const newStaged = s.gitStaged.filter((p) => p !== path && !p.startsWith(path + '/'))
      const newUnstaged = s.gitUnstaged.filter((p) => p !== path && !p.startsWith(path + '/'))
      return {
        fileTree: newTree,
        fileContents: newContents,
        openTabs: newTabs,
        activeTabId: newActiveId,
        gitStaged: newStaged,
        gitUnstaged: newUnstaged,
      }
    })
    get().addOutputEntry('FileSystem', `Deleted: ${path}`)
  },

  renameNode: (oldPath, newName) => {
    set((state) => {
      const node = findNode(state.fileTree, oldPath)
      if (!node) return state

      const parentPath = oldPath.substring(0, oldPath.lastIndexOf('/'))
      const newPath = parentPath ? `${parentPath}/${newName}` : `/${newName}`

      // Check if new path already exists
      if (findNode(state.fileTree, newPath) && newPath !== oldPath) {
        return state
      }

      // Update file contents map
      const newContents: Record<string, string> = {}
      Object.entries(state.fileContents).forEach(([key, val]) => {
        if (key === oldPath) {
          newContents[newPath] = val
        } else if (key.startsWith(oldPath + '/')) {
          newContents[key.replace(oldPath, newPath)] = val
        } else {
          newContents[key] = val
        }
      })

      // Update tree
      const newTree = renameFileNode(state.fileTree, oldPath, newPath, newName)

      // Update open tabs
      const newTabs = state.openTabs.map((t) => {
        if (t.path === oldPath) {
          return { ...t, path: newPath, name: newName }
        }
        if (t.path.startsWith(oldPath + '/')) {
          return { ...t, path: t.path.replace(oldPath, newPath), name: t.path.split('/').pop() || newName }
        }
        return t
      })

      return {
        fileTree: newTree,
        fileContents: newContents,
        openTabs: newTabs,
      }
    })
    get().addOutputEntry('FileSystem', `Renamed: ${oldPath} → ${newName}`)
  },

  readFile: (path) => get().fileContents[path],

  writeFile: (path, content) => {
    set((state) => {
      const newContents = { ...state.fileContents, [path]: content }
      // If file doesn't exist in tree, create it
      const fileExists = !!findNode(state.fileTree, path)
      const fileName = path.split('/').pop() || 'untitled'
      const parentPath = path.substring(0, path.lastIndexOf('/'))
      const newTree = fileExists
        ? state.fileTree
        : addFileNode(state.fileTree, parentPath, {
            name: fileName,
            path,
            type: 'file',
            language: getLanguageFromPath(path),
          })
      const newExpanded = fileExists ? state.expandedFolders : { ...state.expandedFolders, [parentPath]: true }
      // Mark as unstaged
      const newUnstaged = state.gitUnstaged.includes(path) ? state.gitUnstaged : [...state.gitUnstaged, path]
      return { fileContents: newContents, fileTree: newTree, expandedFolders: newExpanded, gitUnstaged: newUnstaged }
    })
  },

  toggleFolder: (path) =>
    set((state) => ({
      expandedFolders: {
        ...state.expandedFolders,
        [path]: !state.expandedFolders[path],
      },
    })),

  isFolderExpanded: (path) => !!get().expandedFolders[path],

  // ─── AI ─────────────────────────────────────────────────

  addChatMessage: (message) => set((state) => ({ chatMessages: [...state.chatMessages, message] })),
  clearChatMessages: () => set({ chatMessages: [] }),
  setAiLoading: (loading) => set({ isAiLoading: loading }),
  setActiveAiProvider: (provider) => set({ activeAiProvider: provider }),
  updateAiProvider: (id, updates) =>
    set((state) => ({
      aiProviders: state.aiProviders.map((p) => (p.id === id ? { ...p, ...updates } : p)),
    })),
  addAiProvider: (provider) =>
    set((state) => ({
      aiProviders: [...state.aiProviders, provider],
      activeAiProvider: state.activeAiProvider || provider.id,
    })),
  removeAiProvider: (id) =>
    set((state) => ({
      aiProviders: state.aiProviders.filter((p) => p.id !== id),
      activeAiProvider: state.activeAiProvider === id
        ? (state.aiProviders.find((p) => p.id !== id)?.id || '')
        : state.activeAiProvider,
    })),

  // ─── GitHub ─────────────────────────────────────────────

  setGitCloneUrl: (url) => set({ gitCloneUrl: url }),
  setIsGitCloning: (cloning) => set({ isGitCloning: cloning }),
  addGitRepo: (repo) => set((state) => ({ gitRepos: [...state.gitRepos, repo] })),
  setGithubToken: (token) => set({ githubToken: token }),

  setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),

  addTerminalHistory: (entry) => set((state) => ({ terminalHistory: [...state.terminalHistory, entry] })),
  clearTerminalHistory: () => set({ terminalHistory: [] }),
  setTerminalCwd: (cwd) => set({ terminalCwd: cwd }),

  // ─── TODOs ──────────────────────────────────────────────

  addTodo: (text, priority = 'medium', source = 'user') =>
    set((state) => ({
      todos: [...state.todos, {
        id: generateId('todo'),
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

  // ─── Notifications ──────────────────────────────────────

  addNotification: (type, message) => {
    const id = generateId('notif')
    set((state) => ({
      notifications: [...state.notifications, { id, type, message, timestamp: Date.now() }],
    }))
    setTimeout(() => {
      get().removeNotification(id)
    }, 4000)
  },

  removeNotification: (id) =>
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    })),

  // ─── Output Log ─────────────────────────────────────────

  addOutputEntry: (source, message, level = 'info') =>
    set((state) => ({
      outputLog: [...state.outputLog, { timestamp: Date.now(), source, message, level }],
    })),

  clearOutputLog: () => set({ outputLog: [] }),

  // ─── Search ─────────────────────────────────────────────

  searchInFiles: (query) => {
    const state = get()
    if (!query.trim()) return []
    const results: SearchResult[] = []
    const lowerQuery = query.toLowerCase()

    Object.entries(state.fileContents).forEach(([filePath, content]) => {
      const lines = content.split('\n')
      lines.forEach((line, index) => {
        const col = line.toLowerCase().indexOf(lowerQuery)
        if (col !== -1) {
          results.push({
            filePath,
            fileName: filePath.split('/').pop() || filePath,
            line: index + 1,
            column: col + 1,
            text: line.trim(),
          })
        }
      })
    })
    return results
  },

  // ─── Git Virtual ────────────────────────────────────────

  stageFile: (path) =>
    set((state) => ({
      gitStaged: state.gitStaged.includes(path) ? state.gitStaged : [...state.gitStaged, path],
      gitUnstaged: state.gitUnstaged.filter((p) => p !== path),
    })),

  unstageFile: (path) =>
    set((state) => ({
      gitUnstaged: state.gitUnstaged.includes(path) ? state.gitUnstaged : [...state.gitUnstaged, path],
      gitStaged: state.gitStaged.filter((p) => p !== path),
    })),

  // ─── PWA ────────────────────────────────────────────────

  setPwaInstallPrompt: (prompt) => set({ pwaInstallPrompt: prompt, pwaInstallAvailable: !!prompt }),
  setPwaInstallAvailable: (available) => set({ pwaInstallAvailable: available }),
}))

// ─── Tree manipulation helpers ──────────────────────────

function findNode(tree: FileNode[], path: string): FileNode | null {
  for (const node of tree) {
    if (node.path === path) return node
    if (node.children) {
      const found = findNode(node.children, path)
      if (found) return found
    }
  }
  return null
}

function addFileNode(tree: FileNode[], parentPath: string, newNode: FileNode): FileNode[] {
  if (!parentPath || parentPath === '/') {
    // Add to root level
    const exists = tree.some((n) => n.path === newNode.path)
    if (exists) return tree
    return sortFileNodes([...tree, newNode])
  }

  return tree.map((node) => {
    if (node.path === parentPath && node.type === 'folder') {
      const children = node.children || []
      const exists = children.some((c) => c.path === newNode.path)
      if (exists) return node
      return { ...node, children: sortFileNodes([...children, newNode]) }
    }
    if (node.children) {
      return { ...node, children: addFileNode(node.children, parentPath, newNode) }
    }
    return node
  })
}

function removeFileNode(tree: FileNode[], path: string): FileNode[] {
  return tree
    .filter((node) => node.path !== path)
    .map((node) => {
      if (node.children) {
        return { ...node, children: removeFileNode(node.children, path) }
      }
      return node
    })
}

function renameFileNode(tree: FileNode[], oldPath: string, newPath: string, newName: string): FileNode[] {
  return tree.map((node) => {
    if (node.path === oldPath) {
      const isFolder = node.type === 'folder'
      return {
        ...node,
        name: newName,
        path: newPath,
        ...(isFolder && node.children ? {
          children: node.children.map((child) => {
            const childNewPath = newPath + child.path.slice(oldPath.length)
            return { ...child, path: childNewPath }
          }),
        } : {}),
      }
    }
    if (node.children) {
      return { ...node, children: renameFileNode(node.children, oldPath, newPath, newName) }
    }
    return node
  })
}
