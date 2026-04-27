'use client'

import { GitBranch, GitCommit, RefreshCw } from 'lucide-react'

export function GitPanel() {
  const changes = [
    { file: 'Editor.tsx', status: 'M', path: 'src/components/' },
    { file: 'ai-providers.ts', status: 'A', path: 'src/lib/' },
    { file: 'page.tsx', status: 'M', path: 'src/app/' },
  ]

  const statusColors: Record<string, string> = {
    M: 'text-[#ffa657]',
    A: 'text-[#3fb950]',
    D: 'text-[#f85149]',
    U: 'text-[#a371f7]',
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-[#30363d] border-b border-[rgba(0,212,170,0.08)]">
        <span>Source Control</span>
        <RefreshCw size={12} className="text-[#30363d] hover:text-[#484f58] cursor-pointer transition-colors" />
      </div>
      <div className="p-3">
        <div className="flex items-center gap-2 text-[12px] text-[#6e7681]">
          <GitBranch size={14} className="text-[#00d4aa]/60" />
          <span className="font-mono text-[#e6edf3]">main</span>
          <span className="text-[#30363d]">·</span>
          <GitCommit size={12} className="text-[#30363d]" />
          <span className="text-[#30363d] font-mono text-[11px]">3 ahead</span>
        </div>
      </div>
      <div className="px-4 py-1.5 text-[11px] uppercase tracking-wider text-[#30363d] font-semibold">
        Changes ({changes.length})
      </div>
      <div className="flex-1 overflow-y-auto px-2 custom-scrollbar">
        {changes.map((c, i) => (
          <div
            key={i}
            className="flex items-center justify-between px-2 py-1.5 hover:bg-[rgba(0,212,170,0.04)] cursor-pointer transition-colors rounded"
          >
            <div className="flex items-center gap-2">
              <span className="text-[12px] text-[#6e7681] font-mono">{c.file}</span>
              <span className="text-[10px] text-[#30363d]">{c.path}</span>
            </div>
            <span className={`text-[11px] font-mono font-semibold ${statusColors[c.status]}`}>
              {c.status}
            </span>
          </div>
        ))}
      </div>
      <div className="p-3 border-t border-[rgba(0,212,170,0.08)]">
        <div className="flex items-center gap-2 bg-[#0d1117] border border-[rgba(0,212,170,0.08)] rounded px-3 py-1.5 focus-within:border-[rgba(0,212,170,0.25)] transition-colors">
          <input
            placeholder="Commit message..."
            className="flex-1 bg-transparent text-[12px] text-[#e6edf3] placeholder-[#30363d] outline-none font-mono"
          />
        </div>
        <button className="w-full mt-2 bg-[rgba(0,212,170,0.12)] text-[#00d4aa] text-[12px] font-mono py-1.5 rounded hover:bg-[rgba(0,212,170,0.18)] transition-colors cursor-pointer">
          Commit
        </button>
      </div>
    </div>
  )
}
