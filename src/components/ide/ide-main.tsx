'use client'

import { useEffect, useCallback, useRef, useMemo } from 'react'
import { ActivityBar } from './activity-bar'
import { SidebarPanel } from './sidebar-panel'
import { EditorArea } from './editor-area'
import { BottomPanel } from './bottom-panel'
import { StatusBar } from './status-bar'
import { CommandPalette } from './command-palette'
import { useIDEStore } from '@/store/ide-store'
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react'
import { HUDTopBar, HUDBadge, AgentStatusChip, HUDSeparator } from '@/components/hud/hud-primitives'
import { colors, typography, radius } from '@/components/hud/tokens'
import { APP_VERSION_DISPLAY } from '@/lib/version'

// ─── Agent Mode type (visual only) ────────────────────────────
type AgentMode = 'Ask' | 'Plan' | 'Build' | 'Review' | 'Auto'
const AGENT_MODES: AgentMode[] = ['Ask', 'Plan', 'Build', 'Review', 'Auto']

type TrustMode = 'Local' | 'Sandbox' | 'Server' | 'Demo'
const TRUST_MODES: TrustMode[] = ['Local', 'Sandbox', 'Server', 'Demo']

// ─── Notification Toast Component ─────────────────────────────
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

// ─── Resize Handle Component ──────────────────────────────────
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

// ─── Mission Bar (replaces Title Bar) ─────────────────────────
function MissionBar() {
  // Store selectors for real agent-first info
  const workspaceName = useIDEStore((s) => s.workspaceName)
  const gitBranch = useIDEStore((s) => s.gitBranch)
  const aiProviders = useIDEStore((s) => s.aiProviders)
  const activeAiProvider = useIDEStore((s) => s.activeAiProvider)
  const isAiLoading = useIDEStore((s) => s.isAiLoading)

  // Derive active provider info
  const activeProvider = useMemo(
    () => aiProviders.find((p) => p.id === activeAiProvider),
    [aiProviders, activeAiProvider],
  )

  const providerName = activeProvider?.name || 'No provider'
  const providerStatus = activeProvider?.status || 'disconnected'

  // Derive agent name from active provider model or name
  const agentName = activeProvider ? (activeProvider.model || activeProvider.name) : 'No agent'

  // Derive agent mode from current state (visual only)
  const agentMode: AgentMode = 'Auto'

  // Derive trust mode from available context (visual display)
  const trustMode: TrustMode = 'Local'

  // Derive compact state indicator
  const stateIndicator: 'Ready' | 'Running' | 'Waiting' | 'Error' = useMemo(() => {
    if (providerStatus === 'error') return 'Error'
    if (isAiLoading) return 'Running'
    if (providerStatus === 'connecting') return 'Waiting'
    return 'Ready'
  }, [isAiLoading, providerStatus])

  // Map state indicator to AgentStatusChip status
  const chipStatus = useMemo(() => {
    switch (stateIndicator) {
      case 'Ready': return 'idle' as const
      case 'Running': return 'active' as const
      case 'Waiting': return 'waiting' as const
      case 'Error': return 'error' as const
    }
  }, [stateIndicator])

  // Connection status dot color
  const connectionDotColor = useMemo(() => {
    switch (providerStatus) {
      case 'connected': return colors.success.DEFAULT
      case 'connecting': return colors.warning.DEFAULT
      case 'error': return colors.danger.DEFAULT
      case 'disconnected':
      default: return colors.text.disabled
    }
  }, [providerStatus])

  return (
    <HUDTopBar role="banner" aria-label="Mission bar">
      {/* Left side: Logo + workspace info + agent info */}
      <div className="flex items-center gap-2 min-w-0">
        {/* Logo + App name */}
        <div className="flex items-center gap-1.5 shrink-0">
          <svg viewBox="0 0 512 512" className="w-3.5 h-3.5 shrink-0" fill="none" aria-hidden="true">
            <path d="M190 176 L120 256 L190 336" stroke={colors.accent.DEFAULT} strokeWidth="24" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M322 176 L392 256 L322 336" stroke={colors.accent.DEFAULT} strokeWidth="24" strokeLinecap="round" strokeLinejoin="round"/>
            <line x1="290" y1="160" x2="222" y2="352" stroke={colors.accent.DEFAULT} strokeWidth="20" strokeLinecap="round"/>
          </svg>
          <span
            className="font-semibold tracking-tight shrink-0"
            style={{
              color: colors.text.primary,
              fontSize: typography.fontSize.md,
              fontFamily: typography.fontFamily.mono,
            }}
          >
            AICodeStudio
          </span>
        </div>

        <HUDSeparator orientation="vertical" />

        {/* Workspace name */}
        <span
          className="shrink-0 truncate max-w-[120px]"
          style={{
            color: workspaceName ? colors.text.secondary : colors.text.disabled,
            fontSize: typography.fontSize.base,
            fontFamily: typography.fontFamily.mono,
          }}
          title={workspaceName || 'No workspace'}
        >
          {workspaceName || 'No workspace'}
        </span>

        <HUDSeparator orientation="vertical" />

        {/* Git branch */}
        <span
          className="shrink-0 flex items-center gap-1"
          style={{
            color: colors.text.muted,
            fontSize: typography.fontSize.base,
            fontFamily: typography.fontFamily.mono,
          }}
        >
          {/* Branch icon */}
          <svg width="10" height="10" viewBox="0 0 16 16" fill="none" aria-hidden="true" style={{ color: colors.text.dim }}>
            <path d="M6 3.5v6.018a2.5 2.5 0 1 1-1 0V4.5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v4.018a2.5 2.5 0 1 1-1 0V4.5H6Z" fill="currentColor"/>
          </svg>
          {gitBranch || 'main'}
        </span>

        <HUDSeparator orientation="vertical" />

        {/* Active agent name */}
        <span
          className="shrink-0 truncate max-w-[100px]"
          style={{
            color: agentName !== 'No agent' ? colors.accent.DEFAULT : colors.text.disabled,
            fontSize: typography.fontSize.base,
            fontFamily: typography.fontFamily.mono,
          }}
          title={agentName}
        >
          {agentName}
        </span>

        <HUDSeparator orientation="vertical" />

        {/* Agent mode selector (visual only) */}
        <div
          className="flex items-center shrink-0 gap-0.5"
          style={{ fontSize: typography.fontSize.xs, fontFamily: typography.fontFamily.mono }}
        >
          {AGENT_MODES.map((mode) => (
            <span
              key={mode}
              className="px-1 rounded-sm"
              style={{
                color: mode === agentMode ? colors.accent.DEFAULT : colors.text.disabled,
                background: mode === agentMode ? colors.accent.subtle : 'transparent',
              }}
            >
              {mode}
            </span>
          ))}
        </div>

        <HUDSeparator orientation="vertical" />

        {/* Trust mode (visual display) */}
        <div
          className="flex items-center shrink-0 gap-0.5"
          style={{ fontSize: typography.fontSize.xs, fontFamily: typography.fontFamily.mono }}
        >
          {TRUST_MODES.map((mode) => (
            <span
              key={mode}
              className="px-1 rounded-sm"
              style={{
                color: mode === trustMode ? colors.info.DEFAULT : colors.text.disabled,
                background: mode === trustMode ? colors.info.dim : 'transparent',
              }}
            >
              {mode}
            </span>
          ))}
        </div>
      </div>

      {/* Right side: Provider + state + version */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Active AI provider + connection status dot */}
        <div
          className="flex items-center gap-1.5"
          style={{
            fontSize: typography.fontSize.base,
            fontFamily: typography.fontFamily.mono,
          }}
        >
          <span
            className="shrink-0 rounded-full"
            style={{
              width: '5px',
              height: '5px',
              background: connectionDotColor,
            }}
            title={`Provider status: ${providerStatus}`}
          />
          <span
            className="truncate max-w-[100px]"
            style={{
              color: providerStatus === 'connected' ? colors.text.secondary : colors.text.disabled,
            }}
            title={providerName}
          >
            {providerName}
          </span>
        </div>

        <HUDSeparator orientation="vertical" />

        {/* Compact state indicator */}
        <AgentStatusChip
          status={chipStatus}
          label={stateIndicator}
          size="sm"
        />

        <HUDSeparator orientation="vertical" />

        {/* Version badge */}
        <HUDBadge variant="default" size="sm">
          {APP_VERSION_DISPLAY}
        </HUDBadge>
      </div>
    </HUDTopBar>
  )
}

// ─── Main IDE Layout ──────────────────────────────────────────
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
    <div className="h-screen w-screen flex flex-col overflow-hidden" style={{ background: colors.bg.root }}>
      {/* Skip to content link for accessibility */}
      <a
        href="#editor-area"
        className="sr-only focus:not-sr-only focus:absolute focus:z-[100] focus:px-4 focus:py-2"
        style={{
          background: colors.accent.DEFAULT,
          color: colors.bg.root,
        }}
      >
        Skip to editor
      </a>

      {/* Mission Bar (replaces Title Bar) */}
      <MissionBar />

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
