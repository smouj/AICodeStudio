'use client'

import { memo, useState, useRef, useEffect, useCallback } from 'react'
import { Pen, Eraser, Square, Circle, Type, Undo2, Redo2, Trash2, Users, MousePointer } from 'lucide-react'
import * as Y from 'yjs'
import { WebsocketProvider } from 'y-websocket'

// ─── Types ──────────────────────────────────────────────────────────────────

type Tool = 'pen' | 'eraser' | 'rect' | 'circle' | 'text' | 'select'

interface WhiteboardPoint {
  x: number
  y: number
}

interface WhiteboardStroke {
  id: string
  tool: Tool
  points: WhiteboardPoint[]
  color: string
  width: number
  userId: string
}

interface WhiteboardShape {
  id: string
  tool: 'rect' | 'circle'
  x: number
  y: number
  width: number
  height: number
  color: string
  lineWidth: number
  userId: string
}

// ─── Yjs Shared Document ────────────────────────────────────────────────────

const ydoc = new Y.Doc()
const yStrokes = ydoc.getArray<WhiteboardStroke>('strokes')
const yShapes = ydoc.getArray<WhiteboardShape>('shapes')

// Attempt WebSocket connection (non-blocking, graceful fallback)
let wsProvider: WebsocketProvider | null = null
try {
  const wsUrl = process.env.NEXT_PUBLIC_YJS_WS_URL || `ws://localhost:3003`
  wsProvider = new WebsocketProvider(wsUrl, 'aicodestudio-whiteboard', ydoc, {
    connect: true,
  })
  wsProvider.on('status', ({ status }: { status: string }) => {
    console.log(`[Whiteboard] Yjs sync status: ${status}`)
  })
} catch {
  console.log('[Whiteboard] Yjs WebSocket not available — using local-only mode')
}

// ─── Color Palette ──────────────────────────────────────────────────────────

const COLORS = [
  '#00d4aa', '#3b82f6', '#ef4444', '#eab308', '#8b5cf6',
  '#ec4899', '#f97316', '#22c55e', '#06b6d4', '#e6edf3',
]

const USER_ID = `user-${Math.random().toString(36).slice(2, 8)}`

// ─── Whiteboard Component ───────────────────────────────────────────────────

export const WhiteboardPanel = memo(function WhiteboardPanel() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const [tool, setTool] = useState<Tool>('pen')
  const [color, setColor] = useState('#00d4aa')
  const [lineWidth, setLineWidth] = useState(2)
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 })
  const [connected, setConnected] = useState(false)
  const [peerCount, setPeerCount] = useState(1)

  const isDrawing = useRef(false)
  const currentStroke = useRef<WhiteboardPoint[]>([])
  const shapeStart = useRef<WhiteboardPoint | null>(null)

  // Track Yjs connection
  useEffect(() => {
    if (wsProvider) {
      const handleStatus = ({ status }: { status: string }) => {
        setConnected(status === 'connected')
      }
      wsProvider.on('status', handleStatus)
      // Defer state reads to avoid synchronous setState in effect
      queueMicrotask(() => {
        setConnected(wsProvider?.wsconnected ?? false)
      })

      // Awareness for peer count
      const awareness = wsProvider.awareness
      queueMicrotask(() => {
        setPeerCount(awareness.getStates().size)
      })
      awareness.on('change', () => {
        setPeerCount(awareness.getStates().size)
      })

      return () => {
        wsProvider?.off('status', handleStatus)
      }
    }
  }, [])

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

  // ─── Drawing Logic ──────────────────────────────────────────────────────

  const drawAll = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    canvas.width = canvasSize.width * dpr
    canvas.height = canvasSize.height * dpr
    canvas.style.width = `${canvasSize.width}px`
    canvas.style.height = `${canvasSize.height}px`
    ctx.scale(dpr, dpr)

    // Background
    ctx.fillStyle = '#080c12'
    ctx.fillRect(0, 0, canvasSize.width, canvasSize.height)

    // Grid
    ctx.strokeStyle = 'rgba(0, 212, 170, 0.025)'
    ctx.lineWidth = 1
    const gridSize = 30
    for (let x = 0; x < canvasSize.width; x += gridSize) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, canvasSize.height)
      ctx.stroke()
    }
    for (let y = 0; y < canvasSize.height; y += gridSize) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(canvasSize.width, y)
      ctx.stroke()
    }

    // Draw shapes
    for (let i = 0; i < yShapes.length; i++) {
      const shape = yShapes.get(i)
      if (!shape) continue

      ctx.strokeStyle = shape.color
      ctx.lineWidth = shape.lineWidth

      if (shape.tool === 'rect') {
        ctx.strokeRect(shape.x, shape.y, shape.width, shape.height)
      } else if (shape.tool === 'circle') {
        ctx.beginPath()
        const rx = shape.width / 2
        const ry = shape.height / 2
        ctx.ellipse(shape.x + rx, shape.y + ry, Math.abs(rx), Math.abs(ry), 0, 0, Math.PI * 2)
        ctx.stroke()
      }
    }

    // Draw strokes
    for (let i = 0; i < yStrokes.length; i++) {
      const stroke = yStrokes.get(i)
      if (!stroke || stroke.points.length < 2) continue

      ctx.strokeStyle = stroke.tool === 'eraser' ? '#080c12' : stroke.color
      ctx.lineWidth = stroke.tool === 'eraser' ? stroke.width * 4 : stroke.width
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'

      ctx.beginPath()
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y)
      for (let j = 1; j < stroke.points.length; j++) {
        ctx.lineTo(stroke.points[j].x, stroke.points[j].y)
      }
      ctx.stroke()
    }
  }, [canvasSize])

  // Observe Yjs changes and redraw
  useEffect(() => {
    const redraw = () => drawAll()

    yStrokes.observe(redraw)
    yShapes.observe(redraw)

    return () => {
      yStrokes.unobserve(redraw)
      yShapes.unobserve(redraw)
    }
  }, [drawAll])

  // ─── Mouse Handlers ────────────────────────────────────────────────────

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    isDrawing.current = true

    if (tool === 'pen' || tool === 'eraser') {
      currentStroke.current = [{ x, y }]
    } else if (tool === 'rect' || tool === 'circle') {
      shapeStart.current = { x, y }
    } else if (tool === 'text') {
      const text = prompt('Enter text:')
      if (text) {
        const ctx = canvas.getContext('2d')
        if (ctx) {
          ctx.fillStyle = color
          ctx.font = `${lineWidth * 6}px "Geist Mono", monospace`
          ctx.fillText(text, x, y)
        }
      }
      isDrawing.current = false
    }
  }, [tool, color, lineWidth])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDrawing.current) return
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    if (tool === 'pen' || tool === 'eraser') {
      currentStroke.current.push({ x, y })
      // Draw preview
      drawAll()
      const ctx = canvas.getContext('2d')
      if (ctx && currentStroke.current.length >= 2) {
        ctx.strokeStyle = tool === 'eraser' ? '#080c12' : color
        ctx.lineWidth = tool === 'eraser' ? lineWidth * 4 : lineWidth
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'
        ctx.beginPath()
        ctx.moveTo(currentStroke.current[0].x, currentStroke.current[0].y)
        for (let i = 1; i < currentStroke.current.length; i++) {
          ctx.lineTo(currentStroke.current[i].x, currentStroke.current[i].y)
        }
        ctx.stroke()
      }
    } else if ((tool === 'rect' || tool === 'circle') && shapeStart.current) {
      // Preview shape
      drawAll()
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.strokeStyle = color
        ctx.lineWidth = lineWidth
        const sx = shapeStart.current.x
        const sy = shapeStart.current.y
        const w = x - sx
        const h = y - sy

        if (tool === 'rect') {
          ctx.strokeRect(sx, sy, w, h)
        } else {
          ctx.beginPath()
          ctx.ellipse(sx + w / 2, sy + h / 2, Math.abs(w / 2), Math.abs(h / 2), 0, 0, Math.PI * 2)
          ctx.stroke()
        }
      }
    }
  }, [tool, color, lineWidth, drawAll])

  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    if (!isDrawing.current) return
    isDrawing.current = false

    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    if ((tool === 'pen' || tool === 'eraser') && currentStroke.current.length >= 2) {
      const stroke: WhiteboardStroke = {
        id: `stroke-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        tool,
        points: [...currentStroke.current],
        color,
        width: lineWidth,
        userId: USER_ID,
      }
      yStrokes.push([stroke])
      currentStroke.current = []
    } else if ((tool === 'rect' || tool === 'circle') && shapeStart.current) {
      const shape: WhiteboardShape = {
        id: `shape-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        tool,
        x: shapeStart.current.x,
        y: shapeStart.current.y,
        width: x - shapeStart.current.x,
        height: y - shapeStart.current.y,
        color,
        lineWidth,
        userId: USER_ID,
      }
      yShapes.push([shape])
      shapeStart.current = null
    }

    drawAll()
  }, [tool, color, lineWidth, drawAll])

  // ─── Actions ──────────────────────────────────────────────────────────

  const handleUndo = useCallback(() => {
    // Remove the last element added by this user
    for (let i = yStrokes.length - 1; i >= 0; i--) {
      const stroke = yStrokes.get(i)
      if (stroke?.userId === USER_ID) {
        yStrokes.delete(i, 1)
        break
      }
    }
    for (let i = yShapes.length - 1; i >= 0; i--) {
      const shape = yShapes.get(i)
      if (shape?.userId === USER_ID) {
        yShapes.delete(i, 1)
        break
      }
    }
    drawAll()
  }, [drawAll])

  const handleClear = useCallback(() => {
    if (confirm('Clear the entire whiteboard? This cannot be undone.')) {
      ydoc.transact(() => {
        yStrokes.delete(0, yStrokes.length)
        yShapes.delete(0, yShapes.length)
      })
      drawAll()
    }
  }, [drawAll])

  // ─── Toolbar ──────────────────────────────────────────────────────────

  const tools: { id: Tool; icon: React.ReactNode; label: string }[] = [
    { id: 'pen', icon: <Pen size={14} />, label: 'Pen' },
    { id: 'eraser', icon: <Eraser size={14} />, label: 'Eraser' },
    { id: 'rect', icon: <Square size={14} />, label: 'Rectangle' },
    { id: 'circle', icon: <Circle size={14} />, label: 'Circle' },
    { id: 'text', icon: <Type size={14} />, label: 'Text' },
    { id: 'select', icon: <MousePointer size={14} />, label: 'Select' },
  ]

  return (
    <div className="h-full flex flex-col bg-[#080c12]" role="region" aria-label="Collaborative Whiteboard">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-[#050810] border-b border-[rgba(0,212,170,0.08)] shrink-0">
        <div className="flex items-center gap-1">
          {tools.map((t) => (
            <button
              key={t.id}
              onClick={() => setTool(t.id)}
              className={`p-1.5 rounded transition-colors cursor-pointer ${
                tool === t.id
                  ? 'bg-[rgba(0,212,170,0.1)] text-[#00d4aa]'
                  : 'text-[#484f58] hover:text-[#8b949e] hover:bg-[rgba(0,212,170,0.04)]'
              }`}
              aria-label={t.label}
              aria-pressed={tool === t.id}
            >
              {t.icon}
            </button>
          ))}

          <div className="w-px h-4 bg-[rgba(0,212,170,0.08)] mx-1" aria-hidden="true" />

          {/* Color picker */}
          <div className="flex items-center gap-0.5">
            {COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className={`w-4 h-4 rounded-full border cursor-pointer transition-transform ${
                  color === c ? 'border-white scale-125' : 'border-transparent hover:scale-110'
                }`}
                style={{ backgroundColor: c }}
                aria-label={`Color ${c}`}
              />
            ))}
          </div>

          <div className="w-px h-4 bg-[rgba(0,212,170,0.08)] mx-1" aria-hidden="true" />

          {/* Line width */}
          <input
            type="range"
            min={1}
            max={10}
            value={lineWidth}
            onChange={(e) => setLineWidth(parseInt(e.target.value, 10))}
            className="w-16 h-1 accent-[#00d4aa]"
            aria-label="Line width"
          />
          <span className="text-[9px] font-mono text-[#30363d] ml-1">{lineWidth}px</span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={handleUndo}
            className="p-1.5 rounded text-[#484f58] hover:text-[#8b949e] hover:bg-[rgba(0,212,170,0.04)] transition-colors cursor-pointer"
            aria-label="Undo"
          >
            <Undo2 size={14} />
          </button>
          <button
            onClick={handleClear}
            className="p-1.5 rounded text-[#484f58] hover:text-[#f85149] hover:bg-[rgba(248,81,73,0.04)] transition-colors cursor-pointer"
            aria-label="Clear whiteboard"
          >
            <Trash2 size={14} />
          </button>

          <div className="w-px h-4 bg-[rgba(0,212,170,0.08)] mx-1" aria-hidden="true" />

          {/* Connection status */}
          <div className="flex items-center gap-1">
            <Users size={10} className={connected ? 'text-[#00d4aa]' : 'text-[#30363d]'} />
            <span className="text-[9px] font-mono text-[#30363d]">
              {peerCount} {peerCount === 1 ? 'user' : 'users'}
            </span>
          </div>
        </div>
      </div>

      {/* Canvas */}
      <div ref={containerRef} className="flex-1 relative overflow-hidden min-h-0">
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={() => { isDrawing.current = false }}
          role="img"
          aria-label="Collaborative whiteboard canvas. Draw with mouse, shapes sync via Yjs."
          style={{ cursor: tool === 'select' ? 'default' : 'crosshair' }}
        />

        {/* Empty state */}
        {yStrokes.length === 0 && yShapes.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center">
              <Pen size={32} className="mx-auto text-[#00d4aa]/10 mb-2" />
              <p className="text-[12px] font-mono text-[#484f58]">Draw on the whiteboard</p>
              <p className="text-[10px] font-mono text-[#30363d] mt-1">
                {connected
                  ? `Connected — ${peerCount} ${peerCount === 1 ? 'user' : 'users'} in session`
                  : 'Local mode — connect a Yjs WebSocket for collaboration'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
})
