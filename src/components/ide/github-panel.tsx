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
      <div className="flex items-center justify-between px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-[#30363d] border-b border-[rgba(0,212,170,0.08)]">
        <span>GitHub</span>
        <ExternalLink size={12} className="text-[#30363d] hover:text-[#00d4aa] cursor-pointer transition-colors" />
      </div>

      {/* Clone Section */}
      <div className="p-3 border-b border-[rgba(0,212,170,0.08)]">
        <div className="flex items-center gap-2 mb-2">
          <GitFork size={14} className="text-[#00d4aa]/50" />
          <span className="text-[12px] text-[#6e7681] font-mono">Clone Repository</span>
        </div>
        <div className="flex gap-2">
          <input
            value={gitCloneUrl}
            onChange={(e) => setGitCloneUrl(e.target.value)}
            placeholder="https://github.com/user/repo.git"
            className="flex-1 bg-[#0d1117] border border-[rgba(0,212,170,0.08)] rounded px-3 py-1.5 text-[12px] text-[#e6edf3] placeholder-[#30363d] outline-none font-mono focus:border-[rgba(0,212,170,0.25)] transition-colors"
          />
          <button
            onClick={handleClone}
            disabled={isGitCloning || !gitCloneUrl.trim()}
            className={`
              px-3 py-1.5 rounded text-[11px] font-mono transition-all cursor-pointer
              ${cloneSuccess
                ? 'bg-[#3fb950]/10 text-[#3fb950]'
                : isGitCloning
                  ? 'bg-[rgba(0,212,170,0.04)] text-[#30363d] cursor-not-allowed'
                  : 'bg-[rgba(0,212,170,0.12)] text-[#00d4aa] hover:bg-[rgba(0,212,170,0.18)]'
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
        <div className="px-4 py-2 border-b border-[rgba(0,212,170,0.08)]">
          <div className="text-[11px] uppercase tracking-wider text-[#30363d] font-semibold mb-2">
            Cloned Repos
          </div>
          {gitRepos.map((repo, i) => (
            <div key={i} className="flex items-center gap-2 py-1 text-[12px]">
              <FolderGit2 size={12} className="text-[#00d4aa]/50" />
              <span className="text-[#6e7681] font-mono">{repo}</span>
            </div>
          ))}
        </div>
      )}

      {/* Trending */}
      <div className="px-4 py-2">
        <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-[#30363d] font-semibold mb-2">
          <GitBranch size={12} className="text-[#00d4aa]/40" />
          Trending
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-2 custom-scrollbar">
        {trendingRepos.map((repo, i) => (
          <div
            key={i}
            className="px-2 py-2 hover:bg-[rgba(0,212,170,0.04)] cursor-pointer transition-colors rounded mb-0.5"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="text-[12px] text-[#484f58] font-mono">{repo.owner}/</span>
                <span className="text-[12px] text-[#e6edf3] font-mono font-semibold">{repo.name}</span>
              </div>
              <div className="flex items-center gap-1 text-[10px] text-[#30363d]">
                <Star size={10} />
                {repo.stars}
              </div>
            </div>
            <div className="text-[11px] text-[#30363d] mt-0.5">{repo.desc}</div>
            <div className="flex items-center gap-1.5 mt-1">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: repo.langColor }} />
              <span className="text-[10px] text-[#30363d]">{repo.lang}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
