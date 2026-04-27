'use client'

import { useEffect } from 'react'
import { ActivityBar } from './activity-bar'
import { SidebarPanel } from './sidebar-panel'
import { EditorArea } from './editor-area'
import { BottomPanel } from './bottom-panel'
import { StatusBar } from './status-bar'
import { CommandPalette } from './command-palette'
import { useIDEStore } from '@/store/ide-store'

export function IDEMain() {
  const { setCommandPaletteOpen, bottomPanelVisible } = useIDEStore()

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'P') {
        e.preventDefault()
        setCommandPaletteOpen(true)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [setCommandPaletteOpen])

  return (
    <div className="h-screen w-screen flex flex-col bg-[#0d1117] overflow-hidden">
      {/* Title Bar */}
      <div className="h-9 bg-[#080c12] border-b border-[#00e5ff]/10 flex items-center justify-between px-4 shrink-0 select-none">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
            <div className="w-3 h-3 rounded-full bg-[#febc2e]" />
            <div className="w-3 h-3 rounded-full bg-[#28c840]" />
          </div>
          <div className="flex items-center gap-2 ml-4">
            <span className="text-[#00e5ff] text-[12px] font-mono font-bold">AICodeStudio</span>
            <span className="text-[#3d4450] text-[11px] font-mono">v1.0.0</span>
          </div>
        </div>
        <div className="flex items-center gap-4 text-[11px] text-[#3d4450] font-mono">
          <span className="hover:text-[#5a6270] cursor-pointer">File</span>
          <span className="hover:text-[#5a6270] cursor-pointer">Edit</span>
          <span className="hover:text-[#5a6270] cursor-pointer">View</span>
          <span className="hover:text-[#5a6270] cursor-pointer">AI</span>
          <span className="hover:text-[#5a6270] cursor-pointer">Git</span>
          <span className="hover:text-[#5a6270] cursor-pointer">Help</span>
        </div>
        <div className="w-20" /> {/* Spacer for centering */}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex min-h-0">
        {/* Activity Bar */}
        <ActivityBar />

        {/* Sidebar */}
        <SidebarPanel />

        {/* Editor + Bottom Panel */}
        <div className="flex-1 flex flex-col min-w-0">
          <EditorArea />
          <BottomPanel />
        </div>
      </div>

      {/* Status Bar */}
      <StatusBar />

      {/* Command Palette Overlay */}
      <CommandPalette />
    </div>
  )
}
