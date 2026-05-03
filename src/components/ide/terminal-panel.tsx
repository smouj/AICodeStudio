'use client'

import { useState, useRef, useEffect, useCallback, memo } from 'react'
import { Terminal, X, Plus, ChevronDown, Trash2, Wifi, WifiOff } from 'lucide-react'
import { useIDEStore } from '@/store/ide-store'

// ─── WebSocket PTY Connection ───────────────────────────────────────────────

interface PtyConnection {
  ws: WebSocket | null
  sessionId: string | null
  connected: boolean
}

function usePtyConnection() {
  const [connection, setConnection] = useState<PtyConnection>({ ws: null, sessionId: null, connected: false })
  const addTerminalHistory = useIDEStore((s) => s.addTerminalHistory)
  const wsRef = useRef<WebSocket | null>(null)

  const connect = useCallback(async () => {
    try {
      // Create a session via the API
      const res = await fetch('/api/terminal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shell: '/bin/bash' }),
      })

      if (!res.ok) {
        addTerminalHistory('  [PTY] Failed to create session')
        return
      }

      const data = await res.json()
      const wsUrl = data.session?.websocketUrl

      if (!wsUrl) {
        addTerminalHistory('  [PTY] No WebSocket URL — virtual mode only')
        return
      }

      const ws = new WebSocket(wsUrl)

      ws.onopen = () => {
        setConnection({ ws, sessionId: data.session.id, connected: true })
        wsRef.current = ws
        addTerminalHistory('  [PTY] Connected to real terminal')
      }

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data)
          if (msg.type === 'output') {
            // Split output by newlines for display
            msg.data.split('\n').forEach((line: string) => {
              addTerminalHistory(line)
            })
          } else if (msg.type === 'exit') {
            addTerminalHistory(`  [PTY] Process exited with code ${msg.code}`)
            setConnection({ ws: null, sessionId: null, connected: false })
            wsRef.current = null
          } else if (msg.type === 'session') {
            addTerminalHistory(`  [PTY] Session ${msg.id} (pid: ${msg.pid})`)
          } else if (msg.type === 'error') {
            addTerminalHistory(`  [PTY Error] ${msg.data}`)
          }
        } catch {
          // Ignore malformed messages
        }
      }

      ws.onclose = () => {
        setConnection({ ws: null, sessionId: null, connected: false })
        wsRef.current = null
        addTerminalHistory('  [PTY] Disconnected')
      }

      ws.onerror = () => {
        addTerminalHistory('  [PTY] Connection error — falling back to virtual terminal')
        setConnection({ ws: null, sessionId: null, connected: false })
        wsRef.current = null
      }
    } catch (err) {
      addTerminalHistory(`  [PTY] Connection failed: ${(err as Error).message}`)
    }
  }, [addTerminalHistory])

  const sendInput = useCallback((data: string) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'input', data }))
      return true
    }
    return false
  }, [])

  const resize = useCallback((cols: number, rows: number) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'resize', cols, rows }))
    }
  }, [])

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
      setConnection({ ws: null, sessionId: null, connected: false })
    }
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close()
      }
    }
  }, [])

  return { connection, connect, sendInput, resize, disconnect }
}

// ─── Terminal Panel ─────────────────────────────────────────────────────────

export const TerminalPanel = memo(function TerminalPanel() {
  const terminalHistory = useIDEStore((s) => s.terminalHistory)
  const addTerminalHistory = useIDEStore((s) => s.addTerminalHistory)
  const clearTerminalHistory = useIDEStore((s) => s.clearTerminalHistory)
  const bottomPanelVisible = useIDEStore((s) => s.bottomPanelVisible)
  const terminalCwd = useIDEStore((s) => s.terminalCwd)

  const [input, setInput] = useState('')
  const [ptyMode, setPtyMode] = useState<'virtual' | 'real'>('virtual')
  const terminalRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const commandHistoryRef = useRef<string[]>([])
  const historyIndexRef = useRef(-1)
  const pty = usePtyConnection()

  // Check terminal capabilities on mount
  useEffect(() => {
    fetch('/api/capabilities')
      .then((r) => r.json())
      .then((data) => {
        if (data.capabilities?.terminal?.enabled) {
          setPtyMode('real')
        }
      })
      .catch(() => {
        // Default to virtual
      })
  }, [])

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight
    }
  }, [terminalHistory])

  useEffect(() => {
    if (bottomPanelVisible) {
      inputRef.current?.focus()
    }
  }, [bottomPanelVisible])

  // Auto-connect to PTY when in real mode
  useEffect(() => {
    if (ptyMode === 'real' && !pty.connection.connected && !pty.connection.ws) {
      pty.connect()
    }
  }, [ptyMode, pty])

  // Helper: list files in a directory from the virtual FS
  const listDirectory = useCallback((dirPath: string): string[] => {
    const state = useIDEStore.getState()
    const results: string[] = []

    const findChildren = (nodes: typeof state.fileTree, target: string): typeof state.fileTree | null => {
      for (const node of nodes) {
        if (node.path === target && node.type === 'folder') return node.children || []
        if (node.children) {
          const found = findChildren(node.children, target)
          if (found) return found
        }
      }
      return null
    }

    const children = findChildren(state.fileTree, dirPath)
    if (children) {
      children.forEach((c) => {
        results.push(c.type === 'folder' ? `${c.name}/` : c.name)
      })
    }

    Object.keys(state.fileContents).forEach((path) => {
      const parent = path.substring(0, path.lastIndexOf('/'))
      if (parent === dirPath) {
        const name = path.split('/').pop() || ''
        if (!results.includes(name) && !results.includes(`${name}/`)) {
          results.push(name)
        }
      }
    })

    return results
  }, [])

  const processCommand = useCallback((cmd: string) => {
    const trimmed = cmd.trim()
    const lower = trimmed.toLowerCase()
    const state = useIDEStore.getState()
    const cwd = state.terminalCwd

    addTerminalHistory(`$ ${cmd}`)

    // If real PTY is connected, send input directly
    if (pty.connection.connected && pty.sendInput(trimmed + '\n')) {
      return
    }

    // ── Virtual terminal fallback ──

    if (lower === 'help') {
      addTerminalHistory('Available commands:')
      addTerminalHistory('  help              Show this help message')
      addTerminalHistory('  clear             Clear terminal')
      addTerminalHistory('  ls [path]         List files in directory')
      addTerminalHistory('  cd <path>         Change directory')
      addTerminalHistory('  pwd               Print working directory')
      addTerminalHistory('  cat <file>        Display file contents')
      addTerminalHistory('  touch <file>      Create an empty file')
      addTerminalHistory('  mkdir <dir>       Create a directory')
      addTerminalHistory('  rm <path>         Remove a file or directory')
      addTerminalHistory('  mv <old> <new>    Rename a file or directory')
      addTerminalHistory('  date              Show current date and time')
      addTerminalHistory('  echo <text>       Echo text')
      addTerminalHistory('  whoami            Show current user')
      addTerminalHistory('  ai                Show AI provider status')
      addTerminalHistory('  git status        Show git status')
      addTerminalHistory('  git log           Show recent commits')
      addTerminalHistory('  todo              Show TODO summary')
      addTerminalHistory('  version           Show AICodeStudio version')
      addTerminalHistory('  neofetch          System information')
      addTerminalHistory('  tree              Show file tree')
    } else if (lower === 'clear') {
      clearTerminalHistory()
      return
    } else if (lower === 'ls' || lower.startsWith('ls ')) {
      const targetPath = trimmed.slice(2).trim()
      const listPath = targetPath
        ? (targetPath.startsWith('/') ? targetPath : `${cwd === '/' ? '' : cwd}/${targetPath}`)
        : cwd
      const items = listDirectory(listPath)
      if (items.length === 0) {
        addTerminalHistory(`  (empty directory: ${listPath})`)
      } else {
        addTerminalHistory(`  ${items.sort().join('  ')}`)
      }
    } else if (lower.startsWith('cd ')) {
      const target = trimmed.slice(3).trim()
      if (target === '/' || target === '~') {
        useIDEStore.getState().setTerminalCwd('/')
        addTerminalHistory('  Changed to /')
      } else if (target === '..') {
        const parts = cwd.split('/').filter(Boolean)
        parts.pop()
        const newPath = '/' + parts.join('/')
        useIDEStore.getState().setTerminalCwd(newPath || '/')
        addTerminalHistory(`  Changed to ${newPath || '/'}`)
      } else {
        const newPath = target.startsWith('/') ? target : `${cwd === '/' ? '' : cwd}/${target}`
        const items = listDirectory(newPath)
        const exists = state.fileTree.some((n) => n.path === newPath && n.type === 'folder') ||
          Object.keys(state.fileContents).some((p) => p.startsWith(newPath + '/'))
        if (exists || items.length > 0 || newPath === '/') {
          useIDEStore.getState().setTerminalCwd(newPath)
          addTerminalHistory(`  Changed to ${newPath}`)
        } else {
          addTerminalHistory(`  cd: no such directory: ${target}`)
        }
      }
    } else if (lower === 'pwd') {
      addTerminalHistory(cwd)
    } else if (lower.startsWith('cat ')) {
      const fileName = trimmed.slice(4).trim()
      const filePath = fileName.startsWith('/') ? fileName : `${cwd === '/' ? '' : cwd}/${fileName}`
      const content = state.fileContents[filePath]
      if (content !== undefined) {
        content.split('\n').forEach((line) => addTerminalHistory(line))
      } else {
        addTerminalHistory(`  cat: ${fileName}: No such file`)
      }
    } else if (lower.startsWith('touch ')) {
      const fileName = trimmed.slice(6).trim()
      if (!fileName) {
        addTerminalHistory('  touch: missing file operand')
        return
      }
      const filePath = fileName.startsWith('/') ? fileName : `${cwd === '/' ? '' : cwd}/${fileName}`
      if (state.fileContents[filePath] !== undefined) {
        addTerminalHistory(`  touch: ${fileName} already exists`)
      } else {
        state.createFile(filePath, '')
        addTerminalHistory(`  Created: ${filePath}`)
      }
    } else if (lower.startsWith('mkdir ')) {
      const dirName = trimmed.slice(6).trim()
      if (!dirName) {
        addTerminalHistory('  mkdir: missing directory operand')
        return
      }
      const dirPath = dirName.startsWith('/') ? dirName : `${cwd === '/' ? '' : cwd}/${dirName}`
      state.createFolder(dirPath)
      addTerminalHistory(`  Created directory: ${dirPath}`)
    } else if (lower.startsWith('rm ')) {
      const name = trimmed.slice(3).trim()
      if (!name) {
        addTerminalHistory('  rm: missing operand')
        return
      }
      const path = name.startsWith('/') ? name : `${cwd === '/' ? '' : cwd}/${name}`
      if (state.fileContents[path] !== undefined || state.fileTree.some((n) => n.path === path)) {
        state.deleteNode(path)
        addTerminalHistory(`  Removed: ${path}`)
      } else {
        addTerminalHistory(`  rm: ${name}: No such file or directory`)
      }
    } else if (lower.startsWith('mv ')) {
      const parts = trimmed.slice(3).trim().split(/\s+/)
      if (parts.length < 2) {
        addTerminalHistory('  mv: missing destination operand')
        return
      }
      const oldPath = parts[0].startsWith('/') ? parts[0] : `${cwd === '/' ? '' : cwd}/${parts[0]}`
      const newName = parts[1]
      if (state.fileContents[oldPath] !== undefined || state.fileTree.some((n) => n.path === oldPath)) {
        state.renameNode(oldPath, newName)
        addTerminalHistory(`  Renamed: ${parts[0]} → ${newName}`)
      } else {
        addTerminalHistory(`  mv: ${parts[0]}: No such file or directory`)
      }
    } else if (lower === 'date') {
      addTerminalHistory(new Date().toLocaleString())
    } else if (lower === 'version') {
      addTerminalHistory('AICodeStudio v2.0.0 — Next-Generation AI-Powered IDE')
    } else if (trimmed.startsWith('echo ')) {
      addTerminalHistory(trimmed.slice(5))
    } else if (lower === 'whoami') {
      addTerminalHistory('user@aicode')
    } else if (lower === 'tree') {
      const printTree = (nodes: typeof state.fileTree, prefix: string = '') => {
        nodes.forEach((node, i) => {
          const isLast = i === nodes.length - 1
          const connector = isLast ? '└── ' : '├── '
          const childPrefix = isLast ? '    ' : '│   '
          addTerminalHistory(`${prefix}${connector}${node.name}${node.type === 'folder' ? '/' : ''}`)
          if (node.children) {
            printTree(node.children, prefix + childPrefix)
          }
        })
      }
      if (state.fileTree.length === 0) {
        addTerminalHistory('  (empty workspace)')
      } else {
        printTree(state.fileTree)
      }
    } else if (lower === 'git status') {
      addTerminalHistory(`On branch ${state.gitBranch}`)
      if (state.gitStaged.length > 0) {
        addTerminalHistory('Changes to be committed:')
        state.gitStaged.forEach((f) => addTerminalHistory(`  new file:   ${f}`))
      }
      if (state.gitUnstaged.length > 0) {
        addTerminalHistory('Changes not staged for commit:')
        state.gitUnstaged.forEach((f) => addTerminalHistory(`  modified:   ${f}`))
      }
      if (state.gitStaged.length === 0 && state.gitUnstaged.length === 0) {
        addTerminalHistory('nothing to commit, working tree clean')
      }
    } else if (lower === 'git log') {
      if (state.gitCommitCount === 0) {
        addTerminalHistory('fatal: your current branch does not have any commits yet')
      } else {
        for (let i = 0; i < Math.min(state.gitCommitCount, 5); i++) {
          addTerminalHistory(`commit ${Math.random().toString(36).slice(2, 9)}`)
          addTerminalHistory(`Author: User <user@aicode>`)
          addTerminalHistory(`Date:   ${new Date(Date.now() - i * 86400000).toISOString()}`)
          addTerminalHistory(``)
          addTerminalHistory(`    Commit ${state.gitCommitCount - i}`)
          addTerminalHistory(``)
        }
      }
    } else if (lower === 'git') {
      addTerminalHistory('usage: git [subcommand]')
      addTerminalHistory('  status    Show working tree status')
      addTerminalHistory('  log       Show commit logs')
      addTerminalHistory('  diff      Show changes')
    } else if (lower === 'ai') {
      const providers = state.aiProviders
      if (providers.length === 0) {
        addTerminalHistory('AI Providers: none configured')
        addTerminalHistory('  Use the AI panel to add a provider')
      } else {
        addTerminalHistory('AI Providers:')
        providers.forEach((p) => {
          const statusIcon = p.status === 'connected' ? '[+]' : p.status === 'error' ? '[!]' : '[-]'
          addTerminalHistory(`  ${statusIcon} ${p.name}  ${p.status}  model: ${p.model}`)
        })
      }
    } else if (lower === 'todo') {
      const todos = state.todos
      const pending = todos.filter(t => !t.completed).length
      const completed = todos.filter(t => t.completed).length
      addTerminalHistory(`TODOs: ${pending} pending, ${completed} completed`)
      todos.filter(t => !t.completed).forEach(t => {
        const priority = t.priority === 'high' ? '[H]' : t.priority === 'medium' ? '[M]' : '[L]'
        addTerminalHistory(`  ${priority} ${t.text}`)
      })
    } else if (lower === 'neofetch') {
      addTerminalHistory('  ┌──────────────────────────────┐')
      addTerminalHistory('  │  AICodeStudio v2.0.0         │')
      addTerminalHistory('  │  Next.js 16 + React 19       │')
      addTerminalHistory('  │  Monaco Editor               │')
      addTerminalHistory(`  │  Files: ${Object.keys(state.fileContents).length}                    │`)
      addTerminalHistory(`  │  Providers: ${state.aiProviders.filter(p => p.status === 'connected').length} connected           │`)
      addTerminalHistory(`  │  TODOs: ${state.todos.filter(t => !t.completed).length} pending               │`)
      addTerminalHistory(`  │  PTY: ${pty.connection.connected ? 'real' : 'virtual'}                    │`)
      addTerminalHistory('  │  PWA Ready                   │')
      addTerminalHistory('  └──────────────────────────────┘')
    } else if (trimmed === '') {
      // empty command
    } else {
      addTerminalHistory(`command not found: ${trimmed}`)
      addTerminalHistory('Type "help" for available commands')
    }
    addTerminalHistory('')

    // Save to command history
    if (trimmed) {
      commandHistoryRef.current = [...commandHistoryRef.current, trimmed].slice(-50)
      historyIndexRef.current = -1
    }
  }, [addTerminalHistory, clearTerminalHistory, listDirectory, pty])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    processCommand(input)
    setInput('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (commandHistoryRef.current.length > 0) {
        const newIndex = historyIndexRef.current < commandHistoryRef.current.length - 1
          ? historyIndexRef.current + 1
          : historyIndexRef.current
        historyIndexRef.current = newIndex
        setInput(commandHistoryRef.current[commandHistoryRef.current.length - 1 - newIndex])
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (historyIndexRef.current > 0) {
        historyIndexRef.current -= 1
        setInput(commandHistoryRef.current[commandHistoryRef.current.length - 1 - historyIndexRef.current])
      } else {
        historyIndexRef.current = -1
        setInput('')
      }
    }
  }

  const isPtyConnected = pty.connection.connected

  return (
    <div className="h-full flex flex-col bg-[#0a0e14]" role="region" aria-label="Terminal">
      {/* Terminal Header */}
      <div className="flex items-center justify-between px-3 py-1 bg-[#050810] border-b border-[rgba(0,212,170,0.06)] shrink-0">
        <div className="flex items-center gap-1">
          <button className="flex items-center gap-1 px-2 py-0.5 text-[11px] font-mono rounded text-[#00d4aa] bg-[rgba(0,212,170,0.08)] cursor-pointer">
            <Terminal size={11} />
            bash
          </button>
          {isPtyConnected ? (
            <Wifi size={10} className="text-[#00d4aa]" aria-label="Real PTY connected" />
          ) : (
            <WifiOff size={10} className="text-[#30363d]" aria-label="Virtual terminal (no PTY)" />
          )}
          <span className="text-[9px] font-mono text-[#30363d]">
            {isPtyConnected ? 'PTY' : 'virtual'}
          </span>
          <button className="text-[#30363d] hover:text-[#484f58] transition-colors ml-1 cursor-pointer" aria-label="New terminal">
            <Plus size={12} />
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={clearTerminalHistory} className="text-[#30363d] hover:text-[#484f58] transition-colors cursor-pointer" aria-label="Clear terminal" title="Clear">
            <Trash2 size={12} />
          </button>
          <button className="text-[#30363d] hover:text-[#484f58] transition-colors cursor-pointer" aria-label="Terminal options">
            <ChevronDown size={12} />
          </button>
          <button className="text-[#30363d] hover:text-[#484f58] transition-colors cursor-pointer" aria-label="Close terminal">
            <X size={12} />
          </button>
        </div>
      </div>

      {/* Terminal Content */}
      <div
        ref={terminalRef}
        className="flex-1 overflow-y-auto p-3 font-mono text-[12px] leading-5 custom-scrollbar"
        onClick={() => inputRef.current?.focus()}
        role="log"
        aria-label="Terminal output"
      >
        {terminalHistory.length === 0 && (
          <div className="text-[#30363d]">
            <div>AICodeStudio Terminal v2.0.0 ({isPtyConnected ? 'Real PTY' : 'Virtual'})</div>
            <div>Type &quot;help&quot; for available commands</div>
            {!isPtyConnected && ptyMode === 'virtual' && (
              <div className="text-[#30363d] mt-1">
                Set AICODE_ENABLE_TERMINAL=true with node-pty for a real terminal
              </div>
            )}
            <div></div>
          </div>
        )}
        {terminalHistory.map((line, i) => (
          <div key={i} className={
            line.startsWith('$')
              ? 'text-[#e6edf3]'
              : line.startsWith('  ')
                ? 'text-[#484f58]'
                : 'text-[#6e7681]'
          }>
            {line || '\u00A0'}
          </div>
        ))}
        <form onSubmit={handleSubmit} className="flex items-center">
          <span className="text-[#00d4aa] mr-2" aria-hidden="true">{isPtyConnected ? '❯' : '$'}</span>
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent text-[#e6edf3] outline-none caret-[#00d4aa]"
            spellCheck={false}
            autoComplete="off"
            aria-label="Terminal input"
          />
        </form>
      </div>
    </div>
  )
})
