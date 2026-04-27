'use client'

import { GitBranch, AlertCircle, CheckCircle2, Wifi, WifiOff, Bot } from 'lucide-react'
import { useIDEStore } from '@/store/ide-store'

export function StatusBar() {
  const { activeTabId, openTabs, activeAiProvider, aiProviders, theme, setTheme } = useIDEStore()

  const activeTab = openTabs.find((t) => t.id === activeTabId)
  const currentProvider = aiProviders.find((p) => p.id === activeAiProvider)

  return (
    <div className="h-6 bg-[#060a10] border-t border-white/[0.06] flex items-center justify-between px-3 text-[11px] font-mono shrink-0 select-none">
      <div className="flex items-center gap-3">
        {/* Git Branch */}
        <div className="flex items-center gap-1 text-white/70 hover:text-white cursor-pointer transition-colors">
          <GitBranch size={12} />
          <span>main</span>
        </div>

        {/* Errors/Warnings */}
        <div className="flex items-center gap-2 text-[#484f58]">
          <div className="flex items-center gap-0.5 hover:text-[#e6edf3] cursor-pointer">
            <AlertCircle size={12} className="text-[#f0883e]" />
            <span>0</span>
          </div>
          <div className="flex items-center gap-0.5 hover:text-[#e6edf3] cursor-pointer">
            <CheckCircle2 size={12} className="text-[#3fb950]" />
            <span>0</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* AI Provider Status */}
        <div className="flex items-center gap-1 text-[#484f58] hover:text-white cursor-pointer transition-colors">
          <Bot size={11} />
          <span>{currentProvider?.name}</span>
          {currentProvider?.status === 'connected' ? (
            <Wifi size={9} className="text-[#3fb950]" />
          ) : (
            <WifiOff size={9} className="text-[#f85149]" />
          )}
        </div>

        {/* File Info */}
        {activeTab && (
          <>
            <span className="text-[#3d4450]">Ln 1, Col 1</span>
            <span className="text-[#3d4450]">Spaces: 2</span>
            <span className="text-[#484f58]">UTF-8</span>
            <span className="text-[#484f58]">{activeTab.language}</span>
          </>
        )}

        {/* Theme Toggle */}
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="text-[#484f58] hover:text-white transition-colors cursor-pointer"
        >
          {theme === 'dark' ? '☀' : '☾'}
        </button>
      </div>
    </div>
  )
}
