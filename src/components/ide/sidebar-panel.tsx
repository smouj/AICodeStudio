'use client'

import { useIDEStore } from '@/store/ide-store'
import { FileExplorer } from './file-tree'
import { SearchPanel } from './search-panel'
import { GitPanel } from './git-panel'
import { AIChatPanel } from './ai-chat'
import { GitHubPanel } from './github-panel'
import { ExtensionsPanel } from './extensions-panel'
import { TodosPanel } from './todos-panel'

export function SidebarPanel() {
  const { activeSidebarPanel, sidebarVisible, sidebarWidth } = useIDEStore()

  if (!sidebarVisible) return null

  return (
    <div
      className="h-full bg-[#0a0e14] border-r border-white/[0.06] overflow-hidden shrink-0 flex flex-col"
      style={{ width: sidebarWidth }}
    >
      {activeSidebarPanel === 'explorer' && <FileExplorer />}
      {activeSidebarPanel === 'search' && <SearchPanel />}
      {activeSidebarPanel === 'git' && <GitPanel />}
      {activeSidebarPanel === 'todos' && <TodosPanel />}
      {activeSidebarPanel === 'ai' && <AIChatPanel />}
      {activeSidebarPanel === 'github' && <GitHubPanel />}
      {activeSidebarPanel === 'extensions' && <ExtensionsPanel />}
      {activeSidebarPanel === 'settings' && (
        <div className="h-full flex flex-col">
          <div className="px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-[#484f58] border-b border-white/[0.06]">
            Settings
          </div>
          <div className="p-4">
            <div className="text-[13px] text-[#e6edf3] font-mono mb-3">Preferences</div>
            <div className="space-y-3">
              {[
                { label: 'Font Size', value: '13px' },
                { label: 'Tab Size', value: '2' },
                { label: 'Minimap', value: 'On' },
                { label: 'Word Wrap', value: 'Off' },
                { label: 'Auto Save', value: 'On' },
                { label: 'Ligatures', value: 'On' },
                { label: 'Line Numbers', value: 'On' },
                { label: 'Bracket Pairs', value: 'Colorized' },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between">
                  <span className="text-[12px] text-[#8b949e] font-mono">{item.label}</span>
                  <span className="text-[12px] text-white font-mono">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
