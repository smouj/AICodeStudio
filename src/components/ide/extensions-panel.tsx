'use client'

import { useState } from 'react'
import { Blocks, Search, Download, Trash2, Check, RefreshCw } from 'lucide-react'
import { useIDEStore } from '@/store/ide-store'

interface Extension {
  id: string
  name: string
  publisher: string
  desc: string
  installed: boolean
  version: string
  category: 'ai' | 'git' | 'editor' | 'devops' | 'theme' | 'language'
}

// Real extension definitions — installable/uninstallable with state tracking
const AVAILABLE_EXTENSIONS: Omit<Extension, 'installed'>[] = [
  { id: 'ai-completion', name: 'AI Code Completion', publisher: 'AICodeStudio', desc: 'AI-powered inline code suggestions and autocompletion', version: '2.1.0', category: 'ai' },
  { id: 'ai-review', name: 'AI Code Review', publisher: 'AICodeStudio', desc: 'Automated code review with security and quality analysis', version: '1.3.0', category: 'ai' },
  { id: 'git-enhanced', name: 'Git Enhanced', publisher: 'Community', desc: 'Advanced Git integration with blame, history, and graph view', version: '3.2.1', category: 'git' },
  { id: 'terminal-pro', name: 'Terminal Pro', publisher: 'AICodeStudio', desc: 'Split terminals, SSH support, and custom shell profiles', version: '1.5.0', category: 'editor' },
  { id: 'docker-explorer', name: 'Docker Explorer', publisher: 'DevOps', desc: 'Manage Docker containers, images, and compose files', version: '1.8.2', category: 'devops' },
  { id: 'rest-client', name: 'REST Client', publisher: 'API Tools', desc: 'Send HTTP requests and view responses directly in the editor', version: '2.0.1', category: 'devops' },
  { id: 'theme-designer', name: 'Theme Designer', publisher: 'Community', desc: 'Create and customize editor color themes visually', version: '1.1.0', category: 'theme' },
  { id: 'python-support', name: 'Python Support', publisher: 'Languages', desc: 'Python linting, formatting, and debugging support', version: '4.0.0', category: 'language' },
  { id: 'rust-analyzer', name: 'Rust Analyzer', publisher: 'Languages', desc: 'Rust language server integration with Cargo support', version: '2.3.0', category: 'language' },
  { id: 'go-tools', name: 'Go Tools', publisher: 'Languages', desc: 'Go language support with gofmt, gopls, and debugging', version: '1.7.0', category: 'language' },
]

const CATEGORY_COLORS: Record<Extension['category'], string> = {
  ai: 'text-[#d2a8ff]',
  git: 'text-[#ffa657]',
  editor: 'text-[#00d4aa]',
  devops: 'text-[#79c0ff]',
  theme: 'text-[#f778ba]',
  language: 'text-[#7ee787]',
}

export function ExtensionsPanel() {
  const addNotification = useIDEStore((s) => s.addNotification)
  const addOutputEntry = useIDEStore((s) => s.addOutputEntry)

  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState<'all' | 'installed' | 'popular'>('all')
  const [extensions, setExtensions] = useState<Extension[]>(
    AVAILABLE_EXTENSIONS.map((e) => ({ ...e, installed: false }))
  )
  const [installingId, setInstallingId] = useState<string | null>(null)

  const filteredExtensions = extensions.filter((ext) => {
    if (activeFilter === 'installed') return ext.installed
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      return ext.name.toLowerCase().includes(q) || ext.publisher.toLowerCase().includes(q) || ext.desc.toLowerCase().includes(q)
    }
    return true
  })

  const installedCount = extensions.filter((e) => e.installed).length

  const handleInstall = (extId: string) => {
    const ext = extensions.find((e) => e.id === extId)
    if (!ext || ext.installed) return

    setInstallingId(extId)
    addOutputEntry('Extensions', `Installing ${ext.name}...`)

    // Simulate install process with state change
    setTimeout(() => {
      setExtensions((prev) =>
        prev.map((e) => e.id === extId ? { ...e, installed: true } : e)
      )
      addNotification('success', `${ext.name} v${ext.version} installed successfully.`)
      addOutputEntry('Extensions', `${ext.name} installed and activated.`)
      setInstallingId(null)
    }, 800)
  }

  const handleUninstall = (extId: string) => {
    const ext = extensions.find((e) => e.id === extId)
    if (!ext || !ext.installed) return

    setExtensions((prev) =>
      prev.map((e) => e.id === extId ? { ...e, installed: false } : e)
    )
    addNotification('info', `${ext.name} uninstalled.`)
    addOutputEntry('Extensions', `${ext.name} uninstalled.`)
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-[#30363d] border-b border-[rgba(0,212,170,0.08)]">
        <span>Extensions</span>
        <span className="text-[10px] text-[#30363d] font-mono">{installedCount} installed</span>
      </div>
      <div className="p-3">
        <div className="flex items-center gap-2 bg-[#0d1117] border border-[rgba(0,212,170,0.08)] rounded px-3 py-1.5 focus-within:border-[rgba(0,212,170,0.25)] transition-colors">
          <Search size={14} className="text-[#30363d] shrink-0" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search extensions..."
            className="flex-1 bg-transparent text-[12px] text-[#e6edf3] placeholder-[#30363d] outline-none font-mono"
          />
        </div>
      </div>
      <div className="px-3 pb-2 flex items-center gap-2 text-[10px]">
        <button
          onClick={() => setActiveFilter('all')}
          className={`px-2 py-0.5 rounded font-mono cursor-pointer transition-colors ${activeFilter === 'all' ? 'bg-[rgba(0,212,170,0.12)] text-[#00d4aa]' : 'text-[#30363d] hover:text-[#484f58]'}`}
        >
          All
        </button>
        <button
          onClick={() => setActiveFilter('installed')}
          className={`px-2 py-0.5 rounded font-mono cursor-pointer transition-colors ${activeFilter === 'installed' ? 'bg-[rgba(0,212,170,0.12)] text-[#00d4aa]' : 'text-[#30363d] hover:text-[#484f58]'}`}
        >
          Installed ({installedCount})
        </button>
        <button
          onClick={() => setActiveFilter('popular')}
          className={`px-2 py-0.5 rounded font-mono cursor-pointer transition-colors ${activeFilter === 'popular' ? 'bg-[rgba(0,212,170,0.12)] text-[#00d4aa]' : 'text-[#30363d] hover:text-[#484f58]'}`}
        >
          Popular
        </button>
      </div>
      <div className="flex-1 overflow-y-auto px-2 custom-scrollbar">
        {filteredExtensions.length === 0 && (
          <div className="text-center py-8 text-[12px] text-[#30363d] font-mono">
            <Blocks size={24} className="mx-auto mb-2 text-[#30363d]/40" />
            <p>{activeFilter === 'installed' ? 'No extensions installed' : 'No matching extensions'}</p>
          </div>
        )}
        {filteredExtensions.map((ext) => (
          <div
            key={ext.id}
            className="px-2 py-2 hover:bg-[rgba(0,212,170,0.04)] cursor-pointer transition-colors rounded mb-0.5"
          >
            <div className="flex items-start gap-2">
              <div className="w-8 h-8 rounded bg-[rgba(0,212,170,0.06)] flex items-center justify-center shrink-0">
                <Blocks size={16} className="text-[#00d4aa]/50" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-[12px] text-[#e6edf3] font-mono">{ext.name}</span>
                  {ext.installed ? (
                    <div className="flex items-center gap-1">
                      <span className="text-[9px] text-[#00d4aa] font-mono">INSTALLED</span>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleUninstall(ext.id) }}
                        className="text-[#30363d] hover:text-[#f85149] cursor-pointer"
                        title="Uninstall"
                      >
                        <Trash2 size={10} />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleInstall(ext.id) }}
                      disabled={installingId === ext.id}
                      className="p-1 text-[#00d4aa]/60 hover:text-[#00d4aa] hover:bg-[rgba(0,212,170,0.08)] rounded cursor-pointer disabled:animate-spin"
                      title="Install"
                    >
                      {installingId === ext.id ? <RefreshCw size={12} /> : <Download size={12} />}
                    </button>
                  )}
                </div>
                <div className="text-[10px] text-[#30363d]">{ext.publisher} · v{ext.version}</div>
                <div className="text-[11px] text-[#484f58] mt-0.5">{ext.desc}</div>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className={`text-[9px] font-mono uppercase ${CATEGORY_COLORS[ext.category]}`}>{ext.category}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
