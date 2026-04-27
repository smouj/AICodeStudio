'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  Search, Download, Trash2, Check, RefreshCw, Blocks, Star,
  ChevronLeft, ExternalLink, X, Power, PowerOff, Tag,
  Clock, Package, FileText, ArrowUpDown, Loader2
} from 'lucide-react'
import { useIDEStore } from '@/store/ide-store'
import type { RegistryExtension, InstalledExtension } from '@/store/ide-store'

// ─── Category definitions with colors ───────────────────────

const CATEGORIES = [
  { id: '', label: 'All', color: '#e6edf3' },
  { id: 'Programming Languages', label: 'Languages', color: '#7ee787' },
  { id: 'Snippets', label: 'Snippets', color: '#ffa657' },
  { id: 'Linters', label: 'Linters', color: '#f85149' },
  { id: 'Themes', label: 'Themes', color: '#f778ba' },
  { id: 'Debuggers', label: 'Debuggers', color: '#d2a8ff' },
  { id: 'Formatters', label: 'Formatters', color: '#79c0ff' },
  { id: 'Keymaps', label: 'Keymaps', color: '#00d4aa' },
  { id: 'SCM Providers', label: 'SCM', color: '#ffa657' },
  { id: 'Data Science', label: 'Data Science', color: '#d2a8ff' },
  { id: 'Testing', label: 'Testing', color: '#7ee787' },
  { id: 'Visualization', label: 'Visualization', color: '#79c0ff' },
] as const

type TabView = 'marketplace' | 'installed'
type DetailView = RegistryExtension & {
  readme?: string
  changelog?: string
  versions?: string[]
  dependencies?: string[]
  repository?: string | null
  license?: string | null
}

// ─── Helpers ────────────────────────────────────────────────

function formatDownloadCount(count: number): string {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}K`
  return String(count)
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '—'
  try {
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
  } catch {
    return dateStr
  }
}

// ─── Sub-Components ─────────────────────────────────────────

function ExtensionIcon({ url, name }: { url?: string | null; name: string }) {
  const [error, setError] = useState(false)
  if (url && !error) {
    return (
      <img
        src={url}
        alt={`${name} icon`}
        className="w-8 h-8 rounded"
        onError={() => setError(true)}
      />
    )
  }
  return (
    <div className="w-8 h-8 rounded bg-[rgba(0,212,170,0.06)] flex items-center justify-center shrink-0">
      <Blocks size={16} className="text-[#00d4aa]/50" />
    </div>
  )
}

function RatingStars({ rating }: { rating: number }) {
  if (!rating || rating <= 0) return <span className="text-[10px] text-[#30363d] font-mono">No rating</span>
  const full = Math.floor(rating)
  const half = rating - full >= 0.5
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          size={9}
          className={i < full ? 'text-[#ffa657] fill-[#ffa657]' : i === full && half ? 'text-[#ffa657] fill-[#ffa657]/50' : 'text-[#30363d]'}
        />
      ))}
      <span className="text-[9px] text-[#484f58] font-mono ml-0.5">{rating.toFixed(1)}</span>
    </div>
  )
}

function CategoryTag({ category }: { category: string }) {
  const match = CATEGORIES.find((c) => c.id === category)
  const color = match?.color || '#484f58'
  return (
    <span
      className="text-[8px] font-mono uppercase px-1.5 py-0.5 rounded-full border"
      style={{ color, borderColor: `${color}33`, backgroundColor: `${color}11` }}
    >
      {match?.label || category}
    </span>
  )
}

// ─── Extension Card ─────────────────────────────────────────

function ExtensionCard({
  ext,
  isInstalled,
  isInstalling,
  onInstall,
  onUninstall,
  onClick,
}: {
  ext: RegistryExtension
  isInstalled: boolean
  isInstalling: boolean
  onInstall: () => void
  onUninstall: () => void
  onClick: () => void
}) {
  return (
    <div
      className="px-2 py-2.5 hover:bg-[rgba(0,212,170,0.04)] cursor-pointer transition-colors rounded mb-0.5 group"
      onClick={onClick}
    >
      <div className="flex items-start gap-2.5">
        <ExtensionIcon url={ext.iconUrl} name={ext.name} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[12px] text-[#e6edf3] font-mono truncate">
              {ext.name}
            </span>
            {isInstalled ? (
              <div className="flex items-center gap-1 shrink-0">
                <span className="text-[9px] text-[#00d4aa] font-mono">INSTALLED</span>
                <button
                  onClick={(e) => { e.stopPropagation(); onUninstall() }}
                  className="text-[#30363d] hover:text-[#f85149] cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Uninstall"
                >
                  <Trash2 size={10} />
                </button>
              </div>
            ) : (
              <button
                onClick={(e) => { e.stopPropagation(); onInstall() }}
                disabled={isInstalling}
                className="p-1 text-[#00d4aa]/60 hover:text-[#00d4aa] hover:bg-[rgba(0,212,170,0.08)] rounded cursor-pointer disabled:cursor-wait shrink-0 transition-colors"
                title="Install"
              >
                {isInstalling ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />}
              </button>
            )}
          </div>
          <div className="text-[10px] text-[#30363d] font-mono truncate">
            {ext.namespace} · v{ext.version}
          </div>
          <div className="text-[11px] text-[#484f58] mt-0.5 line-clamp-2">
            {ext.description}
          </div>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <div className="flex items-center gap-1">
              <Download size={9} className="text-[#30363d]" />
              <span className="text-[9px] text-[#30363d] font-mono">{formatDownloadCount(ext.downloadCount)}</span>
            </div>
            <RatingStars rating={ext.rating} />
            {ext.categories.slice(0, 2).map((cat) => (
              <CategoryTag key={cat} category={cat} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Installed Extension Row ────────────────────────────────

function InstalledExtensionRow({
  ext,
  registryExt,
  onUninstall,
  onToggle,
  onClick,
}: {
  ext: InstalledExtension
  registryExt?: RegistryExtension
  onUninstall: () => void
  onToggle: () => void
  onClick: () => void
}) {
  return (
    <div
      className="px-2 py-2.5 hover:bg-[rgba(0,212,170,0.04)] cursor-pointer transition-colors rounded mb-0.5 group"
      onClick={onClick}
    >
      <div className="flex items-start gap-2.5">
        <ExtensionIcon url={registryExt?.iconUrl} name={ext.name} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[12px] text-[#e6edf3] font-mono truncate">{ext.name}</span>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={(e) => { e.stopPropagation(); onToggle() }}
                className={`p-0.5 cursor-pointer transition-colors ${ext.enabled ? 'text-[#00d4aa]/60 hover:text-[#00d4aa]' : 'text-[#30363d] hover:text-[#484f58]'}`}
                title={ext.enabled ? 'Disable' : 'Enable'}
              >
                {ext.enabled ? <Power size={11} /> : <PowerOff size={11} />}
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onUninstall() }}
                className="p-0.5 text-[#30363d] hover:text-[#f85149] cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
                title="Uninstall"
              >
                <Trash2 size={11} />
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[10px] text-[#30363d] font-mono">v{ext.version}</span>
            <span className={`text-[9px] font-mono uppercase ${ext.enabled ? 'text-[#00d4aa]' : 'text-[#484f58]'}`}>
              {ext.enabled ? 'ENABLED' : 'DISABLED'}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Extension Detail View ──────────────────────────────────

function ExtensionDetailView({
  ext,
  isInstalled,
  isInstalling,
  installProgress,
  onInstall,
  onUninstall,
  onBack,
}: {
  ext: DetailView
  isInstalled: boolean
  isInstalling: boolean
  installProgress: number
  onInstall: () => void
  onUninstall: () => void
  onBack: () => void
}) {
  const [activeTab, setActiveTab] = useState<'details' | 'readme' | 'changelog' | 'versions'>('details')

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-3 py-2 border-b border-[rgba(0,212,170,0.08)]">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-[11px] text-[#484f58] hover:text-[#e6edf3] cursor-pointer transition-colors mb-2"
        >
          <ChevronLeft size={12} />
          Back
        </button>
        <div className="flex items-start gap-3">
          <ExtensionIcon url={ext.iconUrl} name={ext.name} />
          <div className="flex-1 min-w-0">
            <h2 className="text-[13px] text-[#e6edf3] font-mono font-semibold">{ext.name}</h2>
            <div className="text-[10px] text-[#484f58] font-mono mt-0.5">
              {ext.namespace} · v{ext.version}
            </div>
            <div className="flex items-center gap-3 mt-1.5">
              <div className="flex items-center gap-1">
                <Download size={10} className="text-[#30363d]" />
                <span className="text-[10px] text-[#484f58] font-mono">{formatDownloadCount(ext.downloadCount)} downloads</span>
              </div>
              <RatingStars rating={ext.rating} />
            </div>
            <div className="flex items-center gap-2 mt-2">
              {isInstalled ? (
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1 text-[10px] text-[#00d4aa] font-mono bg-[rgba(0,212,170,0.08)] px-2 py-0.5 rounded">
                    <Check size={10} />
                    Installed
                  </span>
                  <button
                    onClick={onUninstall}
                    className="text-[10px] text-[#f85149] hover:text-[#f85149]/80 font-mono cursor-pointer transition-colors"
                  >
                    Uninstall
                  </button>
                </div>
              ) : (
                <button
                  onClick={onInstall}
                  disabled={isInstalling}
                  className="flex items-center gap-1.5 text-[10px] text-[#080c12] bg-[#00d4aa] hover:bg-[#00d4aa]/90 font-mono font-semibold px-3 py-1 rounded cursor-pointer disabled:opacity-60 disabled:cursor-wait transition-colors"
                >
                  {isInstalling ? (
                    <>
                      <Loader2 size={10} className="animate-spin" />
                      Installing... {installProgress}%
                    </>
                  ) : (
                    <>
                      <Download size={10} />
                      Install
                    </>
                  )}
                </button>
              )}
              {ext.repository && (
                <a
                  href={ext.repository}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-[10px] text-[#484f58] hover:text-[#79c0ff] font-mono cursor-pointer transition-colors"
                >
                  <ExternalLink size={9} />
                  Repository
                </a>
              )}
            </div>
            {/* Progress bar */}
            {isInstalling && (
              <div className="mt-2 h-1 bg-[#161b22] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#00d4aa] rounded-full transition-all duration-300"
                  style={{ width: `${installProgress}%` }}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex items-center gap-0 px-3 border-b border-[rgba(0,212,170,0.08)]">
        {(['details', 'readme', 'changelog', 'versions'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider cursor-pointer transition-colors border-b-2 ${
              activeTab === tab
                ? 'text-[#00d4aa] border-[#00d4aa]'
                : 'text-[#30363d] border-transparent hover:text-[#484f58]'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto px-3 py-3 custom-scrollbar">
        {activeTab === 'details' && (
          <div className="space-y-4">
            {/* Description */}
            <div>
              <h3 className="text-[10px] font-semibold uppercase tracking-wider text-[#30363d] mb-1.5">Description</h3>
              <p className="text-[11px] text-[#8b949e] leading-relaxed font-mono">
                {ext.description || 'No description available.'}
              </p>
            </div>

            {/* Info grid */}
            <div className="grid grid-cols-2 gap-2">
              <InfoItem icon={<Clock size={10} />} label="Published" value={formatDate(ext.publishedDate)} />
              <InfoItem icon={<RefreshCw size={10} />} label="Updated" value={formatDate(ext.lastUpdated)} />
              <InfoItem icon={<Package size={10} />} label="Version" value={ext.version} />
              <InfoItem icon={<FileText size={10} />} label="License" value={ext.license || 'Unknown'} />
            </div>

            {/* Categories */}
            {ext.categories.length > 0 && (
              <div>
                <h3 className="text-[10px] font-semibold uppercase tracking-wider text-[#30363d] mb-1.5">Categories</h3>
                <div className="flex flex-wrap gap-1">
                  {ext.categories.map((cat) => (
                    <CategoryTag key={cat} category={cat} />
                  ))}
                </div>
              </div>
            )}

            {/* Tags */}
            {ext.tags.length > 0 && (
              <div>
                <h3 className="text-[10px] font-semibold uppercase tracking-wider text-[#30363d] mb-1.5">Tags</h3>
                <div className="flex flex-wrap gap-1">
                  {ext.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-[9px] font-mono text-[#484f58] bg-[rgba(0,212,170,0.04)] px-1.5 py-0.5 rounded flex items-center gap-0.5"
                    >
                      <Tag size={7} />
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Dependencies */}
            {ext.dependencies && ext.dependencies.length > 0 && (
              <div>
                <h3 className="text-[10px] font-semibold uppercase tracking-wider text-[#30363d] mb-1.5">Dependencies</h3>
                <div className="space-y-0.5">
                  {ext.dependencies.map((dep) => (
                    <div key={dep} className="text-[10px] text-[#484f58] font-mono">{dep}</div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'readme' && (
          <div>
            {ext.readme ? (
              <div
                className="text-[11px] text-[#8b949e] leading-relaxed font-mono prose-invert max-w-none [&_h1]:text-[14px] [&_h1]:text-[#e6edf3] [&_h1]:font-semibold [&_h1]:mb-2 [&_h1]:mt-4 [&_h2]:text-[12px] [&_h2]:text-[#e6edf3] [&_h2]:font-semibold [&_h2]:mb-1.5 [&_h2]:mt-3 [&_h3]:text-[11px] [&_h3]:text-[#e6edf3] [&_h3]:font-semibold [&_h3]:mb-1 [&_h3]:mt-2 [&_code]:text-[#00d4aa] [&_code]:bg-[rgba(0,212,170,0.06)] [&_code]:px-1 [&_code]:rounded [&_pre]:bg-[#0d1117] [&_pre]:p-3 [&_pre]:rounded [&_pre]:overflow-x-auto [&_a]:text-[#79c0ff] [&_a]:underline [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4"
                dangerouslySetInnerHTML={{ __html: ext.readme }}
              />
            ) : (
              <div className="text-center py-8">
                <FileText size={20} className="mx-auto mb-2 text-[#30363d]/40" />
                <p className="text-[11px] text-[#30363d] font-mono">No README available</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'changelog' && (
          <div>
            {ext.changelog ? (
              <div
                className="text-[11px] text-[#8b949e] leading-relaxed font-mono"
                dangerouslySetInnerHTML={{ __html: ext.changelog }}
              />
            ) : (
              <div className="text-center py-8">
                <FileText size={20} className="mx-auto mb-2 text-[#30363d]/40" />
                <p className="text-[11px] text-[#30363d] font-mono">No changelog available</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'versions' && (
          <div>
            {ext.versions && ext.versions.length > 0 ? (
              <div className="space-y-1">
                {ext.versions.map((ver, i) => (
                  <div
                    key={ver}
                    className={`flex items-center justify-between px-2 py-1.5 rounded text-[10px] font-mono ${
                      ver === ext.version ? 'bg-[rgba(0,212,170,0.06)] text-[#00d4aa]' : 'text-[#484f58]'
                    }`}
                  >
                    <span className="flex items-center gap-1.5">
                      <Package size={9} />
                      v{ver}
                    </span>
                    {ver === ext.version && (
                      <span className="text-[8px] uppercase tracking-wider">Latest</span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Package size={20} className="mx-auto mb-2 text-[#30363d]/40" />
                <p className="text-[11px] text-[#30363d] font-mono">No version history available</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function InfoItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[#30363d]">{icon}</span>
      <div>
        <div className="text-[8px] text-[#30363d] font-mono uppercase tracking-wider">{label}</div>
        <div className="text-[10px] text-[#8b949e] font-mono">{value}</div>
      </div>
    </div>
  )
}

// ─── Main Component ─────────────────────────────────────────

export function ExtensionsMarketplace() {
  const extensionRegistry = useIDEStore((s) => s.extensionRegistry)
  const installedExtensions = useIDEStore((s) => s.installedExtensions)
  const extensionLoading = useIDEStore((s) => s.extensionLoading)
  const searchExtensions = useIDEStore((s) => s.searchExtensions)
  const installExtension = useIDEStore((s) => s.installExtension)
  const uninstallExtension = useIDEStore((s) => s.uninstallExtension)
  const fetchPopularExtensions = useIDEStore((s) => s.fetchPopularExtensions)
  const addNotification = useIDEStore((s) => s.addNotification)

  const [tabView, setTabView] = useState<TabView>('marketplace')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [installingId, setInstallingId] = useState<string | null>(null)
  const [installProgress, setInstallProgress] = useState(0)
  const [detailExt, setDetailExt] = useState<DetailView | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const initialFetchRef = useRef(false)

  // Fetch popular extensions on mount
  useEffect(() => {
    if (!initialFetchRef.current) {
      initialFetchRef.current = true
      fetchPopularExtensions()
    }
  }, [fetchPopularExtensions])

  // Debounced search
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      if (query.trim()) {
        searchExtensions(query)
      } else {
        fetchPopularExtensions()
      }
    }, 400)
  }, [searchExtensions, fetchPopularExtensions])

  // Category filter search
  const handleCategorySelect = useCallback((category: string) => {
    setSelectedCategory(category)
    setDetailExt(null)
    if (category) {
      // Search by category via API
      const params = new URLSearchParams({ category, size: '30', sortBy: 'downloadCount', sortOrder: 'desc' })
      fetch(`/api/extensions?${params.toString()}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.extensions) {
            useIDEStore.setState({ extensionRegistry: data.extensions })
          }
        })
        .catch(() => {
          addNotification('error', 'Failed to filter by category')
        })
    } else {
      fetchPopularExtensions()
    }
  }, [fetchPopularExtensions, addNotification])

  // Real install with progress
  const handleInstall = useCallback(async (extId: string) => {
    const ext = extensionRegistry.find((e) => e.id === extId)
    if (!ext) return

    setInstallingId(extId)
    setInstallProgress(0)

    try {
      // Simulate progress stages while the actual install happens
      const progressInterval = setInterval(() => {
        setInstallProgress((prev) => {
          if (prev >= 90) return prev
          return prev + Math.random() * 15
        })
      }, 200)

      // Store extension data in IndexedDB via the store action
      // The installExtension action handles store state
      installExtension(extId)

      // Also persist the extension package metadata to localStorage
      const storageKey = `aicodestudio-ext-${extId}`
      const packageData = {
        id: ext.id,
        name: ext.name,
        namespace: ext.namespace,
        version: ext.version,
        description: ext.description,
        iconUrl: ext.iconUrl,
        installedAt: Date.now(),
      }
      localStorage.setItem(storageKey, JSON.stringify(packageData))

      clearInterval(progressInterval)
      setInstallProgress(100)

      // Brief delay to show 100%
      setTimeout(() => {
        setInstallingId(null)
        setInstallProgress(0)
      }, 500)
    } catch {
      addNotification('error', `Failed to install ${ext.name}`)
      setInstallingId(null)
      setInstallProgress(0)
    }
  }, [extensionRegistry, installExtension, addNotification])

  // Uninstall with cleanup
  const handleUninstall = useCallback((installId: string) => {
    const ext = installedExtensions.find((e) => e.id === installId)
    if (ext) {
      // Clean up localStorage
      localStorage.removeItem(`aicodestudio-ext-${ext.registryId}`)
    }
    uninstallExtension(installId)
    setDetailExt(null)
  }, [installedExtensions, uninstallExtension])

  // Toggle enable/disable
  const handleToggleExtension = useCallback((installId: string) => {
    const ext = installedExtensions.find((e) => e.id === installId)
    if (!ext) return
    useIDEStore.setState((state) => ({
      installedExtensions: state.installedExtensions.map((e) =>
        e.id === installId ? { ...e, enabled: !e.enabled } : e
      ),
    }))
  }, [installedExtensions])

  // Fetch extension detail
  const handleShowDetail = useCallback(async (ext: RegistryExtension) => {
    setDetailLoading(true)
    setDetailExt({
      ...ext,
      readme: undefined,
      changelog: undefined,
      versions: undefined,
      dependencies: undefined,
      repository: ext.repository ?? undefined,
      license: ext.license ?? undefined,
    })

    try {
      const res = await fetch('/api/extensions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'detail', namespace: ext.namespace, name: ext.name }),
      })

      if (res.ok) {
        const data = await res.json()
        const detail = data.extension
        setDetailExt((prev) => prev ? {
          ...prev,
          versions: detail.versions || [],
          repository: detail.repository || null,
          license: detail.license || null,
        } : null)

        // Fetch README if available
        if (detail.iconUrl || detail.namespace) {
          // Try to fetch README from the extension's files
          try {
            const readmeUrl = `https://open-vsx.org/api/${encodeURIComponent(ext.namespace)}/${encodeURIComponent(ext.name)}/${encodeURIComponent(ext.version)}/file/README.md`
            const readmeRes = await fetch(readmeUrl)
            if (readmeRes.ok) {
              const readmeText = await readmeRes.text()
              // Simple markdown-to-HTML: convert line breaks, headers, code blocks
              const htmlReadme = simpleMarkdownToHtml(readmeText)
              setDetailExt((prev) => prev ? { ...prev, readme: htmlReadme } : null)
            }
          } catch {
            // README fetch is non-critical
          }

          // Try to fetch CHANGELOG
          try {
            const changelogUrl = `https://open-vsx.org/api/${encodeURIComponent(ext.namespace)}/${encodeURIComponent(ext.name)}/${encodeURIComponent(ext.version)}/file/CHANGELOG.md`
            const changelogRes = await fetch(changelogUrl)
            if (changelogRes.ok) {
              const changelogText = await changelogRes.text()
              const htmlChangelog = simpleMarkdownToHtml(changelogText)
              setDetailExt((prev) => prev ? { ...prev, changelog: htmlChangelog } : null)
            }
          } catch {
            // Changelog fetch is non-critical
          }
        }
      }
    } catch {
      // Detail fetch failed, but we still show basic info
    } finally {
      setDetailLoading(false)
    }
  }, [])

  // Show installed extension detail
  const handleShowInstalledDetail = useCallback((installed: InstalledExtension) => {
    const registryExt = extensionRegistry.find((e) => e.id === installed.registryId)
    if (registryExt) {
      handleShowDetail(registryExt)
    }
  }, [extensionRegistry, handleShowDetail])

  const installedCount = installedExtensions.length

  // If detail view is active, render it
  if (detailExt) {
    const isInstalled = installedExtensions.some((e) => e.registryId === detailExt.id)
    return (
      <div className="h-full flex flex-col">
        <ExtensionDetailView
          ext={detailExt}
          isInstalled={isInstalled}
          isInstalling={installingId === detailExt.id}
          installProgress={installProgress}
          onInstall={() => handleInstall(detailExt.id)}
          onUninstall={() => {
            const installed = installedExtensions.find((e) => e.registryId === detailExt.id)
            if (installed) handleUninstall(installed.id)
          }}
          onBack={() => setDetailExt(null)}
        />
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-[#30363d] border-b border-[rgba(0,212,170,0.08)]">
        <span>Extensions</span>
        <span className="text-[10px] text-[#30363d] font-mono">{installedCount} installed</span>
      </div>

      {/* Search */}
      <div className="p-3">
        <div className="flex items-center gap-2 bg-[#0d1117] border border-[rgba(0,212,170,0.08)] rounded px-3 py-1.5 focus-within:border-[rgba(0,212,170,0.25)] transition-colors">
          <Search size={14} className="text-[#30363d] shrink-0" />
          <input
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search extensions in marketplace..."
            className="flex-1 bg-transparent text-[12px] text-[#e6edf3] placeholder-[#30363d] outline-none font-mono"
          />
          {searchQuery && (
            <button
              onClick={() => handleSearch('')}
              className="text-[#30363d] hover:text-[#484f58] cursor-pointer transition-colors"
            >
              <X size={12} />
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="px-3 pb-2 flex items-center gap-2 text-[10px]">
        <button
          onClick={() => { setTabView('marketplace'); setDetailExt(null) }}
          className={`px-2 py-0.5 rounded font-mono cursor-pointer transition-colors ${tabView === 'marketplace' ? 'bg-[rgba(0,212,170,0.12)] text-[#00d4aa]' : 'text-[#30363d] hover:text-[#484f58]'}`}
        >
          Marketplace
        </button>
        <button
          onClick={() => { setTabView('installed'); setDetailExt(null) }}
          className={`px-2 py-0.5 rounded font-mono cursor-pointer transition-colors ${tabView === 'installed' ? 'bg-[rgba(0,212,170,0.12)] text-[#00d4aa]' : 'text-[#30363d] hover:text-[#484f58]'}`}
        >
          Installed ({installedCount})
        </button>
      </div>

      {/* Category filter (only in marketplace tab) */}
      {tabView === 'marketplace' && (
        <div className="px-3 pb-2">
          <div className="flex items-center gap-1 flex-wrap">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => handleCategorySelect(cat.id)}
                className={`text-[8px] font-mono uppercase px-1.5 py-0.5 rounded-full border cursor-pointer transition-colors ${
                  selectedCategory === cat.id
                    ? 'border-[rgba(0,212,170,0.25)] bg-[rgba(0,212,170,0.08)] text-[#00d4aa]'
                    : 'border-[rgba(0,212,170,0.06)] text-[#30363d] hover:text-[#484f58] hover:border-[rgba(0,212,170,0.12)]'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-2 custom-scrollbar">
        {/* Loading state */}
        {extensionLoading && (
          <div className="flex flex-col items-center justify-center py-8">
            <Loader2 size={20} className="text-[#00d4aa] animate-spin mb-2" />
            <p className="text-[11px] text-[#30363d] font-mono">
              {searchQuery ? 'Searching...' : 'Loading extensions...'}
            </p>
          </div>
        )}

        {/* Marketplace tab */}
        {!extensionLoading && tabView === 'marketplace' && (
          <>
            {extensionRegistry.length === 0 && (
              <div className="text-center py-8">
                <Blocks size={24} className="mx-auto mb-2 text-[#30363d]/40" />
                <p className="text-[12px] text-[#30363d] font-mono">
                  {searchQuery ? 'No extensions found' : 'No extensions available'}
                </p>
                {!searchQuery && (
                  <button
                    onClick={() => fetchPopularExtensions()}
                    className="mt-2 text-[10px] text-[#00d4aa] hover:text-[#00d4aa]/80 font-mono cursor-pointer transition-colors"
                  >
                    Retry loading
                  </button>
                )}
              </div>
            )}
            {extensionRegistry.map((ext) => {
              const isInstalled = installedExtensions.some((e) => e.registryId === ext.id)
              return (
                <ExtensionCard
                  key={ext.id}
                  ext={ext}
                  isInstalled={isInstalled}
                  isInstalling={installingId === ext.id}
                  onInstall={() => handleInstall(ext.id)}
                  onUninstall={() => {
                    const installed = installedExtensions.find((e) => e.registryId === ext.id)
                    if (installed) handleUninstall(installed.id)
                  }}
                  onClick={() => handleShowDetail(ext)}
                />
              )
            })}
          </>
        )}

        {/* Installed tab */}
        {!extensionLoading && tabView === 'installed' && (
          <>
            {installedExtensions.length === 0 && (
              <div className="text-center py-8">
                <Blocks size={24} className="mx-auto mb-2 text-[#30363d]/40" />
                <p className="text-[12px] text-[#30363d] font-mono">No extensions installed</p>
                <button
                  onClick={() => setTabView('marketplace')}
                  className="mt-2 text-[10px] text-[#00d4aa] hover:text-[#00d4aa]/80 font-mono cursor-pointer transition-colors"
                >
                  Browse marketplace
                </button>
              </div>
            )}
            {installedExtensions.map((ext) => {
              const registryExt = extensionRegistry.find((e) => e.id === ext.registryId)
              return (
                <InstalledExtensionRow
                  key={ext.id}
                  ext={ext}
                  registryExt={registryExt}
                  onUninstall={() => handleUninstall(ext.id)}
                  onToggle={() => handleToggleExtension(ext.id)}
                  onClick={() => handleShowInstalledDetail(ext)}
                />
              )
            })}
          </>
        )}
      </div>

      {/* Footer with refresh */}
      <div className="px-3 py-1.5 border-t border-[rgba(0,212,170,0.08)] flex items-center justify-between">
        <span className="text-[9px] text-[#30363d] font-mono">
          Powered by Open VSX Registry
        </span>
        <button
          onClick={() => {
            if (searchQuery) {
              searchExtensions(searchQuery)
            } else {
              fetchPopularExtensions()
            }
          }}
          disabled={extensionLoading}
          className="text-[#30363d] hover:text-[#00d4aa] cursor-pointer transition-colors disabled:animate-spin disabled:cursor-wait"
          title="Refresh"
        >
          <RefreshCw size={11} />
        </button>
      </div>
    </div>
  )
}

// ─── Simple Markdown → HTML converter ───────────────────────
// Lightweight conversion for README/CHANGELOG rendering

function simpleMarkdownToHtml(md: string): string {
  let html = md
    // Escape HTML entities first
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  // Code blocks (``` ... ```)
  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_match, _lang, code) => {
    return `<pre><code>${code.trim()}</code></pre>`
  })

  // Inline code
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>')

  // Headers
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>')
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>')
  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>')

  // Bold & italic
  html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>')

  // Links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')

  // Unordered lists
  html = html.replace(/^[*-] (.+)$/gm, '<li>$1</li>')
  html = html.replace(/(<li>.*<\/li>\n?)+/g, (match) => `<ul>${match}</ul>`)

  // Ordered lists
  html = html.replace(/^\d+\. (.+)$/gm, '<li>$1</li>')

  // Paragraphs (double newlines)
  html = html.replace(/\n\n/g, '</p><p>')

  // Single newlines → <br/>
  html = html.replace(/\n/g, '<br/>')

  // Wrap in paragraph
  html = `<p>${html}</p>`

  // Clean up empty paragraphs
  html = html.replace(/<p>\s*<\/p>/g, '')

  return html
}
