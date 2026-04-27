'use client'

import { useIDEStore } from '@/store/ide-store'
import { TerminalPanel } from './terminal-panel'
import { Terminal, AlertCircle, FileOutput, Bug } from 'lucide-react'

export function BottomPanel() {
  const { bottomPanelVisible, activeBottomPanel, setActiveBottomPanel, bottomPanelHeight } = useIDEStore()

  if (!bottomPanelVisible) return null

  const tabs = [
    { id: 'terminal' as const, label: 'Terminal', icon: Terminal },
    { id: 'output' as const, label: 'Output', icon: FileOutput },
    { id: 'problems' as const, label: 'Problems', icon: AlertCircle },
    { id: 'debug' as const, label: 'Debug', icon: Bug },
  ]

  return (
    <div
      className="bg-[#0a0e14] border-t border-[rgba(0,212,170,0.08)] flex flex-col shrink-0"
      style={{ height: bottomPanelHeight }}
    >
      {/* Panel Tabs */}
      <div className="flex items-center gap-0 bg-[#050810] border-b border-[rgba(0,212,170,0.08)] shrink-0">
        {tabs.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveBottomPanel(tab.id)}
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
            </button>
          )
        })}
      </div>

      {/* Panel Content */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {activeBottomPanel === 'terminal' && <TerminalPanel />}
        {activeBottomPanel === 'output' && (
          <div className="h-full p-3 font-mono text-[12px] text-[#30363d]">
            <div><span className="text-[#00d4aa]/60">[AICodeStudio]</span> Output channel ready</div>
            <div><span className="text-[#00d4aa]/60">[AICodeStudio]</span> Extensions loaded: 2</div>
            <div><span className="text-[#00d4aa]/60">[AICodeStudio]</span> AI providers initialized</div>
            <div><span className="text-[#00d4aa]/60">[AICodeStudio]</span> TypeScript server started</div>
          </div>
        )}
        {activeBottomPanel === 'problems' && (
          <div className="h-full p-3 font-mono text-[12px] text-[#30363d]">
            <div className="text-[#3fb950]">&#10003; No problems detected in workspace</div>
          </div>
        )}
        {activeBottomPanel === 'debug' && (
          <div className="h-full p-3 font-mono text-[12px] text-[#30363d]">
            <div>No active debug session</div>
            <div className="mt-2 text-[11px] text-[#30363d]">Press F5 to start debugging</div>
          </div>
        )}
      </div>
    </div>
  )
}
