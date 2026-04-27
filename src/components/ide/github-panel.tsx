'use client'

import { useState } from 'react'
import { GitFork, FolderGit2, Star, ExternalLink, Loader2, CheckCircle2, GitBranch, Key, Search, AlertCircle, X } from 'lucide-react'
import { useIDEStore } from '@/store/ide-store'

interface GitHubRepo {
  name: string
  full_name: string
  owner: string
  description: string
  stars: number
  language: string
  langColor: string
  url: string
}

const LANG_COLORS: Record<string, string> = {
  TypeScript: '#3178c6', JavaScript: '#f1e05a', Python: '#3572A5', Rust: '#dea584',
  Go: '#00add8', Java: '#b07219', C: '#555555', 'C++': '#f34b7d', Ruby: '#701516',
  PHP: '#4F5D95', Swift: '#F05138', Kotlin: '#A97BFF', Dart: '#00B4AB',
  Shell: '#89e051', HTML: '#e34c26', CSS: '#1572b6', Vue: '#41b883',
  Svelte: '#ff3e00', Scala: '#c22d40', Haskell: '#5e5086', Lua: '#000080',
}

export function GitHubPanel() {
  const { gitCloneUrl, setGitCloneUrl, isGitCloning, setIsGitCloning, addGitRepo, gitRepos, githubToken, setGithubToken, addNotification } = useIDEStore()
  const [cloneSuccess, setCloneSuccess] = useState(false)
  const [trendingRepos, setTrendingRepos] = useState<GitHubRepo[]>([])
  const [isLoadingTrending, setIsLoadingTrending] = useState(false)
  const [trendingError, setTrendingError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<GitHubRepo[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showTokenInput, setShowTokenInput] = useState(false)
  const [tokenInput, setTokenInput] = useState('')

  // Fetch trending repos from GitHub API
  const fetchTrending = async () => {
    setIsLoadingTrending(true)
    setTrendingError('')
    try {
      const headers: Record<string, string> = {
        Accept: 'application/vnd.github.v3+json',
      }
      if (githubToken) {
        headers.Authorization = `token ${githubToken}`
      }

      // Use GitHub search API to get most starred repos created in the last month
      const oneMonthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      const response = await fetch(
        `https://api.github.com/search/repositories?q=created:>${oneMonthAgo}&sort=stars&order=desc&per_page=10`,
        { headers }
      )

      if (!response.ok) {
        throw new Error(`GitHub API returned ${response.status}`)
      }

      const data = await response.json()
      const repos: GitHubRepo[] = (data.items || []).map((repo: Record<string, unknown>) => ({
        name: repo.name as string,
        full_name: repo.full_name as string,
        owner: (repo.owner as Record<string, string>)?.login || '',
        description: (repo.description as string) || 'No description',
        stars: repo.stargazers_count as number,
        language: (repo.language as string) || 'Unknown',
        langColor: LANG_COLORS[(repo.language as string)] || '#8b949e',
        url: repo.html_url as string,
      }))

      setTrendingRepos(repos)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch trending repos'
      setTrendingError(msg)
    } finally {
      setIsLoadingTrending(false)
    }
  }

  // Search repos on GitHub
  const handleSearch = async () => {
    if (!searchQuery.trim()) return
    setIsSearching(true)
    try {
      const headers: Record<string, string> = {
        Accept: 'application/vnd.github.v3+json',
      }
      if (githubToken) {
        headers.Authorization = `token ${githubToken}`
      }

      const response = await fetch(
        `https://api.github.com/search/repositories?q=${encodeURIComponent(searchQuery)}&sort=stars&order=desc&per_page=10`,
        { headers }
      )

      if (!response.ok) {
        throw new Error(`GitHub API returned ${response.status}`)
      }

      const data = await response.json()
      const repos: GitHubRepo[] = (data.items || []).map((repo: Record<string, unknown>) => ({
        name: repo.name as string,
        full_name: repo.full_name as string,
        owner: (repo.owner as Record<string, string>)?.login || '',
        description: (repo.description as string) || 'No description',
        stars: repo.stargazers_count as number,
        language: (repo.language as string) || 'Unknown',
        langColor: LANG_COLORS[(repo.language as string)] || '#8b949e',
        url: repo.html_url as string,
      }))

      setSearchResults(repos)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Search failed'
      addNotification('error', msg)
    } finally {
      setIsSearching(false)
    }
  }

  // Validate and clone repository URL
  const handleClone = () => {
    const url = gitCloneUrl.trim()
    if (!url) return

    // Validate GitHub URL format
    const githubPattern = /^https?:\/\/github\.com\/[\w.-]+\/[\w.-]+(?:\.git)?$/i
    const sshPattern = /^git@github\.com:[\w.-]+\/[\w.-]+(?:\.git)?$/

    if (!githubPattern.test(url) && !sshPattern.test(url)) {
      addNotification('error', 'Invalid GitHub repository URL. Use format: https://github.com/user/repo')
      return
    }

    setIsGitCloning(true)
    setCloneSuccess(false)

    // Extract repo name from URL
    const repoName = url.replace(/\.git$/, '').split('/').pop() || 'repo'

    // In a real IDE this would do a git clone. Here we simulate by creating
    // a workspace entry and fetching repo metadata.
    const owner = url.replace(/\.git$/, '').split('/').slice(-2, -1)[0] || ''

    // Fetch repo contents via GitHub API
    const fetchRepoContents = async () => {
      try {
        const headers: Record<string, string> = {
          Accept: 'application/vnd.github.v3+json',
        }
        if (githubToken) {
          headers.Authorization = `token ${githubToken}`
        }

        const apiUrl = `https://api.github.com/repos/${owner}/${repoName}/contents`
        const response = await fetch(apiUrl, { headers })

        if (response.ok) {
          const contents = await response.json()
          if (Array.isArray(contents)) {
            // Create the repository workspace in virtual FS
            const store = useIDEStore.getState()
            const basePath = `/${repoName}`
            store.createFolder(basePath)

            for (const item of contents as Record<string, unknown>[]) {
              if (item.type === 'dir') {
                store.createFolder(`${basePath}/${item.name as string}`)
              } else if (item.type === 'file') {
                // Fetch file content
                try {
                  const fileRes = await fetch(item.download_url as string, { headers })
                  if (fileRes.ok) {
                    const content = await fileRes.text()
                    store.createFile(`${basePath}/${item.name as string}`, content)
                  } else {
                    store.createFile(`${basePath}/${item.name as string}`, `// ${item.name as string}`)
                  }
                } catch {
                  store.createFile(`${basePath}/${item.name as string}`, `// ${item.name as string}`)
                }
              }
            }
            addNotification('success', `Repository ${owner}/${repoName} cloned successfully!`)
          }
        } else {
          // API failed — create minimal workspace entry
          const store = useIDEStore.getState()
          store.createFolder(`/${repoName}`)
          store.createFile(`/${repoName}/README.md`, `# ${repoName}\n\nCloned from ${url}`)
          addNotification('warning', `Could not fetch full repo contents. Created minimal workspace for ${repoName}.`)
        }
      } catch {
        // Network error — create minimal workspace entry
        const store = useIDEStore.getState()
        store.createFolder(`/${repoName}`)
        store.createFile(`/${repoName}/README.md`, `# ${repoName}\n\nCloned from ${url}`)
        addNotification('warning', `Network error. Created minimal workspace for ${repoName}.`)
      } finally {
        addGitRepo(repoName)
        setIsGitCloning(false)
        setCloneSuccess(true)
        setGitCloneUrl('')
        setTimeout(() => setCloneSuccess(false), 3000)
      }
    }

    fetchRepoContents()
  }

  const handleSaveToken = () => {
    setGithubToken(tokenInput.trim())
    setShowTokenInput(false)
    addNotification('success', 'GitHub token saved. API rate limits will be increased.')
  }

  const formatStars = (n: number): string => {
    if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
    return String(n)
  }

  const displayRepos = searchResults.length > 0 ? searchResults : trendingRepos

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-[#30363d] border-b border-[rgba(0,212,170,0.08)]">
        <span>GitHub</span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowTokenInput(!showTokenInput)}
            className={`transition-colors cursor-pointer ${githubToken ? 'text-[#00d4aa]' : 'text-[#30363d] hover:text-[#484f58]'}`}
            title={githubToken ? 'Token configured' : 'Configure GitHub token'}
          >
            <Key size={12} />
          </button>
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#30363d] hover:text-[#00d4aa] transition-colors"
          >
            <ExternalLink size={12} />
          </a>
        </div>
      </div>

      {/* GitHub Token Configuration */}
      {showTokenInput && (
        <div className="p-3 border-b border-[rgba(0,212,170,0.08)] space-y-2">
          <div className="text-[11px] text-[#484f58]">
            Add a GitHub personal access token for higher API rate limits and private repo access.
            Your token is stored only in your browser session.
          </div>
          <div className="flex items-center gap-2 bg-[#0d1117] border border-[rgba(0,212,170,0.08)] rounded px-3 py-1.5 focus-within:border-[rgba(0,212,170,0.25)] transition-colors">
            <Key size={12} className="text-[#30363d] shrink-0" />
            <input
              type="password"
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              placeholder="ghp_xxxxxxxxxxxx"
              className="flex-1 bg-transparent text-[12px] text-[#e6edf3] placeholder-[#30363d] outline-none font-mono"
            />
          </div>
          <button
            onClick={handleSaveToken}
            disabled={!tokenInput.trim()}
            className="px-3 py-1 rounded text-[10px] font-mono bg-[rgba(0,212,170,0.12)] text-[#00d4aa] hover:bg-[rgba(0,212,170,0.18)] transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Save Token
          </button>
        </div>
      )}

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
            onKeyDown={(e) => e.key === 'Enter' && handleClone()}
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

      {/* Search GitHub */}
      <div className="p-3 border-b border-[rgba(0,212,170,0.08)]">
        <div className="flex items-center gap-2 mb-2">
          <Search size={12} className="text-[#00d4aa]/40" />
          <span className="text-[11px] text-[#30363d] font-mono">Search Repositories</span>
        </div>
        <div className="flex gap-2">
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Search GitHub..."
            className="flex-1 bg-[#0d1117] border border-[rgba(0,212,170,0.08)] rounded px-3 py-1.5 text-[12px] text-[#e6edf3] placeholder-[#30363d] outline-none font-mono focus:border-[rgba(0,212,170,0.25)] transition-colors"
          />
          <button
            onClick={handleSearch}
            disabled={isSearching || !searchQuery.trim()}
            className="px-2 py-1 rounded text-[11px] font-mono bg-[rgba(0,212,170,0.12)] text-[#00d4aa] hover:bg-[rgba(0,212,170,0.18)] transition-colors cursor-pointer disabled:opacity-50"
          >
            {isSearching ? <Loader2 size={12} className="animate-spin" /> : <Search size={12} />}
          </button>
        </div>
        {searchResults.length > 0 && (
          <button
            onClick={() => setSearchResults([])}
            className="mt-1 text-[10px] text-[#30363d] hover:text-[#484f58] font-mono cursor-pointer"
          >
            Clear search results
          </button>
        )}
      </div>

      {/* Trending */}
      <div className="px-4 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-[#30363d] font-semibold">
            <GitBranch size={12} className="text-[#00d4aa]/40" />
            {searchResults.length > 0 ? 'Search Results' : 'Trending This Month'}
          </div>
          {!searchResults.length && (
            <button
              onClick={fetchTrending}
              disabled={isLoadingTrending}
              className="text-[10px] text-[#30363d] hover:text-[#00d4aa] font-mono cursor-pointer transition-colors"
            >
              {isLoadingTrending ? 'Loading...' : 'Refresh'}
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-2 custom-scrollbar">
        {trendingError && (
          <div className="px-2 py-2 text-[11px] text-[#f85149] font-mono flex items-center gap-2">
            <AlertCircle size={12} />
            {trendingError}
          </div>
        )}

        {isLoadingTrending && (
          <div className="flex items-center justify-center py-8 text-[#30363d]">
            <Loader2 size={16} className="animate-spin" />
          </div>
        )}

        {!isLoadingTrending && displayRepos.length === 0 && !trendingError && (
          <div className="px-2 py-4 text-center">
            <p className="text-[11px] text-[#30363d] font-mono">Click Refresh to load trending repos</p>
            <p className="text-[10px] text-[#30363d] mt-1">Or search for specific repositories above</p>
          </div>
        )}

        {displayRepos.map((repo, i) => (
          <a
            key={i}
            href={repo.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block px-2 py-2 hover:bg-[rgba(0,212,170,0.04)] cursor-pointer transition-colors rounded mb-0.5"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="text-[12px] text-[#484f58] font-mono">{repo.owner}/</span>
                <span className="text-[12px] text-[#e6edf3] font-mono font-semibold">{repo.name}</span>
              </div>
              <div className="flex items-center gap-1 text-[10px] text-[#30363d]">
                <Star size={10} />
                {formatStars(repo.stars)}
              </div>
            </div>
            <div className="text-[11px] text-[#30363d] mt-0.5 line-clamp-1">{repo.description}</div>
            <div className="flex items-center gap-1.5 mt-1">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: repo.langColor }} />
              <span className="text-[10px] text-[#30363d]">{repo.language}</span>
            </div>
          </a>
        ))}
      </div>
    </div>
  )
}
