'use client'

import { useIDEStore } from '@/store/ide-store'
import { FileExplorer } from './file-tree'
import { SearchPanel } from './search-panel'
import { GitOperations } from './git-operations'
import { AIChatPanel } from './ai-chat'
import { GitHubPanel } from './github-panel'
import { ExtensionsMarketplace } from './extensions-marketplace'
import { TodosPanel } from './todos-panel'
import { SettingsPanel } from './settings-panel'
import { DockerPanel } from './docker-panel'
import { DatabasePanel } from './database-panel'
import { CollaborationPanel } from './collaboration-panel'
import { LSPPanel } from './lsp-panel'
import { VoicePanel } from './voice-panel'
import { ThemesPanel } from './themes-panel'
import { CanvasNavigation } from './canvas-navigation'
import { WhiteboardPanel } from './whiteboard-panel'

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
      {activeSidebarPanel === 'git' && <GitOperations />}
      {activeSidebarPanel === 'todos' && <TodosPanel />}
      {activeSidebarPanel === 'ai' && <AIChatPanel />}
      {activeSidebarPanel === 'github' && <GitHubPanel />}
      {activeSidebarPanel === 'extensions' && <ExtensionsMarketplace />}
      {activeSidebarPanel === 'settings' && <SettingsPanel />}
      {activeSidebarPanel === 'docker' && <DockerPanel />}
      {activeSidebarPanel === 'database' && <DatabasePanel />}
      {activeSidebarPanel === 'collaboration' && <CollaborationPanel />}
      {activeSidebarPanel === 'lsp' && <LSPPanel />}
      {activeSidebarPanel === 'voice' && <VoicePanel />}
      {activeSidebarPanel === 'themes' && <ThemesPanel />}
      {activeSidebarPanel === 'canvas' && <CanvasNavigation />}
      {activeSidebarPanel === 'whiteboard' && <WhiteboardPanel />}
    </div>
  )
}
