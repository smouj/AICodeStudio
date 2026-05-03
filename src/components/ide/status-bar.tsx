'use client'

import { memo, useEffect, useState } from 'react'
import { GitBranch, FileText, GitCommitHorizontal, Sun, Moon, Download } from 'lucide-react'
import { useIDEStore } from '@/store/ide-store'
import { colors, typography } from '@/components/hud/tokens'
import { AgentStatusChip } from '@/components/hud/hud-primitives'
import { APP_VERSION_DISPLAY } from '@/lib/version'

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
  const gitStaged = useIDEStore((s) => s.gitStaged)
  const gitUnstaged = useIDEStore((s) => s.gitUnstaged)

  // ─── Runtime mode (fetched from /api/capabilities) ──────
  const [runtimeMode, setRuntimeMode] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch('/api/capabilities')
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled && data?.mode) {
          setRuntimeMode(data.mode)
        }
      })
      .catch(() => {
        if (!cancelled) setRuntimeMode('static-demo')
      })
    return () => { cancelled = true }
  }, [])

  // ─── Derived values ─────────────────────────────────────
  const activeTab = openTabs.find((t) => t.id === activeTabId)
  const currentProvider = aiProviders.find((p) => p.id === activeAiProvider)
  const fileCount = Object.keys(fileContents).length
  const gitChangeCount = gitStaged.length + gitUnstaged.length

  const providerChipStatus = currentProvider?.status === 'connected'
    ? 'active' as const
    : currentProvider?.status === 'connecting'
      ? 'waiting' as const
      : currentProvider?.status === 'error'
        ? 'error' as const
        : 'unavailable' as const

  const runtimeLabel = runtimeMode === null
    ? 'Loading...'
    : runtimeMode === 'server'
      ? 'Server'
      : 'Static'

  const runtimeChipStatus = runtimeMode === null
    ? 'waiting' as const
    : runtimeMode === 'server'
      ? 'active' as const
      : 'simulated' as const

  // ─── PWA install handler ────────────────────────────────
  const handlePwaInstall = async () => {
    if (!pwaInstallPrompt) return
    try {
      await (pwaInstallPrompt as { prompt: () => Promise<void> }).prompt()
    } catch {
      // User dismissed or already installed
    }
  }

  return (
    <div
      className="h-6 flex items-center justify-between px-3 shrink-0 select-none"
      style={{
        background: colors.bg.base,
        borderTop: `1px solid ${colors.border.default}`,
        fontSize: typography.fontSize.base,
        fontFamily: typography.fontFamily.mono,
      }}
      role="status"
      aria-label="Status bar"
    >
      {/* ─── Left Side ──────────────────────────────────── */}
      <div className="flex items-center gap-3">
        {/* Git Branch */}
        <div
          className="flex items-center gap-1 cursor-pointer transition-colors"
          style={{ color: colors.text.muted }}
          onMouseEnter={(e) => { e.currentTarget.style.color = colors.accent.DEFAULT }}
          onMouseLeave={(e) => { e.currentTarget.style.color = colors.text.muted }}
        >
          <GitBranch size={12} aria-hidden="true" />
          <span>{gitBranch}</span>
        </div>

        {/* File Count */}
        <div
          className="flex items-center gap-1"
          style={{ color: colors.text.disabled }}
        >
          <FileText size={11} aria-hidden="true" />
          <span>{fileCount} file{fileCount !== 1 ? 's' : ''}</span>
        </div>

        {/* Git Changes Count (staged + unstaged) */}
        {gitChangeCount > 0 && (
          <div
            className="flex items-center gap-1 cursor-pointer transition-colors"
            style={{ color: colors.text.muted }}
            onMouseEnter={(e) => { e.currentTarget.style.color = colors.text.secondary }}
            onMouseLeave={(e) => { e.currentTarget.style.color = colors.text.muted }}
            aria-label={`${gitChangeCount} git changes`}
          >
            <GitCommitHorizontal size={11} aria-hidden="true" />
            <span>{gitChangeCount} change{gitChangeCount !== 1 ? 's' : ''}</span>
          </div>
        )}

        {/* Active AI Provider + Status */}
        <AgentStatusChip
          status={currentProvider ? providerChipStatus : 'unavailable'}
          label={currentProvider ? currentProvider.name : 'No AI'}
          size="sm"
        />

        {/* Runtime Mode */}
        <AgentStatusChip
          status={runtimeChipStatus}
          label={runtimeLabel}
          size="sm"
        />

        {/* Version */}
        <span style={{ color: colors.text.disabled, fontSize: typography.fontSize.xs }}>
          {APP_VERSION_DISPLAY}
        </span>
      </div>

      {/* ─── Right Side ─────────────────────────────────── */}
      <div className="flex items-center gap-3">
        {/* Cursor Position */}
        <span style={{ color: colors.text.disabled }}>
          Ln {cursorPosition.line}, Col {cursorPosition.column}
        </span>

        {/* File Language */}
        {activeTab && (
          <span style={{ color: colors.text.disabled }}>
            {activeTab.language}
          </span>
        )}

        {/* Encoding */}
        <span style={{ color: colors.text.dim }}>UTF-8</span>

        {/* Tab Size */}
        <span style={{ color: colors.text.disabled }}>
          Spaces: {editorSettings.tabSize}
        </span>

        {/* Theme Toggle */}
        <button
          onClick={() => updateEditorSettings({ theme: editorSettings.theme === 'dark' ? 'light' : 'dark' })}
          className="cursor-pointer transition-colors"
          style={{ color: colors.text.disabled }}
          onMouseEnter={(e) => { e.currentTarget.style.color = colors.accent.DEFAULT }}
          onMouseLeave={(e) => { e.currentTarget.style.color = colors.text.disabled }}
          aria-label={`Switch to ${editorSettings.theme === 'dark' ? 'light' : 'dark'} theme`}
        >
          {editorSettings.theme === 'dark' ? <Sun size={12} /> : <Moon size={12} />}
        </button>

        {/* PWA Install */}
        {pwaInstallAvailable && (
          <button
            onClick={handlePwaInstall}
            className="flex items-center gap-1 cursor-pointer transition-colors"
            style={{ color: colors.text.muted }}
            onMouseEnter={(e) => { e.currentTarget.style.color = colors.accent.DEFAULT }}
            onMouseLeave={(e) => { e.currentTarget.style.color = colors.text.muted }}
            aria-label="Install AICodeStudio as desktop app"
          >
            <Download size={10} />
            <span>Install</span>
          </button>
        )}
      </div>
    </div>
  )
})
