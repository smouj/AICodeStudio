'use client'

import { useIDEStore } from '@/store/ide-store'
import { FileExplorer } from './file-tree'
import { SearchPanel } from './search-panel'
import { GitPanel } from './git-panel'
import { AIChatPanel } from './ai-chat'
import { GitHubPanel } from './github-panel'
import { ExtensionsPanel } from './extensions-panel'
import { TodosPanel } from './todos-panel'
import { SettingsPanel } from './settings-panel'

export function SidebarPanel() {
  const { activeSidebarPanel, sidebarVisible, sidebarWidth } = useIDEStore()

  if (!sidebarVisible) return null

  return (
    <div
      className="h-full bg-[#080c12] border-r border-[rgba(0,212,170,0.08)] overflow-hidden shrink-0 flex flex-col"
      style={{ width: sidebarWidth }}
    >
      {activeSidebarPanel === 'explorer' && <FileExplorer />}
      {activeSidebarPanel === 'search' && <SearchPanel />}
      {activeSidebarPanel === 'git' && <GitPanel />}
      {activeSidebarPanel === 'todos' && <TodosPanel />}
      {activeSidebarPanel === 'ai' && <AIChatPanel />}
      {activeSidebarPanel === 'github' && <GitHubPanel />}
      {activeSidebarPanel === 'extensions' && <ExtensionsPanel />}
      {activeSidebarPanel === 'settings' && <SettingsPanel />}
    </div>
  )
}
