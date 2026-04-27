'use client'

import { useIDEStore } from '@/store/ide-store'
import { FileExplorer } from './file-tree'
import { SearchPanel } from './search-panel'
import { GitPanel } from './git-panel'
import { AIChatPanel } from './ai-chat'
import { GitHubPanel } from './github-panel'
import { ExtensionsPanel } from './extensions-panel'

export function SidebarPanel() {
  const { activeSidebarPanel, sidebarVisible, sidebarWidth } = useIDEStore()

  if (!sidebarVisible) return null

  return (
    <div
      className="h-full bg-[#0d1117] border-r border-[#00e5ff]/10 overflow-hidden shrink-0 flex flex-col"
      style={{ width: sidebarWidth }}
    >
      {activeSidebarPanel === 'explorer' && <FileExplorer />}
      {activeSidebarPanel === 'search' && <SearchPanel />}
      {activeSidebarPanel === 'git' && <GitPanel />}
      {activeSidebarPanel === 'ai' && <AIChatPanel />}
      {activeSidebarPanel === 'github' && <GitHubPanel />}
      {activeSidebarPanel === 'extensions' && <ExtensionsPanel />}
      {activeSidebarPanel === 'settings' && (
        <div className="h-full flex flex-col">
          <div className="px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-[#5a6270] border-b border-[#00e5ff]/10">
            Settings
          </div>
          <div className="p-4">
            <div className="text-[13px] text-[#e6edf3] font-mono mb-3">Preferences</div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[12px] text-[#8b949e] font-mono">Font Size</span>
                <span className="text-[12px] text-[#00e5ff] font-mono">13px</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[12px] text-[#8b949e] font-mono">Tab Size</span>
                <span className="text-[12px] text-[#00e5ff] font-mono">2</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[12px] text-[#8b949e] font-mono">Minimap</span>
                <span className="text-[12px] text-[#00e5ff] font-mono">On</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[12px] text-[#8b949e] font-mono">Word Wrap</span>
                <span className="text-[12px] text-[#00e5ff] font-mono">Off</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[12px] text-[#8b949e] font-mono">Auto Save</span>
                <span className="text-[12px] text-[#00e5ff] font-mono">On</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
