'use client'

import { useState } from 'react'
import { GitFork, FolderGit2, Star, ExternalLink, Loader2, CheckCircle2, GitBranch } from 'lucide-react'
import { useIDEStore } from '@/store/ide-store'

const trendingRepos = [
  { name: 'next.js', owner: 'vercel', stars: '128k', desc: 'The React Framework', lang: 'TypeScript', langColor: '#3178c6' },
  { name: 'react', owner: 'facebook', stars: '232k', desc: 'The library for web and native UIs', lang: 'JavaScript', langColor: '#f1e05a' },
  { name: 'typescript', owner: 'microsoft', stars: '105k', desc: 'TypeScript is a superset of JavaScript', lang: 'TypeScript', langColor: '#3178c6' },
  { name: 'rust', owner: 'rust-lang', stars: '100k', desc: 'Empowering everyone to build reliable software', lang: 'Rust', langColor: '#dea584' },
  { name: 'go', owner: 'golang', stars: '125k', desc: 'The Go programming language', lang: 'Go', langColor: '#00add8' },
]

export function GitHubPanel() {
  const { gitCloneUrl, setGitCloneUrl, isGitCloning, setIsGitCloning, addGitRepo, gitRepos } = useIDEStore()
  const [cloneSuccess, setCloneSuccess] = useState(false)

  const handleClone = () => {
    if (!gitCloneUrl.trim()) return
    setIsGitCloning(true)
    setCloneSuccess(false)

    setTimeout(() => {
      const repoName = gitCloneUrl.split('/').pop()?.replace('.git', '') || 'repo'
      addGitRepo(repoName)
      setIsGitCloning(false)
      setCloneSuccess(true)
      setGitCloneUrl('')
      setTimeout(() => setCloneSuccess(false), 3000)
    }, 1500)
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-[#5a6270] border-b border-[#00e5ff]/10">
        <span>GitHub</span>
        <ExternalLink size={12} className="text-[#3d4450] hover:text-[#5a6270] cursor-pointer" />
      </div>

      {/* Clone Section */}
      <div className="p-3 border-b border-[#00e5ff]/10">
        <div className="flex items-center gap-2 mb-2">
          <GitFork size={14} className="text-[#00e5ff]/70" />
          <span className="text-[12px] text-[#8b949e] font-mono">Clone Repository</span>
        </div>
        <div className="flex gap-2">
          <input
            value={gitCloneUrl}
            onChange={(e) => setGitCloneUrl(e.target.value)}
            placeholder="https://github.com/user/repo.git"
            className="flex-1 bg-[#0d1117] border border-[#00e5ff]/20 rounded px-3 py-1.5 text-[12px] text-[#e6edf3] placeholder-[#3d4450] outline-none font-mono focus:border-[#00e5ff]/50 transition-colors"
          />
          <button
            onClick={handleClone}
            disabled={isGitCloning || !gitCloneUrl.trim()}
            className={`
              px-3 py-1.5 rounded text-[11px] font-mono transition-all cursor-pointer
              ${cloneSuccess
                ? 'bg-[#3fb950]/10 text-[#3fb950]'
                : isGitCloning
                  ? 'bg-[#00e5ff]/5 text-[#3d4450] cursor-not-allowed'
                  : 'bg-[#00e5ff]/10 text-[#00e5ff] hover:bg-[#00e5ff]/20'
              }
            `}
          >
            {cloneSuccess ? (
              <CheckCircle2 size={14} />
            ) : isGitCloning ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              'Clone'
            )}
          </button>
        </div>
      </div>

      {/* Cloned Repos */}
      {gitRepos.length > 0 && (
        <div className="px-4 py-2 border-b border-[#00e5ff]/10">
          <div className="text-[11px] uppercase tracking-wider text-[#5a6270] font-semibold mb-2">
            Cloned Repos
          </div>
          {gitRepos.map((repo, i) => (
            <div key={i} className="flex items-center gap-2 py-1 text-[12px]">
              <FolderGit2 size={12} className="text-[#00e5ff]/70" />
              <span className="text-[#8b949e] font-mono">{repo}</span>
            </div>
          ))}
        </div>
      )}

      {/* Trending */}
      <div className="px-4 py-2">
        <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-[#5a6270] font-semibold mb-2">
          <GitBranch size={12} />
          Trending
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-2 custom-scrollbar">
        {trendingRepos.map((repo, i) => (
          <div
            key={i}
            className="px-2 py-2 hover:bg-[#00e5ff]/5 cursor-pointer transition-colors rounded mb-0.5"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="text-[12px] text-[#00e5ff]/70 font-mono">{repo.owner}/</span>
                <span className="text-[12px] text-[#e6edf3] font-mono font-semibold">{repo.name}</span>
              </div>
              <div className="flex items-center gap-1 text-[10px] text-[#3d4450]">
                <Star size={10} />
                {repo.stars}
              </div>
            </div>
            <div className="text-[11px] text-[#5a6270] mt-0.5">{repo.desc}</div>
            <div className="flex items-center gap-1.5 mt-1">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: repo.langColor }} />
              <span className="text-[10px] text-[#3d4450]">{repo.lang}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
