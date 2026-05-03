'use client'

import { useCallback, Component } from 'react'
import { X, Circle, Plus, FolderOpen } from 'lucide-react'
import { useIDEStore } from '@/store/ide-store'
import dynamic from 'next/dynamic'
import type { editor } from 'monaco-editor'

// Error Boundary for Monaco Editor
class EditorErrorBoundary extends Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex-1 flex items-center justify-center bg-[#0a0e14] text-[#484f58] font-mono text-sm">
          <div className="text-center">
            <p className="text-[#f85149] mb-2">Editor failed to load</p>
            <button
              onClick={() => this.setState({ hasError: false })}
              className="px-3 py-1 bg-[rgba(0,212,170,0.12)] text-[#00d4aa] rounded text-xs hover:bg-[rgba(0,212,170,0.18)] cursor-pointer"
            >
              Retry
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

const MonacoEditor = dynamic(() => import('@monaco-editor/react').then((mod) => mod.default), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full bg-[#0d1117] text-[#30363d] font-mono text-sm">
      Loading editor...
    </div>
  ),
})

const customThemeName = 'aicode-dark'

function getLanguageFromFilename(name: string): string {
  const ext = name.split('.').pop()?.toLowerCase()
  const map: Record<string, string> = {
    tsx: 'typescript', ts: 'typescript', jsx: 'javascript', js: 'javascript',
    json: 'json', css: 'css', html: 'html', md: 'markdown', svg: 'xml',
    py: 'python', rs: 'rust', go: 'go', gitignore: 'plaintext',
    yml: 'yaml', yaml: 'yaml', sh: 'shell', sql: 'sql', env: 'plaintext',
    txt: 'plaintext', xml: 'xml', dockerfile: 'dockerfile',
  }
  return map[ext || ''] || 'plaintext'
}

// Extract theme as a constant to avoid recreation
const monacoThemeDefinition: editor.IStandaloneThemeData = {
  base: 'vs-dark',
  inherit: true,
  rules: [
    { token: 'comment', foreground: '3d4450', fontStyle: 'italic' },
    { token: 'keyword', foreground: '00d4aa' },
    { token: 'string', foreground: 'a5d6ff' },
    { token: 'number', foreground: '79c0ff' },
    { token: 'type', foreground: '7ee787' },
    { token: 'function', foreground: 'd2a8ff' },
    { token: 'variable', foreground: 'ffa657' },
    { token: 'operator', foreground: '00d4aa' },
    { token: 'delimiter', foreground: '8b949e' },
    { token: 'tag', foreground: '7ee787' },
    { token: 'attribute.name', foreground: '79c0ff' },
    { token: 'attribute.value', foreground: 'a5d6ff' },
  ],
  colors: {
    'editor.background': '#0a0e14',
    'editor.foreground': '#c9d1d9',
    'editor.lineHighlightBackground': '#0d1117',
    'editor.selectionBackground': '#00d4aa22',
    'editorCursor.foreground': '#00d4aa',
    'editor.inactiveSelectionBackground': '#00d4aa11',
    'editorLineNumber.foreground': '#30363d',
    'editorLineNumber.activeForeground': '#00d4aa',
    'editorIndentGuide.background': '#161b22',
    'editorIndentGuide.activeBackground': '#30363d',
    'editorWhitespace.foreground': '#161b22',
    'editorBracketMatch.background': '#00d4aa11',
    'editorBracketMatch.border': '#00d4aa33',
    'editorOverviewRuler.border': '#0a0e14',
    'editorGutter.background': '#0a0e14',
    'editor.selectionHighlightBackground': '#00d4aa11',
    'editorWidget.background': '#0d1117',
    'editorWidget.border': 'rgba(0,212,170,0.08)',
    'editorSuggestWidget.background': '#0d1117',
    'editorSuggestWidget.border': 'rgba(0,212,170,0.08)',
    'editorSuggestWidget.selectedBackground': 'rgba(0,212,170,0.08)',
    'editorSuggestWidget.highlightForeground': '#00d4aa',
    'input.background': '#0a0e14',
    'input.border': 'rgba(0,212,170,0.08)',
    'input.focusBorder': 'rgba(0,212,170,0.25)',
    'scrollbarSlider.background': '#30363d40',
    'scrollbarSlider.hoverBackground': '#30363d80',
    'scrollbarSlider.activeBackground': '#30363da0',
    'minimap.background': '#0a0e14',
    'editorGutter.modifiedBackground': '#ffa65733',
    'editorGutter.addedBackground': '#3fb95033',
    'editorGutter.deletedBackground': '#f8514933',
  },
}

export function EditorArea() {
  const openTabs = useIDEStore((s) => s.openTabs)
  const activeTabId = useIDEStore((s) => s.activeTabId)
  const setActiveTab = useIDEStore((s) => s.setActiveTab)
  const closeTab = useIDEStore((s) => s.closeTab)
  const updateTabContent = useIDEStore((s) => s.updateTabContent)
  const setCursorPosition = useIDEStore((s) => s.setCursorPosition)
  const setActiveSidebarPanel = useIDEStore((s) => s.setActiveSidebarPanel)
  const editorSettings = useIDEStore((s) => s.editorSettings)
  const writeFile = useIDEStore((s) => s.writeFile)

  const activeTab = openTabs.find((t) => t.id === activeTabId)

  const handleEditorChange = useCallback(
    (value: string | undefined) => {
      if (activeTabId && value !== undefined) {
        updateTabContent(activeTabId, value)
        // Auto-save to virtual FS
        const tab = useIDEStore.getState().openTabs.find((t) => t.id === activeTabId)
        if (tab) {
          writeFile(tab.path, value)
        }
      }
    },
    [activeTabId, updateTabContent, writeFile]
  )

  const handleBeforeMount = useCallback((monaco: typeof import('monaco-editor')) => {
    monaco.editor.defineTheme(customThemeName, monacoThemeDefinition)
  }, [])

  const handleOnMount = useCallback((editorInstance: editor.IStandaloneCodeEditor) => {
    editorInstance.onDidChangeCursorPosition((e) => {
      setCursorPosition({ line: e.position.lineNumber, column: e.position.column })
    })
  }, [setCursorPosition])

  if (openTabs.length === 0) {
    return (
      <div className="flex-1 bg-[#080c12] flex items-center justify-center relative overflow-hidden" role="main" aria-label="Welcome screen">
        {/* ASCII Art Background */}
        <div className="absolute inset-0 opacity-[0.03] font-mono text-[8px] leading-tight text-[#00d4aa] select-none overflow-hidden whitespace-pre p-4 ascii-bg" aria-hidden="true">
{`\u2588\u2588\u2588\u2588\u2557 \u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2557 \u2588\u2588\u2588\u2588\u2588\u2588\u2557\u2588\u2588\u2557  \u2588\u2588\u2557\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2557\u2588\u2588\u2588\u2588\u2588\u2588\u2557  \u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2557 \u2588\u2588\u2588\u2557   \u2588\u2588\u2557
\u255A\u2550\u2550\u2588\u2588\u2557\u2588\u2588\u2554\u2550\u2550\u2550\u2550\u255D\u2588\u2588\u2554\u2550\u2550\u2550\u2550\u255D\u2588\u2588\u2557  \u2588\u2588\u2557\u2588\u2588\u2554\u2550\u2550\u2550\u2550\u255D\u2588\u2588\u2554\u2550\u2550\u2588\u2588\u2557\u2588\u2588\u2554\u2550\u2550\u2550\u2588\u2588\u2557
  \u2588\u2588\u2557\u2588\u2588\u2588\u2588\u2588\u2557  \u2588\u2588\u2557     \u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2557\u2588\u2588\u2588\u2588\u2588\u2557  \u255A\u2550\u2550\u2588\u2588\u255D\u2588\u2588\u2554\u2550\u2550\u2550\u2550\u255D
  \u2588\u2588\u2557\u2588\u2588\u2554\u2550\u2550\u255D  \u2588\u2588\u2557     \u2588\u2588\u2554\u2550\u2550\u2588\u2588\u2557\u2588\u2588\u2554\u2550\u2550\u2588\u2588\u2557\u2588\u2588\u2551\u255A\u2588\u2588\u2557\u2588\u2588\u2554\u2550\u2550\u2550\u2550\u255D
  \u2588\u2588\u2557\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2557\u255A\u2588\u2588\u2588\u2588\u2588\u2588\u2557\u2588\u2588\u2557  \u2588\u2588\u2557\u2588\u2588\u2551   \u2588\u2588\u2557\u2588\u2588\u2551 \u255A\u2588\u2588\u2588\u2588\u2557\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2557
  \u255A\u2550\u255D\u255A\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u255D \u255A\u2550\u2550\u2550\u2550\u2550\u255D\u255A\u2550\u255D  \u255A\u2550\u255D\u255A\u2550\u255D   \u255A\u2550\u255D\u255A\u2550\u255D  \u255A\u2550\u2550\u2550\u255D\u255A\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u255D`}
        </div>

        {/* Decorative grid lines */}
        <div className="absolute inset-0 opacity-[0.015]" aria-hidden="true" style={{
          backgroundImage: 'linear-gradient(rgba(0,212,170,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,170,0.3) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }} />

        {/* Welcome Content */}
        <div className="relative z-10 text-center">
          <div className="text-[#00d4aa]/20 text-[80px] font-bold font-mono leading-none mb-2 pulse-accent" aria-hidden="true">
            {'</>'}
          </div>
          <h1 className="text-[#e6edf3] text-2xl font-mono font-semibold mb-1">AICodeStudio</h1>
          <p className="text-[#484f58] text-sm font-mono mb-8">Next-Generation AI-Powered IDE</p>
          <div className="flex flex-col gap-2.5 text-[12px] font-mono">
            {[
              { label: 'Create a File', shortcut: 'Terminal: touch', panel: 'explorer' as const },
              { label: 'Clone Repository', shortcut: 'Ctrl+Shift+G', panel: 'github' as const },
              { label: 'Connect AI Provider', shortcut: 'Ctrl+Shift+A', panel: 'ai' as const },
            ].map((action) => (
              <button
                key={action.label}
                onClick={() => setActiveSidebarPanel(action.panel)}
                className="group flex items-center gap-3 text-[#484f58] hover:text-[#00d4aa] transition-colors cursor-pointer mx-auto"
              >
                <span className="text-[#00d4aa]/40 group-hover:text-[#00d4aa] transition-colors" aria-hidden="true">{'\u2192'}</span>
                <span>{action.label}</span>
                <span className="text-[#30363d] text-[10px]">{action.shortcut}</span>
              </button>
            ))}
          </div>

          {/* Version badge */}
          <div className="mt-10 flex items-center justify-center gap-2">
            <div className="h-px w-8 bg-[#30363d]" aria-hidden="true" />
            <span className="text-[10px] text-[#30363d] font-mono">v2.0.0</span>
            <div className="h-px w-8 bg-[#30363d]" aria-hidden="true" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col bg-[#080c12] min-w-0">
      {/* Tabs */}
      <div className="flex items-center bg-[#050810] border-b border-[rgba(0,212,170,0.08)] overflow-x-auto shrink-0 custom-scrollbar" role="tablist" aria-label="Open files">
        {openTabs.map((tab) => (
          <div
            key={tab.id}
            role="tab"
            aria-selected={tab.id === activeTabId}
            tabIndex={0}
            className={`
              flex items-center gap-2 px-3 py-1.5 text-[12px] font-mono cursor-pointer
              border-r border-[rgba(0,212,170,0.04)] min-w-0 shrink-0 transition-colors
              ${tab.id === activeTabId
                ? 'bg-[#0a0e14] text-[#e6edf3] border-t-[2px] border-t-[#00d4aa]'
                : 'text-[#484f58] hover:text-[#8b949e] border-t-[2px] border-t-transparent hover:bg-[#0d1117]'
              }
            `}
            onClick={() => setActiveTab(tab.id)}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setActiveTab(tab.id) }}
          >
            <span className="truncate max-w-[120px]">{tab.name}</span>
            {tab.isModified && (
              <Circle size={6} fill="currentColor" className="text-[#00d4aa] shrink-0" aria-label="Unsaved changes" />
            )}
            <button
              onClick={(e) => {
                e.stopPropagation()
                closeTab(tab.id)
              }}
              aria-label={`Close tab ${tab.name}`}
              className="ml-1 text-[#30363d] hover:text-[#e6edf3] transition-colors shrink-0 cursor-pointer"
            >
              <X size={12} />
            </button>
          </div>
        ))}
      </div>

      {/* Breadcrumb */}
      {activeTab && (
        <div className="flex items-center gap-1 px-3 py-1 bg-[#080c12] border-b border-[rgba(0,212,170,0.04)] text-[11px] font-mono text-[#30363d]">
          {activeTab.path.split('/').filter(Boolean).map((segment, i, arr) => (
            <span key={i} className="flex items-center gap-1">
              {i > 0 && <span className="text-[#30363d]/50">/</span>}
              <span className={i === arr.length - 1 ? 'text-[#6e7681]' : 'text-[#30363d] hover:text-[#484f58] cursor-pointer'}>
                {segment}
              </span>
            </span>
          ))}
        </div>
      )}

      {/* Editor */}
      <div className="flex-1 min-h-0">
        <EditorErrorBoundary>
          {activeTab && (
            <MonacoEditor
              height="100%"
              language={getLanguageFromFilename(activeTab.name)}
              value={activeTab.content}
              onChange={handleEditorChange}
              beforeMount={handleBeforeMount}
              onMount={handleOnMount}
              theme={customThemeName}
              options={{
                fontSize: editorSettings.fontSize,
                fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
                fontLigatures: editorSettings.fontLigatures,
                lineHeight: Math.round(editorSettings.fontSize * 1.7),
                tabSize: editorSettings.tabSize,
                minimap: { enabled: editorSettings.minimap, scale: 2, showSlider: 'mouseover' },
                wordWrap: editorSettings.wordWrap,
                lineNumbers: editorSettings.lineNumbers,
                scrollBeyondLastLine: false,
                smoothScrolling: true,
                cursorBlinking: 'smooth',
                cursorSmoothCaretAnimation: 'on',
                renderLineHighlight: 'line',
                renderWhitespace: 'selection',
                bracketPairColorization: { enabled: editorSettings.bracketPairColorization },
                guides: {
                  bracketPairs: true,
                  indentation: true,
                },
                padding: { top: 12 },
                automaticLayout: true,
                suggest: {
                  showMethods: true,
                  showFunctions: true,
                  showConstants: true,
                  showProperties: true,
                },
                scrollbar: {
                  verticalScrollbarSize: 8,
                  horizontalScrollbarSize: 8,
                },
              }}
            />
          )}
        </EditorErrorBoundary>
      </div>
    </div>
  )
}
