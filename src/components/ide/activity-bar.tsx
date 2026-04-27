'use client'

import {
  Files,
  Search,
  GitBranch,
  Bot,
  GitFork,
  Blocks,
  CheckSquare,
  Settings,
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
]

export function ActivityBar() {
  const { activeSidebarPanel, setActiveSidebarPanel, setCommandPaletteOpen, todos } = useIDEStore()
  const pendingTodos = todos.filter((t) => !t.completed).length

  return (
    <div className="flex flex-col items-center w-12 bg-[#060a10] border-r border-white/[0.06] py-2 shrink-0">
      {activityItems.map((item) => {
        const Icon = item.icon
        const isActive = activeSidebarPanel === item.id
        return (
          <button
            key={item.id}
            onClick={() => setActiveSidebarPanel(item.id)}
            className={`
              relative w-full h-11 flex items-center justify-center
              transition-all duration-200 group cursor-pointer
              ${isActive ? 'text-white' : 'text-[#484f58] hover:text-[#8b949e]'}
            `}
            title={item.label}
          >
            {isActive && (
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-6 bg-white rounded-r" />
            )}
            <Icon size={22} strokeWidth={isActive ? 2 : 1.5} />
            {item.id === 'todos' && pendingTodos > 0 && (
              <div className="absolute top-1.5 right-1.5 min-w-[14px] h-[14px] flex items-center justify-center bg-white text-black text-[8px] font-bold rounded-full px-0.5">
                {pendingTodos > 9 ? '9+' : pendingTodos}
              </div>
            )}
            <div className="absolute left-14 bg-[#161b22] text-[#e6edf3] text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 border border-white/[0.08] shadow-xl">
              {item.label}
            </div>
          </button>
        )
      })}

      <div className="mt-auto">
        <button
          onClick={() => setCommandPaletteOpen(true)}
          className="w-full h-11 flex items-center justify-center text-[#484f58] hover:text-[#8b949e] transition-colors cursor-pointer"
          title="Command Palette (Ctrl+Shift+P)"
        >
          <Settings size={20} strokeWidth={1.5} />
        </button>
      </div>
    </div>
  )
}
