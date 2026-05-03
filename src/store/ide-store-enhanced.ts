import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
// ─── Existing Types (from original store) ───────────────────

export type SidebarPanel = 'explorer' | 'search' | 'git' | 'ai' | 'github' | 'extensions' | 'settings' | 'todos' | 'docker' | 'database' | 'collaboration' | 'lsp' | 'voice' | 'themes' | 'canvas'
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

// ─── New Types: File System Access API ──────────────────────

export interface FSFileEntry {
  path: string
  name: string
  kind: 'file' | 'directory'
}

// ─── New Types: Collaboration ───────────────────────────────

export interface CollabPeer {
  id: string
  name: string
  color: string
  cursorPosition: CursorPosition
  selectionRange?: {
    startLine: number
    startCol: number
    endLine: number
    endCol: number
  }
  activeFile?: string
}

// ─── New Types: Docker ──────────────────────────────────────

export interface DockerContainer {
  id: string
  name: string
  image: string
  status: 'running' | 'stopped' | 'paused' | 'restarting' | 'created' | 'exited'
  ports: string[]
  created: string
}

export interface DockerImage {
  id: string
  name: string
  tag: string
  size: number
  created: string
}

// ─── New Types: Database ────────────────────────────────────

export interface DBConnection {
  id: string
  name: string
  type: 'postgresql' | 'mysql' | 'sqlite' | 'mongodb' | 'redis' | 'mssql'
  host: string
  port: number
  database: string
  connected: boolean
  username?: string
  ssl?: boolean
}

export interface DBTable {
  name: string
  schema: string
  rowCount: number
  columns?: DBColumn[]
}

export interface DBColumn {
  name: string
  type: string
  nullable: boolean
  primaryKey: boolean
  defaultValue?: string
}

export interface DBQueryResult {
  columns: string[]
  rows: Record<string, unknown>[]
  executionTime: number
  affectedRows?: number
}

// ─── New Types: LSP ────────────────────────────────────────

export interface LSPServer {
  id: string
  language: string
  status: 'starting' | 'running' | 'stopped' | 'error'
  capabilities: string[]
  version?: string
}

export interface LSPDiagnostic {
  severity: 'error' | 'warning' | 'info' | 'hint'
  message: string
  line: number
  column: number
  endLine?: number
  endColumn?: number
  source?: string
  code?: string | number
}

// ─── New Types: Voice ───────────────────────────────────────

export interface VoiceCommand {
  id: string
  transcript: string
  confidence: number
  timestamp: number
}

// ─── New Types: Themes ──────────────────────────────────────

export interface CustomTheme {
  id: string
  name: string
  colors: {
    background: string
    foreground: string
    primary: string
    primaryForeground: string
    secondary: string
    secondaryForeground: string
    accent: string
    accentForeground: string
    muted: string
    mutedForeground: string
    border: string
    card: string
    cardForeground: string
    editorBackground: string
    editorForeground: string
    editorLineHighlight: string
    editorSelection: string
    editorCursor: string
    sidebarBackground: string
    sidebarForeground: string
    activityBarBackground: string
    activityBarForeground: string
    terminalBackground: string
    terminalForeground: string
    [key: string]: string
  }
  author: string
  version: string
  description?: string
  tags?: string[]
}

// ─── New Types: Enhanced Extensions ─────────────────────────

export interface RegistryExtension {
  id: string
  name: string
  namespace: string
  version: string
  description: string
  author: string
  iconUrl?: string
  downloadCount: number
  rating: number
  categories: string[]
  tags: string[]
  publishedDate: string
  lastUpdated: string
  repository?: string
  license?: string
  displayName?: string
  publisher?: string
}

export interface InstalledExtension {
  id: string
  registryId: string
  name: string
  version: string
  enabled: boolean
  installedAt: number
  settings?: Record<string, unknown>
}

// ─── New Types: Enhanced Git ────────────────────────────────

export interface GitRemote {
  name: string
  url: string
  type?: 'fetch' | 'push'
}

export interface GitCommit {
  hash: string
  message: string
  author: string
  date: string
  parents?: string[]
}

// ─── Helper Functions ───────────────────────────────────────

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

// Helper: generate unique IDs (browser-native, no external deps)
let _idCounter = 0
function generateId(prefix: string = 'id'): string {
  _idCounter++
  const random = typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID().slice(0, 8)
    : `${Date.now().toString(36)}${_idCounter}`
  return `${prefix}-${random}`
}


// ─── Tree manipulation helpers ──────────────────────────────

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

// ─── Default Custom Theme ───────────────────────────────────

const defaultDarkTheme: CustomTheme = {
  id: 'default-dark',
  name: 'Default Dark',
  colors: {
    background: '#1e1e1e',
    foreground: '#d4d4d4',
    primary: '#007acc',
    primaryForeground: '#ffffff',
    secondary: '#3c3c3c',
    secondaryForeground: '#d4d4d4',
    accent: '#c586c0',
    accentForeground: '#ffffff',
    muted: '#2d2d2d',
    mutedForeground: '#858585',
    border: '#404040',
    card: '#252526',
    cardForeground: '#d4d4d4',
    editorBackground: '#1e1e1e',
    editorForeground: '#d4d4d4',
    editorLineHighlight: '#2a2d2e',
    editorSelection: '#264f78',
    editorCursor: '#aeafad',
    sidebarBackground: '#252526',
    sidebarForeground: '#cccccc',
    activityBarBackground: '#333333',
    activityBarForeground: '#ffffff',
    terminalBackground: '#1e1e1e',
    terminalForeground: '#d4d4d4',
  },
  author: 'AICodeStudio',
  version: '1.0.0',
  description: 'Default dark theme',
}

// ─── Enhanced Store Interface ───────────────────────────────

interface IDEState {
  // ─── Existing Sidebar State ─────────────────────────────
  activeSidebarPanel: SidebarPanel
  sidebarVisible: boolean
  sidebarWidth: number

  // ─── Existing Editor State ──────────────────────────────
  openTabs: TabInfo[]
  activeTabId: string | null
  cursorPosition: CursorPosition
  editorSettings: EditorSettings

  // ─── Existing Bottom Panel State ────────────────────────
  bottomPanelVisible: boolean
  bottomPanelHeight: number
  activeBottomPanel: BottomPanel

  // ─── Existing Virtual File System State ─────────────────
  fileTree: FileNode[]
  fileContents: Record<string, string>
  expandedFolders: Record<string, boolean>
  workspaceName: string

  // ─── Existing AI State ──────────────────────────────────
  aiProviders: AIProvider[]
  chatMessages: ChatMessage[]
  isAiLoading: boolean
  activeAiProvider: string

  // ─── Existing GitHub State ──────────────────────────────
  gitRepos: string[]
  isGitCloning: boolean
  gitCloneUrl: string
  githubToken: string

  // ─── Existing Git (virtual) State ───────────────────────
  gitBranch: string
  gitStaged: string[]
  gitUnstaged: string[]
  gitCommitCount: number

  // ─── Existing Command Palette State ─────────────────────
  commandPaletteOpen: boolean

  // ─── Existing Terminal State ────────────────────────────
  terminalHistory: string[]
  terminalCwd: string

  // ─── Existing TODOs State ───────────────────────────────
  todos: TodoItem[]

  // ─── Existing Notifications State ───────────────────────
  notifications: Notification[]

  // ─── Existing Output Log State ──────────────────────────
  outputLog: OutputEntry[]

  // ─── Existing PWA State ─────────────────────────────────
  pwaInstallPrompt: unknown | null
  pwaInstallAvailable: boolean

  // ─── NEW: File System Access API State ──────────────────
  fsHandle: FileSystemDirectoryHandle | null
  fsAccessSupported: boolean
  localFiles: Record<string, string>

  // ─── NEW: Collaboration State ───────────────────────────
  collabConnected: boolean
  collabRoomId: string | null
  collabPeers: CollabPeer[]
  collabProvider: 'yjs' | 'none'

  // ─── NEW: Docker State ──────────────────────────────────
  dockerContainers: DockerContainer[]
  dockerImages: DockerImage[]
  dockerConnected: boolean
  dockerLoading: boolean

  // ─── NEW: Database State ────────────────────────────────
  dbConnections: DBConnection[]
  dbActiveConnection: string | null
  dbTables: DBTable[]
  dbQueryResult: DBQueryResult | null
  dbQueryRunning: boolean

  // ─── NEW: LSP State ────────────────────────────────────
  lspServers: LSPServer[]
  lspDiagnostics: Record<string, LSPDiagnostic[]>
  lspConnected: boolean

  // ─── NEW: Voice State ──────────────────────────────────
  voiceListening: boolean
  voiceSupported: boolean
  voiceLanguage: string
  voiceTranscript: string

  // ─── NEW: Themes State ─────────────────────────────────
  installedThemes: CustomTheme[]
  activeThemeId: string
  marketplaceThemes: CustomTheme[]

  // ─── NEW: Enhanced Extensions State ─────────────────────
  extensionRegistry: RegistryExtension[]
  installedExtensions: InstalledExtension[]
  extensionSearchQuery: string
  extensionLoading: boolean

  // ─── NEW: Enhanced Git State ────────────────────────────
  gitInitialized: boolean
  gitRemotes: GitRemote[]
  gitLog: GitCommit[]
  gitDiff: Record<string, string>
  gitLoading: boolean

  // ─── EXISTING Actions ───────────────────────────────────

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

  addTodo: (text: string, priority?: TodoItem['priority'], source?: TodoItem['source']) => void
  toggleTodo: (id: string) => void
  removeTodo: (id: string) => void
  updateTodo: (id: string, updates: Partial<Pick<TodoItem, 'text' | 'priority'>>) => void
  clearCompletedTodos: () => void

  addNotification: (type: Notification['type'], message: string) => void
  removeNotification: (id: string) => void

  addOutputEntry: (source: string, message: string, level?: OutputEntry['level']) => void
  clearOutputLog: () => void

  searchInFiles: (query: string) => SearchResult[]

  stageFile: (path: string) => void
  unstageFile: (path: string) => void

  setPwaInstallPrompt: (prompt: unknown) => void
  setPwaInstallAvailable: (available: boolean) => void

  // ─── NEW: File System Access API Actions ────────────────

  openLocalDirectory: () => Promise<void>
  saveFileLocally: (path: string, content: string) => Promise<void>
  readLocalFile: (path: string) => Promise<string | null>

  // ─── NEW: Collaboration Actions ─────────────────────────

  joinRoom: (roomId: string) => void
  leaveRoom: () => void
  updatePeerCursor: (peerId: string, cursor: CursorPosition, activeFile?: string) => void

  // ─── NEW: Docker Actions ────────────────────────────────

  fetchContainers: () => Promise<void>
  fetchImages: () => Promise<void>
  startContainer: (id: string) => Promise<void>
  stopContainer: (id: string) => Promise<void>
  removeContainer: (id: string) => Promise<void>

  // ─── NEW: Database Actions ──────────────────────────────

  addDBConnection: (connection: Omit<DBConnection, 'id' | 'connected'>) => void
  removeDBConnection: (id: string) => void
  connectDB: (id: string) => Promise<void>
  disconnectDB: (id: string) => void
  executeQuery: (sql: string) => Promise<void>
  fetchTables: () => Promise<void>

  // ─── NEW: LSP Actions ──────────────────────────────────

  startLSP: (language: string) => void
  stopLSP: (id: string) => void
  getDiagnostics: (filePath: string) => LSPDiagnostic[]

  // ─── NEW: Voice Actions ────────────────────────────────

  startListening: () => void
  stopListening: () => void
  setVoiceLanguage: (lang: string) => void

  // ─── NEW: Themes Actions ───────────────────────────────

  installTheme: (id: string) => void
  uninstallTheme: (id: string) => void
  applyTheme: (id: string) => void
  createCustomTheme: (theme: Omit<CustomTheme, 'id'>) => void
  fetchMarketplaceThemes: () => Promise<void>

  // ─── NEW: Enhanced Extensions Actions ───────────────────

  searchExtensions: (query: string) => Promise<void>
  installExtension: (id: string) => void
  uninstallExtension: (id: string) => void
  fetchPopularExtensions: () => Promise<void>

  // ─── NEW: Enhanced Git Actions ──────────────────────────

  gitInit: () => Promise<void>
  gitAdd: (paths: string[]) => Promise<void>
  gitCommit: (message: string) => Promise<void>
  gitPush: (remote: string, branch: string) => Promise<void>
  gitPull: (remote: string, branch: string) => Promise<void>
  gitCheckout: (branch: string) => Promise<void>
  gitCreateBranch: (name: string) => Promise<void>
  gitMerge: (branch: string) => Promise<void>
  gitRebase: (branch: string) => Promise<void>
  gitFetchDiff: () => Promise<void>
  gitFetchLog: () => Promise<void>
}

// ─── Enhanced Store Implementation ──────────────────────────

export const useIDEStore = create<IDEState>()(
  persist(
    (set, get) => ({
      // ─── Existing Initial State ──────────────────────────

      activeSidebarPanel: 'explorer' as SidebarPanel,
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
      activeBottomPanel: 'terminal' as BottomPanel,

      fileTree: [],
      fileContents: {},
      expandedFolders: {},
      workspaceName: '',

      aiProviders: [],
      chatMessages: [],
      isAiLoading: false,
      activeAiProvider: '',

      gitRepos: [],
      isGitCloning: false,
      gitCloneUrl: '',
      githubToken: '',

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

      // ─── NEW: File System Access API Initial State ───────

      fsHandle: null,
      fsAccessSupported: typeof window !== 'undefined' && 'showDirectoryPicker' in window,
      localFiles: {},

      // ─── NEW: Collaboration Initial State ────────────────

      collabConnected: false,
      collabRoomId: null,
      collabPeers: [],
      collabProvider: 'none' as const,

      // ─── NEW: Docker Initial State ───────────────────────

      dockerContainers: [],
      dockerImages: [],
      dockerConnected: false,
      dockerLoading: false,

      // ─── NEW: Database Initial State ─────────────────────

      dbConnections: [],
      dbActiveConnection: null,
      dbTables: [],
      dbQueryResult: null,
      dbQueryRunning: false,

      // ─── NEW: LSP Initial State ─────────────────────────

      lspServers: [],
      lspDiagnostics: {},
      lspConnected: false,

      // ─── NEW: Voice Initial State ───────────────────────

      voiceListening: false,
      voiceSupported: typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window),
      voiceLanguage: 'en-US',
      voiceTranscript: '',

      // ─── NEW: Themes Initial State ──────────────────────

      installedThemes: [defaultDarkTheme],
      activeThemeId: 'default-dark',
      marketplaceThemes: [],

      // ─── NEW: Enhanced Extensions Initial State ─────────

      extensionRegistry: [],
      installedExtensions: [],
      extensionSearchQuery: '',
      extensionLoading: false,

      // ─── NEW: Enhanced Git Initial State ────────────────

      gitInitialized: false,
      gitRemotes: [],
      gitLog: [],
      gitDiff: {},
      gitLoading: false,

      // ─── EXISTING Actions ────────────────────────────────

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

      // ─── Virtual File System ────────────────────────────

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
          const newExpanded = { ...state.expandedFolders, [parentPath]: true }
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
        set((s) => {
          const newContents = { ...s.fileContents }
          Object.keys(newContents).forEach((key) => {
            if (key === path || key.startsWith(path + '/')) {
              delete newContents[key]
            }
          })
          const newTree = removeFileNode(s.fileTree, path)
          const newTabs = s.openTabs.filter((t) => !t.path.startsWith(path) && t.path !== path)
          const newActiveId = newTabs.find((t) => t.id === s.activeTabId)
            ? s.activeTabId
            : newTabs.length > 0
              ? newTabs[newTabs.length - 1].id
              : null
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

          if (findNode(state.fileTree, newPath) && newPath !== oldPath) {
            return state
          }

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

          const newTree = renameFileNode(state.fileTree, oldPath, newPath, newName)

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

      // ─── AI ─────────────────────────────────────────────

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

      // ─── GitHub ─────────────────────────────────────────

      setGitCloneUrl: (url) => set({ gitCloneUrl: url }),
      setIsGitCloning: (cloning) => set({ isGitCloning: cloning }),
      addGitRepo: (repo) => set((state) => ({ gitRepos: [...state.gitRepos, repo] })),
      setGithubToken: (token) => set({ githubToken: token }),

      setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),

      addTerminalHistory: (entry) => set((state) => ({ terminalHistory: [...state.terminalHistory, entry] })),
      clearTerminalHistory: () => set({ terminalHistory: [] }),
      setTerminalCwd: (cwd) => set({ terminalCwd: cwd }),

      // ─── TODOs ──────────────────────────────────────────

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

      // ─── Notifications ──────────────────────────────────

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

      // ─── Output Log ─────────────────────────────────────

      addOutputEntry: (source, message, level = 'info') =>
        set((state) => ({
          outputLog: [...state.outputLog, { timestamp: Date.now(), source, message, level }],
        })),

      clearOutputLog: () => set({ outputLog: [] }),

      // ─── Search ─────────────────────────────────────────

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

      // ─── Git Virtual ────────────────────────────────────

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

      // ─── PWA ────────────────────────────────────────────

      setPwaInstallPrompt: (prompt) => set({ pwaInstallPrompt: prompt, pwaInstallAvailable: !!prompt }),
      setPwaInstallAvailable: (available) => set({ pwaInstallAvailable: available }),

      // ─── NEW: File System Access API Actions ────────────

      openLocalDirectory: async () => {
        const state = get()
        if (!state.fsAccessSupported) {
          get().addNotification('error', 'File System Access API is not supported in this browser')
          return
        }

        try {
          // @ts-expect-error — showDirectoryPicker is not in all TS libs
          const handle: FileSystemDirectoryHandle = await window.showDirectoryPicker()
          const files: Record<string, string> = {}

          // Recursively read directory
          async function readDirectory(dirHandle: FileSystemDirectoryHandle, basePath: string) {
            // @ts-expect-error -- values() is available in modern browsers but not in TS types yet
            for await (const entry of dirHandle.values()) {
              const entryPath = `${basePath}/${entry.name}`
              if (entry.kind === 'file') {
                try {
                  const fileHandle = entry as FileSystemFileHandle
                  const file = await fileHandle.getFile()
                  const content = await file.text()
                  files[entryPath] = content
                } catch {
                  // Skip files that can't be read (e.g., binary)
                }
              } else if (entry.kind === 'directory') {
                await readDirectory(entry as FileSystemDirectoryHandle, entryPath)
              }
            }
          }

          await readDirectory(handle, handle.name)

          set({
            fsHandle: handle,
            localFiles: files,
            workspaceName: handle.name,
          })

          get().addNotification('success', `Opened directory: ${handle.name}`)
          get().addOutputEntry('FileSystem', `Opened local directory: ${handle.name} (${Object.keys(files).length} files)`)
        } catch (err) {
          if ((err as DOMException)?.name !== 'AbortError') {
            get().addNotification('error', `Failed to open directory: ${(err as Error).message}`)
          }
        }
      },

      saveFileLocally: async (path, content) => {
        const state = get()
        if (!state.fsHandle) {
          get().addNotification('error', 'No local directory is opened')
          return
        }

        try {
          const pathParts = path.split('/').filter(Boolean)
          const fileName = pathParts.pop()!

          // Navigate to the correct subdirectory
          let currentHandle: FileSystemDirectoryHandle = state.fsHandle
          for (const dirName of pathParts) {
            currentHandle = await currentHandle.getDirectoryHandle(dirName)
          }

          // Create/write the file
          const fileHandle = await currentHandle.getFileHandle(fileName, { create: true })
          const writable = await fileHandle.createWritable()
          await writable.write(content)
          await writable.close()

          // Update local cache
          set((s) => ({
            localFiles: { ...s.localFiles, [path]: content },
          }))

          get().addOutputEntry('FileSystem', `Saved file locally: ${path}`)
        } catch (err) {
          get().addNotification('error', `Failed to save file: ${(err as Error).message}`)
        }
      },

      readLocalFile: async (path) => {
        const state = get()
        if (!state.fsHandle) {
          return null
        }

        try {
          const pathParts = path.split('/').filter(Boolean)
          const fileName = pathParts.pop()!

          let currentHandle: FileSystemDirectoryHandle = state.fsHandle
          for (const dirName of pathParts) {
            currentHandle = await currentHandle.getDirectoryHandle(dirName)
          }

          const fileHandle = await currentHandle.getFileHandle(fileName)
          const file = await fileHandle.getFile()
          const content = await file.text()

          set((s) => ({
            localFiles: { ...s.localFiles, [path]: content },
          }))

          return content
        } catch {
          return null
        }
      },

      // ─── NEW: Collaboration Actions ─────────────────────

      joinRoom: (roomId) => {
        set({
          collabRoomId: roomId,
          collabConnected: true,
          collabProvider: 'yjs',
          collabPeers: [],
        })
        get().addNotification('success', `Joined collaboration room: ${roomId}`)
        get().addOutputEntry('Collaboration', `Joined room: ${roomId}`)
      },

      leaveRoom: () => {
        const state = get()
        set({
          collabConnected: false,
          collabRoomId: null,
          collabPeers: [],
          collabProvider: 'none',
        })
        if (state.collabRoomId) {
          get().addNotification('info', `Left collaboration room: ${state.collabRoomId}`)
          get().addOutputEntry('Collaboration', `Left room: ${state.collabRoomId}`)
        }
      },

      updatePeerCursor: (peerId, cursor, activeFile) => {
        set((state) => ({
          collabPeers: state.collabPeers.map((p) =>
            p.id === peerId
              ? { ...p, cursorPosition: cursor, ...(activeFile !== undefined && { activeFile }) }
              : p
          ),
        }))
      },

      // ─── NEW: Docker Actions ────────────────────────────

      fetchContainers: async () => {
        set({ dockerLoading: true })
        try {
          const res = await fetch('/api/docker/containers?XTransformPort=3001')
          if (res.ok) {
            const data = await res.json()
            set({ dockerContainers: data.containers || [], dockerConnected: true })
          } else {
            set({ dockerConnected: false })
            get().addNotification('warning', 'Failed to fetch Docker containers')
          }
        } catch {
          set({ dockerConnected: false })
          get().addNotification('error', 'Docker daemon is not reachable')
        } finally {
          set({ dockerLoading: false })
        }
      },

      fetchImages: async () => {
        set({ dockerLoading: true })
        try {
          const res = await fetch('/api/docker/images?XTransformPort=3001')
          if (res.ok) {
            const data = await res.json()
            set({ dockerImages: data.images || [], dockerConnected: true })
          } else {
            set({ dockerConnected: false })
          }
        } catch {
          set({ dockerConnected: false })
        } finally {
          set({ dockerLoading: false })
        }
      },

      startContainer: async (id) => {
        try {
          const res = await fetch(`/api/docker/containers/${id}/start?XTransformPort=3001`, { method: 'POST' })
          if (res.ok) {
            set((state) => ({
              dockerContainers: state.dockerContainers.map((c) =>
                c.id === id ? { ...c, status: 'running' as const } : c
              ),
            }))
            get().addNotification('success', `Container started: ${id.slice(0, 12)}`)
            get().addOutputEntry('Docker', `Started container: ${id.slice(0, 12)}`)
          }
        } catch {
          get().addNotification('error', `Failed to start container: ${id.slice(0, 12)}`)
        }
      },

      stopContainer: async (id) => {
        try {
          const res = await fetch(`/api/docker/containers/${id}/stop?XTransformPort=3001`, { method: 'POST' })
          if (res.ok) {
            set((state) => ({
              dockerContainers: state.dockerContainers.map((c) =>
                c.id === id ? { ...c, status: 'stopped' as const } : c
              ),
            }))
            get().addNotification('success', `Container stopped: ${id.slice(0, 12)}`)
            get().addOutputEntry('Docker', `Stopped container: ${id.slice(0, 12)}`)
          }
        } catch {
          get().addNotification('error', `Failed to stop container: ${id.slice(0, 12)}`)
        }
      },

      removeContainer: async (id) => {
        try {
          const res = await fetch(`/api/docker/containers/${id}?XTransformPort=3001`, { method: 'DELETE' })
          if (res.ok) {
            set((state) => ({
              dockerContainers: state.dockerContainers.filter((c) => c.id !== id),
            }))
            get().addNotification('success', `Container removed: ${id.slice(0, 12)}`)
            get().addOutputEntry('Docker', `Removed container: ${id.slice(0, 12)}`)
          }
        } catch {
          get().addNotification('error', `Failed to remove container: ${id.slice(0, 12)}`)
        }
      },

      // ─── NEW: Database Actions ──────────────────────────

      addDBConnection: (connection) => {
        const id = generateId('db')
        set((state) => ({
          dbConnections: [...state.dbConnections, { ...connection, id, connected: false }],
        }))
        get().addOutputEntry('Database', `Added connection: ${connection.name}`)
      },

      removeDBConnection: (id) => {
        set((state) => ({
          dbConnections: state.dbConnections.filter((c) => c.id !== id),
          dbActiveConnection: state.dbActiveConnection === id ? null : state.dbActiveConnection,
        }))
        get().addOutputEntry('Database', `Removed connection: ${id}`)
      },

      connectDB: async (id) => {
        set((state) => ({
          dbConnections: state.dbConnections.map((c) =>
            c.id === id ? { ...c, status: 'connecting' as const } : c
          ),
        }))

        try {
          const conn = get().dbConnections.find((c) => c.id === id)
          if (!conn) return

          const res = await fetch('/api/database/connect?XTransformPort=3002', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(conn),
          })

          if (res.ok) {
            set((state) => ({
              dbConnections: state.dbConnections.map((c) =>
                c.id === id ? { ...c, connected: true } : c
              ),
              dbActiveConnection: id,
            }))
            get().addNotification('success', `Connected to: ${conn.name}`)
            get().addOutputEntry('Database', `Connected to: ${conn.name}`)
            // Auto-fetch tables after connecting
            get().fetchTables()
          } else {
            set((state) => ({
              dbConnections: state.dbConnections.map((c) =>
                c.id === id ? { ...c, connected: false } : c
              ),
            }))
            get().addNotification('error', `Failed to connect to: ${conn.name}`)
          }
        } catch (err) {
          set((state) => ({
            dbConnections: state.dbConnections.map((c) =>
              c.id === id ? { ...c, connected: false } : c
            ),
          }))
          get().addNotification('error', `Connection error: ${(err as Error).message}`)
        }
      },

      disconnectDB: (id) => {
        set((state) => ({
          dbConnections: state.dbConnections.map((c) =>
            c.id === id ? { ...c, connected: false } : c
          ),
          dbActiveConnection: state.dbActiveConnection === id ? null : state.dbActiveConnection,
          dbTables: state.dbActiveConnection === id ? [] : state.dbTables,
        }))
        const conn = get().dbConnections.find((c) => c.id === id)
        if (conn) {
          get().addOutputEntry('Database', `Disconnected from: ${conn.name}`)
        }
      },

      executeQuery: async (sql) => {
        const state = get()
        if (!state.dbActiveConnection) {
          get().addNotification('warning', 'No active database connection')
          return
        }

        set({ dbQueryRunning: true, dbQueryResult: null })

        try {
          const startTime = Date.now()
          const res = await fetch('/api/database/query?XTransformPort=3002', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              connectionId: state.dbActiveConnection,
              sql,
            }),
          })

          const executionTime = Date.now() - startTime

          if (res.ok) {
            const data = await res.json()
            set({
              dbQueryResult: {
                columns: data.columns || [],
                rows: data.rows || [],
                executionTime,
                affectedRows: data.affectedRows,
              },
            })
            get().addOutputEntry('Database', `Query executed in ${executionTime}ms`)
          } else {
            const errorData = await res.json().catch(() => ({ error: 'Unknown error' }))
            get().addNotification('error', `Query failed: ${errorData.error || res.statusText}`)
            get().addOutputEntry('Database', `Query error: ${errorData.error || res.statusText}`, 'error')
          }
        } catch (err) {
          get().addNotification('error', `Query execution failed: ${(err as Error).message}`)
        } finally {
          set({ dbQueryRunning: false })
        }
      },

      fetchTables: async () => {
        const state = get()
        if (!state.dbActiveConnection) return

        try {
          const res = await fetch(`/api/database/tables?XTransformPort=3002&connectionId=${state.dbActiveConnection}`)
          if (res.ok) {
            const data = await res.json()
            set({ dbTables: data.tables || [] })
          }
        } catch {
          get().addOutputEntry('Database', 'Failed to fetch tables', 'error')
        }
      },

      // ─── NEW: LSP Actions ──────────────────────────────

      startLSP: (language) => {
        const id = generateId('lsp')
        const existing = get().lspServers.find((s) => s.language === language && s.status === 'running')
        if (existing) {
          get().addNotification('info', `LSP for ${language} is already running`)
          return
        }

        set((state) => ({
          lspServers: [...state.lspServers, {
            id,
            language,
            status: 'starting' as const,
            capabilities: [],
          }],
        }))

        // Simulate LSP startup (in a real implementation, this would connect to a language server)
        setTimeout(() => {
          set((state) => ({
            lspServers: state.lspServers.map((s) =>
              s.id === id
                ? {
                    ...s,
                    status: 'running' as const,
                    capabilities: ['completion', 'diagnostics', 'hover', 'definition', 'references', 'rename'],
                    version: '1.0.0',
                  }
                : s
            ),
            lspConnected: state.lspServers.some((s) => s.id === id) || state.lspServers.some((s) => s.status === 'running'),
          }))
          get().addOutputEntry('LSP', `Language server started for: ${language}`)
          get().addNotification('success', `${language} language server is ready`)
        }, 1500)
      },

      stopLSP: (id) => {
        set((state) => {
          const newServers = state.lspServers.map((s) =>
            s.id === id ? { ...s, status: 'stopped' as const } : s
          )
          return {
            lspServers: newServers,
            lspConnected: newServers.some((s) => s.status === 'running'),
          }
        })
        get().addOutputEntry('LSP', `Language server stopped: ${id}`)
      },

      getDiagnostics: (filePath) => {
        return get().lspDiagnostics[filePath] || []
      },

      // ─── NEW: Voice Actions ────────────────────────────

      startListening: () => {
        const state = get()
        if (!state.voiceSupported) {
          get().addNotification('error', 'Speech recognition is not supported in this browser')
          return
        }

        set({ voiceListening: true, voiceTranscript: '' })
        get().addOutputEntry('Voice', `Started listening (language: ${state.voiceLanguage})`)

        // In a real implementation, this would use the Web Speech API
        // For now, we set up the state management layer
        try {
          const SpeechRecognition = (window as unknown as Record<string, unknown>).SpeechRecognition
            || (window as unknown as Record<string, unknown>).webkitSpeechRecognition

          if (SpeechRecognition) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const recognition = new (SpeechRecognition as any)();
            recognition.lang = state.voiceLanguage
            recognition.continuous = false
            recognition.interimResults = false

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            recognition.onresult = (event: any) => {
              const transcript = event.results[0][0].transcript
              set({ voiceTranscript: transcript })
              get().addOutputEntry('Voice', `Recognized: ${transcript}`)
            }

            recognition.onerror = () => {
              set({ voiceListening: false })
              get().addNotification('error', 'Speech recognition error')
            }

            recognition.onend = () => {
              set({ voiceListening: false })
            }

            recognition.start()

            // Store recognition instance for stopping later
            ;(window as unknown as Record<string, unknown>).__speechRecognition = recognition
          }
        } catch (err) {
          set({ voiceListening: false })
          get().addNotification('error', `Voice initialization failed: ${(err as Error).message}`)
        }
      },

      stopListening: () => {
        set({ voiceListening: false })
        try {
          const recognition = (window as unknown as Record<string, unknown>).__speechRecognition as // eslint-disable-next-line @typescript-eslint/no-explicit-any
            any | undefined
          recognition?.stop()
        } catch {
          // Ignore errors when stopping
        }
        get().addOutputEntry('Voice', 'Stopped listening')
      },

      setVoiceLanguage: (lang) => {
        set({ voiceLanguage: lang })
        get().addOutputEntry('Voice', `Language set to: ${lang}`)
      },

      // ─── NEW: Themes Actions ───────────────────────────

      installTheme: (id) => {
        const state = get()
        const theme = state.marketplaceThemes.find((t) => t.id === id)
        if (!theme) {
          get().addNotification('error', `Theme not found: ${id}`)
          return
        }
        if (state.installedThemes.some((t) => t.id === id)) {
          get().addNotification('info', `Theme already installed: ${theme.name}`)
          return
        }
        set((state) => ({
          installedThemes: [...state.installedThemes, theme],
        }))
        get().addNotification('success', `Theme installed: ${theme.name}`)
        get().addOutputEntry('Themes', `Installed theme: ${theme.name}`)
      },

      uninstallTheme: (id) => {
        const state = get()
        if (id === 'default-dark') {
          get().addNotification('warning', 'Cannot uninstall the default theme')
          return
        }
        const theme = state.installedThemes.find((t) => t.id === id)
        set((state) => ({
          installedThemes: state.installedThemes.filter((t) => t.id !== id),
          activeThemeId: state.activeThemeId === id ? 'default-dark' : state.activeThemeId,
        }))
        if (theme) {
          get().addNotification('info', `Theme uninstalled: ${theme.name}`)
          get().addOutputEntry('Themes', `Uninstalled theme: ${theme.name}`)
        }
      },

      applyTheme: (id) => {
        const state = get()
        if (!state.installedThemes.some((t) => t.id === id)) {
          get().addNotification('error', `Theme not installed: ${id}`)
          return
        }
        set({ activeThemeId: id })
        const theme = state.installedThemes.find((t) => t.id === id)
        if (theme) {
          get().addOutputEntry('Themes', `Applied theme: ${theme.name}`)
        }
      },

      createCustomTheme: (theme) => {
        const id = generateId('theme')
        const newTheme: CustomTheme = { ...theme, id }
        set((state) => ({
          installedThemes: [...state.installedThemes, newTheme],
        }))
        get().addNotification('success', `Custom theme created: ${theme.name}`)
        get().addOutputEntry('Themes', `Created custom theme: ${theme.name}`)
      },

      fetchMarketplaceThemes: async () => {
        try {
          const res = await fetch('/api/themes/marketplace?XTransformPort=3001')
          if (res.ok) {
            const data = await res.json()
            set({ marketplaceThemes: data.themes || [] })
          } else {
            get().addNotification('warning', 'Failed to fetch marketplace themes')
          }
        } catch {
          get().addNotification('error', 'Theme marketplace is not reachable')
        }
      },

      // ─── NEW: Enhanced Extensions Actions ───────────────

      searchExtensions: async (query) => {
        set({ extensionSearchQuery: query, extensionLoading: true })
        try {
          const params = new URLSearchParams({ query, size: '30' })
          const res = await fetch(`/api/extensions?${params.toString()}`)
          if (res.ok) {
            const data = await res.json()
            set({ extensionRegistry: data.extensions || [] })
          } else {
            get().addNotification('warning', 'Extension search failed')
          }
        } catch {
          get().addNotification('error', 'Extension registry is not reachable')
        } finally {
          set({ extensionLoading: false })
        }
      },

      installExtension: (id) => {
        const state = get()
        const ext = state.extensionRegistry.find((e) => e.id === id)
        if (!ext) {
          get().addNotification('error', `Extension not found: ${id}`)
          return
        }
        if (state.installedExtensions.some((e) => e.registryId === id)) {
          get().addNotification('info', `Extension already installed: ${ext.name}`)
          return
        }
        const installed: InstalledExtension = {
          id: generateId('ext'),
          registryId: ext.id,
          name: ext.name,
          version: ext.version,
          enabled: true,
          installedAt: Date.now(),
        }
        set((state) => ({
          installedExtensions: [...state.installedExtensions, installed],
        }))
        get().addNotification('success', `Extension installed: ${ext.name}`)
        get().addOutputEntry('Extensions', `Installed extension: ${ext.name} v${ext.version}`)
      },

      uninstallExtension: (id) => {
        const state = get()
        const ext = state.installedExtensions.find((e) => e.id === id)
        set((state) => ({
          installedExtensions: state.installedExtensions.filter((e) => e.id !== id),
        }))
        if (ext) {
          get().addNotification('info', `Extension uninstalled: ${ext.name}`)
          get().addOutputEntry('Extensions', `Uninstalled extension: ${ext.name}`)
        }
      },

      fetchPopularExtensions: async () => {
        set({ extensionLoading: true })
        try {
          const res = await fetch('/api/extensions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'popular', size: 30 }),
          })
          if (res.ok) {
            const data = await res.json()
            set({ extensionRegistry: data.extensions || [] })
          } else {
            get().addNotification('warning', 'Failed to fetch popular extensions')
          }
        } catch {
          get().addNotification('error', 'Extension registry is not reachable')
        } finally {
          set({ extensionLoading: false })
        }
      },

      // ─── NEW: Enhanced Git Actions ─────────────────────

      gitInit: async () => {
        set({ gitLoading: true })
        try {
          const res = await fetch('/api/git/init?XTransformPort=3003', { method: 'POST' })
          if (res.ok) {
            set({ gitInitialized: true, gitBranch: 'main' })
            get().addNotification('success', 'Git repository initialized')
            get().addOutputEntry('Git', 'Initialized git repository')
          } else {
            get().addNotification('error', 'Failed to initialize git repository')
          }
        } catch (err) {
          get().addNotification('error', `Git init failed: ${(err as Error).message}`)
        } finally {
          set({ gitLoading: false })
        }
      },

      gitAdd: async (paths) => {
        set({ gitLoading: true })
        try {
          const res = await fetch('/api/git/add?XTransformPort=3003', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ paths }),
          })
          if (res.ok) {
            set((state) => ({
              gitStaged: [...new Set([...state.gitStaged, ...paths])],
              gitUnstaged: state.gitUnstaged.filter((p) => !paths.includes(p)),
            }))
            get().addOutputEntry('Git', `Staged ${paths.length} file(s)`)
          }
        } catch (err) {
          get().addNotification('error', `Git add failed: ${(err as Error).message}`)
        } finally {
          set({ gitLoading: false })
        }
      },

      gitCommit: async (message) => {
        set({ gitLoading: true })
        try {
          const res = await fetch('/api/git/commit?XTransformPort=3003', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message }),
          })
          if (res.ok) {
            set((state) => ({
              gitStaged: [],
              gitCommitCount: state.gitCommitCount + 1,
            }))
            get().addNotification('success', `Committed: ${message}`)
            get().addOutputEntry('Git', `Committed: ${message}`)
            // Refresh log after commit
            get().gitFetchLog()
          } else {
            get().addNotification('error', 'Commit failed')
          }
        } catch (err) {
          get().addNotification('error', `Git commit failed: ${(err as Error).message}`)
        } finally {
          set({ gitLoading: false })
        }
      },

      gitPush: async (remote, branch) => {
        set({ gitLoading: true })
        try {
          const res = await fetch('/api/git/push?XTransformPort=3003', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ remote, branch }),
          })
          if (res.ok) {
            get().addNotification('success', `Pushed to ${remote}/${branch}`)
            get().addOutputEntry('Git', `Pushed to ${remote}/${branch}`)
          } else {
            get().addNotification('error', 'Push failed')
          }
        } catch (err) {
          get().addNotification('error', `Git push failed: ${(err as Error).message}`)
        } finally {
          set({ gitLoading: false })
        }
      },

      gitPull: async (remote, branch) => {
        set({ gitLoading: true })
        try {
          const res = await fetch('/api/git/pull?XTransformPort=3003', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ remote, branch }),
          })
          if (res.ok) {
            get().addNotification('success', `Pulled from ${remote}/${branch}`)
            get().addOutputEntry('Git', `Pulled from ${remote}/${branch}`)
          } else {
            get().addNotification('error', 'Pull failed')
          }
        } catch (err) {
          get().addNotification('error', `Git pull failed: ${(err as Error).message}`)
        } finally {
          set({ gitLoading: false })
        }
      },

      gitCheckout: async (branch) => {
        set({ gitLoading: true })
        try {
          const res = await fetch('/api/git/checkout?XTransformPort=3003', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ branch }),
          })
          if (res.ok) {
            set({ gitBranch: branch })
            get().addNotification('success', `Switched to branch: ${branch}`)
            get().addOutputEntry('Git', `Checked out: ${branch}`)
          } else {
            get().addNotification('error', `Checkout failed: ${branch}`)
          }
        } catch (err) {
          get().addNotification('error', `Git checkout failed: ${(err as Error).message}`)
        } finally {
          set({ gitLoading: false })
        }
      },

      gitCreateBranch: async (name) => {
        set({ gitLoading: true })
        try {
          const res = await fetch('/api/git/branch?XTransformPort=3003', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name }),
          })
          if (res.ok) {
            get().addNotification('success', `Created branch: ${name}`)
            get().addOutputEntry('Git', `Created branch: ${name}`)
          } else {
            get().addNotification('error', `Branch creation failed: ${name}`)
          }
        } catch (err) {
          get().addNotification('error', `Git branch creation failed: ${(err as Error).message}`)
        } finally {
          set({ gitLoading: false })
        }
      },

      gitMerge: async (branch) => {
        set({ gitLoading: true })
        try {
          const res = await fetch('/api/git/merge?XTransformPort=3003', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ branch }),
          })
          if (res.ok) {
            get().addNotification('success', `Merged branch: ${branch}`)
            get().addOutputEntry('Git', `Merged branch: ${branch}`)
          } else {
            const data = await res.json().catch(() => ({ error: 'Merge conflict or error' }))
            get().addNotification('error', `Merge failed: ${data.error}`)
          }
        } catch (err) {
          get().addNotification('error', `Git merge failed: ${(err as Error).message}`)
        } finally {
          set({ gitLoading: false })
        }
      },

      gitRebase: async (branch) => {
        set({ gitLoading: true })
        try {
          const res = await fetch('/api/git/rebase?XTransformPort=3003', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ branch }),
          })
          if (res.ok) {
            get().addNotification('success', `Rebased onto: ${branch}`)
            get().addOutputEntry('Git', `Rebased onto: ${branch}`)
          } else {
            get().addNotification('error', `Rebase failed: ${branch}`)
          }
        } catch (err) {
          get().addNotification('error', `Git rebase failed: ${(err as Error).message}`)
        } finally {
          set({ gitLoading: false })
        }
      },

      gitFetchDiff: async () => {
        set({ gitLoading: true })
        try {
          const res = await fetch('/api/git/diff?XTransformPort=3003')
          if (res.ok) {
            const data = await res.json()
            set({ gitDiff: data.diffs || {} })
          }
        } catch (err) {
          get().addOutputEntry('Git', `Failed to fetch diff: ${(err as Error).message}`, 'error')
        } finally {
          set({ gitLoading: false })
        }
      },

      gitFetchLog: async () => {
        set({ gitLoading: true })
        try {
          const res = await fetch('/api/git/log?XTransformPort=3003')
          if (res.ok) {
            const data = await res.json()
            set({ gitLog: data.commits || [] })
          }
        } catch (err) {
          get().addOutputEntry('Git', `Failed to fetch log: ${(err as Error).message}`, 'error')
        } finally {
          set({ gitLoading: false })
        }
      },
    }),

    // ─── Persist Middleware Configuration ───────────────────
    // SECURITY: We do NOT persist API keys, tokens, or credentials.
    // Only preferences, layout, theme, and non-sensitive data are stored.
    {
      name: 'aicodestudio-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        editorSettings: state.editorSettings,
        // aiProviders are persisted WITHOUT apiKey/endpoint (stripped below)
        aiProviders: state.aiProviders.map((p) => ({
          id: p.id,
          name: p.name,
          status: p.status,
          model: p.model,
          // apiKey and endpoint are intentionally NOT persisted
          error: p.error,
        })),
        activeAiProvider: state.activeAiProvider,
        // githubToken is intentionally NOT persisted
        installedExtensions: state.installedExtensions,
        installedThemes: state.installedThemes,
        activeThemeId: state.activeThemeId,
        // dbConnections are persisted WITHOUT credentials
        dbConnections: state.dbConnections.map((c) => ({
          id: c.id,
          name: c.name,
          type: c.type,
          host: c.host,
          port: c.port,
          database: c.database,
          connected: false, // Always start disconnected
          // username and ssl are intentionally NOT persisted
        })),
        todos: state.todos,
        workspaceName: state.workspaceName,
      }),
      // Migration: remove any previously persisted secrets
      version: 1,
      migrate: (persistedState: unknown, version: number) => {
        if (version === 0) {
          // v0 persisted apiKey, githubToken, and db usernames — clear them
          const state = { ...(persistedState as Record<string, unknown>) }
          if (Array.isArray(state.aiProviders)) {
            state.aiProviders = (state.aiProviders as Array<Record<string, unknown>>).map(
              (p) => {
                const { apiKey, endpoint, ...rest } = p
                return rest
              }
            )
          }
          if (state.githubToken) {
            delete state.githubToken
          }
          if (Array.isArray(state.dbConnections)) {
            state.dbConnections = (state.dbConnections as Array<Record<string, unknown>>).map(
              (c) => {
                const { username, password, ...rest } = c
                return { ...rest, connected: false }
              }
            )
          }
          return state
        }
        return persistedState
      },
      // Skip hydration mismatch on SSR
      skipHydration: true,
    }
  )
)

// ─── Helper: Initialize hydration on client ────────────────

if (typeof window !== 'undefined') {
  useIDEStore.persist.rehydrate()
}
