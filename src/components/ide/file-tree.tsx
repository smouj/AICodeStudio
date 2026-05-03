'use client'

import { memo, useState, useCallback } from 'react'
import { ChevronRight, ChevronDown, File, Folder, FolderOpen, Plus, FolderPlus, FilePlus, Trash2, Pencil, HardDrive } from 'lucide-react'
import { useIDEStore, type FileNode } from '@/store/ide-store'

function getFileIconColor(name: string): string {
  const ext = name.split('.').pop()?.toLowerCase()
  const colors: Record<string, string> = {
    tsx: '#00d4aa', ts: '#3178c6', jsx: '#61dafb', js: '#f7df1e',
    json: '#f7df1e', css: '#1572b6', html: '#e34c26', md: '#8b949e',
    svg: '#ff9900', py: '#3776ab', rs: '#dea584', go: '#00add8',
  }
  return colors[ext || ''] || '#484f58'
}

const FileTreeItem = memo(function FileTreeItem({ node, depth }: { node: FileNode; depth: number }) {
  const expandedFolders = useIDEStore((s) => s.expandedFolders)
  const toggleFolder = useIDEStore((s) => s.toggleFolder)
  const openFile = useIDEStore((s) => s.openFile)
  const deleteNode = useIDEStore((s) => s.deleteNode)
  const renameNode = useIDEStore((s) => s.renameNode)
  const createFile = useIDEStore((s) => s.createFile)
  const createFolder = useIDEStore((s) => s.createFolder)
  const addNotification = useIDEStore((s) => s.addNotification)

  const [isRenaming, setIsRenaming] = useState(false)
  const [renameValue, setRenameValue] = useState(node.name)
  const [showActions, setShowActions] = useState(false)

  const isExpanded = !!expandedFolders[node.path]
  const isFolder = node.type === 'folder'

  const handleCreateFile = useCallback(() => {
    const name = prompt('File name (e.g. index.tsx):')
    if (!name?.trim()) return
    createFile(`${node.path}/${name.trim()}`)
  }, [node.path, createFile])

  const handleCreateFolder = useCallback(() => {
    const name = prompt('Folder name:')
    if (!name?.trim()) return
    createFolder(`${node.path}/${name.trim()}`)
  }, [node.path, createFolder])

  const handleDelete = useCallback(() => {
    if (confirm(`Delete "${node.name}"?`)) {
      deleteNode(node.path)
    }
  }, [node, deleteNode])

  const handleRenameSubmit = useCallback(() => {
    if (renameValue.trim() && renameValue.trim() !== node.name) {
      renameNode(node.path, renameValue.trim())
    }
    setIsRenaming(false)
  }, [renameValue, node, renameNode])

  return (
    <div role="treeitem" aria-expanded={isFolder ? isExpanded : undefined} aria-selected={false}>
      <div
        className={`
          flex items-center gap-1 py-[3px] pr-3 cursor-pointer
          text-[13px] font-mono
          hover:bg-[rgba(0,212,170,0.04)] transition-colors
          group
        `}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
        onClick={() => {
          if (isFolder) {
            toggleFolder(node.path)
          } else {
            openFile(node.path)
          }
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            if (isFolder) toggleFolder(node.path)
            else openFile(node.path)
          }
        }}
        onMouseEnter={() => setShowActions(true)}
        onMouseLeave={() => setShowActions(false)}
        tabIndex={0}
      >
        {isFolder ? (
          <>
            {isExpanded ? (
              <ChevronDown size={14} className="text-[#30363d] shrink-0" />
            ) : (
              <ChevronRight size={14} className="text-[#30363d] shrink-0" />
            )}
            {isExpanded ? (
              <FolderOpen size={14} className="text-[#00d4aa]/50 shrink-0" />
            ) : (
              <Folder size={14} className="text-[#484f58] shrink-0" />
            )}
          </>
        ) : (
          <>
            <span className="w-[14px] shrink-0" />
            <File size={14} className="shrink-0" style={{ color: getFileIconColor(node.name) }} />
          </>
        )}
        {isRenaming ? (
          <input
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onBlur={handleRenameSubmit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleRenameSubmit()
              if (e.key === 'Escape') setIsRenaming(false)
            }}
            className="flex-1 bg-[#0d1117] border border-[rgba(0,212,170,0.25)] rounded px-1 text-[12px] text-[#e6edf3] outline-none font-mono min-w-0"
            autoFocus
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span className={`truncate ${isFolder ? 'text-[#e6edf3]' : 'text-[#6e7681] group-hover:text-[#e6edf3]'}`}>
            {node.name}
          </span>
        )}

        {/* Context Actions */}
        {showActions && !isRenaming && (
          <div className="ml-auto flex items-center gap-0.5 shrink-0" onClick={(e) => e.stopPropagation()}>
            {isFolder && (
              <>
                <button
                  onClick={handleCreateFile}
                  className="p-0.5 text-[#30363d] hover:text-[#00d4aa] cursor-pointer"
                  title="New file"
                >
                  <FilePlus size={11} />
                </button>
                <button
                  onClick={handleCreateFolder}
                  className="p-0.5 text-[#30363d] hover:text-[#00d4aa] cursor-pointer"
                  title="New folder"
                >
                  <FolderPlus size={11} />
                </button>
              </>
            )}
            <button
              onClick={() => { setIsRenaming(true); setRenameValue(node.name) }}
              className="p-0.5 text-[#30363d] hover:text-[#ffa657] cursor-pointer"
              title="Rename"
            >
              <Pencil size={11} />
            </button>
            <button
              onClick={handleDelete}
              className="p-0.5 text-[#30363d] hover:text-[#f85149] cursor-pointer"
              title="Delete"
            >
              <Trash2 size={11} />
            </button>
          </div>
        )}
      </div>
      {isFolder && isExpanded && node.children && (
        <div role="group">
          {node.children
            .sort((a, b) => {
              if (a.type === 'folder' && b.type === 'file') return -1
              if (a.type === 'file' && b.type === 'folder') return 1
              return a.name.localeCompare(b.name)
            })
            .map((child) => (
              <FileTreeItem key={child.path} node={child} depth={depth + 1} />
            ))}
        </div>
      )}
    </div>
  )
})

export function FileExplorer() {
  const fileTree = useIDEStore((s) => s.fileTree)
  const createFile = useIDEStore((s) => s.createFile)
  const createFolder = useIDEStore((s) => s.createFolder)
  const workspaceName = useIDEStore((s) => s.workspaceName)
  const fsAccessSupported = useIDEStore((s) => s.fsAccessSupported)
  const fsHandle = useIDEStore((s) => s.fsHandle)
  const openLocalDirectory = useIDEStore((s) => s.openLocalDirectory)
  const saveFileLocally = useIDEStore((s) => s.saveFileLocally)
  const writeFile = useIDEStore((s) => s.writeFile)

  const isLocalFS = !!fsHandle

  const handleNewFile = () => {
    const name = prompt('File name (e.g. index.tsx):')
    if (!name?.trim()) return
    createFile(`/${name.trim()}`)
  }

  const handleNewFolder = () => {
    const name = prompt('Folder name:')
    if (!name?.trim()) return
    createFolder(`/${name.trim()}`)
  }

  const handleOpenLocal = async () => {
    await openLocalDirectory()
  }

  const handleSaveCurrentFile = useCallback(async () => {
    const state = useIDEStore.getState()
    const activeTab = state.openTabs.find((t) => t.id === state.activeTabId)
    if (activeTab && activeTab.isModified && fsHandle) {
      await saveFileLocally(activeTab.path, activeTab.content)
      // Mark as not modified in the virtual FS too
      writeFile(activeTab.path, activeTab.content)
    }
  }, [fsHandle, saveFileLocally, writeFile])

  return (
    <div className="h-full flex flex-col" role="tree" aria-label="File explorer">
      <div className="flex items-center justify-between px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-[#30363d] border-b border-[rgba(0,212,170,0.08)]">
        <span className="truncate">{workspaceName || 'Explorer'}</span>
        <div className="flex items-center gap-1">
          {fsAccessSupported && !isLocalFS && (
            <button
              onClick={handleOpenLocal}
              className="text-[#30363d] hover:text-[#00d4aa] cursor-pointer transition-colors"
              title="Open local folder (File System Access API)"
            >
              <HardDrive size={12} />
            </button>
          )}
          {isLocalFS && (
            <button
              onClick={handleSaveCurrentFile}
              className="text-[#00d4aa]/60 hover:text-[#00d4aa] cursor-pointer transition-colors"
              title="Save to local disk"
            >
              <HardDrive size={12} />
            </button>
          )}
          <button
            onClick={handleNewFile}
            className="text-[#30363d] hover:text-[#00d4aa] cursor-pointer transition-colors"
            title="New file"
          >
            <FilePlus size={12} />
          </button>
          <button
            onClick={handleNewFolder}
            className="text-[#30363d] hover:text-[#00d4aa] cursor-pointer transition-colors"
            title="New folder"
          >
            <FolderPlus size={12} />
          </button>
        </div>
      </div>

      {/* Local FS indicator */}
      {isLocalFS && (
        <div className="px-3 py-1.5 bg-[rgba(0,212,170,0.06)] border-b border-[rgba(0,212,170,0.08)] flex items-center gap-1.5">
          <HardDrive size={10} className="text-[#00d4aa] shrink-0" />
          <span className="text-[10px] font-mono text-[#00d4aa]/70">Local FS — saves to disk</span>
        </div>
      )}

      <div className="flex-1 overflow-y-auto overflow-x-hidden py-1 custom-scrollbar">
        {fileTree.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-[#30363d] text-center py-8 px-4">
            <Folder size={32} className="mb-2 text-[#00d4aa]/10" />
            <p className="text-[12px] font-mono text-[#484f58]">No files in workspace</p>
            <p className="text-[10px] text-[#30363d] mt-1">Create files, open a local folder, or clone a repository</p>
            <div className="flex gap-2 mt-3">
              {fsAccessSupported && (
                <button
                  onClick={handleOpenLocal}
                  className="px-2 py-1 text-[10px] font-mono border border-[rgba(0,212,170,0.12)] rounded text-[#00d4aa]/60 hover:bg-[rgba(0,212,170,0.06)] hover:text-[#00d4aa] cursor-pointer transition-colors"
                >
                  <HardDrive size={9} className="inline mr-1" />
                  Open Folder
                </button>
              )}
              <button
                onClick={handleNewFile}
                className="px-2 py-1 text-[10px] font-mono border border-[rgba(0,212,170,0.12)] rounded text-[#00d4aa]/60 hover:bg-[rgba(0,212,170,0.06)] hover:text-[#00d4aa] cursor-pointer transition-colors"
              >
                <Plus size={9} className="inline mr-1" />
                New File
              </button>
              <button
                onClick={handleNewFolder}
                className="px-2 py-1 text-[10px] font-mono border border-[rgba(0,212,170,0.12)] rounded text-[#00d4aa]/60 hover:bg-[rgba(0,212,170,0.06)] hover:text-[#00d4aa] cursor-pointer transition-colors"
              >
                <FolderPlus size={9} className="inline mr-1" />
                New Folder
              </button>
            </div>
          </div>
        ) : (
          fileTree.map((node) => (
            <FileTreeItem key={node.path} node={node} depth={0} />
          ))
        )}
      </div>
    </div>
  )
}
