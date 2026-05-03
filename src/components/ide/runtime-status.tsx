'use client'

import { useEffect, useState } from 'react'
import { useIDEStore } from '@/store/ide-store'

interface Capability {
  enabled: boolean
  status: 'enabled' | 'disabled' | 'simulated' | 'unavailable'
  reason?: string
}

interface CapabilitiesResponse {
  version: string
  mode: string
  capabilities: Record<string, Capability>
}

const STATUS_COLORS: Record<string, string> = {
  enabled: 'text-[#3fb950]',
  disabled: 'text-[#484f58]',
  simulated: 'text-[#ffa657]',
  unavailable: 'text-[#f85149]',
}

const STATUS_LABELS: Record<string, string> = {
  enabled: 'Active',
  disabled: 'Off',
  simulated: 'Sim',
  unavailable: 'N/A',
}

const CAPABILITY_ICONS: Record<string, string> = {
  docker: '🐳',
  terminal: '⌨',
  lsp: '🔤',
  git: '🔀',
  database: '🗄',
  ai: '🤖',
  collaboration: '👥',
  localFS: '📁',
}

export function RuntimeStatus() {
  const [caps, setCaps] = useState<CapabilitiesResponse | null>(null)
  const [error, setError] = useState(false)
  const fsAccessSupported = useIDEStore((s) => s.fsAccessSupported)

  useEffect(() => {
    fetch('/api/capabilities')
      .then((r) => r.json())
      .then((data) => setCaps(data))
      .catch(() => setError(true))
  }, [])

  return (
    <div className="p-3 space-y-2">
      <div className="text-[10px] font-mono text-[#8b949e] uppercase tracking-wider mb-2">
        Runtime Status
      </div>

      {/* Mode Badge */}
      <div className="flex items-center gap-2 mb-3">
        <div className={`text-[10px] font-mono px-2 py-0.5 rounded ${
          caps?.mode === 'server'
            ? 'bg-[#238636]/20 text-[#3fb950] border border-[#238636]/30'
            : 'bg-[#ffa657]/10 text-[#ffa657] border border-[#ffa657]/30'
        }`}>
          {caps?.mode === 'server' ? 'Server Mode' : 'Static Demo'}
        </div>
        {caps && (
          <span className="text-[9px] font-mono text-[#484f58]">
            {caps.version}
          </span>
        )}
      </div>

      {/* Capabilities List */}
      <div className="space-y-1.5">
        {caps ? (
          Object.entries(caps.capabilities).map(([key, cap]) => (
            <div key={key} className="flex items-center justify-between text-[11px] font-mono">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px]">{CAPABILITY_ICONS[key] || '•'}</span>
                <span className="text-[#8b949e] capitalize">{key === 'localFS' ? 'Local FS' : key === 'lsp' ? 'LSP' : key === 'ai' ? 'AI' : key}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className={`text-[9px] ${STATUS_COLORS[cap.status]}`}>
                  {STATUS_LABELS[cap.status]}
                </span>
                <div className={`w-1.5 h-1.5 rounded-full ${
                  cap.status === 'enabled' ? 'bg-[#3fb950]' :
                  cap.status === 'simulated' ? 'bg-[#ffa657]' :
                  cap.status === 'disabled' ? 'bg-[#484f58]' :
                  'bg-[#f85149]'
                }`} />
              </div>
            </div>
          ))
        ) : (
          <div className="text-[10px] text-[#484f58] font-mono">
            {error ? 'Failed to load' : 'Loading...'}
          </div>
        )}

        {/* Browser-only: File System Access */}
        <div className="flex items-center justify-between text-[11px] font-mono">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px]">📁</span>
            <span className="text-[#8b949e]">Browser FS</span>
          </div>
          <div className="flex items-center gap-1">
            <span className={`text-[9px] ${fsAccessSupported ? 'text-[#3fb950]' : 'text-[#484f58]'}`}>
              {fsAccessSupported ? 'Active' : 'N/A'}
            </span>
            <div className={`w-1.5 h-1.5 rounded-full ${fsAccessSupported ? 'bg-[#3fb950]' : 'bg-[#484f58]'}`} />
          </div>
        </div>
      </div>

      {/* Security Note */}
      <div className="mt-3 text-[9px] text-[#484f58] font-mono leading-tight border-t border-[#21262d] pt-2">
        <div>API keys: session-only</div>
        <div>DB: read-only by default</div>
        <div>Docker/Terminal: require flags</div>
      </div>
    </div>
  )
}
