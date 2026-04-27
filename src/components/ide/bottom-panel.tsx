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
      className="bg-[#0d1117] border-t border-[#00e5ff]/10 flex flex-col shrink-0"
      style={{ height: bottomPanelHeight }}
    >
      {/* Panel Tabs */}
      <div className="flex items-center gap-0 bg-[#080c12] border-b border-[#00e5ff]/10 shrink-0">
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
                  ? 'text-[#e6edf3] border-b-[#00e5ff]'
                  : 'text-[#5a6270] border-b-transparent hover:text-[#8b949e]'
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
          <div className="h-full p-3 font-mono text-[12px] text-[#5a6270]">
            <div>[AICodeStudio] Output channel ready</div>
            <div>[AICodeStudio] Extensions loaded: 2</div>
            <div>[AICodeStudio] AI providers initialized</div>
            <div>[AICodeStudio] TypeScript server started</div>
          </div>
        )}
        {activeBottomPanel === 'problems' && (
          <div className="h-full p-3 font-mono text-[12px] text-[#5a6270]">
            <div className="text-[#3fb950]">✓ No problems detected in workspace</div>
          </div>
        )}
        {activeBottomPanel === 'debug' && (
          <div className="h-full p-3 font-mono text-[12px] text-[#5a6270]">
            <div>No active debug session</div>
            <div className="mt-2 text-[11px] text-[#3d4450]">Press F5 to start debugging</div>
          </div>
        )}
      </div>
    </div>
  )
}
