'use client'

import { memo } from 'react'
import { useIDEStore } from '@/store/ide-store'
import { TerminalPanel } from './terminal-panel'
import {
  Terminal, AlertCircle, FileOutput, Bug, Trash2,
  Bot, Wrench, ShieldCheck, FileQuestion, Circle, GitBranch, AlertTriangle,
} from 'lucide-react'
import { colors, typography, radius } from '@/components/hud/tokens'
import { HUDBadge } from '@/components/hud/hud-primitives'

export const BottomPanel = memo(function BottomPanel() {
  const activeBottomPanel = useIDEStore((s) => s.activeBottomPanel)
  const setActiveBottomPanel = useIDEStore((s) => s.setActiveBottomPanel)
  const bottomPanelHeight = useIDEStore((s) => s.bottomPanelHeight)
  const outputLog = useIDEStore((s) => s.outputLog)
  const clearOutputLog = useIDEStore((s) => s.clearOutputLog)
  const openTabs = useIDEStore((s) => s.openTabs)
  const gitUnstaged = useIDEStore((s) => s.gitUnstaged)
  const gitStaged = useIDEStore((s) => s.gitStaged)
  const chatMessages = useIDEStore((s) => s.chatMessages)
  const lspDiagnostics = useIDEStore((s) => s.lspDiagnostics)

  const tabs = [
    { id: 'terminal' as const, label: 'Terminal', icon: Terminal },
    { id: 'output' as const, label: 'Output', icon: FileOutput },
    { id: 'problems' as const, label: 'Problems', icon: AlertCircle },
    { id: 'debug' as const, label: 'Debug', icon: Bug },
    { id: 'agentlogs' as const, label: 'Agent Logs', icon: Bot },
    { id: 'toolcalls' as const, label: 'Tool Calls', icon: Wrench },
    { id: 'approvals' as const, label: 'Approvals', icon: ShieldCheck },
  ]

  // Properly categorized problems count
  const diagnosticCount = Object.values(lspDiagnostics).reduce(
    (sum, diags) => sum + diags.filter(d => d.severity === 'error' || d.severity === 'warning').length, 0
  )
  const problemCount = diagnosticCount

  // Unsaved changes (not problems!)
  const unsavedCount = openTabs.filter((t) => t.isModified).length

  // Format timestamp
  const formatTime = (ts: number) => {
    const d = new Date(ts)
    return d.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })
  }

  const activeTabStyle = {
    color: colors.text.primary,
    borderBottom: `2px solid ${colors.accent.DEFAULT}`,
  }
  const inactiveTabStyle = {
    color: colors.text.disabled,
    borderBottom: '2px solid transparent',
  }

  return (
    <div
      className="flex flex-col shrink-0"
      style={{ height: bottomPanelHeight, background: colors.bg.surface }}
      role="tabpanel"
      aria-label="Bottom panel"
    >
      {/* Panel Tabs */}
      <div
        className="flex items-center gap-0 shrink-0"
        style={{
          background: colors.bg.base,
          borderBottom: `1px solid ${colors.border.default}`,
        }}
        role="tablist"
        aria-label="Bottom panel tabs"
      >
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeBottomPanel === tab.id
          const badgeCount = tab.id === 'problems' && problemCount > 0 ? problemCount : 0
          return (
            <button
              key={tab.id}
              onClick={() => setActiveBottomPanel(tab.id)}
              role="tab"
              aria-selected={isActive}
              className="flex items-center gap-1.5 px-3 py-1 font-mono transition-colors cursor-pointer"
              style={{
                fontSize: typography.fontSize.base,
                ...(isActive ? activeTabStyle : inactiveTabStyle),
              }}
              onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.color = colors.text.muted }}
              onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.color = colors.text.disabled }}
            >
              <Icon size={12} />
              {tab.label}
              {badgeCount > 0 && (
                <HUDBadge variant="warning" size="sm">{badgeCount}</HUDBadge>
              )}
            </button>
          )
        })}
      </div>

      {/* Panel Content */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {activeBottomPanel === 'terminal' && <TerminalPanel />}
        {activeBottomPanel === 'output' && (
          <div className="h-full flex flex-col">
            <div
              className="flex items-center justify-between px-3 py-1 shrink-0"
              style={{ background: colors.bg.base, borderBottom: `1px solid ${colors.border.muted}` }}
            >
              <span className="font-mono" style={{ fontSize: typography.fontSize.sm, color: colors.text.disabled }}>
                Output Channel
              </span>
              {outputLog.length > 0 && (
                <button
                  onClick={clearOutputLog}
                  className="cursor-pointer transition-colors"
                  style={{ color: colors.text.disabled }}
                  onMouseEnter={(e) => e.currentTarget.style.color = colors.text.dim}
                  onMouseLeave={(e) => e.currentTarget.style.color = colors.text.disabled}
                  title="Clear output"
                >
                  <Trash2 size={10} />
                </button>
              )}
            </div>
            <div
              className="flex-1 p-3 font-mono overflow-y-auto custom-scrollbar"
              style={{ fontSize: typography.fontSize.md, color: colors.text.disabled }}
              role="log"
            >
              {outputLog.length === 0 ? (
                <div className="text-center py-4">
                  <p>No output yet</p>
                  <p className="mt-1" style={{ fontSize: typography.fontSize.sm }}>
                    Output from file operations, extensions, and AI will appear here
                  </p>
                </div>
              ) : (
                outputLog.map((entry, i) => (
                  <div key={i} style={{
                    color: entry.level === 'error' ? colors.danger.DEFAULT
                      : entry.level === 'warn' ? colors.warning.DEFAULT
                      : colors.text.dim,
                  }}>
                    <span style={{ color: colors.text.disabled }}>[{formatTime(entry.timestamp)}]</span>{' '}
                    <span style={{ color: `${colors.accent.DEFAULT}80` }}>[{entry.source}]</span>{' '}
                    {entry.message}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
        {activeBottomPanel === 'problems' && (
          <div className="h-full p-3 font-mono overflow-y-auto custom-scrollbar" style={{ fontSize: typography.fontSize.md }} role="status">
            {/* Diagnostics Section */}
            <div className="mb-3">
              <div className="flex items-center gap-1.5 mb-1" style={{ color: colors.text.dim, fontSize: typography.fontSize.sm }}>
                <AlertCircle size={10} />
                <span className="uppercase tracking-wider font-semibold">Diagnostics</span>
              </div>
              {diagnosticCount === 0 ? (
                <div className="flex items-center gap-2" style={{ color: colors.success.DEFAULT, fontSize: typography.fontSize.md }}>
                  <Circle size={8} fill="currentColor" />
                  No diagnostics
                </div>
              ) : (
                Object.entries(lspDiagnostics).map(([filePath, diags]) =>
                  diags.filter(d => d.severity === 'error' || d.severity === 'warning').map((d, i) => (
                    <div key={`${filePath}-${i}`} className="flex items-center gap-2 py-0.5" style={{
                      color: d.severity === 'error' ? colors.danger.DEFAULT : colors.warning.DEFAULT,
                    }}>
                      <AlertCircle size={11} />
                      <span>{filePath}:{d.line}</span>
                      <span style={{ color: colors.text.dim }}>{d.message}</span>
                    </div>
                  ))
                )
              )}
            </div>

            {/* Unsaved Changes Section */}
            {unsavedCount > 0 && (
              <div className="mb-3">
                <div className="flex items-center gap-1.5 mb-1" style={{ color: colors.text.dim, fontSize: typography.fontSize.sm }}>
                  <FileQuestion size={10} />
                  <span className="uppercase tracking-wider font-semibold">Unsaved Changes</span>
                </div>
                {openTabs.filter((t) => t.isModified).map((tab) => (
                  <div key={tab.id} className="flex items-center gap-2 py-0.5" style={{ color: colors.warning.DEFAULT }}>
                    <AlertTriangle size={11} />
                    <span>{tab.name}</span>
                    <span style={{ color: colors.text.disabled }}>— unsaved</span>
                  </div>
                ))}
              </div>
            )}

            {/* Git Changes Section */}
            {(gitUnstaged.length > 0 || gitStaged.length > 0) && (
              <div className="mb-3">
                <div className="flex items-center gap-1.5 mb-1" style={{ color: colors.text.dim, fontSize: typography.fontSize.sm }}>
                  <GitBranch size={10} />
                  <span className="uppercase tracking-wider font-semibold">Git Changes</span>
                </div>
                {gitStaged.length > 0 && (
                  <div className="flex items-center gap-2 py-0.5" style={{ color: colors.success.DEFAULT }}>
                    <Circle size={6} fill="currentColor" />
                    <span>{gitStaged.length} staged file{gitStaged.length > 1 ? 's' : ''}</span>
                  </div>
                )}
                {gitUnstaged.length > 0 && (
                  <div className="flex items-center gap-2 py-0.5" style={{ color: colors.warning.DEFAULT }}>
                    <AlertTriangle size={11} />
                    <span>{gitUnstaged.length} unstaged file{gitUnstaged.length > 1 ? 's' : ''}</span>
                  </div>
                )}
              </div>
            )}

            {/* Runtime Errors Section */}
            {outputLog.filter(e => e.level === 'error').length > 0 && (
              <div className="mb-3">
                <div className="flex items-center gap-1.5 mb-1" style={{ color: colors.text.dim, fontSize: typography.fontSize.sm }}>
                  <AlertCircle size={10} />
                  <span className="uppercase tracking-wider font-semibold">Runtime Errors</span>
                </div>
                {outputLog.filter(e => e.level === 'error').slice(-5).map((entry, i) => (
                  <div key={i} className="flex items-center gap-2 py-0.5" style={{ color: colors.danger.DEFAULT }}>
                    <AlertCircle size={11} />
                    <span style={{ color: colors.text.disabled }}>[{entry.source}]</span>
                    <span>{entry.message}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Clean state */}
            {diagnosticCount === 0 && unsavedCount === 0 && gitUnstaged.length === 0 && gitStaged.length === 0 && (
              <div className="flex items-center gap-2" style={{ color: colors.success.DEFAULT }}>
                <AlertCircle size={14} />
                No problems detected in workspace
              </div>
            )}
          </div>
        )}
        {activeBottomPanel === 'debug' && (
          <div className="h-full p-3 font-mono" style={{ fontSize: typography.fontSize.md, color: colors.text.disabled }}>
            <div>No active debug session</div>
            <div className="mt-2" style={{ fontSize: typography.fontSize.base }}>Press F5 to start debugging</div>
          </div>
        )}
        {activeBottomPanel === 'agentlogs' && (
          <div className="h-full p-3 font-mono overflow-y-auto custom-scrollbar" style={{ fontSize: typography.fontSize.md }}>
            {chatMessages.length === 0 ? (
              <div style={{ color: colors.text.disabled }}>
                <p>No agent activity yet</p>
                <p className="mt-1" style={{ fontSize: typography.fontSize.sm }}>
                  Agent interactions will be logged here
                </p>
              </div>
            ) : (
              chatMessages.slice(-20).map((msg) => (
                <div key={msg.id} className="flex items-start gap-2 py-0.5">
                  <span style={{
                    color: msg.role === 'user' ? colors.accent.DEFAULT : colors.text.muted,
                    fontSize: typography.fontSize.sm,
                    minWidth: '14px',
                  }}>
                    {msg.role === 'user' ? '>' : '<'}
                  </span>
                  <span style={{
                    color: msg.role === 'user' ? colors.text.secondary : colors.text.dim,
                    maxWidth: '90%',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>
                    {msg.content.slice(0, 120)}
                  </span>
                  <span style={{ color: colors.text.disabled, fontSize: typography.fontSize.xs, marginLeft: 'auto', whiteSpace: 'nowrap' }}>
                    {new Date(msg.timestamp).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))
            )}
          </div>
        )}
        {activeBottomPanel === 'toolcalls' && (
          <div className="h-full p-3 font-mono" style={{ fontSize: typography.fontSize.md, color: colors.text.disabled }}>
            <div className="flex items-center gap-2">
              <Wrench size={14} />
              No tool calls recorded
            </div>
            <p className="mt-1" style={{ fontSize: typography.fontSize.sm }}>
              Tool calls from AI agents will appear here when available
            </p>
          </div>
        )}
        {activeBottomPanel === 'approvals' && (
          <div className="h-full p-3 font-mono" style={{ fontSize: typography.fontSize.md, color: colors.text.disabled }}>
            <div className="flex items-center gap-2">
              <ShieldCheck size={14} />
              No pending approvals
            </div>
            <p className="mt-1" style={{ fontSize: typography.fontSize.sm }}>
              Approval requests from AI agents will appear here when available
            </p>
          </div>
        )}
      </div>
    </div>
  )
})
