'use client'

import { useEffect, useCallback, useRef } from 'react'
import { ActivityBar } from './activity-bar'
import { SidebarPanel } from './sidebar-panel'
import { EditorArea } from './editor-area'
import { BottomPanel } from './bottom-panel'
import { StatusBar } from './status-bar'
import { CommandPalette } from './command-palette'
import { useIDEStore } from '@/store/ide-store'
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react'

// Notification Toast Component
function NotificationToasts() {
  const notifications = useIDEStore((s) => s.notifications)
  const removeNotification = useIDEStore((s) => s.removeNotification)

  if (notifications.length === 0) return null

  const iconMap = {
    info: <Info size={14} className="text-[#00d4aa]" />,
    success: <CheckCircle2 size={14} className="text-[#3fb950]" />,
    warning: <AlertTriangle size={14} className="text-[#ffa657]" />,
    error: <AlertCircle size={14} className="text-[#f85149]" />,
  }

  const bgMap = {
    info: 'border-[rgba(0,212,170,0.15)]',
    success: 'border-[rgba(63,185,80,0.15)]',
    warning: 'border-[rgba(255,166,87,0.15)]',
    error: 'border-[rgba(248,81,73,0.15)]',
  }

  return (
    <div className="fixed bottom-10 right-4 z-[60] flex flex-col gap-2 max-w-sm" aria-live="polite" role="region" aria-label="Notifications">
      {notifications.slice(-3).map((notif) => (
        <div
          key={notif.id}
          className={`flex items-start gap-2 bg-[#0d1117] border ${bgMap[notif.type]} rounded-lg px-3 py-2 shadow-xl shadow-black/30 animate-in slide-in-from-right duration-200`}
          role="alert"
        >
          <div className="shrink-0 mt-0.5">{iconMap[notif.type]}</div>
          <p className="text-[12px] text-[#e6edf3] font-mono leading-tight flex-1">{notif.message}</p>
          <button
            onClick={() => removeNotification(notif.id)}
            className="shrink-0 text-[#30363d] hover:text-[#e6edf3] transition-colors cursor-pointer"
            aria-label="Dismiss notification"
          >
            <X size={12} />
          </button>
        </div>
      ))}
    </div>
  )
}

// Resize Handle Component
function ResizeHandle({
  onResize,
  direction,
}: {
  onResize: (delta: number) => void
  direction: 'horizontal' | 'vertical'
}) {
  const isDragging = useRef(false)
  const startPos = useRef(0)

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    isDragging.current = true
    startPos.current = direction === 'horizontal' ? e.clientX : e.clientY

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return
      const currentPos = direction === 'horizontal' ? e.clientX : e.clientY
      const delta = currentPos - startPos.current
      startPos.current = currentPos
      onResize(delta)
    }

    const handleMouseUp = () => {
      isDragging.current = false
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    document.body.style.cursor = direction === 'horizontal' ? 'col-resize' : 'row-resize'
    document.body.style.userSelect = 'none'
  }, [onResize, direction])

  if (direction === 'horizontal') {
    return (
      <div
        onMouseDown={handleMouseDown}
        className="w-[3px] cursor-col-resize hover:bg-[rgba(0,212,170,0.15)] transition-colors shrink-0"
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize sidebar"
      />
    )
  }

  return (
    <div
      onMouseDown={handleMouseDown}
      className="h-[3px] cursor-row-resize hover:bg-[rgba(0,212,170,0.15)] transition-colors shrink-0"
      role="separator"
      aria-orientation="horizontal"
      aria-label="Resize bottom panel"
    />
  )
}

export function IDEMain() {
  const setCommandPaletteOpen = useIDEStore((s) => s.setCommandPaletteOpen)
  const setSidebarWidth = useIDEStore((s) => s.setSidebarWidth)
  const setBottomPanelHeight = useIDEStore((s) => s.setBottomPanelHeight)
  const sidebarVisible = useIDEStore((s) => s.sidebarVisible)
  const bottomPanelVisible = useIDEStore((s) => s.bottomPanelVisible)
  const setPwaInstallPrompt = useIDEStore((s) => s.setPwaInstallPrompt)

  // Command Palette keyboard shortcut
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

  // PWA install prompt handler
  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault()
      setPwaInstallPrompt(e)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [setPwaInstallPrompt])

  return (
    <div className="h-screen w-screen flex flex-col bg-[#080c12] overflow-hidden">
      {/* Skip to content link for accessibility */}
      <a href="#editor-area" className="sr-only focus:not-sr-only focus:absolute focus:z-[100] focus:px-4 focus:py-2 focus:bg-[#00d4aa] focus:text-[#080c12]">
        Skip to editor
      </a>

      {/* Title Bar */}
      <div className="h-9 bg-[#050810] border-b border-[rgba(0,212,170,0.08)] flex items-center justify-between px-4 shrink-0 select-none" role="banner">
        <div className="flex items-center gap-3">
          {/* Traffic Lights */}
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-[#ff5f57]" aria-label="Close" />
            <div className="w-3 h-3 rounded-full bg-[#febc2e]" aria-label="Minimize" />
            <div className="w-3 h-3 rounded-full bg-[#28c840]" aria-label="Maximize" />
          </div>
          {/* Logo + Title */}
          <div className="flex items-center gap-2 ml-4">
            <svg viewBox="0 0 512 512" className="w-4 h-4" fill="none" aria-hidden="true">
              <path d="M190 176 L120 256 L190 336" stroke="#00d4aa" strokeWidth="24" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M322 176 L392 256 L322 336" stroke="#00d4aa" strokeWidth="24" strokeLinecap="round" strokeLinejoin="round"/>
              <line x1="290" y1="160" x2="222" y2="352" stroke="#00d4aa" strokeWidth="20" strokeLinecap="round"/>
            </svg>
            <span className="text-[#e6edf3] text-[12px] font-mono font-semibold tracking-tight">AICodeStudio</span>
            <span className="text-[#30363d] text-[10px] font-mono ml-0.5">v2.0.0</span>
          </div>
        </div>
        {/* Menu Bar */}
        <nav className="flex items-center gap-4 text-[11px] text-[#30363d] font-mono" aria-label="Main menu">
          {['File', 'Edit', 'View', 'AI', 'Git', 'Help'].map((item) => (
            <button key={item} className="hover:text-[#8b949e] cursor-pointer transition-colors">{item}</button>
          ))}
        </nav>
        <div className="w-20" />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex min-h-0">
        <ActivityBar />
        {sidebarVisible && (
          <>
            <SidebarPanel />
            <ResizeHandle direction="horizontal" onResize={(delta) => setSidebarWidth(delta)} />
          </>
        )}
        <div className="flex-1 flex flex-col min-w-0" id="editor-area">
          <EditorArea />
          {bottomPanelVisible && (
            <>
              <ResizeHandle direction="vertical" onResize={(delta) => setBottomPanelHeight(delta)} />
              <BottomPanel />
            </>
          )}
        </div>
      </div>

      <StatusBar />
      <CommandPalette />
      <NotificationToasts />
    </div>
  )
}
