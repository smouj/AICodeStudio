'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Palette,
  Search,
  Check,
  Plus,
  Trash2,
  Download,
  Eye,
  X,
  Loader2,
  Star,
  Tag,
  Brush,
  ChevronDown,
  Sparkles,
  Settings,
  Code2,
} from 'lucide-react'
import { useIDEStore } from '@/store/ide-store'
import type { CustomTheme } from '@/store/ide-store'

// ─── Syntax Color Keys ──────────────────────────────────────

const SYNTAX_COLORS = [
  { key: 'syntaxKeyword', label: 'Keyword', defaultColor: '#c586c0' },
  { key: 'syntaxString', label: 'String', defaultColor: '#ce9178' },
  { key: 'syntaxNumber', label: 'Number', defaultColor: '#b5cea8' },
  { key: 'syntaxType', label: 'Type', defaultColor: '#4ec9b0' },
  { key: 'syntaxFunction', label: 'Function', defaultColor: '#dcdcaa' },
  { key: 'syntaxVariable', label: 'Variable', defaultColor: '#9cdcfe' },
  { key: 'syntaxComment', label: 'Comment', defaultColor: '#6a9955' },
] as const

// ─── Theme Preview Code Snippet ─────────────────────────────

const PREVIEW_CODE = `// TypeScript Example
import { useState } from 'react'

interface Props {
  count: number
  name: string
}

function Counter({ count, name }: Props) {
  const [value, setValue] = useState(0)
  // Increment the counter
  const increment = () => setValue(value + 1)
  return value
}`

// ─── Marketplace Sample Themes ──────────────────────────────

const SAMPLE_MARKETPLACE_THEMES: CustomTheme[] = [
  {
    id: 'market-nord',
    name: 'Nord Frost',
    colors: {
      background: '#2e3440',
      foreground: '#d8dee9',
      primary: '#88c0d0',
      primaryForeground: '#2e3440',
      secondary: '#3b4252',
      secondaryForeground: '#d8dee9',
      accent: '#a3be8c',
      accentForeground: '#2e3440',
      muted: '#434c5e',
      mutedForeground: '#d8dee9',
      border: '#4c566a',
      card: '#3b4252',
      cardForeground: '#d8dee9',
      editorBackground: '#2e3440',
      editorForeground: '#d8dee9',
      editorLineHighlight: '#3b4252',
      editorSelection: '#434c5e',
      editorCursor: '#d8dee9',
      sidebarBackground: '#2e3440',
      sidebarForeground: '#d8dee9',
      activityBarBackground: '#2e3440',
      activityBarForeground: '#d8dee9',
      terminalBackground: '#2e3440',
      terminalForeground: '#d8dee9',
      syntaxKeyword: '#81a1c1',
      syntaxString: '#a3be8c',
      syntaxNumber: '#b48ead',
      syntaxType: '#8fbcbb',
      syntaxFunction: '#88c0d0',
      syntaxVariable: '#d8dee9',
      syntaxComment: '#616e88',
    },
    author: 'Nord Team',
    version: '1.0.0',
    description: 'Arctic, north-bluish color palette',
    tags: ['dark', 'blue', 'calm'],
  },
  {
    id: 'market-dracula',
    name: 'Dracula Pro',
    colors: {
      background: '#282a36',
      foreground: '#f8f8f2',
      primary: '#bd93f9',
      primaryForeground: '#282a36',
      secondary: '#44475a',
      secondaryForeground: '#f8f8f2',
      accent: '#ff79c6',
      accentForeground: '#282a36',
      muted: '#6272a4',
      mutedForeground: '#f8f8f2',
      border: '#44475a',
      card: '#343746',
      cardForeground: '#f8f8f2',
      editorBackground: '#282a36',
      editorForeground: '#f8f8f2',
      editorLineHighlight: '#44475a',
      editorSelection: '#44475a',
      editorCursor: '#f8f8f2',
      sidebarBackground: '#21222c',
      sidebarForeground: '#f8f8f2',
      activityBarBackground: '#191a21',
      activityBarForeground: '#f8f8f2',
      terminalBackground: '#282a36',
      terminalForeground: '#f8f8f2',
      syntaxKeyword: '#ff79c6',
      syntaxString: '#f1fa8c',
      syntaxNumber: '#bd93f9',
      syntaxType: '#8be9fd',
      syntaxFunction: '#50fa7b',
      syntaxVariable: '#f8f8f2',
      syntaxComment: '#6272a4',
    },
    author: 'Dracula Theme',
    version: '2.0.0',
    description: 'Dark theme with vivid colors',
    tags: ['dark', 'purple', 'vivid'],
  },
  {
    id: 'market-github-dark',
    name: 'GitHub Dark',
    colors: {
      background: '#0d1117',
      foreground: '#e6edf3',
      primary: '#58a6ff',
      primaryForeground: '#0d1117',
      secondary: '#21262d',
      secondaryForeground: '#e6edf3',
      accent: '#f78166',
      accentForeground: '#0d1117',
      muted: '#21262d',
      mutedForeground: '#8b949e',
      border: '#30363d',
      card: '#161b22',
      cardForeground: '#e6edf3',
      editorBackground: '#0d1117',
      editorForeground: '#e6edf3',
      editorLineHighlight: '#161b22',
      editorSelection: '#264f78',
      editorCursor: '#e6edf3',
      sidebarBackground: '#0d1117',
      sidebarForeground: '#e6edf3',
      activityBarBackground: '#0d1117',
      activityBarForeground: '#e6edf3',
      terminalBackground: '#0d1117',
      terminalForeground: '#e6edf3',
      syntaxKeyword: '#ff7b72',
      syntaxString: '#a5d6ff',
      syntaxNumber: '#79c0ff',
      syntaxType: '#ffa657',
      syntaxFunction: '#d2a8ff',
      syntaxVariable: '#ffa657',
      syntaxComment: '#8b949e',
    },
    author: 'GitHub',
    version: '1.0.0',
    description: 'GitHub-inspired dark theme',
    tags: ['dark', 'blue', 'professional'],
  },
  {
    id: 'market-solarized',
    name: 'Solarized Dark',
    colors: {
      background: '#002b36',
      foreground: '#839496',
      primary: '#268bd2',
      primaryForeground: '#002b36',
      secondary: '#073642',
      secondaryForeground: '#839496',
      accent: '#b58900',
      accentForeground: '#002b36',
      muted: '#073642',
      mutedForeground: '#586e75',
      border: '#073642',
      card: '#073642',
      cardForeground: '#839496',
      editorBackground: '#002b36',
      editorForeground: '#839496',
      editorLineHighlight: '#073642',
      editorSelection: '#073642',
      editorCursor: '#839496',
      sidebarBackground: '#002b36',
      sidebarForeground: '#839496',
      activityBarBackground: '#002b36',
      activityBarForeground: '#839496',
      terminalBackground: '#002b36',
      terminalForeground: '#839496',
      syntaxKeyword: '#859900',
      syntaxString: '#2aa198',
      syntaxNumber: '#d33682',
      syntaxType: '#b58900',
      syntaxFunction: '#268bd2',
      syntaxVariable: '#839496',
      syntaxComment: '#586e75',
    },
    author: 'Ethan Schoonover',
    version: '1.0.0',
    description: 'Precision colors for machines and people',
    tags: ['dark', 'warm', 'classic'],
  },
  {
    id: 'market-monokai',
    name: 'Monokai Pro',
    colors: {
      background: '#2d2a2e',
      foreground: '#fcfcfa',
      primary: '#78dce8',
      primaryForeground: '#2d2a2e',
      secondary: '#403e41',
      secondaryForeground: '#fcfcfa',
      accent: '#ff6188',
      accentForeground: '#2d2a2e',
      muted: '#403e41',
      mutedForeground: '#939293',
      border: '#403e41',
      card: '#363337',
      cardForeground: '#fcfcfa',
      editorBackground: '#2d2a2e',
      editorForeground: '#fcfcfa',
      editorLineHighlight: '#403e41',
      editorSelection: '#403e41',
      editorCursor: '#fcfcfa',
      sidebarBackground: '#2d2a2e',
      sidebarForeground: '#fcfcfa',
      activityBarBackground: '#2d2a2e',
      activityBarForeground: '#fcfcfa',
      terminalBackground: '#2d2a2e',
      terminalForeground: '#fcfcfa',
      syntaxKeyword: '#ff6188',
      syntaxString: '#ffd866',
      syntaxNumber: '#ab9df2',
      syntaxType: '#78dce8',
      syntaxFunction: '#a9dc76',
      syntaxVariable: '#fcfcfa',
      syntaxComment: '#727072',
    },
    author: 'Monokai',
    version: '1.1.0',
    description: 'Classic vivid syntax highlighting',
    tags: ['dark', 'vivid', 'classic'],
  },
  {
    id: 'market-rose-pine',
    name: 'Rosé Pine',
    colors: {
      background: '#191724',
      foreground: '#e0def4',
      primary: '#c4a7e7',
      primaryForeground: '#191724',
      secondary: '#1f1d2e',
      secondaryForeground: '#e0def4',
      accent: '#eb6f92',
      accentForeground: '#191724',
      muted: '#26233a',
      mutedForeground: '#908caa',
      border: '#26233a',
      card: '#1f1d2e',
      cardForeground: '#e0def4',
      editorBackground: '#191724',
      editorForeground: '#e0def4',
      editorLineHighlight: '#1f1d2e',
      editorSelection: '#26233a',
      editorCursor: '#e0def4',
      sidebarBackground: '#191724',
      sidebarForeground: '#e0def4',
      activityBarBackground: '#191724',
      activityBarForeground: '#e0def4',
      terminalBackground: '#191724',
      terminalForeground: '#e0def4',
      syntaxKeyword: '#31748f',
      syntaxString: '#f6c177',
      syntaxNumber: '#ebbcba',
      syntaxType: '#9ccfd8',
      syntaxFunction: '#c4a7e7',
      syntaxVariable: '#e0def4',
      syntaxComment: '#6e6a86',
    },
    author: 'Rosé Pine',
    version: '1.0.0',
    description: 'Elegant dark theme with rose and pine',
    tags: ['dark', 'rose', 'elegant'],
  },
]

// ─── Syntax Highlighting for Preview ────────────────────────

function highlightCode(code: string, colors: Partial<CustomTheme['colors']>): React.ReactNode[] {
  const lines = code.split('\n')
  return lines.map((line, lineIdx) => {
    const tokens: React.ReactNode[] = []
    let remaining = line
    let keyIdx = 0

    // Simple token-based highlighting
    const patterns: { regex: RegExp; colorKey: string }[] = [
      { regex: /^(\/\/.*)/, colorKey: 'syntaxComment' },
      { regex: /^(import|from|export|const|function|return|interface)\b/, colorKey: 'syntaxKeyword' },
      { regex: /^(useState)\b/, colorKey: 'syntaxFunction' },
      { regex: /^(Props|number|string)\b/, colorKey: 'syntaxType' },
      { regex: /^(increment)\b/, colorKey: 'syntaxFunction' },
      { regex: /^(value|count|name)\b/, colorKey: 'syntaxVariable' },
      { regex: /^('[^']*'|"[^"]*")/, colorKey: 'syntaxString' },
      { regex: /^(\d+)/, colorKey: 'syntaxNumber' },
    ]

    while (remaining.length > 0) {
      let matched = false
      for (const { regex, colorKey } of patterns) {
        const match = remaining.match(regex)
        if (match) {
          const color = colors[colorKey] || colors.foreground
          tokens.push(
            <span key={`${lineIdx}-${keyIdx}`} style={{ color }}>
              {match[1]}
            </span>
          )
          remaining = remaining.slice(match[1].length)
          keyIdx++
          matched = true
          break
        }
      }
      if (!matched) {
        // Find next token boundary
        const nextSpecial = remaining.search(/[\/\w'"]/)
        if (nextSpecial === -1 || nextSpecial === 0) {
          tokens.push(
            <span key={`${lineIdx}-${keyIdx}`} style={{ color: colors.foreground }}>
              {remaining[0]}
            </span>
          )
          remaining = remaining.slice(1)
          keyIdx++
        } else {
          tokens.push(
            <span key={`${lineIdx}-${keyIdx}`} style={{ color: colors.foreground }}>
              {remaining.slice(0, nextSpecial)}
            </span>
          )
          remaining = remaining.slice(nextSpecial)
          keyIdx++
        }
      }
    }

    return (
      <div key={lineIdx} className="flex">
        <span
          className="inline-block w-8 text-right mr-4 select-none shrink-0"
          style={{ color: colors.mutedForeground }}
        >
          {lineIdx + 1}
        </span>
        <span>{tokens}</span>
      </div>
    )
  })
}

// ─── Color Swatch Component ─────────────────────────────────

function ColorSwatch({
  color,
  size = 'sm',
  showLabel = false,
}: {
  color: string
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
}) {
  const sizeClasses = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-8 h-8' }

  return (
    <div className="flex items-center gap-1.5">
      <div
        className={`${sizeClasses[size]} rounded border border-[rgba(255,255,255,0.08)] shrink-0`}
        style={{ backgroundColor: color }}
        title={color}
      />
      {showLabel && <span className="text-[10px] font-mono text-[#484f58]">{color}</span>}
    </div>
  )
}

// ─── Color Picker Input ─────────────────────────────────────

function ColorPickerInput({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (color: string) => void
}) {
  const inputId = `color-${label.replace(/\s+/g, '-').toLowerCase()}`
  return (
    <div className="flex items-center gap-2">
      <label htmlFor={inputId} className="text-[11px] font-mono text-[#8b949e] w-20 shrink-0">
        {label}
      </label>
      <div className="flex items-center gap-2 flex-1">
        <div className="relative">
          <input
            id={inputId}
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="absolute inset-0 w-6 h-6 opacity-0 cursor-pointer"
          />
          <div
            className="w-6 h-6 rounded border border-[rgba(255,255,255,0.1)] cursor-pointer"
            style={{ backgroundColor: value }}
          />
        </div>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 bg-[#0d1117] border border-[rgba(0,212,170,0.08)] rounded px-2 py-0.5 text-[11px] font-mono text-[#e6edf3] outline-none focus:border-[rgba(0,212,170,0.25)] transition-colors"
        />
      </div>
    </div>
  )
}

// ─── Theme Card Component ───────────────────────────────────

function ThemeCard({
  theme,
  isInstalled,
  isActive,
  onInstall,
  onUninstall,
  onApply,
  onPreview,
}: {
  theme: CustomTheme
  isInstalled: boolean
  isActive: boolean
  onInstall: () => void
  onUninstall: () => void
  onApply: () => void
  onPreview: () => void
}) {
  const keyColors = [
    theme.colors.editorBackground,
    theme.colors.accent,
    theme.colors.syntaxKeyword || theme.colors.primary,
    theme.colors.syntaxString || theme.colors.accent,
    theme.colors.syntaxFunction || theme.colors.primary,
    theme.colors.syntaxComment || theme.colors.mutedForeground,
  ]

  return (
    <div
      className={`
        border rounded-lg overflow-hidden transition-all
        ${isActive
          ? 'border-[rgba(0,212,170,0.3)] bg-[rgba(0,212,170,0.04)]'
          : 'border-[rgba(0,212,170,0.08)] bg-[#0d1117] hover:border-[rgba(0,212,170,0.15)]'
        }
      `}
    >
      {/* Color Swatches Bar */}
      <div className="flex h-8">
        {keyColors.map((color, i) => (
          <div
            key={i}
            className="flex-1"
            style={{ backgroundColor: color }}
          />
        ))}
      </div>

      {/* Theme Info */}
      <div className="p-3">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <span className="text-[12px] font-mono text-[#e6edf3] font-semibold">{theme.name}</span>
            {isActive && (
              <span className="flex items-center gap-1 text-[9px] font-mono text-[#00d4aa] bg-[rgba(0,212,170,0.1)] px-1.5 py-0.5 rounded">
                <Check size={8} />
                Active
              </span>
            )}
          </div>
        </div>

        <p className="text-[10px] font-mono text-[#484f58] mb-2 line-clamp-1">
          {theme.description || `By ${theme.author}`}
        </p>

        {/* Tags */}
        {theme.tags && theme.tags.length > 0 && (
          <div className="flex items-center gap-1 mb-2 flex-wrap">
            {theme.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-0.5 text-[9px] font-mono text-[#30363d] bg-[rgba(255,255,255,0.03)] px-1.5 py-0.5 rounded"
              >
                <Tag size={7} />
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={onPreview}
            className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-mono text-[#484f58] hover:text-[#e6edf3] hover:bg-[rgba(255,255,255,0.03)] transition-colors cursor-pointer"
            aria-label={`Preview ${theme.name}`}
          >
            <Eye size={10} />
            Preview
          </button>
          {isInstalled ? (
            <>
              {!isActive && (
                <button
                  onClick={onApply}
                  className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-mono bg-[rgba(0,212,170,0.1)] text-[#00d4aa] hover:bg-[rgba(0,212,170,0.15)] transition-colors cursor-pointer"
                  aria-label={`Apply ${theme.name}`}
                >
                  <Check size={10} />
                  Apply
                </button>
              )}
              {theme.id !== 'default-dark' && (
                <button
                  onClick={onUninstall}
                  className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-mono text-[#30363d] hover:text-[#f85149] hover:bg-[rgba(248,81,73,0.06)] transition-colors cursor-pointer"
                  aria-label={`Uninstall ${theme.name}`}
                >
                  <Trash2 size={10} />
                </button>
              )}
            </>
          ) : (
            <button
              onClick={onInstall}
              className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-mono bg-[rgba(0,212,170,0.1)] text-[#00d4aa] hover:bg-[rgba(0,212,170,0.15)] transition-colors cursor-pointer"
              aria-label={`Install ${theme.name}`}
            >
              <Download size={10} />
              Install
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Main Themes Panel Component ────────────────────────────

export function ThemesPanel() {
  const installedThemes = useIDEStore((s) => s.installedThemes)
  const activeThemeId = useIDEStore((s) => s.activeThemeId)
  const marketplaceThemes = useIDEStore((s) => s.marketplaceThemes)
  const installTheme = useIDEStore((s) => s.installTheme)
  const uninstallTheme = useIDEStore((s) => s.uninstallTheme)
  const applyTheme = useIDEStore((s) => s.applyTheme)
  const createCustomTheme = useIDEStore((s) => s.createCustomTheme)
  const fetchMarketplaceThemes = useIDEStore((s) => s.fetchMarketplaceThemes)
  const addNotification = useIDEStore((s) => s.addNotification)

  const [searchQuery, setSearchQuery] = useState('')
  const [previewTheme, setPreviewTheme] = useState<CustomTheme | null>(null)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'installed' | 'marketplace' | 'create'>('installed')

  // Custom theme form state
  const [customName, setCustomName] = useState('')
  const [customAuthor, setCustomAuthor] = useState('')
  const [customDescription, setCustomDescription] = useState('')
  const [customBg, setCustomBg] = useState('#0d1117')
  const [customFg, setCustomFg] = useState('#e6edf3')
  const [customAccent, setCustomAccent] = useState('#00d4aa')
  const [customSyntaxColors, setCustomSyntaxColors] = useState<Record<string, string>>(
    () => Object.fromEntries(SYNTAX_COLORS.map((sc) => [sc.key, sc.defaultColor]))
  )

  // Fetch marketplace themes on mount
  useEffect(() => {
    const loadThemes = async () => {
      setLoading(true)
      try {
        await fetchMarketplaceThemes()
      } catch {
        // Marketplace may be unavailable
      } finally {
        setLoading(false)
      }
    }
    loadThemes()
  }, [fetchMarketplaceThemes])

  // Use sample themes as fallback if marketplace is empty
  const availableMarketplaceThemes = marketplaceThemes.length > 0
    ? marketplaceThemes
    : SAMPLE_MARKETPLACE_THEMES

  // Filter marketplace themes by search
  const filteredThemes = searchQuery
    ? availableMarketplaceThemes.filter(
        (t) =>
          t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.tags?.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : availableMarketplaceThemes

  const activeTheme = installedThemes.find((t) => t.id === activeThemeId)

  const handleInstall = useCallback(
    (theme: CustomTheme) => {
      installTheme(theme.id)
    },
    [installTheme]
  )

  const handleCreateCustomTheme = useCallback(() => {
    if (!customName.trim()) {
      addNotification('warning', 'Theme name is required')
      return
    }

    const themeData: Omit<CustomTheme, 'id'> = {
      name: customName.trim(),
      author: customAuthor.trim() || 'You',
      version: '1.0.0',
      description: customDescription.trim() || undefined,
      tags: ['custom', 'dark'],
      colors: {
        background: customBg,
        foreground: customFg,
        primary: customAccent,
        primaryForeground: customBg,
        secondary: customBg,
        secondaryForeground: customFg,
        accent: customAccent,
        accentForeground: customBg,
        muted: customBg,
        mutedForeground: '#8b949e',
        border: '#30363d',
        card: customBg,
        cardForeground: customFg,
        editorBackground: customBg,
        editorForeground: customFg,
        editorLineHighlight: customBg,
        editorSelection: `${customAccent}33`,
        editorCursor: customFg,
        sidebarBackground: customBg,
        sidebarForeground: customFg,
        activityBarBackground: customBg,
        activityBarForeground: customFg,
        terminalBackground: customBg,
        terminalForeground: customFg,
        ...customSyntaxColors,
      },
    }

    createCustomTheme(themeData)
    addNotification('success', `Custom theme "${customName}" created!`)
    setCustomName('')
    setCustomAuthor('')
    setCustomDescription('')
    setActiveTab('installed')
  }, [
    customName,
    customAuthor,
    customDescription,
    customBg,
    customFg,
    customAccent,
    customSyntaxColors,
    createCustomTheme,
    addNotification,
  ])

  const handleRefreshMarketplace = useCallback(async () => {
    setLoading(true)
    try {
      await fetchMarketplaceThemes()
      addNotification('success', 'Marketplace refreshed')
    } catch {
      addNotification('error', 'Failed to refresh marketplace')
    } finally {
      setLoading(false)
    }
  }, [fetchMarketplaceThemes, addNotification])

  return (
    <div className="h-full flex flex-col" role="region" aria-label="Themes Marketplace">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-[#30363d] border-b border-[rgba(0,212,170,0.08)]">
        <span className="flex items-center gap-2">
          <Palette size={12} className="text-[#00d4aa]" />
          Themes
        </span>
        {loading && <Loader2 size={10} className="animate-spin text-[#00d4aa]" />}
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-[rgba(0,212,170,0.08)]">
        {[
          { key: 'installed' as const, label: 'Installed', icon: Check },
          { key: 'marketplace' as const, label: 'Marketplace', icon: Star },
          { key: 'create' as const, label: 'Create', icon: Brush },
        ].map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`
                flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-[11px] font-mono transition-colors cursor-pointer
                ${activeTab === tab.key
                  ? 'text-[#00d4aa] border-b-2 border-[#00d4aa] bg-[rgba(0,212,170,0.04)]'
                  : 'text-[#30363d] hover:text-[#484f58] hover:bg-[rgba(255,255,255,0.02)]'
                }
              `}
              role="tab"
              aria-selected={activeTab === tab.key}
            >
              <Icon size={10} />
              {tab.label}
              {tab.key === 'installed' && (
                <span className="text-[9px] bg-[rgba(0,212,170,0.08)] px-1 rounded">{installedThemes.length}</span>
              )}
            </button>
          )
        })}
      </div>

      {/* Active Theme Indicator */}
      {activeTheme && (
        <div className="px-4 py-2 border-b border-[rgba(0,212,170,0.06)] bg-[rgba(0,212,170,0.02)]">
          <div className="flex items-center gap-2">
            <div className="flex gap-0.5">
              <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: activeTheme.colors.editorBackground }} />
              <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: activeTheme.colors.accent }} />
              <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: activeTheme.colors.foreground }} />
            </div>
            <span className="text-[11px] font-mono text-[#e6edf3]">{activeTheme.name}</span>
            <span className="text-[9px] font-mono text-[#00d4aa] bg-[rgba(0,212,170,0.1)] px-1.5 py-0.5 rounded">Active</span>
          </div>
        </div>
      )}

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {/* ── Installed Themes Tab ── */}
        {activeTab === 'installed' && (
          <div className="p-4 space-y-3">
            {installedThemes.map((theme) => (
              <ThemeCard
                key={theme.id}
                theme={theme}
                isInstalled={true}
                isActive={theme.id === activeThemeId}
                onInstall={() => {}}
                onUninstall={() => uninstallTheme(theme.id)}
                onApply={() => applyTheme(theme.id)}
                onPreview={() => setPreviewTheme(theme)}
              />
            ))}
          </div>
        )}

        {/* ── Marketplace Tab ── */}
        {activeTab === 'marketplace' && (
          <div className="flex flex-col h-full">
            {/* Search Bar */}
            <div className="p-3 border-b border-[rgba(0,212,170,0.06)]">
              <div className="flex items-center gap-2 bg-[#0d1117] border border-[rgba(0,212,170,0.08)] rounded px-3 py-1.5 focus-within:border-[rgba(0,212,170,0.25)] transition-colors">
                <Search size={12} className="text-[#30363d] shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search themes..."
                  className="flex-1 bg-transparent text-[12px] text-[#e6edf3] placeholder-[#30363d] outline-none font-mono"
                  aria-label="Search themes"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="text-[#30363d] hover:text-[#e6edf3] cursor-pointer"
                  >
                    <X size={10} />
                  </button>
                )}
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-[10px] font-mono text-[#30363d]">
                  {filteredThemes.length} theme{filteredThemes.length !== 1 ? 's' : ''}
                </span>
                <button
                  onClick={handleRefreshMarketplace}
                  disabled={loading}
                  className="flex items-center gap-1 text-[10px] font-mono text-[#484f58] hover:text-[#00d4aa] transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Sparkles size={9} />
                  Refresh
                </button>
              </div>
            </div>

            {/* Theme Grid */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-3">
              {filteredThemes.length === 0 ? (
                <div className="flex flex-col items-center py-12 text-[#30363d]">
                  <Search size={32} className="mb-3 opacity-30" />
                  <p className="text-[12px] font-mono">No themes found</p>
                  <p className="text-[10px] font-mono text-[#484f58] mt-1">
                    Try a different search term
                  </p>
                </div>
              ) : (
                filteredThemes.map((theme) => {
                  const isInstalled = installedThemes.some((t) => t.id === theme.id)
                  return (
                    <ThemeCard
                      key={theme.id}
                      theme={theme}
                      isInstalled={isInstalled}
                      isActive={theme.id === activeThemeId}
                      onInstall={() => handleInstall(theme)}
                      onUninstall={() => uninstallTheme(theme.id)}
                      onApply={() => applyTheme(theme.id)}
                      onPreview={() => setPreviewTheme(theme)}
                    />
                  )
                })
              )}
            </div>
          </div>
        )}

        {/* ── Create Custom Theme Tab ── */}
        {activeTab === 'create' && (
          <div className="p-4 space-y-4">
            <div className="text-[11px] font-mono text-[#484f58] mb-2">
              Design your own custom theme with the color pickers below.
            </div>

            {/* Theme Name */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-mono text-[#8b949e]">Theme Name *</label>
              <input
                type="text"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="My Custom Theme"
                className="w-full bg-[#0d1117] border border-[rgba(0,212,170,0.08)] rounded px-3 py-1.5 text-[12px] font-mono text-[#e6edf3] placeholder-[#30363d] outline-none focus:border-[rgba(0,212,170,0.25)] transition-colors"
              />
            </div>

            {/* Author */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-mono text-[#8b949e]">Author</label>
              <input
                type="text"
                value={customAuthor}
                onChange={(e) => setCustomAuthor(e.target.value)}
                placeholder="Your name"
                className="w-full bg-[#0d1117] border border-[rgba(0,212,170,0.08)] rounded px-3 py-1.5 text-[12px] font-mono text-[#e6edf3] placeholder-[#30363d] outline-none focus:border-[rgba(0,212,170,0.25)] transition-colors"
              />
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-mono text-[#8b949e]">Description</label>
              <input
                type="text"
                value={customDescription}
                onChange={(e) => setCustomDescription(e.target.value)}
                placeholder="A brief description"
                className="w-full bg-[#0d1117] border border-[rgba(0,212,170,0.08)] rounded px-3 py-1.5 text-[12px] font-mono text-[#e6edf3] placeholder-[#30363d] outline-none focus:border-[rgba(0,212,170,0.25)] transition-colors"
              />
            </div>

            {/* Core Colors */}
            <div className="space-y-3 pt-2 border-t border-[rgba(0,212,170,0.06)]">
              <div className="text-[10px] font-mono text-[#30363d] uppercase tracking-wider flex items-center gap-1.5">
                <Settings size={9} />
                Core Colors
              </div>
              <ColorPickerInput label="Background" value={customBg} onChange={setCustomBg} />
              <ColorPickerInput label="Foreground" value={customFg} onChange={setCustomFg} />
              <ColorPickerInput label="Accent" value={customAccent} onChange={setCustomAccent} />
            </div>

            {/* Syntax Colors */}
            <div className="space-y-3 pt-2 border-t border-[rgba(0,212,170,0.06)]">
              <div className="text-[10px] font-mono text-[#30363d] uppercase tracking-wider flex items-center gap-1.5">
                <Code2Icon size={9} />
                Syntax Colors
              </div>
              {SYNTAX_COLORS.map((sc) => (
                <ColorPickerInput
                  key={sc.key}
                  label={sc.label}
                  value={customSyntaxColors[sc.key] || sc.defaultColor}
                  onChange={(color) =>
                    setCustomSyntaxColors((prev) => ({ ...prev, [sc.key]: color }))
                  }
                />
              ))}
            </div>

            {/* Live Preview */}
            <div className="pt-2 border-t border-[rgba(0,212,170,0.06)]">
              <div className="text-[10px] font-mono text-[#30363d] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Eye size={9} />
                Preview
              </div>
              <div
                className="rounded-lg overflow-hidden border border-[rgba(255,255,255,0.06)]"
                style={{ backgroundColor: customBg }}
              >
                <div
                  className="flex items-center gap-1.5 px-3 py-1.5 border-b"
                  style={{ borderColor: `${customFg}15` }}
                >
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#f85149' }} />
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#ffa657' }} />
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#00d4aa' }} />
                  <span
                    className="text-[10px] font-mono ml-2"
                    style={{ color: customSyntaxColors.syntaxVariable || customFg }}
                  >
                    app.tsx
                  </span>
                </div>
                <div className="p-3 text-[11px] font-mono leading-relaxed overflow-x-auto">
                  {highlightCode(PREVIEW_CODE, {
                    foreground: customFg,
                    mutedForeground: '#8b949e',
                    syntaxKeyword: customSyntaxColors.syntaxKeyword || '#c586c0',
                    syntaxString: customSyntaxColors.syntaxString || '#ce9178',
                    syntaxNumber: customSyntaxColors.syntaxNumber || '#b5cea8',
                    syntaxType: customSyntaxColors.syntaxType || '#4ec9b0',
                    syntaxFunction: customSyntaxColors.syntaxFunction || '#dcdcaa',
                    syntaxVariable: customSyntaxColors.syntaxVariable || '#9cdcfe',
                    syntaxComment: customSyntaxColors.syntaxComment || '#6a9955',
                  })}
                </div>
              </div>
            </div>

            {/* Create Button */}
            <button
              onClick={handleCreateCustomTheme}
              disabled={!customName.trim()}
              className={`
                w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-[12px] font-mono transition-all cursor-pointer
                ${customName.trim()
                  ? 'bg-[rgba(0,212,170,0.12)] text-[#00d4aa] hover:bg-[rgba(0,212,170,0.18)] border border-[rgba(0,212,170,0.2)]'
                  : 'bg-[rgba(0,212,170,0.04)] text-[#30363d] cursor-not-allowed border border-transparent'
                }
              `}
            >
              <Plus size={12} />
              Create Theme
            </button>
          </div>
        )}
      </div>

      {/* Theme Preview Modal */}
      {previewTheme && (
        <div className="absolute inset-0 bg-[#080c12]/90 z-20 flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-[#0d1117] rounded-lg border border-[rgba(0,212,170,0.12)] shadow-xl overflow-hidden">
            {/* Preview Header */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-[rgba(0,212,170,0.08)]">
              <div className="flex items-center gap-2">
                <Eye size={12} className="text-[#00d4aa]" />
                <span className="text-[12px] font-mono text-[#e6edf3]">{previewTheme.name}</span>
                <span className="text-[10px] font-mono text-[#484f58]">by {previewTheme.author}</span>
              </div>
              <button
                onClick={() => setPreviewTheme(null)}
                className="text-[#30363d] hover:text-[#e6edf3] transition-colors cursor-pointer"
                aria-label="Close preview"
              >
                <X size={14} />
              </button>
            </div>

            {/* Preview Code */}
            <div
              className="p-4 text-[12px] font-mono leading-relaxed overflow-auto max-h-80"
              style={{ backgroundColor: previewTheme.colors.editorBackground }}
            >
              {highlightCode(PREVIEW_CODE, previewTheme.colors)}
            </div>

            {/* Color Palette Preview */}
            <div className="px-4 py-3 border-t border-[rgba(0,212,170,0.08)]">
              <div className="text-[10px] font-mono text-[#30363d] uppercase tracking-wider mb-2">Color Palette</div>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { label: 'BG', color: previewTheme.colors.editorBackground },
                  { label: 'FG', color: previewTheme.colors.editorForeground },
                  { label: 'Accent', color: previewTheme.colors.accent },
                  { label: 'Primary', color: previewTheme.colors.primary },
                  { label: 'Keyword', color: previewTheme.colors.syntaxKeyword || previewTheme.colors.primary },
                  { label: 'String', color: previewTheme.colors.syntaxString || previewTheme.colors.accent },
                  { label: 'Function', color: previewTheme.colors.syntaxFunction || previewTheme.colors.primary },
                  { label: 'Comment', color: previewTheme.colors.syntaxComment || previewTheme.colors.mutedForeground },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-1.5">
                    <ColorSwatch color={item.color} size="sm" />
                    <span className="text-[9px] font-mono text-[#484f58]">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Preview Actions */}
            <div className="flex items-center gap-2 px-4 py-3 border-t border-[rgba(0,212,170,0.08)]">
              {installedThemes.some((t) => t.id === previewTheme.id) ? (
                <>
                  {previewTheme.id !== activeThemeId && (
                    <button
                      onClick={() => {
                        applyTheme(previewTheme.id)
                        setPreviewTheme(null)
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded text-[11px] font-mono bg-[rgba(0,212,170,0.12)] text-[#00d4aa] hover:bg-[rgba(0,212,170,0.18)] transition-colors cursor-pointer"
                    >
                      <Check size={10} />
                      Apply Theme
                    </button>
                  )}
                </>
              ) : (
                <button
                  onClick={() => {
                    handleInstall(previewTheme)
                    setPreviewTheme(null)
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded text-[11px] font-mono bg-[rgba(0,212,170,0.12)] text-[#00d4aa] hover:bg-[rgba(0,212,170,0.18)] transition-colors cursor-pointer"
                >
                  <Download size={10} />
                  Install & Apply
                </button>
              )}
              <button
                onClick={() => setPreviewTheme(null)}
                className="px-3 py-1.5 rounded text-[11px] font-mono text-[#484f58] hover:text-[#e6edf3] hover:bg-[rgba(255,255,255,0.03)] transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Code2 Icon for section headers ─────────────────────────
function Code2Icon({ size }: { size: number }) {
  return <Code2 size={size} className="inline" />
}
