'use client'

import { useEffect, useState } from 'react'
import { useIDEStore } from '@/store/ide-store'
import {
  Container, Terminal, Code2, GitBranch, Database,
  Bot, Users, FolderOpen,
} from 'lucide-react'
import { colors, typography, radius } from '@/components/hud/tokens'
import { AgentStatusChip, RuntimeHealthChip } from '@/components/hud/hud-primitives'

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

const CAPABILITY_ICONS: Record<string, typeof Bot> = {
  docker: Container,
  terminal: Terminal,
  lsp: Code2,
  git: GitBranch,
  database: Database,
  ai: Bot,
  collaboration: Users,
  localFS: FolderOpen,
}

const CAPABILITY_LABELS: Record<string, string> = {
  docker: 'Docker',
  terminal: 'Terminal',
  lsp: 'LSP',
  git: 'Git',
  database: 'Database',
  ai: 'AI',
  collaboration: 'Collab',
  localFS: 'Local FS',
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
      <div
        className="uppercase tracking-wider mb-2 font-semibold"
        style={{
          fontSize: typography.fontSize.sm,
          color: colors.text.dim,
          fontFamily: typography.fontFamily.mono,
        }}
      >
        Runtime Status
      </div>

      {/* Mode Badge */}
      <div className="flex items-center gap-2 mb-3">
        <AgentStatusChip
          status={caps?.mode === 'server' ? 'active' : 'simulated'}
          label={caps?.mode === 'server' ? 'Server Mode' : 'Static Demo'}
          size="md"
        />
        {caps && (
          <span style={{ fontSize: typography.fontSize.xs, color: colors.text.dim, fontFamily: typography.fontFamily.mono }}>
            {caps.version}
          </span>
        )}
      </div>

      {/* Capabilities List */}
      <div className="space-y-1.5">
        {caps ? (
          Object.entries(caps.capabilities).map(([key, cap]) => {
            const Icon = CAPABILITY_ICONS[key] || null
            const label = CAPABILITY_LABELS[key] || key
            return (
              <div key={key} className="flex items-center justify-between" style={{ fontSize: typography.fontSize.base, fontFamily: typography.fontFamily.mono }}>
                <div className="flex items-center gap-1.5">
                  {Icon ? (
                    <Icon size={12} style={{ color: colors.text.dim }} />
                  ) : (
                    <span style={{ color: colors.text.dim, fontSize: typography.fontSize.sm }}>•</span>
                  )}
                  <span style={{ color: colors.text.secondary }}>{label}</span>
                </div>
                <AgentStatusChip
                  status={
                    cap.status === 'enabled' ? 'active' :
                    cap.status === 'simulated' ? 'simulated' :
                    cap.status === 'disabled' ? 'off' :
                    'unavailable'
                  }
                  size="sm"
                />
              </div>
            )
          })
        ) : (
          <div style={{ fontSize: typography.fontSize.sm, color: colors.text.dim, fontFamily: typography.fontFamily.mono }}>
            {error ? 'Failed to load' : 'Loading...'}
          </div>
        )}

        {/* Browser-only: File System Access */}
        <div className="flex items-center justify-between" style={{ fontSize: typography.fontSize.base, fontFamily: typography.fontFamily.mono }}>
          <div className="flex items-center gap-1.5">
            <FolderOpen size={12} style={{ color: colors.text.dim }} />
            <span style={{ color: colors.text.secondary }}>Browser FS</span>
          </div>
          <AgentStatusChip
            status={fsAccessSupported ? 'active' : 'unavailable'}
            size="sm"
          />
        </div>
      </div>

      {/* Security Note */}
      <div
        className="mt-3 leading-tight pt-2"
        style={{
          fontSize: typography.fontSize.xs,
          color: colors.text.dim,
          fontFamily: typography.fontFamily.mono,
          borderTop: `1px solid ${colors.border.muted}`,
        }}
      >
        <div>API keys: session-only</div>
        <div>DB: read-only by default</div>
        <div>Docker/Terminal: require flags</div>
      </div>
    </div>
  )
}
