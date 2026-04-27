'use client'

import { useState } from 'react'
import { Search, X, ChevronDown } from 'lucide-react'

export function SearchPanel() {
  const [query, setQuery] = useState('')
  const [results] = useState([
    { file: 'Editor.tsx', line: 12, text: 'const [content, setContent] = useState', col: 6 },
    { file: 'ai-providers.ts', line: 24, text: 'async function queryAI(', col: 0 },
    { file: 'page.tsx', line: 5, text: 'return (', col: 2 },
    { file: 'Sidebar.tsx', line: 3, text: 'return (', col: 2 },
  ])

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-[#30363d] border-b border-[rgba(0,212,170,0.08)]">
        <span>Search</span>
      </div>
      <div className="p-3">
        <div className="flex items-center gap-2 bg-[#0d1117] border border-[rgba(0,212,170,0.08)] rounded px-3 py-1.5 focus-within:border-[rgba(0,212,170,0.25)] transition-colors">
          <Search size={14} className="text-[#30363d] shrink-0" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search in files..."
            className="flex-1 bg-transparent text-[13px] text-[#e6edf3] placeholder-[#30363d] outline-none font-mono"
          />
          {query && (
            <button onClick={() => setQuery('')} className="text-[#30363d] hover:text-[#6e7681] cursor-pointer">
              <X size={14} />
            </button>
          )}
        </div>
        <div className="flex items-center gap-2 mt-2 text-[11px] text-[#30363d]">
          <button className="flex items-center gap-1 hover:text-[#484f58] transition-colors cursor-pointer">
            <ChevronDown size={10} />
            <span>.*</span>
          </button>
          <span>Case sensitive</span>
          <span>Whole word</span>
          <span>Regex</span>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-2 custom-scrollbar">
        {results.map((r, i) => (
          <div
            key={i}
            className="px-2 py-1.5 hover:bg-[rgba(0,212,170,0.04)] cursor-pointer transition-colors rounded"
          >
            <div className="flex items-center gap-2 text-[12px]">
              <span className="text-[#6e7681] font-mono">{r.file}</span>
              <span className="text-[#30363d]">:{r.line}</span>
            </div>
            <div className="text-[11px] text-[#484f58] font-mono mt-0.5 pl-3">
              {r.text}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
