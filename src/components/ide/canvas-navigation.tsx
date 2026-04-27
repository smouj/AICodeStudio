'use client'

import {
  memo,
  useState,
  useCallback,
  useRef,
  useEffect,
  useMemo,
} from 'react'
import {
  Search,
  ZoomIn,
  ZoomOut,
  Maximize2,
  GitBranch,
  Plus,
  File,
  Folder,
  X,
  LayoutGrid,
  LayoutList,
  Network,
  ChevronDown,
} from 'lucide-react'
import { useIDEStore, type FileNode } from '@/store/ide-store'

// ─── Types ────────────────────────────────────────────────────────

interface CanvasNode {
  id: string
  path: string
  name: string
  type: 'file' | 'folder'
  x: number
  y: number
  width: number
  height: number
  language: string
  size: number
  depth: number
  parentPath: string | null
}

interface DependencyEdge {
  from: string
  to: string
}

type LayoutMode = 'tree' | 'force' | 'grid'

// ─── Helpers ──────────────────────────────────────────────────────

function getLanguageColor(language: string): string {
  const colors: Record<string, string> = {
    typescript: '#3178c6',
    javascript: '#f7df1e',
    jsx: '#61dafb',
    tsx: '#00d4aa',
    json: '#f7df1e',
    css: '#1572b6',
    html: '#e34c26',
    markdown: '#8b949e',
    xml: '#ff9900',
    python: '#3776ab',
    rust: '#dea584',
    go: '#00add8',
    yaml: '#cb171e',
    shell: '#89e051',
    sql: '#e38c00',
    prisma: '#0c344b',
    dockerfile: '#384d54',
    plaintext: '#484f58',
  }
  return colors[language] || '#484f58'
}

function formatFileSize(chars: number): string {
  if (chars < 500) return 'S'
  if (chars < 2000) return 'M'
  if (chars < 8000) return 'L'
  return 'XL'
}

function sizeToHeight(size: number): number {
  if (size < 500) return 44
  if (size < 2000) return 52
  if (size < 8000) return 60
  return 68
}

// Flatten the file tree into a list of files for canvas rendering
function flattenFiles(
  nodes: FileNode[],
  fileContents: Record<string, string>,
  depth = 0,
  parentPath: string | null = null
): CanvasNode[] {
  const result: CanvasNode[] = []
  for (const node of nodes) {
    if (node.type === 'file') {
      const content = fileContents[node.path] || ''
      result.push({
        id: node.path,
        path: node.path,
        name: node.name,
        type: 'file',
        x: 0,
        y: 0,
        width: 180,
        height: sizeToHeight(content.length),
        language: node.language || 'plaintext',
        size: content.length,
        depth,
        parentPath,
      })
    }
    if (node.type === 'folder' && node.children) {
      result.push({
        id: node.path,
        path: node.path,
        name: node.name,
        type: 'folder',
        x: 0,
        y: 0,
        width: 180,
        height: 36,
        language: '',
        size: 0,
        depth,
        parentPath,
      })
      result.push(
        ...flattenFiles(node.children, fileContents, depth + 1, node.path)
      )
    }
  }
  return result
}

// Tree layout: arrange nodes in a hierarchical tree structure
function layoutTree(nodes: CanvasNode[]): CanvasNode[] {
  if (nodes.length === 0) return []

  const NODE_H_GAP = 24
  const NODE_V_GAP = 16
  const BASE_X = 60
  const BASE_Y = 60

  // Group by depth
  const depthGroups = new Map<number, CanvasNode[]>()
  let maxDepth = 0
  for (const node of nodes) {
    const d = node.depth
    if (!depthGroups.has(d)) depthGroups.set(d, [])
    depthGroups.get(d)!.push(node)
    if (d > maxDepth) maxDepth = d
  }

  // Count leaf descendants for folder width
  const pathMap = new Map(nodes.map((n) => [n.path, n]))

  function countLeaves(nodePath: string): number {
    const children = nodes.filter((n) => n.parentPath === nodePath)
    if (children.length === 0) return 1
    return children.reduce((sum, c) => sum + countLeaves(c.path), 0)
  }

  // Assign positions depth by depth
  const positioned = new Map<string, { x: number; y: number }>()
  const result = nodes.map((n) => ({ ...n }))

  // For each depth level, lay out nodes under their parent
  for (let d = 0; d <= maxDepth; d++) {
    const group = depthGroups.get(d) || []

    if (d === 0) {
      // Root level: lay out horizontally
      let x = BASE_X
      for (const node of group) {
        const leaves = countLeaves(node.path)
        const nodeW = Math.max(node.width, leaves * (node.width + NODE_H_GAP) - NODE_H_GAP)
        positioned.set(node.path, { x, y: BASE_Y })
        // Update node
        const idx = result.findIndex((n) => n.path === node.path)
        if (idx >= 0) {
          result[idx].x = x
          result[idx].y = BASE_Y
        }
        x += nodeW + NODE_H_GAP
      }
    } else {
      // Child level: lay out under parent
      for (const node of group) {
        const parentPos = positioned.get(node.parentPath || '')
        if (!parentPos) continue

        const siblings = group.filter((n) => n.parentPath === node.parentPath)
        const siblingIdx = siblings.indexOf(node)
        const leaves = countLeaves(node.path)
        const nodeW = Math.max(node.width, leaves * (node.width + NODE_H_GAP) - NODE_H_GAP)

        const totalSiblingsWidth = siblings.reduce(
          (sum, s) => sum + Math.max(s.width, countLeaves(s.path) * (s.width + NODE_H_GAP) - NODE_H_GAP),
          0
        ) + (siblings.length - 1) * NODE_H_GAP

        let startX = parentPos.x - totalSiblingsWidth / 2 + Math.max(node.width, nodeW) / 2
        for (let i = 0; i < siblingIdx; i++) {
          startX += Math.max(siblings[i].width, countLeaves(siblings[i].path) * (siblings[i].width + NODE_H_GAP) - NODE_H_GAP) + NODE_H_GAP
        }

        positioned.set(node.path, { x: startX, y: parentPos.y + 80 + NODE_V_GAP })
        const idx = result.findIndex((n) => n.path === node.path)
        if (idx >= 0) {
          result[idx].x = startX
          result[idx].y = parentPos.y + 80 + NODE_V_GAP
        }
      }
    }
  }

  return result
}

// Grid layout: arrange all nodes in a simple grid
function layoutGrid(nodes: CanvasNode[]): CanvasNode[] {
  const COLS = Math.max(1, Math.ceil(Math.sqrt(nodes.length)))
  const NODE_GAP_X = 24
  const NODE_GAP_Y = 16
  const BASE_X = 60
  const BASE_Y = 60

  return nodes.map((node, i) => ({
    ...node,
    x: BASE_X + (i % COLS) * (node.width + NODE_GAP_X),
    y: BASE_Y + Math.floor(i / COLS) * (node.height + NODE_GAP_Y + 20),
  }))
}

// Force layout: simple force-directed layout (lightweight)
function layoutForce(nodes: CanvasNode[], edges: DependencyEdge[]): CanvasNode[] {
  if (nodes.length === 0) return []

  const result = nodes.map((n) => ({ ...n }))
  const nodeMap = new Map(result.map((n) => [n.id, n]))

  // Initialize with circular layout
  const cx = 400
  const cy = 300
  const radius = Math.min(300, 50 * Math.sqrt(nodes.length))

  result.forEach((node, i) => {
    const angle = (2 * Math.PI * i) / result.length
    node.x = cx + radius * Math.cos(angle)
    node.y = cy + radius * Math.sin(angle)
  })

  // Simple iterative force simulation (few iterations for performance)
  const iterations = 30
  for (let iter = 0; iter < iterations; iter++) {
    // Repulsion between all pairs
    for (let i = 0; i < result.length; i++) {
      for (let j = i + 1; j < result.length; j++) {
        const a = result[i]
        const b = result[j]
        let dx = a.x - b.x
        let dy = a.y - b.y
        const dist = Math.sqrt(dx * dx + dy * dy) || 1
        const repulsion = 8000 / (dist * dist)
        const fx = (dx / dist) * repulsion
        const fy = (dy / dist) * repulsion
        a.x += fx * 0.5
        a.y += fy * 0.5
        b.x -= fx * 0.5
        b.y -= fy * 0.5
      }
    }

    // Attraction along edges
    for (const edge of edges) {
      const a = nodeMap.get(edge.from)
      const b = nodeMap.get(edge.to)
      if (!a || !b) continue
      const dx = b.x - a.x
      const dy = b.y - a.y
      const dist = Math.sqrt(dx * dx + dy * dy) || 1
      const attraction = dist * 0.01
      const fx = (dx / dist) * attraction
      const fy = (dy / dist) * attraction
      a.x += fx
      a.y += fy
      b.x -= fx
      b.y -= fy
    }

    // Center gravity
    for (const node of result) {
      node.x += (cx - node.x) * 0.01
      node.y += (cy - node.y) * 0.01
    }
  }

  return result
}

// Extract dependency edges from file contents
function extractDependencies(
  fileContents: Record<string, string>,
  nodes: CanvasNode[]
): DependencyEdge[] {
  const edges: DependencyEdge[] = []
  const filePathSet = new Set(nodes.filter((n) => n.type === 'file').map((n) => n.path))

  for (const [filePath, content] of Object.entries(fileContents)) {
    if (!filePathSet.has(filePath)) continue

    // Match import patterns
    const importRegex =
      /(?:import\s+.*?from\s+['"])(\.\/[^'"]+)(?:['"])|(?:require\s*\(\s*['"])(\.\/[^'"]+)(?:['"]\s*\))/g
    let match: RegExpExecArray | null

    while ((match = importRegex.exec(content)) !== null) {
      const importPath = match[1] || match[2]
      if (!importPath) continue

      // Resolve relative path
      const dir = filePath.substring(0, filePath.lastIndexOf('/'))
      let resolvedPath = importPath

      if (importPath.startsWith('./')) {
        resolvedPath = dir + importPath.slice(1)
      } else if (importPath.startsWith('../')) {
        const parts = dir.split('/')
        const upCount = (importPath.match(/\.\.\//g) || []).length
        const basePath = parts.slice(0, parts.length - upCount).join('/')
        const restPath = importPath.replace(/\.\.\//g, '').replace(/^\.\//, '')
        resolvedPath = basePath + '/' + restPath
      }

      // Try exact match, then with extensions
      if (filePathSet.has(resolvedPath)) {
        edges.push({ from: filePath, to: resolvedPath })
      } else {
        for (const ext of ['.ts', '.tsx', '.js', '.jsx', '/index.ts', '/index.tsx']) {
          if (filePathSet.has(resolvedPath + ext)) {
            edges.push({ from: filePath, to: resolvedPath + ext })
            break
          }
        }
      }
    }
  }

  return edges
}

// ─── Canvas Rendering ─────────────────────────────────────────────

function drawCanvas(
  ctx: CanvasRenderingContext2D,
  nodes: CanvasNode[],
  edges: DependencyEdge[],
  zoom: number,
  panX: number,
  panY: number,
  canvasWidth: number,
  canvasHeight: number,
  activeFilePath: string | null,
  hoveredNodePath: string | null,
  searchTerm: string,
  gitStaged: string[],
  gitUnstaged: string[],
  nodeMap: Map<string, CanvasNode>
) {
  const dpr = window.devicePixelRatio || 1
  ctx.clearRect(0, 0, canvasWidth * dpr, canvasHeight * dpr)
  ctx.save()
  ctx.scale(dpr, dpr)

  // Background
  ctx.fillStyle = '#080c12'
  ctx.fillRect(0, 0, canvasWidth, canvasHeight)

  // Grid pattern
  ctx.save()
  ctx.translate(panX, panY)
  ctx.scale(zoom, zoom)

  ctx.strokeStyle = 'rgba(0, 212, 170, 0.025)'
  ctx.lineWidth = 1 / zoom
  const gridSize = 40
  const startX = Math.floor(-panX / zoom / gridSize) * gridSize - gridSize
  const startY = Math.floor(-panY / zoom / gridSize) * gridSize - gridSize
  const endX = startX + canvasWidth / zoom + gridSize * 2
  const endY = startY + canvasHeight / zoom + gridSize * 2

  for (let x = startX; x < endX; x += gridSize) {
    ctx.beginPath()
    ctx.moveTo(x, startY)
    ctx.lineTo(x, endY)
    ctx.stroke()
  }
  for (let y = startY; y < endY; y += gridSize) {
    ctx.beginPath()
    ctx.moveTo(startX, y)
    ctx.lineTo(endX, y)
    ctx.stroke()
  }
  ctx.restore()

  // Apply transform for nodes
  ctx.save()
  ctx.translate(panX, panY)
  ctx.scale(zoom, zoom)

  // Draw edges (dependency lines)
  for (const edge of edges) {
    const fromNode = nodeMap.get(edge.from)
    const toNode = nodeMap.get(edge.to)
    if (!fromNode || !toNode) continue

    const fromX = fromNode.x + fromNode.width / 2
    const fromY = fromNode.y + fromNode.height
    const toX = toNode.x + toNode.width / 2
    const toY = toNode.y

    // Filter by search
    if (searchTerm) {
      const fromMatch =
        fromNode.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        fromNode.path.toLowerCase().includes(searchTerm.toLowerCase())
      const toMatch =
        toNode.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        toNode.path.toLowerCase().includes(searchTerm.toLowerCase())
      if (!fromMatch && !toMatch) continue
    }

    const isActive =
      fromNode.path === activeFilePath || toNode.path === activeFilePath

    ctx.beginPath()
    ctx.strokeStyle = isActive
      ? 'rgba(0, 212, 170, 0.5)'
      : 'rgba(0, 212, 170, 0.1)'
    ctx.lineWidth = isActive ? 2 / zoom : 1 / zoom

    // Bezier curve for smooth lines
    const midY = (fromY + toY) / 2
    ctx.moveTo(fromX, fromY)
    ctx.bezierCurveTo(fromX, midY, toX, midY, toX, toY)
    ctx.stroke()

    // Arrow at destination
    if (isActive) {
      const arrowSize = 5 / zoom
      const angle = Math.atan2(toY - midY, toX - toX) || Math.PI / 2
      ctx.beginPath()
      ctx.fillStyle = 'rgba(0, 212, 170, 0.5)'
      ctx.moveTo(toX, toY)
      ctx.lineTo(
        toX - arrowSize * Math.cos(angle - Math.PI / 6),
        toY - arrowSize * Math.sin(angle - Math.PI / 6)
      )
      ctx.lineTo(
        toX - arrowSize * Math.cos(angle + Math.PI / 6),
        toY - arrowSize * Math.sin(angle + Math.PI / 6)
      )
      ctx.closePath()
      ctx.fill()
    }
  }

  // Draw nodes
  for (const node of nodes) {
    const isFolder = node.type === 'folder'
    const isActive = node.path === activeFilePath
    const isHovered = node.path === hoveredNodePath
    const isStaged = gitStaged.includes(node.path)
    const isUnstaged = gitUnstaged.includes(node.path)

    // Filter by search
    if (searchTerm) {
      const matches =
        node.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        node.path.toLowerCase().includes(searchTerm.toLowerCase())
      if (!matches) {
        // Dim non-matching nodes
        ctx.globalAlpha = 0.15
      }
    }

    const langColor = isFolder
      ? '#00d4aa'
      : getLanguageColor(node.language)

    // Node background
    const bgRadius = 8
    ctx.beginPath()
    ctx.roundRect(node.x, node.y, node.width, node.height, bgRadius)

    if (isActive) {
      ctx.fillStyle = 'rgba(0, 212, 170, 0.08)'
      ctx.strokeStyle = '#00d4aa'
      ctx.lineWidth = 2 / zoom
    } else if (isHovered) {
      ctx.fillStyle = 'rgba(0, 212, 170, 0.04)'
      ctx.strokeStyle = 'rgba(0, 212, 170, 0.3)'
      ctx.lineWidth = 1.5 / zoom
    } else {
      ctx.fillStyle = 'rgba(13, 17, 23, 0.9)'
      ctx.strokeStyle = 'rgba(0, 212, 170, 0.08)'
      ctx.lineWidth = 1 / zoom
    }
    ctx.fill()
    ctx.stroke()

    // Glow effect for active
    if (isActive) {
      ctx.save()
      ctx.shadowColor = '#00d4aa'
      ctx.shadowBlur = 12 / zoom
      ctx.beginPath()
      ctx.roundRect(node.x, node.y, node.width, node.height, bgRadius)
      ctx.strokeStyle = 'rgba(0, 212, 170, 0.3)'
      ctx.lineWidth = 1 / zoom
      ctx.stroke()
      ctx.restore()
    }

    // Language color indicator bar
    if (!isFolder) {
      ctx.beginPath()
      ctx.roundRect(node.x, node.y, 4, node.height, [bgRadius, 0, 0, bgRadius])
      ctx.fillStyle = langColor
      ctx.fill()
    } else {
      ctx.beginPath()
      ctx.roundRect(node.x, node.y, 4, node.height, [bgRadius, 0, 0, bgRadius])
      ctx.fillStyle = 'rgba(0, 212, 170, 0.3)'
      ctx.fill()
    }

    // File/Folder icon
    const iconX = node.x + 14
    const iconY = node.y + (isFolder ? 10 : 14)

    if (isFolder) {
      // Folder icon
      ctx.fillStyle = 'rgba(0, 212, 170, 0.5)'
      ctx.beginPath()
      ctx.roundRect(iconX, iconY, 12, 9, 1)
      ctx.fill()
      ctx.beginPath()
      ctx.roundRect(iconX, iconY - 2, 6, 3, [2, 2, 0, 0])
      ctx.fill()
    } else {
      // File icon
      ctx.fillStyle = langColor
      ctx.beginPath()
      ctx.roundRect(iconX, iconY, 10, 13, 1)
      ctx.fill()
      // Folded corner
      ctx.beginPath()
      ctx.moveTo(iconX + 6, iconY)
      ctx.lineTo(iconX + 10, iconY + 4)
      ctx.lineTo(iconX + 6, iconY + 4)
      ctx.closePath()
      ctx.fillStyle = 'rgba(8, 12, 18, 0.5)'
      ctx.fill()
    }

    // File name text
    const textX = node.x + (isFolder ? 32 : 30)
    const textY = node.y + (isFolder ? 19 : 19)

    ctx.fillStyle = isActive ? '#00d4aa' : isFolder ? '#e6edf3' : '#8b949e'
    ctx.font = `${isFolder ? 'bold ' : ''}${11 / Math.max(zoom, 0.5)}px "JetBrains Mono", "Fira Code", monospace`
    ctx.textBaseline = 'middle'
    ctx.fillText(
      node.name,
      textX,
      textY,
      node.width - 50
    )

    // Size indicator for files
    if (!isFolder && node.size > 0) {
      const sizeLabel = formatFileSize(node.size)
      const sizeX = node.x + node.width - 26
      const sizeY = node.y + (node.height > 50 ? 32 : 19)

      ctx.fillStyle = 'rgba(0, 212, 170, 0.2)'
      ctx.beginPath()
      ctx.roundRect(sizeX - 4, sizeY - 7, 20, 14, 3)
      ctx.fill()

      ctx.fillStyle = 'rgba(0, 212, 170, 0.6)'
      ctx.font = `${9 / Math.max(zoom, 0.5)}px "JetBrains Mono", monospace`
      ctx.textAlign = 'center'
      ctx.fillText(sizeLabel, sizeX + 6, sizeY)
      ctx.textAlign = 'start'
    }

    // Git status indicator
    if (isStaged) {
      const gitX = node.x + node.width - 10
      const gitY = node.y + 8
      ctx.beginPath()
      ctx.arc(gitX, gitY, 4, 0, Math.PI * 2)
      ctx.fillStyle = '#3fb950'
      ctx.fill()
      // Plus sign
      ctx.strokeStyle = '#080c12'
      ctx.lineWidth = 1.5 / zoom
      ctx.beginPath()
      ctx.moveTo(gitX - 2, gitY)
      ctx.lineTo(gitX + 2, gitY)
      ctx.moveTo(gitX, gitY - 2)
      ctx.lineTo(gitX, gitY + 2)
      ctx.stroke()
    } else if (isUnstaged) {
      const gitX = node.x + node.width - 10
      const gitY = node.y + 8
      ctx.beginPath()
      ctx.arc(gitX, gitY, 4, 0, Math.PI * 2)
      ctx.fillStyle = '#ffa657'
      ctx.fill()
      // Modified indicator (dot)
      ctx.beginPath()
      ctx.arc(gitX, gitY, 1.5, 0, Math.PI * 2)
      ctx.fillStyle = '#080c12'
      ctx.fill()
    }

    // Parent folder connection line
    if (node.parentPath && !isFolder) {
      const parentNode = nodeMap.get(node.parentPath)
      if (parentNode) {
        ctx.beginPath()
        ctx.strokeStyle = 'rgba(0, 212, 170, 0.06)'
        ctx.lineWidth = 1 / zoom
        ctx.setLineDash([3 / zoom, 3 / zoom])
        ctx.moveTo(parentNode.x + parentNode.width / 2, parentNode.y + parentNode.height)
        ctx.lineTo(node.x + node.width / 2, node.y)
        ctx.stroke()
        ctx.setLineDash([])
      }
    }

    ctx.globalAlpha = 1
  }

  ctx.restore()
  ctx.restore()
}

// ─── Minimap Component ────────────────────────────────────────────

const Minimap = memo(function Minimap({
  nodes,
  edges,
  zoom,
  panX,
  panY,
  canvasWidth,
  canvasHeight,
  activeFilePath,
}: {
  nodes: CanvasNode[]
  edges: DependencyEdge[]
  zoom: number
  panX: number
  panY: number
  canvasWidth: number
  canvasHeight: number
  activeFilePath: string | null
}) {
  const minimapRef = useRef<HTMLCanvasElement>(null)

  const bounds = useMemo(() => {
    if (nodes.length === 0) return { minX: 0, minY: 0, maxX: 300, maxY: 200 }
    let minX = Infinity
    let minY = Infinity
    let maxX = -Infinity
    let maxY = -Infinity
    for (const n of nodes) {
      minX = Math.min(minX, n.x)
      minY = Math.min(minY, n.y)
      maxX = Math.max(maxX, n.x + n.width)
      maxY = Math.max(maxY, n.y + n.height)
    }
    return { minX, minY, maxX, maxY }
  }, [nodes])

  useEffect(() => {
    const canvas = minimapRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const width = 160
    const height = 100
    const dpr = window.devicePixelRatio || 1
    canvas.width = width * dpr
    canvas.height = height * dpr
    canvas.style.width = `${width}px`
    canvas.style.height = `${height}px`

    ctx.scale(dpr, dpr)
    ctx.fillStyle = '#050810'
    ctx.fillRect(0, 0, width, height)

    if (nodes.length === 0) return

    const padding = 8
    const worldW = bounds.maxX - bounds.minX + 60
    const worldH = bounds.maxY - bounds.minY + 60
    const scaleX = (width - padding * 2) / worldW
    const scaleY = (height - padding * 2) / worldH
    const scale = Math.min(scaleX, scaleY)

    const offsetX = padding + ((width - padding * 2) - worldW * scale) / 2 - bounds.minX * scale + 30 * scale
    const offsetY = padding + ((height - padding * 2) - worldH * scale) / 2 - bounds.minY * scale + 30 * scale

    // Draw edges
    ctx.strokeStyle = 'rgba(0, 212, 170, 0.08)'
    ctx.lineWidth = 0.5
    const nodeMap = new Map(nodes.map((n) => [n.path, n]))
    for (const edge of edges) {
      const from = nodeMap.get(edge.from)
      const to = nodeMap.get(edge.to)
      if (!from || !to) continue
      ctx.beginPath()
      ctx.moveTo(from.x * scale + offsetX + (from.width * scale) / 2, from.y * scale + offsetY)
      ctx.lineTo(to.x * scale + offsetX + (to.width * scale) / 2, to.y * scale + offsetY)
      ctx.stroke()
    }

    // Draw nodes
    for (const node of nodes) {
      const nx = node.x * scale + offsetX
      const ny = node.y * scale + offsetY
      const nw = Math.max(node.width * scale, 2)
      const nh = Math.max(node.height * scale, 1.5)

      const isActive = node.path === activeFilePath
      ctx.fillStyle = isActive
        ? '#00d4aa'
        : node.type === 'folder'
          ? 'rgba(0, 212, 170, 0.3)'
          : getLanguageColor(node.language)
      ctx.globalAlpha = isActive ? 0.8 : 0.4
      ctx.fillRect(nx, ny, nw, nh)
      ctx.globalAlpha = 1
    }

    // Viewport indicator
    const vpLeft = (-panX / zoom) * scale + offsetX
    const vpTop = (-panY / zoom) * scale + offsetY
    const vpWidth = (canvasWidth / zoom) * scale
    const vpHeight = (canvasHeight / zoom) * scale

    ctx.strokeStyle = 'rgba(0, 212, 170, 0.5)'
    ctx.lineWidth = 1
    ctx.strokeRect(vpLeft, vpTop, vpWidth, vpHeight)
  }, [nodes, edges, zoom, panX, panY, canvasWidth, canvasHeight, activeFilePath, bounds])

  return (
    <canvas
      ref={minimapRef}
      className="rounded border border-[rgba(0,212,170,0.08)]"
      style={{ width: 160, height: 100 }}
    />
  )
})

// ─── Main Component ───────────────────────────────────────────────

export function CanvasNavigation() {
  const fileTree = useIDEStore((s) => s.fileTree)
  const fileContents = useIDEStore((s) => s.fileContents)
  const openTabs = useIDEStore((s) => s.openTabs)
  const activeTabId = useIDEStore((s) => s.activeTabId)
  const gitUnstaged = useIDEStore((s) => s.gitUnstaged)
  const gitStaged = useIDEStore((s) => s.gitStaged)
  const openFile = useIDEStore((s) => s.openFile)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const [zoom, setZoom] = useState(1)
  const [panX, setPanX] = useState(0)
  const [panY, setPanY] = useState(0)
  const [hoveredNode, setHoveredNode] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('tree')
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 })
  const [showSearch, setShowSearch] = useState(false)
  const [layoutMenuOpen, setLayoutMenuOpen] = useState(false)

  const isDragging = useRef(false)
  const dragStart = useRef({ x: 0, y: 0 })
  const panStart = useRef({ x: 0, y: 0 })

  // Get active file path
  const activeFilePath = useMemo(() => {
    const activeTab = openTabs.find((t) => t.id === activeTabId)
    return activeTab?.path || null
  }, [openTabs, activeTabId])

  // Build node list
  const rawNodes = useMemo(
    () => flattenFiles(fileTree, fileContents),
    [fileTree, fileContents]
  )

  // Compute edges
  const edges = useMemo(
    () => extractDependencies(fileContents, rawNodes),
    [fileContents, rawNodes]
  )

  // Layout
  const nodes = useMemo(() => {
    const filtered = searchTerm
      ? rawNodes.filter(
          (n) =>
            n.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            n.path.toLowerCase().includes(searchTerm.toLowerCase()) ||
            n.parentPath?.toLowerCase().includes(searchTerm.toLowerCase())
        )
      : rawNodes

    switch (layoutMode) {
      case 'grid':
        return layoutGrid(filtered)
      case 'force':
        return layoutForce(filtered, edges)
      case 'tree':
      default:
        return layoutTree(filtered)
    }
  }, [rawNodes, edges, layoutMode, searchTerm])

  // Node map for quick lookup
  const nodeMap = useMemo(
    () => new Map(nodes.map((n) => [n.path, n])),
    [nodes]
  )

  // Resize observer
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setCanvasSize({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        })
      }
    })
    observer.observe(container)
    return () => observer.disconnect()
  }, [])

  // Canvas rendering
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    canvas.width = canvasSize.width * dpr
    canvas.height = canvasSize.height * dpr
    canvas.style.width = `${canvasSize.width}px`
    canvas.style.height = `${canvasSize.height}px`

    drawCanvas(
      ctx,
      nodes,
      edges,
      zoom,
      panX,
      panY,
      canvasSize.width,
      canvasSize.height,
      activeFilePath,
      hoveredNode,
      searchTerm,
      gitStaged,
      gitUnstaged,
      nodeMap
    )
  }, [
    nodes,
    edges,
    zoom,
    panX,
    panY,
    canvasSize,
    activeFilePath,
    hoveredNode,
    searchTerm,
    gitStaged,
    gitUnstaged,
    nodeMap,
  ])

  // Mouse handlers
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      isDragging.current = true
      dragStart.current = { x: e.clientX, y: e.clientY }
      panStart.current = { x: panX, y: panY }
    },
    [panX, panY]
  )

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (isDragging.current) {
        const dx = e.clientX - dragStart.current.x
        const dy = e.clientY - dragStart.current.y
        setPanX(panStart.current.x + dx)
        setPanY(panStart.current.y + dy)
      } else {
        // Hit detection for hover
        const canvas = canvasRef.current
        if (!canvas) return
        const rect = canvas.getBoundingClientRect()
        const mx = (e.clientX - rect.left - panX) / zoom
        const my = (e.clientY - rect.top - panY) / zoom

        let found: string | null = null
        for (const node of nodes) {
          if (
            mx >= node.x &&
            mx <= node.x + node.width &&
            my >= node.y &&
            my <= node.y + node.height
          ) {
            found = node.path
            break
          }
        }
        setHoveredNode(found)
        canvas.style.cursor = found ? 'pointer' : 'grab'
      }
    },
    [zoom, panX, panY, nodes]
  )

  const handleMouseUp = useCallback(() => {
    isDragging.current = false
  }, [])

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      const canvas = canvasRef.current
      if (!canvas) return
      const rect = canvas.getBoundingClientRect()
      const mx = (e.clientX - rect.left - panX) / zoom
      const my = (e.clientY - rect.top - panY) / zoom

      for (const node of nodes) {
        if (
          mx >= node.x &&
          mx <= node.x + node.width &&
          my >= node.y &&
          my <= node.y + node.height
        ) {
          if (node.type === 'file') {
            openFile(node.path)
          }
          return
        }
      }
    },
    [zoom, panX, panY, nodes, openFile]
  )

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? 0.9 : 1.1
    setZoom((prev) => Math.max(0.1, Math.min(3, prev * delta)))
  }, [])

  // Zoom controls
  const handleZoomIn = useCallback(() => {
    setZoom((prev) => Math.min(3, prev * 1.2))
  }, [])

  const handleZoomOut = useCallback(() => {
    setZoom((prev) => Math.max(0.1, prev / 1.2))
  }, [])

  const handleFitToScreen = useCallback(() => {
    if (nodes.length === 0) return
    let minX = Infinity
    let minY = Infinity
    let maxX = -Infinity
    let maxY = -Infinity
    for (const n of nodes) {
      minX = Math.min(minX, n.x)
      minY = Math.min(minY, n.y)
      maxX = Math.max(maxX, n.x + n.width)
      maxY = Math.max(maxY, n.y + n.height)
    }
    const worldW = maxX - minX + 80
    const worldH = maxY - minY + 80
    const scaleX = canvasSize.width / worldW
    const scaleY = canvasSize.height / worldH
    const newZoom = Math.min(scaleX, scaleY, 2) * 0.9
    setZoom(newZoom)
    setPanX((canvasSize.width - worldW * newZoom) / 2 - minX * newZoom + 40 * newZoom)
    setPanY((canvasSize.height - worldH * newZoom) / 2 - minY * newZoom + 40 * newZoom)
  }, [nodes, canvasSize])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && !e.ctrlKey && !e.metaKey) {
        const target = e.target as HTMLElement
        if (target.tagName === 'INPUT') return
        e.preventDefault()
        setShowSearch(true)
      }
      if (e.key === 'Escape') {
        setShowSearch(false)
        setSearchTerm('')
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const zoomPercent = Math.round(zoom * 100)

  const layoutOptions: { mode: LayoutMode; label: string; icon: React.ReactNode }[] = [
    { mode: 'tree', label: 'Tree', icon: <LayoutList size={13} /> },
    { mode: 'grid', label: 'Grid', icon: <LayoutGrid size={13} /> },
    { mode: 'force', label: 'Force', icon: <Network size={13} /> },
  ]

  return (
    <div className="h-full w-full flex flex-col bg-[#080c12] relative" role="region" aria-label="Canvas Navigation">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-[#050810] border-b border-[rgba(0,212,170,0.08)] shrink-0 gap-2">
        <div className="flex items-center gap-1">
          {/* Search toggle */}
          <button
            onClick={() => setShowSearch(!showSearch)}
            className={`p-1.5 rounded transition-colors cursor-pointer ${
              showSearch
                ? 'bg-[rgba(0,212,170,0.1)] text-[#00d4aa]'
                : 'text-[#484f58] hover:text-[#8b949e] hover:bg-[rgba(0,212,170,0.04)]'
            }`}
            title="Search files ( / )"
            aria-label="Search files"
          >
            <Search size={14} />
          </button>

          {/* Layout selector */}
          <div className="relative">
            <button
              onClick={() => setLayoutMenuOpen(!layoutMenuOpen)}
              className="flex items-center gap-1 px-2 py-1 rounded text-[11px] font-mono text-[#484f58] hover:text-[#8b949e] hover:bg-[rgba(0,212,170,0.04)] transition-colors cursor-pointer"
              aria-label="Layout mode"
              aria-expanded={layoutMenuOpen}
            >
              {layoutOptions.find((o) => o.mode === layoutMode)?.icon}
              <span>{layoutOptions.find((o) => o.mode === layoutMode)?.label}</span>
              <ChevronDown size={10} />
            </button>
            {layoutMenuOpen && (
              <div className="absolute top-full left-0 mt-1 bg-[#0d1117] border border-[rgba(0,212,170,0.12)] rounded-lg shadow-xl shadow-black/40 py-1 z-20 min-w-[120px]">
                {layoutOptions.map((opt) => (
                  <button
                    key={opt.mode}
                    onClick={() => {
                      setLayoutMode(opt.mode)
                      setLayoutMenuOpen(false)
                    }}
                    className={`w-full flex items-center gap-2 px-3 py-1.5 text-[11px] font-mono transition-colors cursor-pointer ${
                      layoutMode === opt.mode
                        ? 'text-[#00d4aa] bg-[rgba(0,212,170,0.06)]'
                        : 'text-[#8b949e] hover:text-[#e6edf3] hover:bg-[rgba(0,212,170,0.04)]'
                    }`}
                  >
                    {opt.icon}
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="w-px h-4 bg-[rgba(0,212,170,0.08)]" aria-hidden="true" />

          {/* Zoom controls */}
          <button
            onClick={handleZoomOut}
            className="p-1.5 rounded text-[#484f58] hover:text-[#8b949e] hover:bg-[rgba(0,212,170,0.04)] transition-colors cursor-pointer"
            title="Zoom out"
            aria-label="Zoom out"
          >
            <ZoomOut size={14} />
          </button>
          <span className="text-[10px] font-mono text-[#30363d] w-9 text-center select-none" aria-label={`Zoom level: ${zoomPercent}%`}>
            {zoomPercent}%
          </span>
          <button
            onClick={handleZoomIn}
            className="p-1.5 rounded text-[#484f58] hover:text-[#8b949e] hover:bg-[rgba(0,212,170,0.04)] transition-colors cursor-pointer"
            title="Zoom in"
            aria-label="Zoom in"
          >
            <ZoomIn size={14} />
          </button>
          <button
            onClick={handleFitToScreen}
            className="p-1.5 rounded text-[#484f58] hover:text-[#8b949e] hover:bg-[rgba(0,212,170,0.04)] transition-colors cursor-pointer"
            title="Fit to screen"
            aria-label="Fit to screen"
          >
            <Maximize2 size={14} />
          </button>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-3 text-[10px] font-mono text-[#30363d]">
          <span className="flex items-center gap-1">
            <File size={10} />
            {nodes.filter((n) => n.type === 'file').length} files
          </span>
          <span className="flex items-center gap-1">
            <Folder size={10} />
            {nodes.filter((n) => n.type === 'folder').length} folders
          </span>
          {edges.length > 0 && (
            <span className="flex items-center gap-1 text-[rgba(0,212,170,0.4)]">
              <GitBranch size={10} />
              {edges.length} deps
            </span>
          )}
        </div>
      </div>

      {/* Search bar */}
      {showSearch && (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-[#0a0e14] border-b border-[rgba(0,212,170,0.06)] shrink-0">
          <Search size={12} className="text-[#30363d] shrink-0" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search files... (Esc to close)"
            className="flex-1 bg-transparent text-[12px] font-mono text-[#e6edf3] placeholder-[#30363d] outline-none"
            autoFocus
            aria-label="Search files in canvas"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="text-[#30363d] hover:text-[#8b949e] transition-colors cursor-pointer"
              aria-label="Clear search"
            >
              <X size={12} />
            </button>
          )}
          <span className="text-[10px] font-mono text-[#30363d]">
            {searchTerm
              ? `${nodes.filter((n) => n.name.toLowerCase().includes(searchTerm.toLowerCase())).length} matches`
              : ''}
          </span>
        </div>
      )}

      {/* Canvas container */}
      <div
        ref={containerRef}
        className="flex-1 relative overflow-hidden min-h-0"
      >
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onClick={handleClick}
          onWheel={handleWheel}
          role="img"
          aria-label="Interactive code map canvas. Drag to pan, scroll to zoom, click to open files."
        />

        {/* Empty state */}
        {nodes.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center">
              <div className="text-[#00d4aa]/10 text-5xl mb-3" aria-hidden="true">
                <Network size={48} className="mx-auto" />
              </div>
              <p className="text-[12px] font-mono text-[#484f58]">No files to visualize</p>
              <p className="text-[10px] font-mono text-[#30363d] mt-1">
                Create files in the explorer to see them here
              </p>
            </div>
          </div>
        )}

        {/* Minimap */}
        {nodes.length > 0 && (
          <div className="absolute bottom-3 right-3 z-10">
            <Minimap
              nodes={nodes}
              edges={edges}
              zoom={zoom}
              panX={panX}
              panY={panY}
              canvasWidth={canvasSize.width}
              canvasHeight={canvasSize.height}
              activeFilePath={activeFilePath}
            />
          </div>
        )}

        {/* Hovered node tooltip */}
        {hoveredNode && (
          <div className="absolute top-3 left-3 z-10 bg-[#0d1117] border border-[rgba(0,212,170,0.12)] rounded-lg px-3 py-2 shadow-xl shadow-black/40 max-w-[300px]">
            <div className="flex items-center gap-2">
              <div
                className="w-2 h-2 rounded-full shrink-0"
                style={{
                  backgroundColor: getLanguageColor(
                    nodeMap.get(hoveredNode)?.language || 'plaintext'
                  ),
                }}
              />
              <span className="text-[11px] font-mono text-[#e6edf3] truncate">
                {nodeMap.get(hoveredNode)?.name}
              </span>
            </div>
            <p className="text-[10px] font-mono text-[#30363d] mt-0.5 truncate">
              {hoveredNode}
            </p>
            {nodeMap.get(hoveredNode)?.type === 'file' && (
              <div className="flex items-center gap-3 mt-1">
                <span className="text-[9px] font-mono text-[#484f58]">
                  {nodeMap.get(hoveredNode)?.size.toLocaleString()} chars
                </span>
                <span className="text-[9px] font-mono text-[#484f58]">
                  {nodeMap.get(hoveredNode)?.language}
                </span>
                {gitStaged.includes(hoveredNode) && (
                  <span className="flex items-center gap-0.5 text-[9px] font-mono text-[#3fb950]">
                    <Plus size={8} /> staged
                  </span>
                )}
                {gitUnstaged.includes(hoveredNode) && (
                  <span className="flex items-center gap-0.5 text-[9px] font-mono text-[#ffa657]">
                    <GitBranch size={8} /> modified
                  </span>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 px-3 py-1 bg-[#050810] border-t border-[rgba(0,212,170,0.06)] shrink-0 text-[9px] font-mono text-[#30363d]">
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-[#3fb950]" aria-hidden="true" />
          Staged
        </span>
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-[#ffa657]" aria-hidden="true" />
          Modified
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-0.5 bg-[#00d4aa] rounded" aria-hidden="true" />
          Active
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-0.5 bg-[rgba(0,212,170,0.15)] rounded" aria-hidden="true" />
          Dependency
        </span>
        <span className="ml-auto text-[#30363d]">
          Drag to pan · Scroll to zoom · Click to open
        </span>
      </div>

      {/* Click outside layout menu to close */}
      {layoutMenuOpen && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => setLayoutMenuOpen(false)}
          aria-hidden="true"
        />
      )}
    </div>
  )
}

export default CanvasNavigation
