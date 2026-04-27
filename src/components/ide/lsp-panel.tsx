'use client'

import { useState, useMemo, useCallback } from 'react'
import {
  Server,
  Play,
  Square,
  RefreshCw,
  AlertCircle,
  AlertTriangle,
  Info,
  Lightbulb,
  Wrench,
  ChevronDown,
  ChevronRight,
  Circle,
  Search,
  FileCode2,
  Zap,
  X,
  Check,
  Loader2,
} from 'lucide-react'
import { useIDEStore } from '@/store/ide-store'
import type { LSPServer, LSPDiagnostic } from '@/store/ide-store'

// ─── Supported Languages ────────────────────────────────────

interface SupportedLanguage {
  id: string
  name: string
  serverName: string
  extensions: string[]
  icon: string
}

const SUPPORTED_LANGUAGES: SupportedLanguage[] = [
  { id: 'typescript', name: 'TypeScript', serverName: 'tsserver', extensions: ['.ts', '.tsx'], icon: 'TS' },
  { id: 'javascript', name: 'JavaScript', serverName: 'tsserver', extensions: ['.js', '.jsx'], icon: 'JS' },
  { id: 'python', name: 'Python', serverName: 'pylsp', extensions: ['.py'], icon: 'PY' },
  { id: 'rust', name: 'Rust', serverName: 'rust-analyzer', extensions: ['.rs'], icon: 'RS' },
  { id: 'go', name: 'Go', serverName: 'gopls', extensions: ['.go'], icon: 'GO' },
  { id: 'java', name: 'Java', serverName: 'jdtls', extensions: ['.java'], icon: 'JV' },
  { id: 'c', name: 'C/C++', serverName: 'clangd', extensions: ['.c', '.cpp', '.h', '.hpp'], icon: 'C+' },
  { id: 'html', name: 'HTML', serverName: 'html-lsp', extensions: ['.html', '.htm'], icon: 'HT' },
  { id: 'css', name: 'CSS', serverName: 'css-lsp', extensions: ['.css', '.scss', '.less'], icon: 'CS' },
  { id: 'json', name: 'JSON', serverName: 'json-lsp', extensions: ['.json'], icon: '{ }' },
]

// ─── Severity Helpers ────────────────────────────────────────

type DiagnosticSeverity = LSPDiagnostic['severity']

const SEVERITY_CONFIG: Record<DiagnosticSeverity, { color: string; bgColor: string; icon: React.ReactNode; label: string }> = {
  error: {
    color: 'text-[#f85149]',
    bgColor: 'bg-[rgba(248,81,73,0.08)]',
    icon: <AlertCircle size={12} />,
    label: 'Error',
  },
  warning: {
    color: 'text-[#ffa657]',
    bgColor: 'bg-[rgba(255,166,87,0.08)]',
    icon: <AlertTriangle size={12} />,
    label: 'Warning',
  },
  info: {
    color: 'text-[#79c0ff]',
    bgColor: 'bg-[rgba(121,192,255,0.08)]',
    icon: <Info size={12} />,
    label: 'Info',
  },
  hint: {
    color: 'text-[#7ee787]',
    bgColor: 'bg-[rgba(126,231,135,0.08)]',
    icon: <Lightbulb size={12} />,
    label: 'Hint',
  },
}

// ─── Quick Fix / Code Action Types ──────────────────────────

interface CodeAction {
  id: string
  title: string
  kind: string
  diagnostic?: LSPDiagnostic
  isPreferred?: boolean
}

// ─── Sub-Components ─────────────────────────────────────────

function ServerStatusBadge({ status }: { status: LSPServer['status'] }) {
  const config: Record<LSPServer['status'], { color: string; label: string; dotClass: string }> = {
    starting: { color: 'text-[#ffa657]', label: 'Starting', dotClass: 'text-[#ffa657] fill-[#ffa657] animate-pulse' },
    running: { color: 'text-[#00d4aa]', label: 'Running', dotClass: 'text-[#00d4aa] fill-[#00d4aa]' },
    stopped: { color: 'text-[#484f58]', label: 'Stopped', dotClass: 'text-[#484f58]' },
    error: { color: 'text-[#f85149]', label: 'Error', dotClass: 'text-[#f85149] fill-[#f85149]' },
  }
  const { color, label, dotClass } = config[status]
  return (
    <div className="flex items-center gap-1 text-[10px] font-mono">
      <Circle size={5} className={dotClass} />
      <span className={color}>{label}</span>
    </div>
  )
}

function DiagnosticEntry({ diagnostic, onApplyFix }: { diagnostic: LSPDiagnostic; onApplyFix: (d: LSPDiagnostic) => void }) {
  const config = SEVERITY_CONFIG[diagnostic.severity]
  return (
    <div className={`px-2 py-1.5 rounded ${config.bgColor} border border-[rgba(0,212,170,0.04)]`}>
      <div className="flex items-start gap-1.5">
        <div className={`mt-0.5 shrink-0 ${config.color}`}>
          {config.icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] text-[#e6edf3] font-mono leading-tight break-words">
            {diagnostic.message}
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[9px] text-[#30363d] font-mono">
              L{diagnostic.line}:C{diagnostic.column}
            </span>
            {diagnostic.source && (
              <span className="text-[9px] text-[#30363d] font-mono">{diagnostic.source}</span>
            )}
            {diagnostic.code !== undefined && (
              <span className="text-[9px] text-[#484f58] font-mono">({diagnostic.code})</span>
            )}
          </div>
        </div>
        {/* Quick fix button */}
        {diagnostic.severity === 'error' || diagnostic.severity === 'warning' ? (
          <button
            onClick={() => onApplyFix(diagnostic)}
            className="shrink-0 p-0.5 text-[#30363d] hover:text-[#00d4aa] hover:bg-[rgba(0,212,170,0.08)] rounded transition-colors cursor-pointer"
            title="Quick fix"
          >
            <Lightbulb size={10} />
          </button>
        ) : null}
      </div>
    </div>
  )
}

function LanguageCard({
  language,
  server,
  onStart,
  onStop,
  isStarting,
}: {
  language: SupportedLanguage
  server?: LSPServer
  onStart: (langId: string) => void
  onStop: (serverId: string) => void
  isStarting: boolean
}) {
  const isRunning = server?.status === 'running'
  const isStarting_ = server?.status === 'starting' || isStarting

  return (
    <div className="flex items-center justify-between px-2 py-1.5 hover:bg-[rgba(0,212,170,0.04)] transition-colors rounded">
      <div className="flex items-center gap-2 min-w-0">
        <div className="w-6 h-6 rounded bg-[rgba(0,212,170,0.06)] flex items-center justify-center shrink-0">
          <span className="text-[8px] font-mono font-bold text-[#00d4aa]/60">{language.icon}</span>
        </div>
        <div className="min-w-0">
          <div className="text-[11px] text-[#e6edf3] font-mono">{language.name}</div>
          <div className="text-[9px] text-[#30363d] font-mono">{language.serverName}</div>
        </div>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        {server && <ServerStatusBadge status={server.status} />}
        {isRunning ? (
          <button
            onClick={() => onStop(server.id)}
            className="p-1 text-[#f85149]/60 hover:text-[#f85149] hover:bg-[rgba(248,81,73,0.08)] rounded transition-colors cursor-pointer"
            title="Stop server"
          >
            <Square size={10} />
          </button>
        ) : (
          <button
            onClick={() => onStart(language.id)}
            disabled={isStarting_}
            className={`p-1 rounded transition-colors cursor-pointer ${
              isStarting_
                ? 'text-[#30363d] cursor-not-allowed'
                : 'text-[#00d4aa]/60 hover:text-[#00d4aa] hover:bg-[rgba(0,212,170,0.08)]'
            }`}
            title="Start server"
          >
            {isStarting_ ? <Loader2 size={10} className="animate-spin" /> : <Play size={10} />}
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Main Component ─────────────────────────────────────────

export function LSPPanel() {
  const lspServers = useIDEStore((s) => s.lspServers)
  const lspDiagnostics = useIDEStore((s) => s.lspDiagnostics)
  const lspConnected = useIDEStore((s) => s.lspConnected)
  const startLSP = useIDEStore((s) => s.startLSP)
  const stopLSP = useIDEStore((s) => s.stopLSP)
  const getDiagnostics = useIDEStore((s) => s.getDiagnostics)
  const addNotification = useIDEStore((s) => s.addNotification)
  const addOutputEntry = useIDEStore((s) => s.addOutputEntry)
  const openTabs = useIDEStore((s) => s.openTabs)
  const activeTabId = useIDEStore((s) => s.activeTabId)
  const openFile = useIDEStore((s) => s.openFile)

  // ─── Local State ──────────────────────────────────────
  const [serversExpanded, setServersExpanded] = useState(true)
  const [diagnosticsExpanded, setDiagnosticsExpanded] = useState(true)
  const [actionsExpanded, setActionsExpanded] = useState(true)
  const [severityFilter, setSeverityFilter] = useState<DiagnosticSeverity | 'all'>('all')
  const [diagnosticsSearch, setDiagnosticsSearch] = useState('')
  const [startingLangs, setStartingLangs] = useState<Set<string>>(new Set())

  // ─── Computed: flat diagnostics list ───────────────────

  const allDiagnostics = useMemo(() => {
    const result: (LSPDiagnostic & { filePath: string })[] = []
    Object.entries(lspDiagnostics).forEach(([filePath, diags]) => {
      diags.forEach((d) => result.push({ ...d, filePath }))
    })
    return result
  }, [lspDiagnostics])

  // ─── Computed: filtered diagnostics ────────────────────

  const filteredDiagnostics = useMemo(() => {
    let result = allDiagnostics

    if (severityFilter !== 'all') {
      result = result.filter((d) => d.severity === severityFilter)
    }

    if (diagnosticsSearch.trim()) {
      const q = diagnosticsSearch.toLowerCase()
      result = result.filter(
        (d) =>
          d.message.toLowerCase().includes(q) ||
          d.filePath.toLowerCase().includes(q) ||
          (d.source && d.source.toLowerCase().includes(q))
      )
    }

    return result
  }, [allDiagnostics, severityFilter, diagnosticsSearch])

  // ─── Computed: diagnostics grouped by file ─────────────

  const diagnosticsByFile = useMemo(() => {
    const groups: Record<string, (LSPDiagnostic & { filePath: string })[]> = {}
    filteredDiagnostics.forEach((d) => {
      if (!groups[d.filePath]) groups[d.filePath] = []
      groups[d.filePath].push(d)
    })
    return groups
  }, [filteredDiagnostics])

  // ─── Computed: severity counts ─────────────────────────

  const severityCounts = useMemo(() => {
    const counts: Record<DiagnosticSeverity, number> = { error: 0, warning: 0, info: 0, hint: 0 }
    allDiagnostics.forEach((d) => { counts[d.severity]++ })
    return counts
  }, [allDiagnostics])

  // ─── Computed: code actions ────────────────────────────

  const codeActions = useMemo((): CodeAction[] => {
    const actions: CodeAction[] = []
    const activeTab = openTabs.find((t) => t.id === activeTabId)
    if (!activeTab) return actions

    const fileDiags = lspDiagnostics[activeTab.path] || []

    // Generate quick fixes from diagnostics
    fileDiags.forEach((d) => {
      if (d.severity === 'error' || d.severity === 'warning') {
        // Simulate common quick fixes based on diagnostic message
        const msg = d.message.toLowerCase()
        if (msg.includes("is not defined") || msg.includes("cannot find name")) {
          actions.push({
            id: `fix-import-${d.line}-${d.column}`,
            title: `Import missing module`,
            kind: 'quickfix',
            diagnostic: d,
            isPreferred: true,
          })
        }
        if (msg.includes("unused") || msg.includes("declared but never")) {
          actions.push({
            id: `fix-unused-${d.line}-${d.column}`,
            title: `Remove unused variable`,
            kind: 'quickfix',
            diagnostic: d,
            isPreferred: true,
          })
        }
        if (msg.includes("type") && msg.includes("not assignable")) {
          actions.push({
            id: `fix-type-${d.line}-${d.column}`,
            title: `Add type assertion`,
            kind: 'quickfix',
            diagnostic: d,
          })
        }
        if (msg.includes("missing") && msg.includes("property")) {
          actions.push({
            id: `fix-prop-${d.line}-${d.column}`,
            title: `Add missing property`,
            kind: 'quickfix',
            diagnostic: d,
            isPreferred: true,
          })
        }
        // Generic fix
        actions.push({
          id: `fix-suppress-${d.line}-${d.column}`,
          title: `Suppress with comment`,
          kind: 'quickfix',
          diagnostic: d,
        })
      }
    })

    // Refactor actions
    actions.push({
      id: 'refactor-extract',
      title: 'Extract to function',
      kind: 'refactor.extract',
    })
    actions.push({
      id: 'refactor-inline',
      title: 'Inline variable',
      kind: 'refactor.inline',
    })
    actions.push({
      id: 'refactor-rename',
      title: 'Rename symbol',
      kind: 'refactor.rename',
    })

    return actions
  }, [lspDiagnostics, openTabs, activeTabId])

  // ─── Handlers ─────────────────────────────────────────

  const handleStartLSP = useCallback(async (languageId: string) => {
    setStartingLangs((prev) => new Set(prev).add(languageId))
    try {
      const res = await fetch('/api/lsp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'start', language: languageId }),
      })
      if (!res.ok) throw new Error('Failed to start LSP server')
      startLSP(languageId)
      addOutputEntry('LSP', `Starting language server for ${languageId}...`)
      addNotification('info', `Starting ${languageId} language server...`)
    } catch {
      addNotification('error', `Failed to start ${languageId} language server.`)
    } finally {
      setStartingLangs((prev) => {
        const next = new Set(prev)
        next.delete(languageId)
        return next
      })
    }
  }, [startLSP, addNotification, addOutputEntry])

  const handleStopLSP = useCallback(async (serverId: string) => {
    const server = lspServers.find((s) => s.id === serverId)
    if (!server) return
    try {
      await fetch('/api/lsp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'stop', serverId }),
      })
    } catch {
      // stop locally even if API fails
    }
    stopLSP(serverId)
    addOutputEntry('LSP', `Stopped ${server.language} language server.`)
    addNotification('info', `Stopped ${server.language} language server.`)
  }, [lspServers, stopLSP, addNotification, addOutputEntry])

  const handleApplyFix = useCallback((diagnostic: LSPDiagnostic) => {
    addNotification('info', `Applied fix: ${diagnostic.message.slice(0, 50)}...`)
    addOutputEntry('LSP', `Quick fix applied for: ${diagnostic.message.slice(0, 80)}`)
  }, [addNotification, addOutputEntry])

  const handleApplyCodeAction = useCallback((action: CodeAction) => {
    addNotification('info', `Applied: ${action.title}`)
    addOutputEntry('LSP', `Code action executed: ${action.title} (${action.kind})`)
  }, [addNotification, addOutputEntry])

  const handleNavigateToDiagnostic = useCallback((filePath: string, _line: number, _column: number) => {
    openFile(filePath)
  }, [openFile])

  // ─── Active file for code actions context ──────────────

  const activeTab = openTabs.find((t) => t.id === activeTabId)
  const activeFileDiags = activeTab ? (lspDiagnostics[activeTab.path] || []) : []

  // ─── Running server count ─────────────────────────────

  const runningServers = lspServers.filter((s) => s.status === 'running').length

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-[#30363d] border-b border-[rgba(0,212,170,0.08)]">
        <span>LSP Support</span>
        <div className="flex items-center gap-2">
          <Circle
            size={6}
            className={lspConnected ? 'text-[#00d4aa] fill-[#00d4aa]' : 'text-[#30363d]'}
          />
          <span className="text-[10px] font-mono text-[#30363d]">{runningServers} running</span>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">

        {/* ─── Active LSP Servers ──────────────────────── */}
        <div className="border-b border-[rgba(0,212,170,0.05)]">
          <button
            onClick={() => setServersExpanded(!serversExpanded)}
            className="w-full flex items-center justify-between px-4 py-1.5 text-[11px] uppercase tracking-wider text-[#484f58] font-semibold hover:bg-[rgba(0,212,170,0.03)] transition-colors cursor-pointer"
          >
            <span className="flex items-center gap-1.5">
              <Server size={10} />
              Language Servers
            </span>
            <div className="flex items-center gap-1.5">
              {serversExpanded ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
            </div>
          </button>

          {serversExpanded && (
            <div className="px-2 pb-2 space-y-0.5">
              {SUPPORTED_LANGUAGES.map((lang) => {
                const server = lspServers.find((s) => s.language === lang.id)
                return (
                  <LanguageCard
                    key={lang.id}
                    language={lang}
                    server={server}
                    onStart={handleStartLSP}
                    onStop={handleStopLSP}
                    isStarting={startingLangs.has(lang.id)}
                  />
                )
              })}
            </div>
          )}
        </div>

        {/* ─── Diagnostics ─────────────────────────────── */}
        <div className="border-b border-[rgba(0,212,170,0.05)]">
          <button
            onClick={() => setDiagnosticsExpanded(!diagnosticsExpanded)}
            className="w-full flex items-center justify-between px-4 py-1.5 text-[11px] uppercase tracking-wider text-[#484f58] font-semibold hover:bg-[rgba(0,212,170,0.03)] transition-colors cursor-pointer"
          >
            <span className="flex items-center gap-1.5">
              <AlertCircle size={10} />
              Diagnostics
              <span className="text-[9px] text-[#30363d]">({allDiagnostics.length})</span>
            </span>
            {diagnosticsExpanded ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
          </button>

          {diagnosticsExpanded && (
            <div className="px-2 pb-2 space-y-2">
              {/* Search */}
              <div className="flex items-center gap-2 bg-[#0d1117] border border-[rgba(0,212,170,0.08)] rounded px-2 py-1 focus-within:border-[rgba(0,212,170,0.25)] transition-colors">
                <Search size={11} className="text-[#30363d] shrink-0" />
                <input
                  value={diagnosticsSearch}
                  onChange={(e) => setDiagnosticsSearch(e.target.value)}
                  placeholder="Filter diagnostics..."
                  className="flex-1 bg-transparent text-[11px] text-[#e6edf3] placeholder-[#30363d] outline-none font-mono"
                />
                {diagnosticsSearch && (
                  <button
                    onClick={() => setDiagnosticsSearch('')}
                    className="text-[#30363d] hover:text-[#484f58] cursor-pointer"
                  >
                    <X size={10} />
                  </button>
                )}
              </div>

              {/* Severity filter buttons */}
              <div className="flex items-center gap-1 text-[9px]">
                <button
                  onClick={() => setSeverityFilter('all')}
                  className={`px-1.5 py-0.5 rounded font-mono cursor-pointer transition-colors ${
                    severityFilter === 'all'
                      ? 'bg-[rgba(0,212,170,0.12)] text-[#00d4aa]'
                      : 'text-[#30363d] hover:text-[#484f58]'
                  }`}
                >
                  All ({allDiagnostics.length})
                </button>
                {(['error', 'warning', 'info'] as DiagnosticSeverity[]).map((sev) => {
                  const cfg = SEVERITY_CONFIG[sev]
                  return (
                    <button
                      key={sev}
                      onClick={() => setSeverityFilter(sev)}
                      className={`px-1.5 py-0.5 rounded font-mono cursor-pointer transition-colors flex items-center gap-0.5 ${
                        severityFilter === sev
                          ? `${cfg.bgColor} ${cfg.color}`
                          : 'text-[#30363d] hover:text-[#484f58]'
                      }`}
                    >
                      {cfg.icon}
                      {cfg.label} ({severityCounts[sev]})
                    </button>
                  )
                })}
              </div>

              {/* Diagnostic list grouped by file */}
              <div className="max-h-64 overflow-y-auto custom-scrollbar space-y-2">
                {filteredDiagnostics.length === 0 && (
                  <div className="text-center py-4 text-[11px] text-[#30363d] font-mono">
                    <AlertCircle size={20} className="mx-auto mb-1.5 text-[#30363d]/40" />
                    <p>{allDiagnostics.length === 0 ? 'No diagnostics' : 'No matching diagnostics'}</p>
                  </div>
                )}

                {Object.entries(diagnosticsByFile).map(([filePath, diags]) => {
                  const fileName = filePath.split('/').pop() || filePath
                  return (
                    <div key={filePath}>
                      <div className="flex items-center gap-1.5 px-1 mb-1">
                        <FileCode2 size={10} className="text-[#00d4aa]/40" />
                        <span className="text-[10px] text-[#484f58] font-mono truncate">{fileName}</span>
                        <span className="text-[9px] text-[#30363d] font-mono">({diags.length})</span>
                      </div>
                      <div className="space-y-0.5 ml-1">
                        {diags.map((d, i) => (
                          <div
                            key={`${d.line}-${d.column}-${i}`}
                            className="cursor-pointer"
                            onClick={() => handleNavigateToDiagnostic(d.filePath, d.line, d.column)}
                          >
                            <DiagnosticEntry diagnostic={d} onApplyFix={handleApplyFix} />
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* ─── Code Actions ────────────────────────────── */}
        <div>
          <button
            onClick={() => setActionsExpanded(!actionsExpanded)}
            className="w-full flex items-center justify-between px-4 py-1.5 text-[11px] uppercase tracking-wider text-[#484f58] font-semibold hover:bg-[rgba(0,212,170,0.03)] transition-colors cursor-pointer"
          >
            <span className="flex items-center gap-1.5">
              <Wrench size={10} />
              Code Actions
              {activeFileDiags.length > 0 && (
                <span className="text-[9px] text-[#30363d]">({codeActions.length})</span>
              )}
            </span>
            {actionsExpanded ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
          </button>

          {actionsExpanded && (
            <div className="px-2 pb-2 space-y-1">
              {/* Active file context */}
              {activeTab && (
                <div className="flex items-center gap-1.5 px-1 mb-1">
                  <FileCode2 size={10} className="text-[#00d4aa]/40" />
                  <span className="text-[10px] text-[#484f58] font-mono truncate">{activeTab.name}</span>
                  {activeFileDiags.length > 0 && (
                    <span className="text-[9px] text-[#30363d] font-mono">
                      {activeFileDiags.length} issue{activeFileDiags.length !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              )}

              {!activeTab && (
                <div className="text-center py-4 text-[11px] text-[#30363d] font-mono">
                  <Wrench size={20} className="mx-auto mb-1.5 text-[#30363d]/40" />
                  <p>Open a file to see code actions</p>
                </div>
              )}

              {activeTab && codeActions.length === 0 && (
                <div className="text-center py-4 text-[11px] text-[#30363d] font-mono">
                  <Check size={16} className="mx-auto mb-1.5 text-[#00d4aa]/30" />
                  <p>No actions available</p>
                  <p className="text-[9px] mt-0.5">Start a language server to enable code actions</p>
                </div>
              )}

              {codeActions.length > 0 && (
                <>
                  {/* Quick Fixes */}
                  {codeActions.filter((a) => a.kind === 'quickfix').length > 0 && (
                    <div>
                      <div className="flex items-center gap-1 px-1 mb-0.5">
                        <Zap size={9} className="text-[#ffa657]/60" />
                        <span className="text-[9px] text-[#ffa657] font-mono uppercase">Quick Fix</span>
                      </div>
                      {codeActions
                        .filter((a) => a.kind === 'quickfix')
                        .map((action) => (
                          <button
                            key={action.id}
                            onClick={() => handleApplyCodeAction(action)}
                            className="w-full flex items-center gap-2 px-2 py-1.5 hover:bg-[rgba(0,212,170,0.04)] transition-colors rounded text-left cursor-pointer group"
                          >
                            <Lightbulb size={10} className="text-[#ffa657]/40 group-hover:text-[#ffa657] shrink-0" />
                            <div className="flex-1 min-w-0">
                              <span className="text-[11px] text-[#e6edf3] font-mono group-hover:text-[#00d4aa] transition-colors">
                                {action.title}
                              </span>
                              {action.diagnostic && (
                                <span className="text-[9px] text-[#30363d] ml-1.5">
                                  L{action.diagnostic.line}
                                </span>
                              )}
                            </div>
                            {action.isPreferred && (
                              <span className="text-[8px] text-[#00d4aa]/60 font-mono shrink-0">PREFERRED</span>
                            )}
                          </button>
                        ))}
                    </div>
                  )}

                  {/* Refactor Actions */}
                  {codeActions.filter((a) => a.kind.startsWith('refactor')).length > 0 && (
                    <div>
                      <div className="flex items-center gap-1 px-1 mb-0.5 mt-1">
                        <Wrench size={9} className="text-[#79c0ff]/60" />
                        <span className="text-[9px] text-[#79c0ff] font-mono uppercase">Refactor</span>
                      </div>
                      {codeActions
                        .filter((a) => a.kind.startsWith('refactor'))
                        .map((action) => (
                          <button
                            key={action.id}
                            onClick={() => handleApplyCodeAction(action)}
                            className="w-full flex items-center gap-2 px-2 py-1.5 hover:bg-[rgba(0,212,170,0.04)] transition-colors rounded text-left cursor-pointer group"
                          >
                            <Wrench size={10} className="text-[#79c0ff]/40 group-hover:text-[#79c0ff] shrink-0" />
                            <span className="text-[11px] text-[#e6edf3] font-mono group-hover:text-[#00d4aa] transition-colors">
                              {action.title}
                            </span>
                          </button>
                        ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="px-3 py-1.5 border-t border-[rgba(0,212,170,0.08)] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Circle
            size={6}
            className={lspConnected ? 'text-[#00d4aa] fill-[#00d4aa]' : 'text-[#30363d]'}
          />
          <span className="text-[10px] text-[#30363d] font-mono">
            {lspConnected ? `${runningServers} server${runningServers !== 1 ? 's' : ''} active` : 'No servers active'}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          {severityCounts.error > 0 && (
            <span className="text-[9px] font-mono text-[#f85149]">{severityCounts.error}E</span>
          )}
          {severityCounts.warning > 0 && (
            <span className="text-[9px] font-mono text-[#ffa657]">{severityCounts.warning}W</span>
          )}
          {severityCounts.info > 0 && (
            <span className="text-[9px] font-mono text-[#79c0ff]">{severityCounts.info}I</span>
          )}
        </div>
      </div>
    </div>
  )
}
