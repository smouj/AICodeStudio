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
  const { setCommandPaletteOpen } = useIDEStore()

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
    <div className="h-screen w-screen flex flex-col bg-[#0a0e14] overflow-hidden">
      {/* Title Bar */}
      <div className="h-9 bg-[#060a10] border-b border-white/[0.06] flex items-center justify-between px-4 shrink-0 select-none">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
            <div className="w-3 h-3 rounded-full bg-[#febc2e]" />
            <div className="w-3 h-3 rounded-full bg-[#28c840]" />
          </div>
          <div className="flex items-center gap-2 ml-4">
            <svg viewBox="0 0 512 512" className="w-4 h-4" fill="none">
              <path d="M190 176 L120 256 L190 336" stroke="#fff" strokeWidth="24" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M322 176 L392 256 L322 336" stroke="#fff" strokeWidth="24" strokeLinecap="round" strokeLinejoin="round"/>
              <line x1="290" y1="160" x2="222" y2="352" stroke="#fff" strokeWidth="20" strokeLinecap="round"/>
            </svg>
            <span className="text-white text-[12px] font-mono font-semibold tracking-tight">AICodeStudio</span>
            <span className="text-[#30363d] text-[10px] font-mono">v1.0.0</span>
          </div>
        </div>
        <div className="flex items-center gap-4 text-[11px] text-[#30363d] font-mono">
          <span className="hover:text-[#8b949e] cursor-pointer transition-colors">File</span>
          <span className="hover:text-[#8b949e] cursor-pointer transition-colors">Edit</span>
          <span className="hover:text-[#8b949e] cursor-pointer transition-colors">View</span>
          <span className="hover:text-[#8b949e] cursor-pointer transition-colors">AI</span>
          <span className="hover:text-[#8b949e] cursor-pointer transition-colors">Git</span>
          <span className="hover:text-[#8b949e] cursor-pointer transition-colors">Help</span>
        </div>
        <div className="w-20" />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex min-h-0">
        <ActivityBar />
        <SidebarPanel />
        <div className="flex-1 flex flex-col min-w-0">
          <EditorArea />
          <BottomPanel />
        </div>
      </div>

      <StatusBar />
      <CommandPalette />
    </div>
  )
}
