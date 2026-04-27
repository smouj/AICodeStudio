'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Container,
  Image as ImageIcon,
  RefreshCw,
  Play,
  Square,
  RotateCcw,
  Trash2,
  Download,
  ChevronDown,
  ChevronRight,
  Wifi,
  WifiOff,
  Loader2,
  ExternalLink,
} from 'lucide-react'
import { useIDEStore } from '@/store/ide-store'
import type { DockerContainer } from '@/store/ide-store'

// ─── Status helpers ──────────────────────────────────────────

const STATUS_CONFIG: Record<DockerContainer['status'], { color: string; bg: string; label: string }> = {
  running: { color: 'text-[#3fb950]', bg: 'bg-[rgba(63,185,80,0.1)]', label: 'Running' },
  stopped: { color: 'text-[#f85149]', bg: 'bg-[rgba(248,81,73,0.1)]', label: 'Stopped' },
  exited: { color: 'text-[#f85149]', bg: 'bg-[rgba(248,81,73,0.1)]', label: 'Exited' },
  paused: { color: 'text-[#ffa657]', bg: 'bg-[rgba(255,166,87,0.1)]', label: 'Paused' },
  restarting: { color: 'text-[#ffa657]', bg: 'bg-[rgba(255,166,87,0.1)]', label: 'Restarting' },
  created: { color: 'text-[#79c0ff]', bg: 'bg-[rgba(121,192,255,0.1)]', label: 'Created' },
}

function formatSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`
}

function formatImageName(name: string, tag: string): string {
  if (!name || name === '<none>') return `<none>:${tag}`
  return `${name}:${tag}`
}

// ─── Container Details Component ─────────────────────────────

function ContainerDetails({ container }: { container: DockerContainer }) {
  const [activeTab, setActiveTab] = useState<'logs' | 'env' | 'ports'>('logs')
  const [logs, setLogs] = useState<string[]>([])
  const [logsLoading, setLogsLoading] = useState(false)
  const [logsFetched, setLogsFetched] = useState(false)

  const fetchLogs = useCallback(() => {
    if (logsFetched) return
    setLogsLoading(true)
    fetch(`/api/docker/containers/${container.id}/logs?XTransformPort=3001`)
      .then((res) => (res.ok ? res.json() : { logs: [] }))
      .then((data) => {
        setLogs(data.logs || ['No logs available'])
        setLogsLoading(false)
        setLogsFetched(true)
      })
      .catch(() => {
        setLogs(['Failed to fetch logs'])
        setLogsLoading(false)
        setLogsFetched(true)
      })
  }, [container.id, logsFetched])

  const handleTabChange = (tab: 'logs' | 'env' | 'ports') => {
    setActiveTab(tab)
    if (tab === 'logs' && !logsFetched) {
      fetchLogs()
    }
  }

  return (
    <div className="ml-6 mr-2 mt-1 mb-2 border border-[rgba(0,212,170,0.08)] rounded bg-[#060a10]">
      {/* Detail tabs */}
      <div className="flex items-center gap-1 px-2 py-1 border-b border-[rgba(0,212,170,0.06)]">
        {(['logs', 'env', 'ports'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => handleTabChange(tab)}
            className={`px-2 py-0.5 text-[10px] font-mono rounded cursor-pointer transition-colors ${
              activeTab === tab
                ? 'bg-[rgba(0,212,170,0.12)] text-[#00d4aa]'
                : 'text-[#484f58] hover:text-[#6e7681]'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="p-2 max-h-32 overflow-y-auto custom-scrollbar">
        {activeTab === 'logs' && (
          logsLoading ? (
            <div className="flex items-center gap-1 text-[10px] text-[#484f58]">
              <Loader2 size={10} className="animate-spin" /> Loading logs...
            </div>
          ) : (
            <pre className="text-[10px] text-[#484f58] font-mono whitespace-pre-wrap leading-relaxed">
              {logs.join('\n')}
            </pre>
          )
        )}
        {activeTab === 'env' && (
          <div className="space-y-0.5">
            <div className="text-[10px] text-[#30363d] font-mono">Environment variables not available in preview mode</div>
          </div>
        )}
        {activeTab === 'ports' && (
          <div className="space-y-0.5">
            {container.ports.length > 0 ? (
              container.ports.map((port, i) => (
                <div key={i} className="flex items-center gap-1.5 text-[10px] font-mono">
                  <ExternalLink size={9} className="text-[#00d4aa]/50" />
                  <span className="text-[#79c0ff]">{port}</span>
                </div>
              ))
            ) : (
              <div className="text-[10px] text-[#30363d] font-mono">No port mappings</div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Main Docker Panel ───────────────────────────────────────

export function DockerPanel() {
  const dockerContainers = useIDEStore((s) => s.dockerContainers)
  const dockerImages = useIDEStore((s) => s.dockerImages)
  const dockerConnected = useIDEStore((s) => s.dockerConnected)
  const dockerLoading = useIDEStore((s) => s.dockerLoading)
  const fetchContainers = useIDEStore((s) => s.fetchContainers)
  const fetchImages = useIDEStore((s) => s.fetchImages)
  const startContainer = useIDEStore((s) => s.startContainer)
  const stopContainer = useIDEStore((s) => s.stopContainer)
  const removeContainer = useIDEStore((s) => s.removeContainer)
  const addNotification = useIDEStore((s) => s.addNotification)

  const [activeTab, setActiveTab] = useState<'containers' | 'images'>('containers')
  const [expandedContainer, setExpandedContainer] = useState<string | null>(null)
  const [pullImageName, setPullImageName] = useState('')
  const [pulling, setPulling] = useState(false)
  const [containerFilter, setContainerFilter] = useState<'all' | 'running' | 'stopped'>('all')

  // Auto-refresh
  const refreshAll = useCallback(() => {
    fetchContainers()
    fetchImages()
  }, [fetchContainers, fetchImages])

  useEffect(() => {
    refreshAll()
    const interval = setInterval(refreshAll, 15000)
    return () => clearInterval(interval)
  }, [refreshAll])

  // Filtered containers
  const filteredContainers = dockerContainers.filter((c) => {
    if (containerFilter === 'running') return c.status === 'running'
    if (containerFilter === 'stopped') return c.status === 'stopped' || c.status === 'exited'
    return true
  })

  const runningCount = dockerContainers.filter((c) => c.status === 'running').length

  // Pull image handler
  const handlePullImage = async () => {
    if (!pullImageName.trim()) return
    setPulling(true)
    try {
      const res = await fetch('/api/docker/images/pull?XTransformPort=3001', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: pullImageName.trim() }),
      })
      if (res.ok) {
        addNotification('success', `Image pulled: ${pullImageName}`)
        fetchImages()
        setPullImageName('')
      } else {
        addNotification('error', `Failed to pull image: ${pullImageName}`)
      }
    } catch {
      addNotification('error', 'Failed to pull image — Docker daemon unreachable')
    } finally {
      setPulling(false)
    }
  }

  // Remove image handler
  const handleRemoveImage = async (imageId: string, imageName: string) => {
    try {
      const res = await fetch(`/api/docker/images/${imageId}?XTransformPort=3001`, { method: 'DELETE' })
      if (res.ok) {
        addNotification('success', `Image removed: ${imageName}`)
        fetchImages()
      } else {
        addNotification('error', `Failed to remove image: ${imageName}`)
      }
    } catch {
      addNotification('error', 'Failed to remove image — Docker daemon unreachable')
    }
  }

  // Run image handler
  const handleRunImage = async (imageName: string, tag: string) => {
    try {
      const res = await fetch('/api/docker/containers/create?XTransformPort=3001', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: `${imageName}:${tag}` }),
      })
      if (res.ok) {
        addNotification('success', `Container created from ${imageName}:${tag}`)
        fetchContainers()
      } else {
        addNotification('error', `Failed to run image: ${imageName}:${tag}`)
      }
    } catch {
      addNotification('error', 'Failed to run image — Docker daemon unreachable')
    }
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-[#30363d] border-b border-[rgba(0,212,170,0.08)]">
        <div className="flex items-center gap-2">
          <Container size={12} className="text-[#00d4aa]/60" />
          <span>Docker</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={refreshAll}
            className="text-[#30363d] hover:text-[#00d4aa] cursor-pointer transition-colors"
            title="Refresh"
          >
            <RefreshCw size={12} className={dockerLoading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Connection Status */}
      <div className="px-3 py-2 border-b border-[rgba(0,212,170,0.06)]">
        <div className="flex items-center gap-2 text-[11px] font-mono">
          {dockerConnected ? (
            <>
              <Wifi size={12} className="text-[#3fb950]" />
              <span className="text-[#3fb950]">Daemon Connected</span>
            </>
          ) : (
            <>
              <WifiOff size={12} className="text-[#f85149]" />
              <span className="text-[#f85149]">Daemon Unreachable</span>
            </>
          )}
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex items-center border-b border-[rgba(0,212,170,0.08)]">
        <button
          onClick={() => setActiveTab('containers')}
          className={`flex-1 px-3 py-1.5 text-[11px] font-mono cursor-pointer transition-colors border-b-2 ${
            activeTab === 'containers'
              ? 'text-[#00d4aa] border-[#00d4aa]'
              : 'text-[#30363d] border-transparent hover:text-[#484f58]'
          }`}
        >
          <Container size={11} className="inline mr-1 -mt-0.5" />
          Containers ({dockerContainers.length})
        </button>
        <button
          onClick={() => setActiveTab('images')}
          className={`flex-1 px-3 py-1.5 text-[11px] font-mono cursor-pointer transition-colors border-b-2 ${
            activeTab === 'images'
              ? 'text-[#00d4aa] border-[#00d4aa]'
              : 'text-[#30363d] border-transparent hover:text-[#484f58]'
          }`}
        >
          <ImageIcon size={11} className="inline mr-1 -mt-0.5" />
          Images ({dockerImages.length})
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {activeTab === 'containers' && (
          <>
            {/* Container filters */}
            <div className="px-3 py-1.5 flex items-center gap-2 border-b border-[rgba(0,212,170,0.04)]">
              {(['all', 'running', 'stopped'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setContainerFilter(f)}
                  className={`px-2 py-0.5 text-[10px] font-mono rounded cursor-pointer transition-colors ${
                    containerFilter === f
                      ? 'bg-[rgba(0,212,170,0.12)] text-[#00d4aa]'
                      : 'text-[#30363d] hover:text-[#484f58]'
                  }`}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                  {f === 'running' && ` (${runningCount})`}
                </button>
              ))}
            </div>

            {/* Container list */}
            {dockerLoading && dockerContainers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-[12px] text-[#30363d] font-mono">
                <Loader2 size={20} className="animate-spin mb-2 text-[#00d4aa]/30" />
                <p>Loading containers...</p>
              </div>
            ) : filteredContainers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                <Container size={28} className="text-[#00d4aa]/10 mb-3" />
                <p className="text-[12px] text-[#30363d] font-mono">
                  {containerFilter !== 'all' ? `No ${containerFilter} containers` : 'No containers'}
                </p>
                <p className="text-[10px] text-[#30363d] mt-1">
                  {dockerConnected ? 'Pull an image and create a container' : 'Connect to Docker daemon first'}
                </p>
              </div>
            ) : (
              <div className="px-2 py-1">
                {filteredContainers.map((container) => {
                  const statusCfg = STATUS_CONFIG[container.status] || STATUS_CONFIG.stopped
                  const isExpanded = expandedContainer === container.id
                  const isRunning = container.status === 'running'

                  return (
                    <div key={container.id} className="mb-0.5">
                      <div
                        className="flex items-center gap-2 px-2 py-1.5 hover:bg-[rgba(0,212,170,0.04)] cursor-pointer transition-colors rounded group"
                        onClick={() => setExpandedContainer(isExpanded ? null : container.id)}
                      >
                        {/* Expand chevron */}
                        {isExpanded ? (
                          <ChevronDown size={10} className="text-[#484f58] shrink-0" />
                        ) : (
                          <ChevronRight size={10} className="text-[#30363d] group-hover:text-[#484f58] shrink-0" />
                        )}

                        {/* Status indicator */}
                        <div className={`w-2 h-2 rounded-full shrink-0 ${
                          isRunning ? 'bg-[#3fb950] shadow-[0_0_4px_rgba(63,185,80,0.4)]' : 'bg-[#f85149]/60'
                        }`} />

                        {/* Container info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[12px] text-[#e6edf3] font-mono truncate">{container.name}</span>
                            <span className={`text-[9px] font-mono px-1 py-px rounded ${statusCfg.bg} ${statusCfg.color}`}>
                              {statusCfg.label}
                            </span>
                          </div>
                          <div className="text-[10px] text-[#484f58] font-mono truncate">
                            {container.image} {container.ports.length > 0 && `· ${container.ports.join(', ')}`}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {isRunning ? (
                            <button
                              onClick={(e) => { e.stopPropagation(); stopContainer(container.id) }}
                              className="p-1 text-[#30363d] hover:text-[#ffa657] cursor-pointer rounded hover:bg-[rgba(255,166,87,0.1)]"
                              title="Stop"
                            >
                              <Square size={11} />
                            </button>
                          ) : (
                            <button
                              onClick={(e) => { e.stopPropagation(); startContainer(container.id) }}
                              className="p-1 text-[#30363d] hover:text-[#3fb950] cursor-pointer rounded hover:bg-[rgba(63,185,80,0.1)]"
                              title="Start"
                            >
                              <Play size={11} />
                            </button>
                          )}
                          <button
                            onClick={(e) => { e.stopPropagation(); startContainer(container.id) }}
                            className="p-1 text-[#30363d] hover:text-[#79c0ff] cursor-pointer rounded hover:bg-[rgba(121,192,255,0.1)]"
                            title="Restart"
                          >
                            <RotateCcw size={11} />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); removeContainer(container.id) }}
                            className="p-1 text-[#30363d] hover:text-[#f85149] cursor-pointer rounded hover:bg-[rgba(248,81,73,0.1)]"
                            title="Remove"
                          >
                            <Trash2 size={11} />
                          </button>
                        </div>
                      </div>

                      {/* Expanded details */}
                      {isExpanded && <ContainerDetails container={container} />}
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}

        {activeTab === 'images' && (
          <>
            {dockerLoading && dockerImages.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-[12px] text-[#30363d] font-mono">
                <Loader2 size={20} className="animate-spin mb-2 text-[#00d4aa]/30" />
                <p>Loading images...</p>
              </div>
            ) : dockerImages.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                <ImageIcon size={28} className="text-[#00d4aa]/10 mb-3" />
                <p className="text-[12px] text-[#30363d] font-mono">No images</p>
                <p className="text-[10px] text-[#30363d] mt-1">Pull an image from Docker Hub below</p>
              </div>
            ) : (
              <div className="px-2 py-1">
                {dockerImages.map((image) => (
                  <div
                    key={image.id}
                    className="flex items-center gap-2 px-2 py-1.5 hover:bg-[rgba(0,212,170,0.04)] cursor-pointer transition-colors rounded group"
                  >
                    <ImageIcon size={12} className="text-[#00d4aa]/40 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-[12px] text-[#e6edf3] font-mono truncate">
                        {formatImageName(image.name, image.tag)}
                      </div>
                      <div className="text-[10px] text-[#484f58] font-mono">
                        {formatSize(image.size)} · {image.id.slice(0, 12)}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleRunImage(image.name, image.tag)}
                        className="p-1 text-[#30363d] hover:text-[#3fb950] cursor-pointer rounded hover:bg-[rgba(63,185,80,0.1)]"
                        title="Run container from image"
                      >
                        <Play size={11} />
                      </button>
                      <button
                        onClick={() => handleRemoveImage(image.id, formatImageName(image.name, image.tag))}
                        className="p-1 text-[#30363d] hover:text-[#f85149] cursor-pointer rounded hover:bg-[rgba(248,81,73,0.1)]"
                        title="Remove image"
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Pull Image Footer */}
      <div className="p-3 border-t border-[rgba(0,212,170,0.08)] mt-auto">
        <div className="flex items-center gap-2 bg-[#0d1117] border border-[rgba(0,212,170,0.08)] rounded px-3 py-1.5 focus-within:border-[rgba(0,212,170,0.25)] transition-colors">
          <Download size={12} className="text-[#30363d] shrink-0" />
          <input
            value={pullImageName}
            onChange={(e) => setPullImageName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handlePullImage()}
            placeholder="Pull image (e.g. nginx:latest)"
            className="flex-1 bg-transparent text-[12px] text-[#e6edf3] placeholder-[#30363d] outline-none font-mono"
          />
        </div>
        <button
          onClick={handlePullImage}
          disabled={pulling || !pullImageName.trim() || !dockerConnected}
          className={`
            w-full mt-2 text-[11px] font-mono py-1.5 rounded transition-all cursor-pointer flex items-center justify-center gap-1.5
            ${pulling
              ? 'bg-[rgba(0,212,170,0.04)] text-[#30363d] cursor-not-allowed'
              : pullImageName.trim() && dockerConnected
                ? 'bg-[rgba(0,212,170,0.12)] text-[#00d4aa] hover:bg-[rgba(0,212,170,0.18)]'
                : 'bg-[rgba(0,212,170,0.04)] text-[#30363d] cursor-not-allowed'
            }
          `}
        >
          {pulling ? <Loader2 size={11} className="animate-spin" /> : <Download size={11} />}
          {pulling ? 'Pulling...' : 'Pull Image'}
        </button>
      </div>
    </div>
  )
}
