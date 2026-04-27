'use client'

import { useState, useRef, useEffect, useCallback, memo } from 'react'
import { Terminal, X, Plus, ChevronDown, Trash2 } from 'lucide-react'
import { useIDEStore } from '@/store/ide-store'

export const TerminalPanel = memo(function TerminalPanel() {
  const terminalHistory = useIDEStore((s) => s.terminalHistory)
  const addTerminalHistory = useIDEStore((s) => s.addTerminalHistory)
  const clearTerminalHistory = useIDEStore((s) => s.clearTerminalHistory)
  const bottomPanelVisible = useIDEStore((s) => s.bottomPanelVisible)

  const [input, setInput] = useState('')
  const terminalRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

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

  const processCommand = useCallback((cmd: string) => {
    const trimmed = cmd.trim().toLowerCase()
    addTerminalHistory(`$ ${cmd}`)

    if (trimmed === 'help') {
      addTerminalHistory('Available commands:')
      addTerminalHistory('  help       Show this help message')
      addTerminalHistory('  clear      Clear terminal')
      addTerminalHistory('  ls         List files')
      addTerminalHistory('  pwd        Print working directory')
      addTerminalHistory('  date       Show current date')
      addTerminalHistory('  echo       Echo text')
      addTerminalHistory('  ai         Show AI provider status')
      addTerminalHistory('  git        Show git status')
      addTerminalHistory('  todo       Show TODO summary')
      addTerminalHistory('  version    Show AICodeStudio version')
      addTerminalHistory('  whoami     Show current user')
      addTerminalHistory('  neofetch   System information')
    } else if (trimmed === 'clear') {
      clearTerminalHistory()
      return
    } else if (trimmed === 'ls') {
      addTerminalHistory('  src/  public/  package.json  tsconfig.json  README.md  .gitignore')
    } else if (trimmed === 'pwd') {
      addTerminalHistory('/home/user/AICodeStudio')
    } else if (trimmed === 'date') {
      addTerminalHistory(new Date().toLocaleString())
    } else if (trimmed === 'version') {
      addTerminalHistory('AICodeStudio v1.0.0 — Next-Generation AI-Powered IDE')
    } else if (trimmed.startsWith('echo ')) {
      addTerminalHistory(cmd.slice(5))
    } else if (trimmed === 'git status') {
      addTerminalHistory('On branch main')
      addTerminalHistory('Changes not staged for commit:')
      addTerminalHistory('  modified:   src/components/Editor.tsx')
      addTerminalHistory('  modified:   src/app/page.tsx')
      addTerminalHistory('')
      addTerminalHistory('Untracked files:')
      addTerminalHistory('  src/lib/ai-providers.ts')
    } else if (trimmed === 'git') {
      addTerminalHistory('usage: git [subcommand]')
      addTerminalHistory('  status    Show working tree status')
      addTerminalHistory('  log       Show commit logs')
      addTerminalHistory('  diff      Show changes')
    } else if (trimmed === 'ai') {
      addTerminalHistory('AI Providers:')
      addTerminalHistory('  openclaw  connected    model: openclaw-4')
      addTerminalHistory('  hermes    disconnected  model: hermes-pro')
    } else if (trimmed === 'todo') {
      const todos = useIDEStore.getState().todos
      const pending = todos.filter(t => !t.completed).length
      const completed = todos.filter(t => t.completed).length
      addTerminalHistory(`TODOs: ${pending} pending, ${completed} completed`)
      todos.filter(t => !t.completed).forEach(t => {
        const priority = t.priority === 'high' ? '🔴' : t.priority === 'medium' ? '🟡' : '🟢'
        addTerminalHistory(`  ${priority} ${t.text}`)
      })
    } else if (trimmed === 'whoami') {
      addTerminalHistory('developer@aicode')
    } else if (trimmed === 'neofetch') {
      addTerminalHistory('  ╭──────────────────────╮')
      addTerminalHistory('  │   AICodeStudio v1.0   │')
      addTerminalHistory('  │   Next.js 16 + React  │')
      addTerminalHistory('  │   Monaco Editor       │')
      addTerminalHistory('  │   PWA Ready           │')
      addTerminalHistory('  ╰──────────────────────╯')
    } else if (trimmed === '') {
      // empty
    } else {
      addTerminalHistory(`command not found: ${cmd}`)
    }
    addTerminalHistory('')
  }, [addTerminalHistory, clearTerminalHistory])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    processCommand(input)
    setInput('')
  }

  return (
    <div className="h-full flex flex-col bg-[#0a0e14]" role="region" aria-label="Terminal">
      {/* Terminal Header */}
      <div className="flex items-center justify-between px-3 py-1 bg-[#050810] border-b border-[rgba(0,212,170,0.06)] shrink-0">
        <div className="flex items-center gap-1">
          <button className="flex items-center gap-1 px-2 py-0.5 text-[11px] font-mono rounded text-[#00d4aa] bg-[rgba(0,212,170,0.08)] cursor-pointer">
            <Terminal size={11} />
            bash
          </button>
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
          <span className="text-[#00d4aa] mr-2" aria-hidden="true">$</span>
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
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
