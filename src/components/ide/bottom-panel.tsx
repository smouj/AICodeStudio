'use client'

import { memo } from 'react'
import { useIDEStore } from '@/store/ide-store'
import { TerminalPanel } from './terminal-panel'
import { Terminal, AlertCircle, FileOutput, Bug, Trash2 } from 'lucide-react'

export const BottomPanel = memo(function BottomPanel() {
  const activeBottomPanel = useIDEStore((s) => s.activeBottomPanel)
  const setActiveBottomPanel = useIDEStore((s) => s.setActiveBottomPanel)
  const bottomPanelHeight = useIDEStore((s) => s.bottomPanelHeight)
  const outputLog = useIDEStore((s) => s.outputLog)
  const clearOutputLog = useIDEStore((s) => s.clearOutputLog)
  const openTabs = useIDEStore((s) => s.openTabs)
  const gitUnstaged = useIDEStore((s) => s.gitUnstaged)
  const gitStaged = useIDEStore((s) => s.gitStaged)

  const tabs = [
    { id: 'terminal' as const, label: 'Terminal', icon: Terminal },
    { id: 'output' as const, label: 'Output', icon: FileOutput },
    { id: 'problems' as const, label: 'Problems', icon: AlertCircle },
    { id: 'debug' as const, label: 'Debug', icon: Bug },
  ]

  // Count problems: modified but unsaved files
  const problemCount = openTabs.filter((t) => t.isModified).length

  // Format timestamp
  const formatTime = (ts: number) => {
    const d = new Date(ts)
    return d.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })
  }

  return (
    <div
      className="bg-[#0a0e14] flex flex-col shrink-0"
      style={{ height: bottomPanelHeight }}
      role="tabpanel"
      aria-label="Bottom panel"
    >
      {/* Panel Tabs */}
      <div className="flex items-center gap-0 bg-[#050810] border-b border-[rgba(0,212,170,0.08)] shrink-0" role="tablist" aria-label="Bottom panel tabs">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const badge = tab.id === 'problems' && problemCount > 0 ? problemCount : 0
          return (
            <button
              key={tab.id}
              onClick={() => setActiveBottomPanel(tab.id)}
              role="tab"
              aria-selected={activeBottomPanel === tab.id}
              className={`
                flex items-center gap-1.5 px-3 py-1 text-[11px] font-mono transition-colors cursor-pointer
                border-b-[2px]
                ${activeBottomPanel === tab.id
                  ? 'text-[#e6edf3] border-b-[#00d4aa]'
                  : 'text-[#30363d] border-b-transparent hover:text-[#6e7681]'
                }
              `}
            >
              <Icon size={12} />
              {tab.label}
              {badge > 0 && (
                <span className="ml-0.5 px-1 py-0 text-[9px] bg-[#ffa657]/20 text-[#ffa657] rounded-full">{badge}</span>
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
            <div className="flex items-center justify-between px-3 py-1 bg-[#050810] border-b border-[rgba(0,212,170,0.06)]">
              <span className="text-[10px] text-[#30363d] font-mono">Output Channel</span>
              {outputLog.length > 0 && (
                <button
                  onClick={clearOutputLog}
                  className="text-[#30363d] hover:text-[#484f58] cursor-pointer"
                  title="Clear output"
                >
                  <Trash2 size={10} />
                </button>
              )}
            </div>
            <div className="flex-1 p-3 font-mono text-[12px] text-[#30363d] overflow-y-auto custom-scrollbar" role="log">
              {outputLog.length === 0 ? (
                <div className="text-center py-4 text-[#30363d]">
                  <p>No output yet</p>
                  <p className="text-[10px] mt-1">Output from file operations, extensions, and AI will appear here</p>
                </div>
              ) : (
                outputLog.map((entry, i) => (
                  <div key={i} className={
                    entry.level === 'error' ? 'text-[#f85149]' :
                    entry.level === 'warn' ? 'text-[#ffa657]' :
                    'text-[#484f58]'
                  }>
                    <span className="text-[#30363d]">[{formatTime(entry.timestamp)}]</span>{' '}
                    <span className="text-[#00d4aa]/50">[{entry.source}]</span>{' '}
                    {entry.message}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
        {activeBottomPanel === 'problems' && (
          <div className="h-full p-3 font-mono text-[12px] overflow-y-auto custom-scrollbar" role="status">
            {problemCount === 0 && gitUnstaged.length === 0 && gitStaged.length === 0 ? (
              <div className="text-[#3fb950] flex items-center gap-2">
                <AlertCircle size={14} />
                No problems detected in workspace
              </div>
            ) : (
              <div className="space-y-1">
                {openTabs.filter((t) => t.isModified).map((tab) => (
                  <div key={tab.id} className="flex items-center gap-2 text-[#ffa657]">
                    <AlertCircle size={12} />
                    <span>{tab.name}</span>
                    <span className="text-[#30363d]">— unsaved changes</span>
                  </div>
                ))}
                {gitUnstaged.length > 0 && (
                  <div className="flex items-center gap-2 text-[#ffa657]">
                    <AlertCircle size={12} />
                    <span>{gitUnstaged.length} unstaged file change{gitUnstaged.length > 1 ? 's' : ''}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
        {activeBottomPanel === 'debug' && (
          <div className="h-full p-3 font-mono text-[12px] text-[#30363d]">
            <div>No active debug session</div>
            <div className="mt-2 text-[11px]">Press F5 to start debugging</div>
          </div>
        )}
      </div>
    </div>
  )
})
