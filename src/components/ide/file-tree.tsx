'use client'

import { memo } from 'react'
import { ChevronRight, ChevronDown, File, Folder, FolderOpen } from 'lucide-react'
import { useIDEStore, type FileNode } from '@/store/ide-store'

function getFileIconColor(name: string): string {
  const ext = name.split('.').pop()?.toLowerCase()
  const colors: Record<string, string> = {
    tsx: '#00d4aa',
    ts: '#3178c6',
    jsx: '#61dafb',
    js: '#f7df1e',
    json: '#f7df1e',
    css: '#1572b6',
    html: '#e34c26',
    md: '#8b949e',
    svg: '#ff9900',
    py: '#3776ab',
    rs: '#dea584',
    go: '#00add8',
  }
  return colors[ext || ''] || '#484f58'
}

const FileTreeItem = memo(function FileTreeItem({ node, depth }: { node: FileNode; depth: number }) {
  const expandedFolders = useIDEStore((s) => s.expandedFolders)
  const toggleFolder = useIDEStore((s) => s.toggleFolder)
  const openFile = useIDEStore((s) => s.openFile)

  const isExpanded = !!expandedFolders[node.path]
  const isFolder = node.type === 'folder'

  return (
    <div role="treeitem" aria-expanded={isFolder ? isExpanded : undefined}>
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
            openFile(node)
          }
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            if (isFolder) toggleFolder(node.path)
            else openFile(node)
          }
        }}
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
        <span className={`truncate ${isFolder ? 'text-[#e6edf3]' : 'text-[#6e7681] group-hover:text-[#e6edf3]'}`}>
          {node.name}
        </span>
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

  return (
    <div className="h-full flex flex-col" role="tree" aria-label="File explorer">
      <div className="flex items-center justify-between px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-[#30363d] border-b border-[rgba(0,212,170,0.08)]">
        <span>Explorer</span>
        <span className="text-[#00d4aa]/30 font-mono text-[10px]">AICODESTUDIO</span>
      </div>
      <div className="flex-1 overflow-y-auto overflow-x-hidden py-1 custom-scrollbar">
        {fileTree.map((node) => (
          <FileTreeItem key={node.path} node={node} depth={0} />
        ))}
      </div>
    </div>
  )
}
