'use client'

import { memo } from 'react'
import { GitBranch, AlertCircle, CheckCircle2, Wifi, WifiOff, Bot, Download } from 'lucide-react'
import { useIDEStore } from '@/store/ide-store'

export const StatusBar = memo(function StatusBar() {
  const activeTabId = useIDEStore((s) => s.activeTabId)
  const openTabs = useIDEStore((s) => s.openTabs)
  const activeAiProvider = useIDEStore((s) => s.activeAiProvider)
  const aiProviders = useIDEStore((s) => s.aiProviders)
  const editorSettings = useIDEStore((s) => s.editorSettings)
  const updateEditorSettings = useIDEStore((s) => s.updateEditorSettings)
  const cursorPosition = useIDEStore((s) => s.cursorPosition)
  const pwaInstallAvailable = useIDEStore((s) => s.pwaInstallAvailable)
  const pwaInstallPrompt = useIDEStore((s) => s.pwaInstallPrompt)
  const gitBranch = useIDEStore((s) => s.gitBranch)
  const fileContents = useIDEStore((s) => s.fileContents)

  const activeTab = openTabs.find((t) => t.id === activeTabId)
  const currentProvider = aiProviders.find((p) => p.id === activeAiProvider)
  const fileCount = Object.keys(fileContents).length

  const handlePwaInstall = async () => {
    if (!pwaInstallPrompt) return
    try {
      await (pwaInstallPrompt as { prompt: () => Promise<void> }).prompt()
    } catch {
      // User dismissed or already installed
    }
  }

  return (
    <div className="h-6 bg-[#050810] border-t border-[rgba(0,212,170,0.08)] flex items-center justify-between px-3 text-[11px] font-mono shrink-0 select-none" role="status" aria-label="Status bar">
      <div className="flex items-center gap-3">
        {/* Git Branch */}
        <div className="flex items-center gap-1 text-[#00d4aa]/60 hover:text-[#00d4aa] cursor-pointer transition-colors">
          <GitBranch size={12} aria-hidden="true" />
          <span>{gitBranch}</span>
        </div>

        {/* File Count */}
        <div className="flex items-center gap-1 text-[#30363d]">
          <span>{fileCount} file{fileCount !== 1 ? 's' : ''}</span>
        </div>

        {/* Errors/Warnings */}
        <div className="flex items-center gap-2 text-[#30363d]">
          <div className="flex items-center gap-0.5 hover:text-[#8b949e] cursor-pointer">
            <AlertCircle size={12} className="text-[#ffa657]" aria-hidden="true" />
            <span>{openTabs.filter((t) => t.isModified).length}</span>
          </div>
          <div className="flex items-center gap-0.5 hover:text-[#8b949e] cursor-pointer">
            <CheckCircle2 size={12} className="text-[#3fb950]" aria-hidden="true" />
            <span>0</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* PWA Install */}
        {pwaInstallAvailable && (
          <button
            onClick={handlePwaInstall}
            className="flex items-center gap-1 text-[#00d4aa]/60 hover:text-[#00d4aa] transition-colors cursor-pointer"
            aria-label="Install AICodeStudio as desktop app"
          >
            <Download size={10} />
            <span>Install</span>
          </button>
        )}

        {/* AI Provider Status */}
        {currentProvider ? (
          <div className="flex items-center gap-1 text-[#30363d] hover:text-[#00d4aa] cursor-pointer transition-colors">
            <Bot size={11} aria-hidden="true" />
            <span>{currentProvider.name}</span>
            {currentProvider.status === 'connected' ? (
              <Wifi size={9} className="text-[#00d4aa]" aria-label="Connected" />
            ) : (
              <WifiOff size={9} className="text-[#f85149]" aria-label="Disconnected" />
            )}
          </div>
        ) : (
          <div className="flex items-center gap-1 text-[#30363d]">
            <Bot size={11} />
            <span>No AI</span>
          </div>
        )}

        {/* File Info */}
        {activeTab && (
          <>
            <span className="text-[#30363d]">Ln {cursorPosition.line}, Col {cursorPosition.column}</span>
            <span className="text-[#30363d]">Spaces: {editorSettings.tabSize}</span>
            <span className="text-[#484f58]">UTF-8</span>
            <span className="text-[#484f58]">{activeTab.language}</span>
          </>
        )}

        {/* Theme Toggle */}
        <button
          onClick={() => updateEditorSettings({ theme: editorSettings.theme === 'dark' ? 'light' : 'dark' })}
          className="text-[#30363d] hover:text-[#00d4aa] transition-colors cursor-pointer"
          aria-label={`Switch to ${editorSettings.theme === 'dark' ? 'light' : 'dark'} theme`}
        >
          {editorSettings.theme === 'dark' ? '\u2600' : '\u263E'}
        </button>
      </div>
    </div>
  )
})
