'use client'

import { memo } from 'react'
import {
  Files,
  Search,
  GitBranch,
  Bot,
  GitFork,
  Blocks,
  CheckSquare,
  Settings,
  Container,
  Database,
  Users,
  Code2,
  Mic,
  Palette,
  LayoutGrid,
} from 'lucide-react'
import { useIDEStore, type SidebarPanel } from '@/store/ide-store'

const activityItems: { id: SidebarPanel; icon: typeof Files; label: string }[] = [
  { id: 'explorer', icon: Files, label: 'Explorer' },
  { id: 'search', icon: Search, label: 'Search' },
  { id: 'git', icon: GitBranch, label: 'Source Control' },
  { id: 'todos', icon: CheckSquare, label: 'TODOs' },
  { id: 'ai', icon: Bot, label: 'AI Assistant' },
  { id: 'github', icon: GitFork, label: 'GitHub' },
  { id: 'extensions', icon: Blocks, label: 'Extensions' },
  { id: 'docker', icon: Container, label: 'Docker' },
  { id: 'database', icon: Database, label: 'Database' },
  { id: 'collaboration', icon: Users, label: 'Collaboration' },
  { id: 'lsp', icon: Code2, label: 'Language Servers' },
  { id: 'voice', icon: Mic, label: 'Voice-to-Code' },
  { id: 'themes', icon: Palette, label: 'Themes' },
  { id: 'canvas', icon: LayoutGrid, label: 'Canvas Navigation' },
]

export const ActivityBar = memo(function ActivityBar() {
  const activeSidebarPanel = useIDEStore((s) => s.activeSidebarPanel)
  const setActiveSidebarPanel = useIDEStore((s) => s.setActiveSidebarPanel)
  const setCommandPaletteOpen = useIDEStore((s) => s.setCommandPaletteOpen)
  const todos = useIDEStore((s) => s.todos)
  const pendingTodos = todos.filter((t) => !t.completed).length
  const collabConnected = useIDEStore((s) => s.collabConnected)
  const dockerConnected = useIDEStore((s) => s.dockerConnected)
  const voiceListening = useIDEStore((s) => s.voiceListening)

  return (
    <nav className="flex flex-col items-center w-12 bg-[#050810] border-r border-[rgba(0,212,170,0.08)] py-2 shrink-0 overflow-y-auto custom-scrollbar" aria-label="Activity bar">
      {activityItems.map((item) => {
        const Icon = item.icon
        const isActive = activeSidebarPanel === item.id
        const showBadge = item.id === 'todos' && pendingTodos > 0
        const showConnectedDot = 
          (item.id === 'collaboration' && collabConnected) ||
          (item.id === 'docker' && dockerConnected) ||
          (item.id === 'voice' && voiceListening)

        return (
          <button
            key={item.id}
            onClick={() => setActiveSidebarPanel(item.id)}
            aria-pressed={isActive}
            aria-label={item.label}
            className={`
              relative w-full h-11 flex items-center justify-center
              transition-all duration-200 group cursor-pointer
              ${isActive ? 'text-[#00d4aa]' : 'text-[#30363d] hover:text-[#6e7681]'}
            `}
          >
            {isActive && (
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-6 bg-[#00d4aa] rounded-r" />
            )}
            <Icon size={22} strokeWidth={isActive ? 2 : 1.5} />
            {showBadge && (
              <div className="absolute top-1.5 right-1.5 min-w-[14px] h-[14px] flex items-center justify-center bg-[#00d4aa] text-[#080c12] text-[8px] font-bold rounded-full px-0.5" aria-label={`${pendingTodos} pending tasks`}>
                {pendingTodos > 9 ? '9+' : pendingTodos}
              </div>
            )}
            {showConnectedDot && !showBadge && (
              <div className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#3fb950] animate-pulse" />
            )}
            <div className="absolute left-14 bg-[#0d1117] text-[#e6edf3] text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 border border-[rgba(0,212,170,0.1)] shadow-xl" role="tooltip">
              {item.label}
            </div>
          </button>
        )
      })}

      <div className="mt-auto">
        <button
          onClick={() => setActiveSidebarPanel('settings')}
          aria-pressed={activeSidebarPanel === 'settings'}
          className={`
            w-full h-11 flex items-center justify-center transition-colors cursor-pointer
            ${activeSidebarPanel === 'settings' ? 'text-[#00d4aa]' : 'text-[#30363d] hover:text-[#6e7681]'}
          `}
          aria-label="Settings"
        >
          <Settings size={20} strokeWidth={1.5} />
        </button>
      </div>
    </nav>
  )
})
