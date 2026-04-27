'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  GitBranch,
  GitCommit,
  GitPullRequest,
  RefreshCw,
  Plus,
  Minus,
  Check,
  ChevronDown,
  ChevronRight,
  Upload,
  Download,
  ArrowRightLeft,
  GitMerge,
  RotateCcw,
  AlertTriangle,
  FileText,
  Clock,
  User,
  Eye,
  Columns2,
  AlignLeft,
  Trash2,
  Copy,
  X,
  Loader2,
  FolderGit2,
  ArrowUpDown,
  FilePlus,
  FileMinus,
  Search,
} from 'lucide-react'
import { useIDEStore } from '@/store/ide-store'

// ─── Types ───────────────────────────────────────────────────

interface BranchInfo {
  name: string
  current: boolean
  isRemote?: boolean
}

interface FileChange {
  filepath: string
  status: string
  head: number
  workdir: number
  stage: number
}

interface DiffResult {
  oldContent: string
  newContent: string
  file: string
  status: string
}

interface LogCommit {
  oid: string
  message: string
  author: { name: string; email: string }
  timestamp: number
  parent: string[]
}

// ─── API Helper ──────────────────────────────────────────────

async function gitApi(action: string, params: Record<string, unknown> = {}): Promise<Record<string, unknown>> {
  const res = await fetch('/api/git', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, ...params }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Git operation failed')
  return data
}

async function gitGet(action: string, params: Record<string, string> = {}): Promise<Record<string, unknown>> {
  const query = new URLSearchParams({ action, ...params }).toString()
  const res = await fetch(`/api/git?${query}`)
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Git query failed')
  return data
}

// ─── Status Color Map ────────────────────────────────────────

const statusColors: Record<string, string> = {
  M: 'text-[#ffa657]',
  A: 'text-[#3fb950]',
  D: 'text-[#f85149]',
  U: 'text-[#a371f7]',
  R: 'text-[#79c0ff]',
  C: 'text-[#d2a8ff]',
  '?': 'text-[#6e7681]',
}

const statusLabels: Record<string, string> = {
  M: 'Modified',
  A: 'Added',
  D: 'Deleted',
  U: 'Untracked',
  R: 'Renamed',
  C: 'Copied',
  '?': 'Untracked',
}

// ─── Diff Viewer Sub-component ───────────────────────────────

function DiffViewer({ diff, onClose }: { diff: DiffResult | null; onClose: () => void }) {
  const [viewMode, setViewMode] = useState<'side' | 'inline'>('inline')

  if (!diff) return null

  const oldLines = diff.oldContent.split('\n')
  const newLines = diff.newContent.split('\n')

  const computeInlineDiff = () => {
    const maxLen = Math.max(oldLines.length, newLines.length)
    const result: { type: 'equal' | 'add' | 'remove'; oldLine?: string; newLine?: string; lineNum: number }[] = []

    for (let i = 0; i < maxLen; i++) {
      const o = oldLines[i]
      const n = newLines[i]
      if (o === undefined && n !== undefined) {
        result.push({ type: 'add', newLine: n, lineNum: i + 1 })
      } else if (o !== undefined && n === undefined) {
        result.push({ type: 'remove', oldLine: o, lineNum: i + 1 })
      } else if (o !== n) {
        result.push({ type: 'remove', oldLine: o, lineNum: i + 1 })
        result.push({ type: 'add', newLine: n, lineNum: i + 1 })
      } else {
        result.push({ type: 'equal', oldLine: o, newLine: n, lineNum: i + 1 })
      }
    }
    return result
  }

  // Count additions/deletions
  let additions = 0
  let deletions = 0
  const inlineDiff = computeInlineDiff()
  for (const line of inlineDiff) {
    if (line.type === 'add') additions++
    if (line.type === 'remove') deletions++
  }

  return (
    <div className="absolute inset-0 z-20 bg-[#080c12] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-[rgba(0,212,170,0.08)]">
        <div className="flex items-center gap-2">
          <FileText size={13} className="text-[#00d4aa]/60" />
          <span className="text-[12px] font-mono text-[#e6edf3]">{diff.file}</span>
          <span className="text-[10px] text-[#6e7681] ml-2">
            <span className="text-[#3fb950]">+{additions}</span>
            <span className="mx-1 text-[#30363d]">|</span>
            <span className="text-[#f85149]">-{deletions}</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-0.5 bg-[#0d1117] rounded border border-[rgba(0,212,170,0.08)]">
            <button
              onClick={() => setViewMode('inline')}
              className={`px-2 py-0.5 text-[10px] font-mono rounded-l transition-colors ${
                viewMode === 'inline'
                  ? 'bg-[rgba(0,212,170,0.12)] text-[#00d4aa]'
                  : 'text-[#6e7681] hover:text-[#e6edf3]'
              }`}
            >
              <AlignLeft size={11} className="inline mr-1" />
              Inline
            </button>
            <button
              onClick={() => setViewMode('side')}
              className={`px-2 py-0.5 text-[10px] font-mono rounded-r transition-colors ${
                viewMode === 'side'
                  ? 'bg-[rgba(0,212,170,0.12)] text-[#00d4aa]'
                  : 'text-[#6e7681] hover:text-[#e6edf3]'
              }`}
            >
              <Columns2 size={11} className="inline mr-1" />
              Split
            </button>
          </div>
          <button onClick={onClose} className="text-[#6e7681] hover:text-[#e6edf3] transition-colors">
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Diff Content */}
      <div className="flex-1 overflow-auto text-[12px] font-mono leading-[20px]">
        {viewMode === 'inline' ? (
          <table className="w-full border-collapse">
            <tbody>
              {inlineDiff.map((line, i) => (
                <tr
                  key={i}
                  className={
                    line.type === 'add'
                      ? 'bg-[rgba(63,185,80,0.08)]'
                      : line.type === 'remove'
                        ? 'bg-[rgba(248,81,73,0.08)]'
                        : ''
                  }
                >
                  <td className="w-[1%] px-2 text-right text-[#30363d] select-none border-r border-[rgba(0,212,170,0.04)]">
                    {line.type !== 'add' ? line.lineNum : ''}
                  </td>
                  <td className="w-[1%] px-2 text-right text-[#30363d] select-none border-r border-[rgba(0,212,170,0.04)]">
                    {line.type !== 'remove' ? line.lineNum : ''}
                  </td>
                  <td className="w-[1%] px-2 text-right select-none">
                    {line.type === 'add' ? (
                      <span className="text-[#3fb950]">+</span>
                    ) : line.type === 'remove' ? (
                      <span className="text-[#f85149]">-</span>
                    ) : (
                      <span className="text-[#30363d]">&nbsp;</span>
                    )}
                  </td>
                  <td className="px-3 whitespace-pre text-[#e6edf3]">
                    {line.type === 'remove' ? line.oldLine : line.newLine || line.oldLine}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="flex w-full">
            <div className="flex-1 border-r border-[rgba(0,212,170,0.08)] overflow-auto">
              <div className="px-2 py-1 text-[10px] text-[#6e7681] bg-[rgba(0,212,170,0.02)] border-b border-[rgba(0,212,170,0.04)]">
                Original
              </div>
              {oldLines.map((line, i) => (
                <div key={i} className="px-3 whitespace-pre text-[#e6edf3] flex">
                  <span className="w-8 text-right pr-2 text-[#30363d] select-none shrink-0">{i + 1}</span>
                  <span>{line}</span>
                </div>
              ))}
            </div>
            <div className="flex-1 overflow-auto">
              <div className="px-2 py-1 text-[10px] text-[#6e7681] bg-[rgba(0,212,170,0.02)] border-b border-[rgba(0,212,170,0.04)]">
                Modified
              </div>
              {newLines.map((line, i) => {
                const isAdded = i >= oldLines.length || oldLines[i] !== line
                return (
                  <div
                    key={i}
                    className={`px-3 whitespace-pre text-[#e6edf3] flex ${
                      isAdded ? 'bg-[rgba(63,185,80,0.08)]' : ''
                    }`}
                  >
                    <span className="w-8 text-right pr-2 text-[#30363d] select-none shrink-0">{i + 1}</span>
                    <span>
                      {isAdded && <span className="text-[#3fb950] mr-1">+</span>}
                      {line}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Main Component ──────────────────────────────────────────

export function GitOperations() {
  // Store state
  const gitBranch = useIDEStore((s) => s.gitBranch)
  const gitStaged = useIDEStore((s) => s.gitStaged)
  const gitUnstaged = useIDEStore((s) => s.gitUnstaged)
  const gitCommitCount = useIDEStore((s) => s.gitCommitCount)
  const gitInitialized = useIDEStore((s) => s.gitInitialized)
  const gitRemotes = useIDEStore((s) => s.gitRemotes)
  const gitLog = useIDEStore((s) => s.gitLog)
  const gitDiff = useIDEStore((s) => s.gitDiff)
  const gitLoading = useIDEStore((s) => s.gitLoading)
  const addNotification = useIDEStore((s) => s.addNotification)
  const addOutputEntry = useIDEStore((s) => s.addOutputEntry)
  const fileContents = useIDEStore((s) => s.fileContents)

  // Store actions
  const gitInit = useIDEStore((s) => s.gitInit)
  const gitAdd = useIDEStore((s) => s.gitAdd)
  const gitCommit = useIDEStore((s) => s.gitCommit)
  const gitPush = useIDEStore((s) => s.gitPush)
  const gitPull = useIDEStore((s) => s.gitPull)
  const gitCheckout = useIDEStore((s) => s.gitCheckout)
  const gitCreateBranch = useIDEStore((s) => s.gitCreateBranch)
  const gitMerge = useIDEStore((s) => s.gitMerge)
  const gitRebase = useIDEStore((s) => s.gitRebase)
  const gitFetchDiff = useIDEStore((s) => s.gitFetchDiff)
  const gitFetchLog = useIDEStore((s) => s.gitFetchLog)
  const stageFile = useIDEStore((s) => s.stageFile)
  const unstageFile = useIDEStore((s) => s.unstageFile)

  // Local state
  const [commitMessage, setCommitMessage] = useState('')
  const [signedOff, setSignedOff] = useState(false)
  const [amendCommit, setAmendCommit] = useState(false)
  const [newBranchName, setNewBranchName] = useState('')
  const [showBranchDropdown, setShowBranchDropdown] = useState(false)
  const [showNewBranch, setShowNewBranch] = useState(false)
  const [branches, setBranches] = useState<BranchInfo[]>([])
  const [activeSection, setActiveSection] = useState<string>('changes')
  const [fileChanges, setFileChanges] = useState<FileChange[]>([])
  const [activeDiff, setActiveDiff] = useState<DiffResult | null>(null)
  const [isCommitting, setIsCommitting] = useState(false)
  const [pushForce, setPushForce] = useState(false)
  const [pullRebase, setPullRebase] = useState(false)
  const [mergeBranch, setMergeBranch] = useState('')
  const [rebaseBranch, setRebaseBranch] = useState('')
  const [logCommits, setLogCommits] = useState<LogCommit[]>([])
  const [selectedCommit, setSelectedCommit] = useState<LogCommit | null>(null)
  const [syncStatus, setSyncStatus] = useState<'synced' | 'ahead' | 'behind' | 'diverged'>('synced')
  const [aheadBehind, setAheadBehind] = useState({ ahead: 0, behind: 0 })
  const [commitTemplate, setCommitTemplate] = useState('')
  const [showTemplates, setShowTemplates] = useState(false)

  const commitTemplates = [
    'feat: ',
    'fix: ',
    'docs: ',
    'style: ',
    'refactor: ',
    'perf: ',
    'test: ',
    'chore: ',
    'ci: ',
    'build: ',
  ]

  // ─── Data Fetching ─────────────────────────────────────

  const refreshStatus = useCallback(async () => {
    try {
      const data = await gitGet('status')
      const branch = data.branch as string
      const files = (data.files as FileChange[]) || []
      if (branch) {
        useIDEStore.setState({ gitBranch: branch })
      }

      const unstaged: string[] = []
      const staged: string[] = []

      for (const f of files) {
        if (f.status === 'unmodified') continue
        if (f.status === 'staged' || f.status === 'modified-staged') {
          staged.push(f.filepath)
        } else {
          unstaged.push(f.filepath)
        }
      }

      setFileChanges(files.filter((f) => f.status !== 'unmodified'))
      useIDEStore.setState({ gitStaged: staged, gitUnstaged: unstaged })
      useIDEStore.setState({ gitInitialized: true })
    } catch {
      // Not a git repo or error
    }
  }, [])

  const refreshBranches = useCallback(async () => {
    try {
      const data = await gitGet('branches')
      const br = (data.branches as BranchInfo[]) || []
      setBranches(br)
    } catch {
      // Ignore
    }
  }, [])

  const refreshRemotes = useCallback(async () => {
    try {
      const data = await gitGet('remotes')
      const remotes = (data.remotes as { remote: string; url: string }[]) || []
      useIDEStore.setState({
        gitRemotes: remotes.map((r) => ({ name: r.remote, url: r.url })),
      })
    } catch {
      // Ignore
    }
  }, [])

  const refreshLog = useCallback(async () => {
    try {
      const data = await gitGet('log', { depth: '50' })
      const commits = (data.commits as LogCommit[]) || []
      setLogCommits(commits)
      useIDEStore.setState({
        gitLog: commits.map((c) => ({
          hash: c.oid,
          message: c.message,
          author: c.author.name,
          date: new Date(c.timestamp * 1000).toISOString(),
          parents: c.parent,
        })),
        gitCommitCount: commits.length,
      })
    } catch {
      // Ignore
    }
  }, [])

  const refreshAll = useCallback(async () => {
    await Promise.all([refreshStatus(), refreshBranches(), refreshRemotes(), refreshLog()])
  }, [refreshStatus, refreshBranches, refreshRemotes, refreshLog])

  // ─── Initial Load ──────────────────────────────────────

  useEffect(() => {
    refreshAll()
  }, [refreshAll])

  // ─── Computed Status for Files ─────────────────────────

  const getStatusForFile = (filepath: string): string => {
    const change = fileChanges.find((f) => f.filepath === filepath)
    if (change) {
      if (change.head === 0 && change.workdir === 2) return 'A'
      if (change.head === 1 && change.workdir === 0) return 'D'
      if (change.status === 'untracked') return '?'
      return 'M'
    }
    if (fileContents[filepath] !== undefined) return 'M'
    return '?'
  }

  // ─── Action Handlers ───────────────────────────────────

  const handleInit = async () => {
    await gitInit()
    await refreshAll()
  }

  const handleStageFile = async (filepath: string) => {
    try {
      await gitApi('add', { filepath })
      stageFile(filepath)
      addOutputEntry('Git', `Staged: ${filepath}`)
      await refreshStatus()
    } catch (err) {
      addNotification('error', `Stage failed: ${(err as Error).message}`)
    }
  }

  const handleStageAll = async () => {
    try {
      await gitApi('add', { filepath: '.' })
      addOutputEntry('Git', 'Staged all changes')
      await refreshStatus()
    } catch (err) {
      addNotification('error', `Stage all failed: ${(err as Error).message}`)
    }
  }

  const handleUnstageFile = async (filepath: string) => {
    try {
      await gitApi('add', { filepath, unstage: true })
      unstageFile(filepath)
      addOutputEntry('Git', `Unstaged: ${filepath}`)
      await refreshStatus()
    } catch (err) {
      addNotification('error', `Unstage failed: ${(err as Error).message}`)
    }
  }

  const handleDiscardFile = async (filepath: string) => {
    try {
      await gitApi('add', { filepath, discard: true })
      addOutputEntry('Git', `Discarded changes: ${filepath}`)
      addNotification('info', `Discarded changes: ${filepath}`)
      await refreshStatus()
    } catch (err) {
      addNotification('error', `Discard failed: ${(err as Error).message}`)
    }
  }

  const handleCommit = async () => {
    if (!commitMessage.trim()) {
      addNotification('warning', 'Please enter a commit message.')
      return
    }
    if (gitStaged.length === 0) {
      addNotification('warning', 'No changes staged for commit.')
      return
    }

    setIsCommitting(true)
    try {
      let msg = commitMessage.trim()
      if (signedOff) {
        msg += `\n\nSigned-off-by: AICodeStudio <ide@aicodestudio.dev>`
      }

      await gitApi('commit', {
        message: msg,
        amend: amendCommit,
      })

      addNotification('success', `Committed: ${commitMessage.trim()}`)
      addOutputEntry('Git', `Committed: ${commitMessage.trim()}`)
      setCommitMessage('')
      setAmendCommit(false)
      await refreshAll()
    } catch (err) {
      addNotification('error', `Commit failed: ${(err as Error).message}`)
    } finally {
      setIsCommitting(false)
    }
  }

  const handlePush = async () => {
    const remote = gitRemotes.length > 0 ? gitRemotes[0].name : 'origin'
    try {
      await gitPush(remote, gitBranch)
      if (pushForce) {
        addOutputEntry('Git', `Force pushed to ${remote}/${gitBranch}`)
      }
      addNotification('success', `Pushed to ${remote}/${gitBranch}`)
      await refreshStatus()
    } catch (err) {
      addNotification('error', `Push failed: ${(err as Error).message}`)
    }
  }

  const handlePull = async () => {
    const remote = gitRemotes.length > 0 ? gitRemotes[0].name : 'origin'
    try {
      await gitPull(remote, gitBranch)
      addNotification('success', `Pulled from ${remote}/${gitBranch}`)
      await refreshAll()
    } catch (err) {
      addNotification('error', `Pull failed: ${(err as Error).message}`)
    }
  }

  const handleFetch = async () => {
    try {
      await gitGet('remotes')
      addNotification('success', 'Fetched remote info')
      await refreshAll()
    } catch (err) {
      addNotification('error', `Fetch failed: ${(err as Error).message}`)
    }
  }

  const handleCheckout = async (branch: string) => {
    try {
      await gitCheckout(branch)
      setShowBranchDropdown(false)
      addNotification('success', `Switched to ${branch}`)
      await refreshAll()
    } catch (err) {
      addNotification('error', `Checkout failed: ${(err as Error).message}`)
    }
  }

  const handleCreateBranch = async () => {
    if (!newBranchName.trim()) return
    try {
      await gitCreateBranch(newBranchName.trim())
      await gitCheckout(newBranchName.trim())
      addNotification('success', `Created & switched to ${newBranchName.trim()}`)
      setNewBranchName('')
      setShowNewBranch(false)
      setShowBranchDropdown(false)
      await refreshAll()
    } catch (err) {
      addNotification('error', `Branch creation failed: ${(err as Error).message}`)
    }
  }

  const handleMerge = async () => {
    if (!mergeBranch.trim()) {
      addNotification('warning', 'Select a branch to merge')
      return
    }
    try {
      await gitMerge(mergeBranch)
      addNotification('success', `Merged ${mergeBranch} into ${gitBranch}`)
      setMergeBranch('')
      await refreshAll()
    } catch (err) {
      addNotification('error', `Merge failed: ${(err as Error).message}`)
    }
  }

  const handleRebase = async () => {
    if (!rebaseBranch.trim()) {
      addNotification('warning', 'Select a branch to rebase onto')
      return
    }
    try {
      await gitRebase(rebaseBranch)
      addNotification('success', `Rebased onto ${rebaseBranch}`)
      setRebaseBranch('')
      await refreshAll()
    } catch (err) {
      addNotification('error', `Rebase failed: ${(err as Error).message}`)
    }
  }

  const handleViewDiff = async (filepath: string) => {
    try {
      const data = await gitGet('diff', { file: filepath })
      setActiveDiff({
        oldContent: (data.oldContent as string) || '',
        newContent: (data.newContent as string) || '',
        file: filepath,
        status: (data.status as string) || 'modified',
      })
    } catch (err) {
      addNotification('error', `Diff failed: ${(err as Error).message}`)
    }
  }

  // ─── Section toggle ────────────────────────────────────

  const sections = [
    { id: 'changes', label: 'Changes', icon: FileText },
    { id: 'commit', label: 'Commit', icon: GitCommit },
    { id: 'branches', label: 'Branches', icon: GitBranch },
    { id: 'sync', label: 'Push/Pull', icon: ArrowUpDown },
    { id: 'merge', label: 'Merge/Rebase', icon: GitMerge },
    { id: 'log', label: 'History', icon: Clock },
  ]

  const allChanges = gitStaged.length + gitUnstaged.length

  // ─── Not Initialized View ──────────────────────────────

  if (!gitInitialized) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex items-center justify-between px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-[#30363d] border-b border-[rgba(0,212,170,0.08)]">
          <span>Source Control</span>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center text-center py-8 px-4">
          <FolderGit2 size={40} className="text-[#00d4aa]/10 mb-4" />
          <p className="text-[13px] text-[#6e7681] font-mono mb-2">No Git Repository</p>
          <p className="text-[11px] text-[#30363d] mb-4">
            Initialize a repository to start tracking changes
          </p>
          <button
            onClick={handleInit}
            disabled={gitLoading}
            className="px-4 py-1.5 text-[12px] font-mono rounded bg-[rgba(0,212,170,0.12)] text-[#00d4aa] hover:bg-[rgba(0,212,170,0.18)] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {gitLoading ? 'Initializing...' : 'Initialize Repository'}
          </button>
        </div>
      </div>
    )
  }

  // ─── Main View ─────────────────────────────────────────

  return (
    <div className="h-full flex flex-col relative">
      {/* Diff Viewer Overlay */}
      {activeDiff && <DiffViewer diff={activeDiff} onClose={() => setActiveDiff(null)} />}

      {/* ─── Header ────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-[#30363d] border-b border-[rgba(0,212,170,0.08)]">
        <span>Source Control</span>
        <div className="flex items-center gap-2">
          <button
            onClick={refreshAll}
            className="text-[#30363d] hover:text-[#00d4aa] cursor-pointer transition-colors"
            title="Refresh"
          >
            <RefreshCw size={12} className={gitLoading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* ─── Repository Status ──────────────────────────── */}
      <div className="px-3 py-2 border-b border-[rgba(0,212,170,0.04)]">
        <div className="flex items-center gap-2 text-[12px]">
          <GitBranch size={14} className="text-[#00d4aa]/60" />
          <span className="font-mono text-[#e6edf3]">{gitBranch}</span>
          <span className="text-[#30363d]">·</span>
          <GitCommit size={12} className="text-[#30363d]" />
          <span className="text-[#30363d] font-mono text-[11px]">{gitCommitCount} commit{gitCommitCount !== 1 ? 's' : ''}</span>
          {gitRemotes.length > 0 && (
            <>
              <span className="text-[#30363d]">·</span>
              <span className="text-[11px] text-[#00d4aa]/40 font-mono">{gitRemotes[0].name}</span>
            </>
          )}
        </div>
        {/* Sync Status */}
        {(aheadBehind.ahead > 0 || aheadBehind.behind > 0) && (
          <div className="flex items-center gap-2 mt-1 text-[10px] font-mono">
            {aheadBehind.ahead > 0 && (
              <span className="text-[#3fb950]">
                <Upload size={10} className="inline mr-0.5" />{aheadBehind.ahead} ahead
              </span>
            )}
            {aheadBehind.behind > 0 && (
              <span className="text-[#ffa657]">
                <Download size={10} className="inline mr-0.5" />{aheadBehind.behind} behind
              </span>
            )}
          </div>
        )}
      </div>

      {/* ─── Section Tabs ──────────────────────────────── */}
      <div className="flex overflow-x-auto border-b border-[rgba(0,212,170,0.08)] scrollbar-none">
        {sections.map((sec) => {
          const Icon = sec.icon
          const isActive = activeSection === sec.id
          return (
            <button
              key={sec.id}
              onClick={() => setActiveSection(sec.id)}
              className={`flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-mono whitespace-nowrap transition-colors border-b-2 cursor-pointer ${
                isActive
                  ? 'text-[#00d4aa] border-[#00d4aa] bg-[rgba(0,212,170,0.04)]'
                  : 'text-[#6e7681] border-transparent hover:text-[#e6edf3]'
              }`}
            >
              <Icon size={11} />
              {sec.label}
              {sec.id === 'changes' && allChanges > 0 && (
                <span className="ml-0.5 px-1 rounded-full bg-[rgba(0,212,170,0.12)] text-[#00d4aa] text-[9px]">
                  {allChanges}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* ─── Section Content ────────────────────────────── */}
      <div className="flex-1 overflow-y-auto max-h-96" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(0,212,170,0.15) transparent' }}>

        {/* ─── CHANGES SECTION ─────────────────────────── */}
        {activeSection === 'changes' && (
          <div>
            {allChanges === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
                <Check size={28} className="text-[#3fb950]/20 mb-2" />
                <p className="text-[12px] text-[#30363d] font-mono">No changes detected</p>
                <p className="text-[10px] text-[#30363d] mt-1">Working tree clean</p>
              </div>
            ) : (
              <>
                {/* Staged Changes */}
                {gitStaged.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between px-3 py-1.5 text-[11px] uppercase tracking-wider text-[#3fb950] font-semibold">
                      <div className="flex items-center gap-1.5">
                        <Check size={10} />
                        Staged Changes ({gitStaged.length})
                      </div>
                      <button
                        onClick={() => handleUnstageFile('.')}
                        className="text-[#6e7681] hover:text-[#ffa657] text-[10px] font-normal cursor-pointer"
                        title="Unstage all"
                      >
                        Unstage All
                      </button>
                    </div>
                    <div className="px-1.5">
                      {gitStaged.map((filepath) => {
                        const fileName = filepath.split('/').pop() || filepath
                        const parentPath = filepath.substring(0, filepath.lastIndexOf('/'))
                        const status = getStatusForFile(filepath)
                        return (
                          <div
                            key={filepath}
                            className="flex items-center justify-between px-2 py-1 hover:bg-[rgba(0,212,170,0.04)] cursor-pointer transition-colors rounded group"
                          >
                            <div
                              className="flex items-center gap-2 min-w-0 flex-1"
                              onClick={() => handleViewDiff(filepath)}
                            >
                              <span className="text-[12px] text-[#6e7681] font-mono truncate">{fileName}</span>
                              {parentPath && (
                                <span className="text-[10px] text-[#30363d] truncate">{parentPath}</span>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5 opacity-60 group-hover:opacity-100">
                              <span className={`text-[11px] font-mono font-semibold ${statusColors[status]}`}>
                                {status}
                              </span>
                              <button
                                onClick={() => handleViewDiff(filepath)}
                                className="text-[#30363d] hover:text-[#00d4aa] cursor-pointer"
                                title="View diff"
                              >
                                <Eye size={11} />
                              </button>
                              <button
                                onClick={() => handleUnstageFile(filepath)}
                                className="text-[#30363d] hover:text-[#ffa657] cursor-pointer"
                                title="Unstage"
                              >
                                <Minus size={11} />
                              </button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Unstaged Changes */}
                {gitUnstaged.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between px-3 py-1.5 text-[11px] uppercase tracking-wider text-[#ffa657] font-semibold">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full border border-[#ffa657]" />
                        Changes ({gitUnstaged.length})
                      </div>
                      <button
                        onClick={handleStageAll}
                        className="text-[#6e7681] hover:text-[#3fb950] text-[10px] font-normal cursor-pointer"
                        title="Stage all"
                      >
                        Stage All
                      </button>
                    </div>
                    <div className="px-1.5">
                      {gitUnstaged.map((filepath) => {
                        const fileName = filepath.split('/').pop() || filepath
                        const parentPath = filepath.substring(0, filepath.lastIndexOf('/'))
                        const status = getStatusForFile(filepath)
                        return (
                          <div
                            key={filepath}
                            className="flex items-center justify-between px-2 py-1 hover:bg-[rgba(0,212,170,0.04)] cursor-pointer transition-colors rounded group"
                          >
                            <div
                              className="flex items-center gap-2 min-w-0 flex-1"
                              onClick={() => handleViewDiff(filepath)}
                            >
                              <span className="text-[12px] text-[#6e7681] font-mono truncate">{fileName}</span>
                              {parentPath && (
                                <span className="text-[10px] text-[#30363d] truncate">{parentPath}</span>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5 opacity-60 group-hover:opacity-100">
                              <span className={`text-[11px] font-mono font-semibold ${statusColors[status]}`}>
                                {status}
                              </span>
                              <button
                                onClick={() => handleViewDiff(filepath)}
                                className="text-[#30363d] hover:text-[#00d4aa] cursor-pointer"
                                title="View diff"
                              >
                                <Eye size={11} />
                              </button>
                              <button
                                onClick={() => handleDiscardFile(filepath)}
                                className="text-[#30363d] hover:text-[#f85149] cursor-pointer"
                                title="Discard changes"
                              >
                                <RotateCcw size={11} />
                              </button>
                              <button
                                onClick={() => handleStageFile(filepath)}
                                className="text-[#30363d] hover:text-[#3fb950] cursor-pointer"
                                title="Stage"
                              >
                                <Plus size={11} />
                              </button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Diff Stats Summary */}
                {fileChanges.length > 0 && (
                  <div className="px-3 py-2 border-t border-[rgba(0,212,170,0.04)] mt-1">
                    <div className="flex items-center gap-3 text-[10px] font-mono text-[#6e7681]">
                      <span className="flex items-center gap-1">
                        <FilePlus size={10} className="text-[#3fb950]" />
                        {fileChanges.filter((f) => f.status === 'untracked' || f.head === 0).length} added
                      </span>
                      <span className="flex items-center gap-1">
                        <FileText size={10} className="text-[#ffa657]" />
                        {fileChanges.filter((f) => f.status === 'modified').length} modified
                      </span>
                      <span className="flex items-center gap-1">
                        <FileMinus size={10} className="text-[#f85149]" />
                        {fileChanges.filter((f) => f.status === 'deleted' || f.workdir === 0).length} deleted
                      </span>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ─── COMMIT SECTION ──────────────────────────── */}
        {activeSection === 'commit' && (
          <div className="p-3 space-y-2.5">
            {/* Commit Message */}
            <div className="relative">
              <div className="flex items-center gap-1.5 bg-[#0d1117] border border-[rgba(0,212,170,0.08)] rounded px-3 py-1.5 focus-within:border-[rgba(0,212,170,0.25)] transition-colors">
                <input
                  value={commitMessage}
                  onChange={(e) => setCommitMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleCommit()}
                  placeholder="Commit message..."
                  className="flex-1 bg-transparent text-[12px] text-[#e6edf3] placeholder-[#30363d] outline-none font-mono"
                />
                <button
                  onClick={() => setShowTemplates(!showTemplates)}
                  className="text-[#30363d] hover:text-[#00d4aa] cursor-pointer transition-colors"
                  title="Commit templates"
                >
                  <Search size={12} />
                </button>
              </div>

              {/* Template Dropdown */}
              {showTemplates && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-[#0d1117] border border-[rgba(0,212,170,0.15)] rounded shadow-lg z-10 overflow-hidden">
                  {commitTemplates.map((tmpl) => (
                    <button
                      key={tmpl}
                      onClick={() => {
                        setCommitMessage(tmpl)
                        setShowTemplates(false)
                      }}
                      className="w-full text-left px-3 py-1.5 text-[11px] font-mono text-[#6e7681] hover:text-[#e6edf3] hover:bg-[rgba(0,212,170,0.04)] transition-colors cursor-pointer"
                    >
                      {tmpl}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Extended message */}
            <textarea
              value={commitMessage.includes('\n') ? commitMessage.split('\n').slice(1).join('\n') : ''}
              onChange={(e) => {
                const firstLine = commitMessage.split('\n')[0]
                setCommitMessage(firstLine + '\n' + e.target.value)
              }}
              placeholder="Extended description (optional)..."
              rows={3}
              className="w-full bg-[#0d1117] border border-[rgba(0,212,170,0.08)] rounded px-3 py-1.5 text-[11px] text-[#6e7681] placeholder-[#30363d] outline-none font-mono focus:border-[rgba(0,212,170,0.25)] transition-colors resize-none"
            />

            {/* Options Row */}
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-1.5 cursor-pointer group">
                <div
                  className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition-colors ${
                    signedOff
                      ? 'bg-[rgba(0,212,170,0.2)] border-[#00d4aa] text-[#00d4aa]'
                      : 'border-[#30363d] group-hover:border-[#6e7681]'
                  }`}
                  onClick={() => setSignedOff(!signedOff)}
                >
                  {signedOff && <Check size={9} />}
                </div>
                <span className="text-[10px] text-[#6e7681] font-mono">Signed-off-by</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer group">
                <div
                  className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition-colors ${
                    amendCommit
                      ? 'bg-[rgba(255,166,87,0.2)] border-[#ffa657] text-[#ffa657]'
                      : 'border-[#30363d] group-hover:border-[#6e7681]'
                  }`}
                  onClick={() => setAmendCommit(!amendCommit)}
                >
                  {amendCommit && <Check size={9} />}
                </div>
                <span className="text-[10px] text-[#6e7681] font-mono">Amend</span>
              </label>
            </div>

            {/* Commit Button */}
            <button
              onClick={handleCommit}
              disabled={isCommitting || !commitMessage.trim() || gitStaged.length === 0}
              className={`
                w-full text-[12px] font-mono py-1.5 rounded transition-all cursor-pointer flex items-center justify-center gap-1.5
                ${isCommitting
                  ? 'bg-[rgba(0,212,170,0.04)] text-[#30363d] cursor-not-allowed'
                  : commitMessage.trim() && gitStaged.length > 0
                    ? 'bg-[rgba(0,212,170,0.12)] text-[#00d4aa] hover:bg-[rgba(0,212,170,0.18)]'
                    : 'bg-[rgba(0,212,170,0.04)] text-[#30363d] cursor-not-allowed'
                }
              `}
            >
              {isCommitting ? (
                <>
                  <Loader2 size={12} className="animate-spin" />
                  Committing...
                </>
              ) : (
                <>
                  <GitCommit size={12} />
                  {amendCommit ? 'Amend Commit' : `Commit (${gitStaged.length} staged)`}
                </>
              )}
            </button>

            {gitStaged.length === 0 && (
              <p className="text-[10px] text-[#30363d] text-center font-mono">
                Stage changes to commit them
              </p>
            )}
          </div>
        )}

        {/* ─── BRANCHES SECTION ────────────────────────── */}
        {activeSection === 'branches' && (
          <div className="p-3 space-y-3">
            {/* Current Branch */}
            <div>
              <div className="text-[10px] uppercase tracking-wider text-[#6e7681] font-semibold mb-1.5">Current Branch</div>
              <div className="flex items-center justify-between bg-[#0d1117] border border-[rgba(0,212,170,0.08)] rounded px-3 py-1.5">
                <div className="flex items-center gap-2">
                  <GitBranch size={13} className="text-[#00d4aa]/60" />
                  <span className="text-[12px] font-mono text-[#e6edf3]">{gitBranch}</span>
                </div>
                <button
                  onClick={() => setShowBranchDropdown(!showBranchDropdown)}
                  className="text-[#6e7681] hover:text-[#e6edf3] cursor-pointer transition-colors"
                >
                  <ChevronDown size={13} />
                </button>
              </div>

              {/* Branch Dropdown */}
              {showBranchDropdown && (
                <div className="mt-1 bg-[#0d1117] border border-[rgba(0,212,170,0.15)] rounded shadow-lg overflow-hidden">
                  <div className="px-2 py-1 border-b border-[rgba(0,212,170,0.08)]">
                    <input
                      value={newBranchName}
                      onChange={(e) => setNewBranchName(e.target.value)}
                      placeholder="Create new branch..."
                      className="w-full bg-transparent text-[11px] text-[#e6edf3] placeholder-[#30363d] outline-none font-mono"
                      onKeyDown={(e) => e.key === 'Enter' && handleCreateBranch()}
                    />
                  </div>
                  {newBranchName.trim() && (
                    <button
                      onClick={handleCreateBranch}
                      className="w-full text-left px-3 py-1.5 text-[11px] font-mono text-[#00d4aa] hover:bg-[rgba(0,212,170,0.04)] transition-colors cursor-pointer flex items-center gap-2"
                    >
                      <Plus size={11} />
                      Create &quot;{newBranchName.trim()}&quot;
                    </button>
                  )}
                  <div className="max-h-40 overflow-y-auto">
                    {branches
                      .filter((b) => !b.isRemote)
                      .map((branch) => (
                        <button
                          key={branch.name}
                          onClick={() => !branch.current && handleCheckout(branch.name)}
                          className={`w-full text-left px-3 py-1.5 text-[11px] font-mono transition-colors cursor-pointer flex items-center gap-2 ${
                            branch.current
                              ? 'text-[#00d4aa] bg-[rgba(0,212,170,0.04)]'
                              : 'text-[#6e7681] hover:text-[#e6edf3] hover:bg-[rgba(0,212,170,0.04)]'
                          }`}
                        >
                          <GitBranch size={11} />
                          {branch.name}
                          {branch.current && <Check size={10} className="ml-auto" />}
                        </button>
                      ))}
                  </div>
                </div>
              )}
            </div>

            {/* Branch List */}
            <div>
              <div className="text-[10px] uppercase tracking-wider text-[#6e7681] font-semibold mb-1.5">
                Local Branches ({branches.filter((b) => !b.isRemote).length})
              </div>
              <div className="space-y-0.5 max-h-32 overflow-y-auto">
                {branches
                  .filter((b) => !b.isRemote)
                  .map((branch) => (
                    <div
                      key={branch.name}
                      className={`flex items-center gap-2 px-2.5 py-1 rounded text-[11px] font-mono transition-colors ${
                        branch.current
                          ? 'text-[#00d4aa] bg-[rgba(0,212,170,0.06)]'
                          : 'text-[#6e7681] hover:bg-[rgba(0,212,170,0.04)]'
                      }`}
                    >
                      <GitBranch size={11} />
                      <span className="truncate flex-1">{branch.name}</span>
                      {branch.current && (
                        <span className="text-[9px] bg-[rgba(0,212,170,0.12)] text-[#00d4aa] px-1.5 py-0.5 rounded">
                          current
                        </span>
                      )}
                      {!branch.current && (
                        <button
                          onClick={() => handleCheckout(branch.name)}
                          className="text-[#30363d] hover:text-[#00d4aa] cursor-pointer opacity-0 group-hover:opacity-100"
                          title="Switch to this branch"
                        >
                          <ArrowRightLeft size={11} />
                        </button>
                      )}
                    </div>
                  ))}
              </div>
            </div>

            {/* Remote Branches */}
            {branches.some((b) => b.isRemote) && (
              <div>
                <div className="text-[10px] uppercase tracking-wider text-[#6e7681] font-semibold mb-1.5">
                  Remote Branches
                </div>
                <div className="space-y-0.5 max-h-32 overflow-y-auto">
                  {branches
                    .filter((b) => b.isRemote)
                    .map((branch) => (
                      <div
                        key={branch.name}
                        className="flex items-center gap-2 px-2.5 py-1 rounded text-[11px] font-mono text-[#6e7681]"
                      >
                        <GitBranch size={11} className="text-[#00d4aa]/30" />
                        <span className="truncate">{branch.name}</span>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Remotes */}
            {gitRemotes.length > 0 && (
              <div>
                <div className="text-[10px] uppercase tracking-wider text-[#6e7681] font-semibold mb-1.5">Remotes</div>
                <div className="space-y-1">
                  {gitRemotes.map((remote) => (
                    <div
                      key={remote.name}
                      className="px-2.5 py-1 text-[11px] font-mono text-[#6e7681] bg-[#0d1117] border border-[rgba(0,212,170,0.06)] rounded"
                    >
                      <span className="text-[#e6edf3]">{remote.name}</span>
                      <span className="mx-1.5 text-[#30363d]">→</span>
                      <span className="text-[10px] truncate">{remote.url}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ─── PUSH/PULL SECTION ───────────────────────── */}
        {activeSection === 'sync' && (
          <div className="p-3 space-y-3">
            {/* Sync Status */}
            <div className="bg-[#0d1117] border border-[rgba(0,212,170,0.06)] rounded p-3">
              <div className="flex items-center gap-2 mb-2">
                <GitBranch size={13} className="text-[#00d4aa]/60" />
                <span className="text-[12px] font-mono text-[#e6edf3]">{gitBranch}</span>
                {gitRemotes.length > 0 && (
                  <>
                    <ArrowRightLeft size={10} className="text-[#30363d]" />
                    <span className="text-[11px] font-mono text-[#6e7681]">{gitRemotes[0].name}/{gitBranch}</span>
                  </>
                )}
              </div>
              {syncStatus === 'synced' && (
                <div className="flex items-center gap-1.5 text-[10px] text-[#3fb950] font-mono">
                  <Check size={10} />
                  Up to date
                </div>
              )}
            </div>

            {/* Push */}
            <div>
              <div className="text-[10px] uppercase tracking-wider text-[#6e7681] font-semibold mb-1.5">Push</div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <div
                      className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition-colors ${
                        pushForce
                          ? 'bg-[rgba(248,81,73,0.2)] border-[#f85149] text-[#f85149]'
                          : 'border-[#30363d] hover:border-[#6e7681]'
                      }`}
                      onClick={() => setPushForce(!pushForce)}
                    >
                      {pushForce && <Check size={9} />}
                    </div>
                    <span className="text-[10px] text-[#6e7681] font-mono">Force push</span>
                  </label>
                </div>
                <button
                  onClick={handlePush}
                  disabled={gitLoading}
                  className="w-full flex items-center justify-center gap-1.5 text-[12px] font-mono py-1.5 rounded bg-[rgba(0,212,170,0.12)] text-[#00d4aa] hover:bg-[rgba(0,212,170,0.18)] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Upload size={12} />
                  {pushForce ? 'Force Push' : 'Push'}
                </button>
              </div>
            </div>

            {/* Pull */}
            <div>
              <div className="text-[10px] uppercase tracking-wider text-[#6e7681] font-semibold mb-1.5">Pull</div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <div
                      className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition-colors ${
                        pullRebase
                          ? 'bg-[rgba(0,212,170,0.12)] border-[#00d4aa] text-[#00d4aa]'
                          : 'border-[#30363d] hover:border-[#6e7681]'
                      }`}
                      onClick={() => setPullRebase(!pullRebase)}
                    >
                      {pullRebase && <Check size={9} />}
                    </div>
                    <span className="text-[10px] text-[#6e7681] font-mono">Rebase instead of merge</span>
                  </label>
                </div>
                <button
                  onClick={handlePull}
                  disabled={gitLoading}
                  className="w-full flex items-center justify-center gap-1.5 text-[12px] font-mono py-1.5 rounded bg-[rgba(0,212,170,0.12)] text-[#00d4aa] hover:bg-[rgba(0,212,170,0.18)] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Download size={12} />
                  {pullRebase ? 'Pull --rebase' : 'Pull'}
                </button>
              </div>
            </div>

            {/* Fetch */}
            <button
              onClick={handleFetch}
              disabled={gitLoading}
              className="w-full flex items-center justify-center gap-1.5 text-[12px] font-mono py-1.5 rounded bg-[rgba(0,212,170,0.04)] text-[#6e7681] hover:bg-[rgba(0,212,170,0.08)] hover:text-[#e6edf3] transition-all cursor-pointer border border-[rgba(0,212,170,0.06)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw size={12} />
              Fetch
            </button>

            {/* Remote Info */}
            {gitRemotes.length === 0 && (
              <div className="text-center py-3">
                <p className="text-[11px] text-[#30363d] font-mono">No remotes configured</p>
                <p className="text-[10px] text-[#30363d] mt-1">Add a remote to push and pull</p>
              </div>
            )}
          </div>
        )}

        {/* ─── MERGE/REBASE SECTION ─────────────────────── */}
        {activeSection === 'merge' && (
          <div className="p-3 space-y-3">
            {/* Merge */}
            <div>
              <div className="text-[10px] uppercase tracking-wider text-[#6e7681] font-semibold mb-1.5 flex items-center gap-1.5">
                <GitMerge size={11} />
                Merge into {gitBranch}
              </div>
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <select
                    value={mergeBranch}
                    onChange={(e) => setMergeBranch(e.target.value)}
                    className="w-full bg-[#0d1117] border border-[rgba(0,212,170,0.08)] rounded px-3 py-1.5 text-[11px] text-[#e6edf3] outline-none font-mono appearance-none cursor-pointer focus:border-[rgba(0,212,170,0.25)]"
                  >
                    <option value="">Select branch...</option>
                    {branches
                      .filter((b) => !b.current && !b.isRemote)
                      .map((b) => (
                        <option key={b.name} value={b.name}>
                          {b.name}
                        </option>
                      ))}
                  </select>
                  <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 text-[#30363d] pointer-events-none" />
                </div>
                <button
                  onClick={handleMerge}
                  disabled={!mergeBranch || gitLoading}
                  className="px-3 py-1.5 text-[11px] font-mono rounded bg-[rgba(0,212,170,0.12)] text-[#00d4aa] hover:bg-[rgba(0,212,170,0.18)] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  Merge
                </button>
              </div>
            </div>

            {/* Rebase */}
            <div>
              <div className="text-[10px] uppercase tracking-wider text-[#6e7681] font-semibold mb-1.5 flex items-center gap-1.5">
                <ArrowRightLeft size={11} />
                Rebase onto
              </div>
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <select
                    value={rebaseBranch}
                    onChange={(e) => setRebaseBranch(e.target.value)}
                    className="w-full bg-[#0d1117] border border-[rgba(0,212,170,0.08)] rounded px-3 py-1.5 text-[11px] text-[#e6edf3] outline-none font-mono appearance-none cursor-pointer focus:border-[rgba(0,212,170,0.25)]"
                  >
                    <option value="">Select branch...</option>
                    {branches
                      .filter((b) => !b.current && !b.isRemote)
                      .map((b) => (
                        <option key={b.name} value={b.name}>
                          {b.name}
                        </option>
                      ))}
                  </select>
                  <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 text-[#30363d] pointer-events-none" />
                </div>
                <button
                  onClick={handleRebase}
                  disabled={!rebaseBranch || gitLoading}
                  className="px-3 py-1.5 text-[11px] font-mono rounded bg-[rgba(255,166,87,0.12)] text-[#ffa657] hover:bg-[rgba(255,166,87,0.18)] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  Rebase
                </button>
              </div>
            </div>

            {/* Abort Rebase */}
            <div className="border-t border-[rgba(0,212,170,0.06)] pt-3">
              <div className="text-[10px] uppercase tracking-wider text-[#6e7681] font-semibold mb-1.5">Conflict Resolution</div>
              <div className="space-y-2">
                <button
                  onClick={async () => {
                    try {
                      await gitApi('add', { abortRebase: true })
                      addNotification('info', 'Rebase aborted')
                      await refreshAll()
                    } catch (err) {
                      addNotification('error', `Abort failed: ${(err as Error).message}`)
                    }
                  }}
                  className="w-full flex items-center justify-center gap-1.5 text-[11px] font-mono py-1.5 rounded bg-[rgba(248,81,73,0.08)] text-[#f85149] hover:bg-[rgba(248,81,73,0.14)] transition-all cursor-pointer border border-[rgba(248,81,73,0.1)]"
                >
                  <X size={11} />
                  Abort Rebase
                </button>
                <div className="flex items-start gap-2 p-2 bg-[rgba(255,166,87,0.04)] border border-[rgba(255,166,87,0.08)] rounded">
                  <AlertTriangle size={12} className="text-[#ffa657] shrink-0 mt-0.5" />
                  <p className="text-[10px] text-[#6e7681] font-mono leading-relaxed">
                    If a merge or rebase has conflicts, resolve them in the editor, then stage the resolved files and commit.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─── GIT LOG SECTION ─────────────────────────── */}
        {activeSection === 'log' && (
          <div>
            {logCommits.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
                <Clock size={28} className="text-[#00d4aa]/10 mb-2" />
                <p className="text-[12px] text-[#30363d] font-mono">No commit history</p>
                <p className="text-[10px] text-[#30363d] mt-1">Make your first commit to see history here</p>
              </div>
            ) : (
              <div>
                {/* Commit List */}
                <div className="divide-y divide-[rgba(0,212,170,0.04)]">
                  {logCommits.map((commit, idx) => {
                    const isSelected = selectedCommit?.oid === commit.oid
                    const isMerge = commit.parent && commit.parent.length > 1
                    const shortHash = commit.oid.slice(0, 7)
                    const firstLine = commit.message.split('\n')[0]
                    const date = new Date(commit.timestamp * 1000)
                    const timeAgo = getTimeAgo(date)

                    return (
                      <div key={commit.oid}>
                        <button
                          onClick={() => setSelectedCommit(isSelected ? null : commit)}
                          className={`w-full text-left px-3 py-2 transition-colors cursor-pointer ${
                            isSelected
                              ? 'bg-[rgba(0,212,170,0.06)]'
                              : 'hover:bg-[rgba(0,212,170,0.04)]'
                          }`}
                        >
                          <div className="flex items-start gap-2">
                            {/* Graph line */}
                            <div className="flex flex-col items-center pt-0.5">
                              <div
                                className={`w-2.5 h-2.5 rounded-full border-2 ${
                                  idx === 0
                                    ? 'border-[#00d4aa] bg-[rgba(0,212,170,0.3)]'
                                    : 'border-[#30363d] bg-[#080c12]'
                                }`}
                              />
                              {idx < logCommits.length - 1 && (
                                <div className="w-px h-4 bg-[rgba(0,212,170,0.1)]" />
                              )}
                            </div>

                            {/* Commit Info */}
                            <div className="min-w-0 flex-1">
                              <div className="text-[12px] text-[#e6edf3] font-mono truncate leading-tight">
                                {firstLine}
                              </div>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[10px] text-[#00d4aa]/50 font-mono">{shortHash}</span>
                                <span className="text-[10px] text-[#30363d]">·</span>
                                <span className="text-[10px] text-[#6e7681] font-mono">{commit.author.name}</span>
                                <span className="text-[10px] text-[#30363d]">·</span>
                                <span className="text-[10px] text-[#30363d]">{timeAgo}</span>
                                {isMerge && (
                                  <span className="text-[9px] px-1 py-0 rounded bg-[rgba(0,212,170,0.1)] text-[#00d4aa] font-mono">
                                    merge
                                  </span>
                                )}
                              </div>
                            </div>

                            <ChevronRight
                              size={12}
                              className={`text-[#30363d] transition-transform mt-1 ${
                                isSelected ? 'rotate-90' : ''
                              }`}
                            />
                          </div>
                        </button>

                        {/* Expanded Commit Details */}
                        {isSelected && (
                          <div className="px-3 pb-3 pl-7 space-y-2">
                            {/* Full message */}
                            {commit.message.includes('\n') && (
                              <div className="bg-[#0d1117] border border-[rgba(0,212,170,0.06)] rounded p-2">
                                <pre className="text-[11px] text-[#6e7681] font-mono whitespace-pre-wrap leading-relaxed">
                                  {commit.message}
                                </pre>
                              </div>
                            )}

                            {/* Author & Date */}
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 text-[10px] text-[#6e7681] font-mono">
                                <User size={10} className="text-[#30363d]" />
                                {commit.author.name} &lt;{commit.author.email}&gt;
                              </div>
                              <div className="flex items-center gap-2 text-[10px] text-[#6e7681] font-mono">
                                <Clock size={10} className="text-[#30363d]" />
                                {date.toLocaleString()}
                              </div>
                              <div className="flex items-center gap-2 text-[10px] text-[#6e7681] font-mono">
                                <GitCommit size={10} className="text-[#30363d]" />
                                {commit.oid}
                                <button
                                  onClick={() => {
                                    navigator.clipboard.writeText(commit.oid)
                                    addNotification('info', 'Commit hash copied')
                                  }}
                                  className="text-[#30363d] hover:text-[#00d4aa] cursor-pointer"
                                >
                                  <Copy size={10} />
                                </button>
                              </div>
                              {commit.parent && commit.parent.length > 0 && (
                                <div className="text-[10px] text-[#30363d] font-mono">
                                  Parents: {commit.parent.map((p) => p.slice(0, 7)).join(', ')}
                                </div>
                              )}
                            </div>

                            {/* File changes placeholder */}
                            <div className="text-[10px] text-[#30363d] font-mono italic">
                              Select in diff viewer for file-level changes
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ─── Bottom Status ──────────────────────────────── */}
      <div className="border-t border-[rgba(0,212,170,0.08)] px-3 py-1.5 flex items-center justify-between text-[10px] font-mono text-[#30363d]">
        <div className="flex items-center gap-2">
          <GitBranch size={10} />
          <span>{gitBranch}</span>
        </div>
        <div className="flex items-center gap-3">
          {gitStaged.length > 0 && (
            <span className="text-[#3fb950]">{gitStaged.length} staged</span>
          )}
          {gitUnstaged.length > 0 && (
            <span className="text-[#ffa657]">{gitUnstaged.length} changed</span>
          )}
          {allChanges === 0 && <span className="text-[#3fb950]/40">clean</span>}
        </div>
      </div>
    </div>
  )
}

// ─── Utility: Relative Time ──────────────────────────────────

function getTimeAgo(date: Date): string {
  const now = new Date()
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (seconds < 60) return 'just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`
  if (seconds < 2592000) return `${Math.floor(seconds / 604800)}w ago`
  return date.toLocaleDateString()
}
