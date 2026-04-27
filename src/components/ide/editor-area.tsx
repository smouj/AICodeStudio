'use client'

import { useCallback } from 'react'
import { X, Circle } from 'lucide-react'
import { useIDEStore } from '@/store/ide-store'
import dynamic from 'next/dynamic'
import type { editor } from 'monaco-editor'

const MonacoEditor = dynamic(() => import('@monaco-editor/react').then((mod) => mod.default), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full bg-[#0d1117] text-[#3d4450] font-mono text-sm">
      Loading editor...
    </div>
  ),
})

const customThemeName = 'aicode-dark'

function getLanguageFromFilename(name: string): string {
  const ext = name.split('.').pop()?.toLowerCase()
  const map: Record<string, string> = {
    tsx: 'typescript',
    ts: 'typescript',
    jsx: 'javascript',
    js: 'javascript',
    json: 'json',
    css: 'css',
    html: 'html',
    md: 'markdown',
    svg: 'xml',
    py: 'python',
    rs: 'rust',
    go: 'go',
    gitignore: 'plaintext',
  }
  return map[ext || ''] || 'plaintext'
}

export function EditorArea() {
  const { openTabs, activeTabId, setActiveTab, closeTab, updateTabContent } = useIDEStore()

  const activeTab = openTabs.find((t) => t.id === activeTabId)

  const handleEditorChange = useCallback(
    (value: string | undefined) => {
      if (activeTabId && value !== undefined) {
        updateTabContent(activeTabId, value)
      }
    },
    [activeTabId, updateTabContent]
  )

  const handleBeforeMount = useCallback((monaco: Parameters<NonNullable<Parameters<typeof MonacoEditor>[0]['beforeMount']>>[0]) => {
    monaco.editor.defineTheme(customThemeName, {
      base: 'vs-dark',
      inherit: true,
      rules: [],
      colors: {
        'editor.background': '#0d1117',
        'editor.foreground': '#e6edf3',
        'editor.lineHighlightBackground': '#161b22',
        'editor.selectionBackground': '#ffffff20',
        'editorCursor.foreground': '#ffffff',
        'editor.inactiveSelectionBackground': '#ffffff10',
        'editorLineNumber.foreground': '#484f58',
        'editorLineNumber.activeForeground': '#8b949e',
        'editorIndentGuide.background': '#161b22',
        'editorIndentGuide.activeBackground': '#30363d',
        'editorWhitespace.foreground': '#30363d',
        'editorBracketMatch.background': '#ffffff10',
        'editorBracketMatch.border': '#ffffff20',
        'editorOverviewRuler.border': '#0d1117',
        'editorGutter.background': '#0d1117',
        'editor.selectionHighlightBackground': '#ffffff10',
        'editorWidget.background': '#161b22',
        'editorWidget.border': 'rgba(255,255,255,0.06)',
        'editorSuggestWidget.background': '#161b22',
        'editorSuggestWidget.border': 'rgba(255,255,255,0.06)',
        'editorSuggestWidget.selectedBackground': 'rgba(255,255,255,0.08)',
        'input.background': '#0d1117',
        'input.border': 'rgba(255,255,255,0.08)',
        'scrollbarSlider.background': '#484f5840',
        'scrollbarSlider.hoverBackground': '#484f5880',
        'scrollbarSlider.activeBackground': '#484f58a0',
        'minimap.background': '#0d1117',
      },
    })
  }, [])

  const handleOnMount = useCallback((_: editor.IStandaloneCodeEditor, monaco: Parameters<NonNullable<Parameters<typeof MonacoEditor>[0]['onMount']>>[1]) => {
    monaco.editor.setTheme(customThemeName)
  }, [])

  if (openTabs.length === 0) {
    return (
      <div className="flex-1 bg-[#0a0e14] flex items-center justify-center relative overflow-hidden">
        {/* ASCII Art Background */}
        <div className="absolute inset-0 opacity-[0.03] font-mono text-[8px] leading-tight text-white select-none overflow-hidden whitespace-pre p-4">
{`████╗ ███████╗ ██████╗██╗  ██╗███████╗██████╗  ██████╗ ███╗   ██╗ █████╗ ██╗  ██╗   ██╗████████╗███████╗██████╗
╚══██╗██╔════╝██╔════╝██║  ██║██╔════╝██╔══██╗██╔═══██╗████╗  ██║██╔══██╗██║  ╚██╗ ██╔╝╚══██╔══╝██╔════╝██╔══██╗
  ██║█████╗  ██║     ███████║█████╗  ██████╔╝██║   ██║██╔██╗ ██║███████║██║   ╚████╔╝    ██║   █████╗  ██║  ██║
  ██║██╔══╝  ██║     ██╔══██║██╔══╝  ██╔══██╗██║   ██║██║╚██╗██║██╔══██║██║    ╚██╔╝     ██║   ██╔══╝  ██║  ██║
  ██║███████╗╚██████╗██║  ██║███████╗██║  ██║╚██████╔╝██║ ╚████║██║  ██║███████╗██║      ██║   ███████╗██████╔╝
  ╚═╝╚══════╝ ╚═════╝╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝ ╚═════╝ ╚═╝  ╚═══╝╚═╝  ╚═╝╚══════╝╚═╝      ╚═╝   ╚══════╝╚═════╝
 █████╗ ██╗    ████████╗   ██╗  ██╗███████╗██╗   ██╗███████╗███╗   ██╗ ██████╗██████╗ ███████╗
██╔══██╗██║    ╚══██╔══╝   ██║  ██║██╔════╝╚██╗ ██╔╝██╔════╝████╗  ██║██╔════╝██╔══██╗██╔════╝
███████║██║       ██║█████╗███████║█████╗   ╚████╔╝ █████╗  ██╔██╗ ██║██║     ██████╔╝█████╗
██╔══██║██║       ██║╚════╝██╔══██║██╔══╝    ╚██╔╝  ██╔══╝  ██║╚██╗██║██║     ██╔══██╗██╔══╝
██║  ██║███████╗  ██║      ██║  ██║███████╗   ██║   ███████╗██║ ╚████║╚██████╗██║  ██║███████╗
╚═╝  ╚═╝╚══════╝  ╚═╝      ╚═╝  ╚═╝╚══════╝   ╚═╝   ╚══════╝╚═╝  ╚═══╝ ╚═════╝╚═╝  ╚═╝╚══════╝`}
        </div>

        {/* Welcome Content */}
        <div className="relative z-10 text-center">
          <div className="text-white/20 text-[80px] font-bold font-mono leading-none mb-2">
            {'</>'}
          </div>
          <h1 className="text-[#e6edf3] text-2xl font-mono font-semibold mb-1">AICodeStudio</h1>
          <p className="text-[#484f58] text-sm font-mono mb-8">Next-Generation AI-Powered IDE</p>
          <div className="flex flex-col gap-2 text-[12px] font-mono">
            <button className="text-[#8b949e] hover:text-white transition-colors cursor-pointer">
              → Open File
            </button>
            <button className="text-[#8b949e] hover:text-white transition-colors cursor-pointer">
              → Clone Repository
            </button>
            <button className="text-[#8b949e] hover:text-white transition-colors cursor-pointer">
              → Connect AI Provider
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col bg-[#0a0e14] min-w-0">
      {/* Tabs */}
      <div className="flex items-center bg-[#060a10] border-b border-white/[0.06] overflow-x-auto shrink-0 custom-scrollbar">
        {openTabs.map((tab) => (
          <div
            key={tab.id}
            className={`
              flex items-center gap-2 px-3 py-1.5 text-[12px] font-mono cursor-pointer
              border-r border-white/[0.03] min-w-0 shrink-0 transition-colors
              ${tab.id === activeTabId
                ? 'bg-[#0d1117] text-[#e6edf3] border-t-[2px] border-t-white'
                : 'text-[#484f58] hover:text-[#8b949e] border-t-[2px] border-t-transparent'
              }
            `}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className="truncate max-w-[120px]">{tab.name}</span>
            {tab.isModified && (
              <Circle size={6} fill="currentColor" className="text-white shrink-0" />
            )}
            <button
              onClick={(e) => {
                e.stopPropagation()
                closeTab(tab.id)
              }}
              className="ml-1 text-[#3d4450] hover:text-[#e6edf3] transition-colors shrink-0 cursor-pointer"
            >
              <X size={12} />
            </button>
          </div>
        ))}
      </div>

      {/* Editor */}
      <div className="flex-1 min-h-0">
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
              fontSize: 13,
              fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
              fontLigatures: true,
              lineHeight: 22,
              minimap: { enabled: true, scale: 2, showSlider: 'mouseover' },
              scrollBeyondLastLine: false,
              smoothScrolling: true,
              cursorBlinking: 'smooth',
              cursorSmoothCaretAnimation: 'on',
              renderLineHighlight: 'line',
              renderWhitespace: 'selection',
              bracketPairColorization: { enabled: true },
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
      </div>
    </div>
  )
}
