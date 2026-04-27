'use client'

import { GitBranch, GitCommit, RefreshCw } from 'lucide-react'

export function GitPanel() {
  const changes = [
    { file: 'Editor.tsx', status: 'M', path: 'src/components/' },
    { file: 'ai-providers.ts', status: 'A', path: 'src/lib/' },
    { file: 'page.tsx', status: 'M', path: 'src/app/' },
  ]

  const statusColors: Record<string, string> = {
    M: 'text-[#f0883e]',
    A: 'text-[#3fb950]',
    D: 'text-[#f85149]',
    U: 'text-[#a371f7]',
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-[#5a6270] border-b border-[#00e5ff]/10">
        <span>Source Control</span>
        <RefreshCw size={12} className="text-[#3d4450] hover:text-[#5a6270] cursor-pointer transition-colors" />
      </div>
      <div className="p-3">
        <div className="flex items-center gap-2 text-[12px] text-[#8b949e]">
          <GitBranch size={14} className="text-[#00e5ff]/70" />
          <span className="font-mono">main</span>
          <span className="text-[#3d4450]">·</span>
          <GitCommit size={12} className="text-[#3d4450]" />
          <span className="text-[#3d4450] font-mono text-[11px]">3 ahead</span>
        </div>
      </div>
      <div className="px-4 py-1.5 text-[11px] uppercase tracking-wider text-[#5a6270] font-semibold">
        Changes ({changes.length})
      </div>
      <div className="flex-1 overflow-y-auto px-2 custom-scrollbar">
        {changes.map((c, i) => (
          <div
            key={i}
            className="flex items-center justify-between px-2 py-1.5 hover:bg-[#00e5ff]/5 cursor-pointer transition-colors rounded"
          >
            <div className="flex items-center gap-2">
              <span className="text-[12px] text-[#8b949e] font-mono">{c.file}</span>
              <span className="text-[10px] text-[#3d4450]">{c.path}</span>
            </div>
            <span className={`text-[11px] font-mono font-semibold ${statusColors[c.status]}`}>
              {c.status}
            </span>
          </div>
        ))}
      </div>
      <div className="p-3 border-t border-[#00e5ff]/10">
        <div className="flex items-center gap-2 bg-[#0d1117] border border-[#00e5ff]/20 rounded px-3 py-1.5">
          <input
            placeholder="Commit message..."
            className="flex-1 bg-transparent text-[12px] text-[#e6edf3] placeholder-[#3d4450] outline-none font-mono"
          />
        </div>
        <button className="w-full mt-2 bg-[#00e5ff]/10 text-[#00e5ff] text-[12px] font-mono py-1.5 rounded hover:bg-[#00e5ff]/20 transition-colors cursor-pointer">
          Commit
        </button>
      </div>
    </div>
  )
}
