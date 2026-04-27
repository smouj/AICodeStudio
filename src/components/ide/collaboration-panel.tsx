'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import {
  Users,
  Link2,
  Copy,
  Check,
  Wifi,
  WifiOff,
  RefreshCw,
  Send,
  LogOut,
  Eye,
  MousePointer2,
  ChevronDown,
  ChevronRight,
  Circle,
  MessageSquare,
  Zap,
  AlertTriangle,
} from 'lucide-react'
import { useIDEStore } from '@/store/ide-store'
import type { CollabPeer, CursorPosition } from '@/store/ide-store'

// ─── Chat Message Type ──────────────────────────────────────

interface CollabChatMessage {
  id: string
  peerId: string
  peerName: string
  peerColor: string
  content: string
  timestamp: number
}

// ─── Sync Status Type ───────────────────────────────────────

type SyncStatus = 'synced' | 'syncing' | 'conflict'

// ─── Peer Colors ────────────────────────────────────────────

const PEER_PALETTE = [
  '#ff6b6b', '#ffa657', '#7ee787', '#79c0ff',
  '#d2a8ff', '#f778ba', '#00d4aa', '#ffd700',
]

function getPeerColor(index: number): string {
  return PEER_PALETTE[index % PEER_PALETTE.length]
}

// ─── Collab Panel Sub-Components ────────────────────────────

function ConnectionBadge({ connected, provider }: { connected: boolean; provider: string }) {
  return (
    <div className="flex items-center gap-1.5 text-[10px] font-mono">
      {connected ? (
        <Wifi size={10} className="text-[#00d4aa]" />
      ) : (
        <WifiOff size={10} className="text-[#484f58]" />
      )}
      <span className={connected ? 'text-[#00d4aa]' : 'text-[#484f58]'}>
        {connected ? 'Connected' : 'Disconnected'}
      </span>
      {connected && provider !== 'none' && (
        <span className="text-[#30363d]">· {provider.toUpperCase()}</span>
      )}
    </div>
  )
}

function SyncIndicator({ status }: { status: SyncStatus }) {
  const config: Record<SyncStatus, { color: string; label: string; icon: React.ReactNode }> = {
    synced: { color: 'text-[#00d4aa]', label: 'Synced', icon: <Zap size={10} /> },
    syncing: { color: 'text-[#ffa657]', label: 'Syncing', icon: <RefreshCw size={10} className="animate-spin" /> },
    conflict: { color: 'text-[#f85149]', label: 'Conflict', icon: <AlertTriangle size={10} /> },
  }
  const { color, label, icon } = config[status]
  return (
    <div className={`flex items-center gap-1 text-[10px] font-mono ${color}`}>
      {icon}
      <span>{label}</span>
    </div>
  )
}

function PeerCursorVisual({ peer }: { peer: CollabPeer }) {
  const { line, column } = peer.cursorPosition
  return (
    <div className="flex items-center gap-1.5 text-[10px] font-mono">
      <div
        className="w-2.5 h-3 rounded-sm relative"
        style={{ backgroundColor: peer.color }}
      >
        <div
          className="absolute -top-1 left-0 text-[7px] font-bold whitespace-nowrap px-0.5 rounded"
          style={{ backgroundColor: peer.color, color: '#080c12' }}
        >
          {peer.name.charAt(0).toUpperCase()}
        </div>
      </div>
      <span style={{ color: peer.color }}>
        L{line}:C{column}
      </span>
      {peer.activeFile && (
        <span className="text-[#30363d] truncate max-w-[80px]">{peer.activeFile.split('/').pop()}</span>
      )}
    </div>
  )
}

// ─── Main Component ─────────────────────────────────────────

export function CollaborationPanel() {
  const collabConnected = useIDEStore((s) => s.collabConnected)
  const collabRoomId = useIDEStore((s) => s.collabRoomId)
  const collabPeers = useIDEStore((s) => s.collabPeers)
  const collabProvider = useIDEStore((s) => s.collabProvider)
  const joinRoom = useIDEStore((s) => s.joinRoom)
  const leaveRoom = useIDEStore((s) => s.leaveRoom)
  const updatePeerCursor = useIDEStore((s) => s.updatePeerCursor)
  const addNotification = useIDEStore((s) => s.addNotification)
  const addOutputEntry = useIDEStore((s) => s.addOutputEntry)
  const openTabs = useIDEStore((s) => s.openTabs)
  const activeTabId = useIDEStore((s) => s.activeTabId)
  const cursorPosition = useIDEStore((s) => s.cursorPosition)

  // ─── Local State ──────────────────────────────────────
  const [roomInput, setRoomInput] = useState('')
  const [isJoining, setIsJoining] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('synced')
  const [chatMessages, setChatMessages] = useState<CollabChatMessage[]>([])
  const [chatInput, setChatInput] = useState('')
  const [peersExpanded, setPeersExpanded] = useState(true)
  const [chatExpanded, setChatExpanded] = useState(true)
  const [presenceExpanded, setPresenceExpanded] = useState(true)

  const chatEndRef = useRef<HTMLDivElement>(null)
  const localUserId = useRef(`user-${Math.random().toString(36).slice(2, 8)}`)
  const localUserName = useRef(`User-${Math.random().toString(36).slice(2, 5).toUpperCase()}`)

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])

  // Simulate sync pulses when connected
  useEffect(() => {
    if (!collabConnected) {
      setSyncStatus('synced')
      return
    }
    const interval = setInterval(() => {
      setSyncStatus('syncing')
      const delay = 200 + Math.random() * 600
      setTimeout(() => {
        setSyncStatus(Math.random() > 0.95 ? 'conflict' : 'synced')
        if (Math.random() > 0.95) {
          setTimeout(() => setSyncStatus('synced'), 2000)
        }
      }, delay)
    }, 5000 + Math.random() * 10000)
    return () => clearInterval(interval)
  }, [collabConnected])

  // ─── Handlers ─────────────────────────────────────────

  const handleJoinRoom = useCallback(async () => {
    const roomId = roomInput.trim()
    if (!roomId) {
      addNotification('warning', 'Please enter a room ID.')
      return
    }
    setIsJoining(true)
    try {
      const res = await fetch('/api/collaboration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'join', roomId, userId: localUserId.current, userName: localUserName.current }),
      })
      if (!res.ok) throw new Error('Failed to join room')
      joinRoom(roomId)
      addOutputEntry('Collaboration', `Joined room: ${roomId}`)
      addNotification('success', `Connected to collaboration room: ${roomId}`)
      setSyncStatus('syncing')
      setTimeout(() => setSyncStatus('synced'), 800)
    } catch {
      addNotification('error', 'Failed to join collaboration room.')
    } finally {
      setIsJoining(false)
    }
  }, [roomInput, joinRoom, addNotification, addOutputEntry])

  const handleLeaveRoom = useCallback(async () => {
    try {
      await fetch('/api/collaboration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'leave', roomId: collabRoomId, userId: localUserId.current }),
      })
    } catch {
      // silently leave even if API fails
    }
    leaveRoom()
    setChatMessages([])
    addOutputEntry('Collaboration', 'Left collaboration room.')
    addNotification('info', 'Left collaboration room.')
  }, [collabRoomId, leaveRoom, addNotification, addOutputEntry])

  const handleCopyLink = useCallback(() => {
    if (!collabRoomId) return
    const link = `${typeof window !== 'undefined' ? window.location.origin : ''}/?room=${collabRoomId}`
    navigator.clipboard.writeText(link).then(() => {
      setCopiedLink(true)
      addNotification('success', 'Room link copied to clipboard.')
      setTimeout(() => setCopiedLink(false), 2000)
    }).catch(() => {
      addNotification('error', 'Failed to copy link.')
    })
  }, [collabRoomId, addNotification])

  const handleSendChat = useCallback(() => {
    if (!chatInput.trim() || !collabConnected) return
    const msg: CollabChatMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      peerId: localUserId.current,
      peerName: localUserName.current,
      peerColor: '#00d4aa',
      content: chatInput.trim(),
      timestamp: Date.now(),
    }
    setChatMessages((prev) => [...prev, msg])
    setChatInput('')
  }, [chatInput, collabConnected])

  // Broadcast cursor updates when local cursor moves
  useEffect(() => {
    if (!collabConnected || !activeTabId) return
    const activeTab = openTabs.find((t) => t.id === activeTabId)
    if (!activeTab) return
    updatePeerCursor(localUserId.current, cursorPosition, activeTab.path)
  }, [cursorPosition, collabConnected, activeTabId, openTabs, updatePeerCursor])

  // ─── Current active file ──────────────────────────────

  const activeFile = openTabs.find((t) => t.id === activeTabId)?.path

  // ─── Group peers by active file ───────────────────────

  const peersByFile = collabPeers.reduce<Record<string, CollabPeer[]>>((acc, peer) => {
    const file = peer.activeFile || '(no file)'
    if (!acc[file]) acc[file] = []
    acc[file].push(peer)
    return acc
  }, {})

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-[#30363d] border-b border-[rgba(0,212,170,0.08)]">
        <span>Collaboration</span>
        <Users size={12} className="text-[#30363d]" />
      </div>

      {/* Connection Status */}
      <div className="px-3 py-2 border-b border-[rgba(0,212,170,0.05)]">
        <div className="flex items-center justify-between">
          <ConnectionBadge connected={collabConnected} provider={collabProvider} />
          {collabConnected && <SyncIndicator status={syncStatus} />}
        </div>
      </div>

      {/* Room Management */}
      <div className="px-3 py-2 border-b border-[rgba(0,212,170,0.05)]">
        {collabConnected && collabRoomId ? (
          <div className="space-y-2">
            {/* Active Room */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 flex-1 min-w-0 bg-[#0d1117] border border-[rgba(0,212,170,0.12)] rounded px-2 py-1.5">
                <Circle size={6} className="text-[#00d4aa] fill-[#00d4aa] shrink-0" />
                <span className="text-[11px] font-mono text-[#e6edf3] truncate">{collabRoomId}</span>
              </div>
              <button
                onClick={handleCopyLink}
                className="p-1.5 text-[#484f58] hover:text-[#00d4aa] hover:bg-[rgba(0,212,170,0.08)] rounded transition-colors cursor-pointer shrink-0"
                title="Copy share link"
              >
                {copiedLink ? <Check size={12} className="text-[#00d4aa]" /> : <Copy size={12} />}
              </button>
              <button
                onClick={handleLeaveRoom}
                className="p-1.5 text-[#484f58] hover:text-[#f85149] hover:bg-[rgba(248,81,73,0.08)] rounded transition-colors cursor-pointer shrink-0"
                title="Leave room"
              >
                <LogOut size={12} />
              </button>
            </div>

            {/* Share link hint */}
            <div className="flex items-center gap-1.5 text-[10px] text-[#30363d]">
              <Link2 size={10} />
              <span>Share room ID or copy link to invite</span>
            </div>

            {/* Peer count */}
            <div className="flex items-center gap-1.5 text-[10px] text-[#484f58] font-mono">
              <Users size={10} className="text-[#00d4aa]/50" />
              <span>{collabPeers.length + 1} user{(collabPeers.length + 1) !== 1 ? 's' : ''} connected</span>
            </div>
          </div>
        ) : (
          /* Join Room */
          <div className="space-y-2">
            <div className="flex items-center gap-2 bg-[#0d1117] border border-[rgba(0,212,170,0.08)] rounded px-3 py-1.5 focus-within:border-[rgba(0,212,170,0.25)] transition-colors">
              <Link2 size={12} className="text-[#30363d] shrink-0" />
              <input
                value={roomInput}
                onChange={(e) => setRoomInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleJoinRoom()}
                placeholder="Enter room ID..."
                className="flex-1 bg-transparent text-[12px] text-[#e6edf3] placeholder-[#30363d] outline-none font-mono"
              />
            </div>
            <button
              onClick={handleJoinRoom}
              disabled={isJoining || !roomInput.trim()}
              className={`
                w-full text-[12px] font-mono py-1.5 rounded transition-all cursor-pointer
                ${isJoining
                  ? 'bg-[rgba(0,212,170,0.04)] text-[#30363d] cursor-not-allowed'
                  : roomInput.trim()
                    ? 'bg-[rgba(0,212,170,0.12)] text-[#00d4aa] hover:bg-[rgba(0,212,170,0.18)]'
                    : 'bg-[rgba(0,212,170,0.04)] text-[#30363d] cursor-not-allowed'
                }
              `}
            >
              {isJoining ? 'Connecting...' : 'Join Room'}
            </button>
          </div>
        )}
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">

        {/* ─── Connected Peers ──────────────────────────── */}
        <div className="border-b border-[rgba(0,212,170,0.05)]">
          <button
            onClick={() => setPeersExpanded(!peersExpanded)}
            className="w-full flex items-center justify-between px-4 py-1.5 text-[11px] uppercase tracking-wider text-[#484f58] font-semibold hover:bg-[rgba(0,212,170,0.03)] transition-colors cursor-pointer"
          >
            <span className="flex items-center gap-1.5">
              <MousePointer2 size={10} />
              Peers ({collabPeers.length + 1})
            </span>
            {peersExpanded ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
          </button>

          {peersExpanded && (
            <div className="px-2 pb-2 space-y-0.5">
              {/* Local user */}
              <div className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-[rgba(0,212,170,0.04)] transition-colors">
                <div className="w-2 h-2 rounded-full bg-[#00d4aa] shrink-0" />
                <span className="text-[12px] text-[#e6edf3] font-mono">{localUserName.current}</span>
                <span className="text-[9px] text-[#00d4aa] font-mono ml-auto">YOU</span>
              </div>

              {collabPeers.length === 0 && (
                <div className="text-center py-3 text-[11px] text-[#30363d] font-mono">
                  No other peers connected
                </div>
              )}

              {collabPeers.map((peer) => (
                <div
                  key={peer.id}
                  className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-[rgba(0,212,170,0.04)] transition-colors"
                >
                  <div
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: peer.color }}
                  />
                  <span className="text-[12px] text-[#e6edf3] font-mono">{peer.name}</span>
                  <PeerCursorVisual peer={peer} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ─── User Presence ────────────────────────────── */}
        <div className="border-b border-[rgba(0,212,170,0.05)]">
          <button
            onClick={() => setPresenceExpanded(!presenceExpanded)}
            className="w-full flex items-center justify-between px-4 py-1.5 text-[11px] uppercase tracking-wider text-[#484f58] font-semibold hover:bg-[rgba(0,212,170,0.03)] transition-colors cursor-pointer"
          >
            <span className="flex items-center gap-1.5">
              <Eye size={10} />
              Presence
            </span>
            {presenceExpanded ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
          </button>

          {presenceExpanded && (
            <div className="px-2 pb-2 space-y-0.5">
              {/* Local user presence */}
              {activeFile && (
                <div className="flex items-center gap-2 px-2 py-1 text-[11px] font-mono">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#00d4aa] shrink-0" />
                  <span className="text-[#484f58]">{localUserName.current}</span>
                  <span className="text-[#30363d]">→</span>
                  <span className="text-[#e6edf3] truncate">{activeFile.split('/').pop()}</span>
                </div>
              )}

              {Object.entries(peersByFile).map(([file, peers]) => (
                <div key={file} className="px-2 py-1">
                  <div className="text-[10px] text-[#30363d] font-mono truncate mb-0.5">
                    {file}
                  </div>
                  {peers.map((peer) => (
                    <div key={peer.id} className="flex items-center gap-1.5 ml-2 text-[11px] font-mono">
                      <div
                        className="w-1.5 h-1.5 rounded-full shrink-0"
                        style={{ backgroundColor: peer.color }}
                      />
                      <span style={{ color: peer.color }}>{peer.name}</span>
                      <span className="text-[#30363d]">L{peer.cursorPosition.line}</span>
                    </div>
                  ))}
                </div>
              ))}

              {collabPeers.length === 0 && !activeFile && (
                <div className="text-center py-3 text-[11px] text-[#30363d] font-mono">
                  No presence data
                </div>
              )}
            </div>
          )}
        </div>

        {/* ─── Chat ─────────────────────────────────────── */}
        <div>
          <button
            onClick={() => setChatExpanded(!chatExpanded)}
            className="w-full flex items-center justify-between px-4 py-1.5 text-[11px] uppercase tracking-wider text-[#484f58] font-semibold hover:bg-[rgba(0,212,170,0.03)] transition-colors cursor-pointer"
          >
            <span className="flex items-center gap-1.5">
              <MessageSquare size={10} />
              Chat
              {chatMessages.length > 0 && (
                <span className="text-[9px] text-[#30363d]">({chatMessages.length})</span>
              )}
            </span>
            {chatExpanded ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
          </button>

          {chatExpanded && (
            <div className="px-2 pb-2">
              {/* Messages */}
              <div className="max-h-48 overflow-y-auto custom-scrollbar space-y-1 mb-2">
                {chatMessages.length === 0 && (
                  <div className="text-center py-4 text-[11px] text-[#30363d] font-mono">
                    {collabConnected
                      ? 'No messages yet. Say hello!'
                      : 'Join a room to start chatting'}
                  </div>
                )}
                {chatMessages.map((msg) => (
                  <div key={msg.id} className="px-1 py-0.5">
                    <div className="flex items-baseline gap-1.5">
                      <span
                        className="text-[10px] font-mono font-semibold"
                        style={{ color: msg.peerColor }}
                      >
                        {msg.peerName}
                      </span>
                      <span className="text-[8px] text-[#30363d]">
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#8b949e] font-mono break-words leading-tight">
                      {msg.content}
                    </p>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>

              {/* Chat Input */}
              {collabConnected && (
                <div className="flex items-center gap-1.5 bg-[#0d1117] border border-[rgba(0,212,170,0.08)] rounded px-2 py-1 focus-within:border-[rgba(0,212,170,0.25)] transition-colors">
                  <input
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
                    placeholder="Type a message..."
                    className="flex-1 bg-transparent text-[11px] text-[#e6edf3] placeholder-[#30363d] outline-none font-mono"
                  />
                  <button
                    onClick={handleSendChat}
                    disabled={!chatInput.trim()}
                    className={`p-0.5 rounded transition-colors cursor-pointer shrink-0 ${
                      chatInput.trim()
                        ? 'text-[#00d4aa] hover:bg-[rgba(0,212,170,0.08)]'
                        : 'text-[#30363d] cursor-not-allowed'
                    }`}
                  >
                    <Send size={11} />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Footer Status */}
      <div className="px-3 py-1.5 border-t border-[rgba(0,212,170,0.08)] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Circle
            size={6}
            className={collabConnected ? 'text-[#00d4aa] fill-[#00d4aa]' : 'text-[#30363d]'}
          />
          <span className="text-[10px] text-[#30363d] font-mono">
            {collabConnected
              ? `Room: ${collabRoomId}`
              : 'Not connected'}
          </span>
        </div>
        {collabConnected && (
          <span className="text-[10px] text-[#30363d] font-mono">
            Yjs CRDT
          </span>
        )}
      </div>
    </div>
  )
}
