'use client'

import { useCallback } from 'react'
import { X, Circle } from 'lucide-react'
import { useIDEStore } from '@/store/ide-store'
import dynamic from 'next/dynamic'

const MonacoEditor = dynamic(() => import('@monaco-editor/react').then((mod) => mod.default), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full bg-[#0d1117] text-[#3d4450] font-mono text-sm">
      Loading editor...
    </div>
  ),
})

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

  if (openTabs.length === 0) {
    return (
      <div className="flex-1 bg-[#0d1117] flex items-center justify-center relative overflow-hidden">
        {/* ASCII Art Background */}
        <div className="absolute inset-0 opacity-[0.03] font-mono text-[8px] leading-tight text-[#00e5ff] select-none overflow-hidden whitespace-pre p-4">
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
          <div className="text-[#00e5ff]/20 text-[80px] font-bold font-mono leading-none mb-2">
            {'</>'}
          </div>
          <h1 className="text-[#e6edf3] text-2xl font-mono font-semibold mb-1">AICodeStudio</h1>
          <p className="text-[#5a6270] text-sm font-mono mb-8">Next-Generation AI-Powered IDE</p>
          <div className="flex flex-col gap-2 text-[12px] font-mono">
            <button className="text-[#00e5ff]/70 hover:text-[#00e5ff] transition-colors cursor-pointer">
              → Open File
            </button>
            <button className="text-[#00e5ff]/70 hover:text-[#00e5ff] transition-colors cursor-pointer">
              → Clone Repository
            </button>
            <button className="text-[#00e5ff]/70 hover:text-[#00e5ff] transition-colors cursor-pointer">
              → Connect AI Provider
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col bg-[#0d1117] min-w-0">
      {/* Tabs */}
      <div className="flex items-center bg-[#080c12] border-b border-[#00e5ff]/10 overflow-x-auto shrink-0 custom-scrollbar">
        {openTabs.map((tab) => (
          <div
            key={tab.id}
            className={`
              flex items-center gap-2 px-3 py-1.5 text-[12px] font-mono cursor-pointer
              border-r border-[#00e5ff]/5 min-w-0 shrink-0 transition-colors
              ${tab.id === activeTabId
                ? 'bg-[#0d1117] text-[#e6edf3] border-t-[2px] border-t-[#00e5ff]'
                : 'text-[#5a6270] hover:text-[#8b949e] border-t-[2px] border-t-transparent'
              }
            `}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className="truncate max-w-[120px]">{tab.name}</span>
            {tab.isModified && (
              <Circle size={6} fill="currentColor" className="text-[#00e5ff] shrink-0" />
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
            theme="vs-dark"
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
