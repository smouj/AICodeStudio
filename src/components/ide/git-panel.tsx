'use client'

import { useState } from 'react'
import { GitBranch, GitCommit, RefreshCw, Plus, Minus, Check } from 'lucide-react'
import { useIDEStore } from '@/store/ide-store'

export function GitPanel() {
  const gitBranch = useIDEStore((s) => s.gitBranch)
  const gitStaged = useIDEStore((s) => s.gitStaged)
  const gitUnstaged = useIDEStore((s) => s.gitUnstaged)
  const gitCommitCount = useIDEStore((s) => s.gitCommitCount)
  const stageFile = useIDEStore((s) => s.stageFile)
  const unstageFile = useIDEStore((s) => s.unstageFile)
  const addNotification = useIDEStore((s) => s.addNotification)
  const addOutputEntry = useIDEStore((s) => s.addOutputEntry)
  const fileContents = useIDEStore((s) => s.fileContents)

  const [commitMessage, setCommitMessage] = useState('')
  const [isCommitting, setIsCommitting] = useState(false)

  const statusColors: Record<string, string> = {
    M: 'text-[#ffa657]',
    A: 'text-[#3fb950]',
    D: 'text-[#f85149]',
    U: 'text-[#a371f7]',
  }

  const getStatusForFile = (path: string): string => {
    if (gitStaged.includes(path)) return 'A'
    // If file exists in fileContents, it's modified; if not, it's deleted
    if (fileContents[path] !== undefined) return 'M'
    return 'D'
  }

  const handleCommit = () => {
    if (!commitMessage.trim()) {
      addNotification('warning', 'Please enter a commit message.')
      return
    }
    if (gitStaged.length === 0) {
      addNotification('warning', 'No changes staged for commit. Stage files first.')
      return
    }

    setIsCommitting(true)

    // Simulate commit in virtual git
    setTimeout(() => {
      const store = useIDEStore.getState()
      // Increment commit count
      const newCount = store.gitCommitCount + 1

      // Clear staged files
      useIDEStore.setState({
        gitStaged: [],
        gitCommitCount: newCount,
      })

      addOutputEntry('Git', `Committed ${gitStaged.length} file(s): "${commitMessage.trim()}"`)
      addNotification('success', `Commit ${newCount}: "${commitMessage.trim()}"`)
      setCommitMessage('')
      setIsCommitting(false)
    }, 300)
  }

  const allChanges = gitStaged.length + gitUnstaged.length

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-[#30363d] border-b border-[rgba(0,212,170,0.08)]">
        <span>Source Control</span>
        <RefreshCw size={12} className="text-[#30363d] hover:text-[#484f58] cursor-pointer transition-colors" />
      </div>
      <div className="p-3">
        <div className="flex items-center gap-2 text-[12px] text-[#6e7681]">
          <GitBranch size={14} className="text-[#00d4aa]/60" />
          <span className="font-mono text-[#e6edf3]">{gitBranch}</span>
          <span className="text-[#30363d]">·</span>
          <GitCommit size={12} className="text-[#30363d]" />
          <span className="text-[#30363d] font-mono text-[11px]">{gitCommitCount} commit{gitCommitCount !== 1 ? 's' : ''}</span>
        </div>
      </div>

      {allChanges === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center py-8 px-4">
          <GitBranch size={32} className="text-[#00d4aa]/10 mb-3" />
          <p className="text-[12px] text-[#30363d] font-mono">No changes detected</p>
          <p className="text-[10px] text-[#30363d] mt-1">Create or modify files to see changes here</p>
        </div>
      ) : (
        <>
          {/* Staged Changes */}
          {gitStaged.length > 0 && (
            <>
              <div className="px-4 py-1.5 text-[11px] uppercase tracking-wider text-[#3fb950] font-semibold flex items-center gap-2">
                <Check size={10} />
                Staged Changes ({gitStaged.length})
              </div>
              <div className="px-2">
                {gitStaged.map((path) => {
                  const fileName = path.split('/').pop() || path
                  const parentPath = path.substring(0, path.lastIndexOf('/'))
                  const status = getStatusForFile(path)
                  return (
                    <div
                      key={path}
                      className="flex items-center justify-between px-2 py-1.5 hover:bg-[rgba(0,212,170,0.04)] cursor-pointer transition-colors rounded"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-[12px] text-[#6e7681] font-mono">{fileName}</span>
                        <span className="text-[10px] text-[#30363d]">{parentPath}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className={`text-[11px] font-mono font-semibold ${statusColors[status]}`}>{status}</span>
                        <button
                          onClick={() => unstageFile(path)}
                          className="text-[#30363d] hover:text-[#ffa657] cursor-pointer"
                          title="Unstage"
                        >
                          <Minus size={10} />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}

          {/* Unstaged Changes */}
          {gitUnstaged.length > 0 && (
            <>
              <div className="px-4 py-1.5 text-[11px] uppercase tracking-wider text-[#ffa657] font-semibold flex items-center gap-2 mt-1">
                <span className="w-2.5 h-2.5 rounded-full border border-[#ffa657]" />
                Changes ({gitUnstaged.length})
              </div>
              <div className="px-2">
                {gitUnstaged.map((path) => {
                  const fileName = path.split('/').pop() || path
                  const parentPath = path.substring(0, path.lastIndexOf('/'))
                  const status = getStatusForFile(path)
                  return (
                    <div
                      key={path}
                      className="flex items-center justify-between px-2 py-1.5 hover:bg-[rgba(0,212,170,0.04)] cursor-pointer transition-colors rounded"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-[12px] text-[#6e7681] font-mono">{fileName}</span>
                        <span className="text-[10px] text-[#30363d]">{parentPath}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className={`text-[11px] font-mono font-semibold ${statusColors[status]}`}>{status}</span>
                        <button
                          onClick={() => stageFile(path)}
                          className="text-[#30363d] hover:text-[#3fb950] cursor-pointer"
                          title="Stage"
                        >
                          <Plus size={10} />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </>
      )}

      {/* Commit Section */}
      <div className="p-3 border-t border-[rgba(0,212,170,0.08)] mt-auto">
        <div className="flex items-center gap-2 bg-[#0d1117] border border-[rgba(0,212,170,0.08)] rounded px-3 py-1.5 focus-within:border-[rgba(0,212,170,0.25)] transition-colors">
          <input
            value={commitMessage}
            onChange={(e) => setCommitMessage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCommit()}
            placeholder="Commit message..."
            className="flex-1 bg-transparent text-[12px] text-[#e6edf3] placeholder-[#30363d] outline-none font-mono"
          />
        </div>
        <button
          onClick={handleCommit}
          disabled={isCommitting || !commitMessage.trim() || gitStaged.length === 0}
          className={`
            w-full mt-2 text-[12px] font-mono py-1.5 rounded transition-all cursor-pointer
            ${isCommitting
              ? 'bg-[rgba(0,212,170,0.04)] text-[#30363d] cursor-not-allowed'
              : commitMessage.trim() && gitStaged.length > 0
                ? 'bg-[rgba(0,212,170,0.12)] text-[#00d4aa] hover:bg-[rgba(0,212,170,0.18)]'
                : 'bg-[rgba(0,212,170,0.04)] text-[#30363d] cursor-not-allowed'
            }
          `}
        >
          {isCommitting ? 'Committing...' : `Commit (${gitStaged.length} staged)`}
        </button>
      </div>
    </div>
  )
}
