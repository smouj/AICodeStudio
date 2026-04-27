'use client'

import { Blocks, Search, Download } from 'lucide-react'

const extensions = [
  { name: 'AI Code Completion', publisher: 'AICodeStudio', desc: 'AI-powered code suggestions', installed: true, downloads: '2.1M' },
  { name: 'Git Enhanced', publisher: 'Community', desc: 'Advanced Git integration', installed: true, downloads: '890K' },
  { name: 'Terminal Pro', publisher: 'AICodeStudio', desc: 'Enhanced terminal experience', installed: false, downloads: '1.5M' },
  { name: 'Theme Designer', publisher: 'Community', desc: 'Custom theme creator', installed: false, downloads: '450K' },
  { name: 'Docker Explorer', publisher: 'DevOps', desc: 'Manage Docker containers', installed: false, downloads: '670K' },
  { name: 'REST Client', publisher: 'API Tools', desc: 'HTTP request testing', installed: false, downloads: '1.2M' },
]

export function ExtensionsPanel() {
  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-[#484f58] border-b border-white/[0.06]">
        <span>Extensions</span>
      </div>
      <div className="p-3">
        <div className="flex items-center gap-2 bg-[#0d1117] border border-white/[0.08] rounded px-3 py-1.5 focus-within:border-white/[0.15] transition-colors">
          <Search size={14} className="text-[#484f58] shrink-0" />
          <input
            placeholder="Search extensions..."
            className="flex-1 bg-transparent text-[12px] text-[#e6edf3] placeholder-[#3d4450] outline-none font-mono"
          />
        </div>
      </div>
      <div className="px-3 pb-2 flex items-center gap-2 text-[10px]">
        <button className="px-2 py-0.5 bg-white/[0.06] text-white rounded font-mono cursor-pointer">Installed</button>
        <button className="px-2 py-0.5 text-[#3d4450] hover:text-[#484f58] rounded font-mono cursor-pointer">Popular</button>
        <button className="px-2 py-0.5 text-[#3d4450] hover:text-[#484f58] rounded font-mono cursor-pointer">Recommended</button>
      </div>
      <div className="flex-1 overflow-y-auto px-2 custom-scrollbar">
        {extensions.map((ext, i) => (
          <div
            key={i}
            className="px-2 py-2 hover:bg-white/[0.03] cursor-pointer transition-colors rounded mb-0.5"
          >
            <div className="flex items-start gap-2">
              <div className="w-8 h-8 rounded bg-white/[0.06] flex items-center justify-center shrink-0">
                <Blocks size={16} className="text-[#8b949e]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-[12px] text-[#e6edf3] font-mono">{ext.name}</span>
                  {ext.installed ? (
                    <span className="text-[9px] text-[#3fb950] font-mono">INSTALLED</span>
                  ) : (
                    <button className="p-1 text-white hover:bg-white/[0.06] rounded cursor-pointer">
                      <Download size={12} />
                    </button>
                  )}
                </div>
                <div className="text-[10px] text-[#3d4450]">{ext.publisher}</div>
                <div className="text-[11px] text-[#484f58] mt-0.5">{ext.desc}</div>
                <div className="text-[10px] text-[#3d4450] mt-0.5 flex items-center gap-1">
                  <Download size={9} /> {ext.downloads}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
