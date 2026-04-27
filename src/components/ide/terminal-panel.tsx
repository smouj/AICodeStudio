'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Terminal, X, Plus, ChevronDown } from 'lucide-react'
import { useIDEStore } from '@/store/ide-store'

export function TerminalPanel() {
  const { terminalHistory, addTerminalHistory, bottomPanelVisible } = useIDEStore()
  const [input, setInput] = useState('')
  const [activeTerm, setActiveTerm] = useState(0)
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
      addTerminalHistory('  help     - Show this help message')
      addTerminalHistory('  clear    - Clear terminal')
      addTerminalHistory('  ls       - List files')
      addTerminalHistory('  pwd      - Print working directory')
      addTerminalHistory('  date     - Show current date')
      addTerminalHistory('  echo     - Echo text')
      addTerminalHistory('  ai       - Toggle AI assistance')
      addTerminalHistory('  git      - Git status')
      addTerminalHistory('  todo     - Manage TODOs')
      addTerminalHistory('  version  - Show AICodeStudio version')
    } else if (trimmed === 'clear') {
      // Clear handled separately
    } else if (trimmed === 'ls') {
      addTerminalHistory('  src/  public/  package.json  tsconfig.json  README.md  .gitignore')
    } else if (trimmed === 'pwd') {
      addTerminalHistory('/home/user/AICodeStudio')
    } else if (trimmed === 'date') {
      addTerminalHistory(new Date().toLocaleString())
    } else if (trimmed === 'version') {
      addTerminalHistory('\x1b[36mAICodeStudio v1.0.0\x1b[0m — Next-Generation AI-Powered IDE')
    } else if (trimmed.startsWith('echo ')) {
      addTerminalHistory(cmd.slice(5))
    } else if (trimmed === 'git status') {
      addTerminalHistory('On branch \x1b[36mmain\x1b[0m')
      addTerminalHistory('Changes not staged for commit:')
      addTerminalHistory('  modified:   src/components/Editor.tsx')
      addTerminalHistory('  modified:   src/app/page.tsx')
      addTerminalHistory('')
      addTerminalHistory('Untracked files:')
      addTerminalHistory('  src/lib/ai-providers.ts')
    } else if (trimmed === 'git' || trimmed === 'ai' || trimmed === 'todo') {
      addTerminalHistory(`Usage: ${trimmed} [subcommand]`)
    } else if (trimmed === '') {
      // empty
    } else {
      addTerminalHistory(`command not found: ${cmd}`)
    }
    addTerminalHistory('')
  }, [addTerminalHistory])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (input.trim().toLowerCase() === 'clear') {
      addTerminalHistory('')
    } else {
      processCommand(input)
    }
    setInput('')
  }

  const terminals = [
    { id: 0, name: 'bash', icon: Terminal },
  ]

  return (
    <div className="h-full flex flex-col bg-[#0a0e14]">
      {/* Terminal Header */}
      <div className="flex items-center justify-between px-3 py-1 bg-[#050810] border-b border-[rgba(0,212,170,0.06)] shrink-0">
        <div className="flex items-center gap-1">
          {terminals.map((term) => (
            <button
              key={term.id}
              onClick={() => setActiveTerm(term.id)}
              className={`
                flex items-center gap-1 px-2 py-0.5 text-[11px] font-mono rounded transition-colors cursor-pointer
                ${activeTerm === term.id
                  ? 'text-[#00d4aa] bg-[rgba(0,212,170,0.08)]'
                  : 'text-[#30363d] hover:text-[#6e7681]'
                }
              `}
            >
              <term.icon size={11} />
              {term.name}
            </button>
          ))}
          <button className="text-[#30363d] hover:text-[#484f58] transition-colors ml-1 cursor-pointer">
            <Plus size={12} />
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button className="text-[#30363d] hover:text-[#484f58] transition-colors cursor-pointer">
            <ChevronDown size={12} />
          </button>
          <button className="text-[#30363d] hover:text-[#484f58] transition-colors cursor-pointer">
            <X size={12} />
          </button>
        </div>
      </div>

      {/* Terminal Content */}
      <div
        ref={terminalRef}
        className="flex-1 overflow-y-auto p-3 font-mono text-[12px] leading-5 custom-scrollbar"
        onClick={() => inputRef.current?.focus()}
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
          <span className="text-[#00d4aa] mr-2">$</span>
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 bg-transparent text-[#e6edf3] outline-none caret-[#00d4aa]"
            spellCheck={false}
            autoComplete="off"
          />
        </form>
      </div>
    </div>
  )
}
