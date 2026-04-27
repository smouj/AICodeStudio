'use client'

import { useState, useEffect, useRef } from 'react'
import {
  Search,
  Bot,
  GitBranch,
  Terminal,
  Settings,
  Palette,
  Moon,
  Sun,
  Code2,
  FolderOpen,
} from 'lucide-react'
import { useIDEStore } from '@/store/ide-store'

export function CommandPalette() {
  const { commandPaletteOpen, setCommandPaletteOpen, setActiveSidebarPanel, setTheme, theme, toggleBottomPanel, setActiveBottomPanel } = useIDEStore()
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const commands = [
    { id: 'toggle-theme', label: 'Toggle Theme', shortcut: 'Ctrl+T', Icon: theme === 'dark' ? Sun : Moon, category: 'Preferences', action: () => setTheme(theme === 'dark' ? 'light' : 'dark') },
    { id: 'open-explorer', label: 'Show Explorer', Icon: FolderOpen, category: 'View', action: () => setActiveSidebarPanel('explorer') },
    { id: 'open-search', label: 'Show Search', shortcut: 'Ctrl+Shift+F', Icon: Search, category: 'View', action: () => setActiveSidebarPanel('search') },
    { id: 'open-git', label: 'Show Source Control', shortcut: 'Ctrl+Shift+G', Icon: GitBranch, category: 'View', action: () => setActiveSidebarPanel('git') },
    { id: 'open-ai', label: 'Show AI Assistant', shortcut: 'Ctrl+Shift+A', Icon: Bot, category: 'AI', action: () => setActiveSidebarPanel('ai') },
    { id: 'open-github', label: 'Show GitHub', Icon: GitBranch, category: 'View', action: () => setActiveSidebarPanel('github') },
    { id: 'open-extensions', label: 'Show Extensions', shortcut: 'Ctrl+Shift+X', Icon: Code2, category: 'View', action: () => setActiveSidebarPanel('extensions') },
    { id: 'open-terminal', label: 'Toggle Terminal', shortcut: 'Ctrl+`', Icon: Terminal, category: 'View', action: () => { setActiveBottomPanel('terminal'); toggleBottomPanel() } },
    { id: 'open-settings', label: 'Open Settings', shortcut: 'Ctrl+,', Icon: Settings, category: 'Preferences', action: () => setActiveSidebarPanel('settings') },
    { id: 'open-color-theme', label: 'Color Theme', Icon: Palette, category: 'Preferences', action: () => {} },
    { id: 'ai-explain', label: 'AI: Explain Code', Icon: Bot, category: 'AI', action: () => setActiveSidebarPanel('ai') },
    { id: 'ai-refactor', label: 'AI: Refactor Code', Icon: Bot, category: 'AI', action: () => setActiveSidebarPanel('ai') },
    { id: 'ai-fix', label: 'AI: Fix Errors', Icon: Bot, category: 'AI', action: () => setActiveSidebarPanel('ai') },
  ]

  const lowerQuery = query.toLowerCase()
  const filtered = commands.filter(
    (c) => c.label.toLowerCase().includes(lowerQuery) || c.category.toLowerCase().includes(lowerQuery)
  )

  const [hoveredIndex, setHoveredIndex] = useState(-1)
  const activeIndex = hoveredIndex >= 0 ? hoveredIndex : 0

  useEffect(() => {
    if (commandPaletteOpen) {
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [commandPaletteOpen])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'P') {
        e.preventDefault()
        setCommandPaletteOpen(!commandPaletteOpen)
      }
      if (e.key === 'Escape') {
        setCommandPaletteOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [commandPaletteOpen, setCommandPaletteOpen])

  if (!commandPaletteOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex justify-center pt-[15%]" onClick={() => setCommandPaletteOpen(false)}>
      <div
        className="w-[520px] max-h-[360px] bg-[#0d1117] border border-[#00e5ff]/20 rounded-lg shadow-2xl shadow-black/50 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 px-4 py-3 border-b border-[#00e5ff]/10">
          <Search size={14} className="text-[#5a6270] shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => { setQuery(e.target.value); setHoveredIndex(-1) }}
            placeholder="Type a command..."
            className="flex-1 bg-transparent text-[13px] text-[#e6edf3] placeholder-[#3d4450] outline-none font-mono"
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') {
                e.preventDefault()
                setHoveredIndex((prev) => prev < 0 ? 0 : Math.min(prev + 1, filtered.length - 1))
              } else if (e.key === 'ArrowUp') {
                e.preventDefault()
                setHoveredIndex((prev) => Math.max(prev - 1, 0))
              } else if (e.key === 'Enter') {
                e.preventDefault()
                const cmd = filtered[activeIndex]
                if (cmd) {
                  cmd.action()
                  setCommandPaletteOpen(false)
                }
              }
            }}
          />
          <span className="text-[10px] text-[#3d4450] font-mono">ESC</span>
        </div>

        <div className="overflow-y-auto max-h-[300px] py-1 custom-scrollbar">
          {filtered.length === 0 ? (
            <div className="px-4 py-8 text-center text-[#3d4450] text-[13px] font-mono">
              No matching commands
            </div>
          ) : (
            filtered.map((cmd, i) => {
              const Icon = cmd.Icon
              return (
                <div
                  key={cmd.id}
                  className={`
                    flex items-center justify-between px-4 py-2 cursor-pointer transition-colors
                    ${i === activeIndex ? 'bg-[#00e5ff]/10 text-[#e6edf3]' : 'text-[#8b949e]'}
                  `}
                  onClick={() => {
                    cmd.action()
                    setCommandPaletteOpen(false)
                  }}
                  onMouseEnter={() => setHoveredIndex(i)}
                >
                  <div className="flex items-center gap-2">
                    <Icon size={14} className={i === activeIndex ? 'text-[#00e5ff]' : 'text-[#5a6270]'} />
                    <span className="text-[12px] font-mono">{cmd.label}</span>
                    <span className="text-[10px] text-[#3d4450]">{cmd.category}</span>
                  </div>
                  {cmd.shortcut && (
                    <span className="text-[10px] text-[#3d4450] font-mono">{cmd.shortcut}</span>
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
