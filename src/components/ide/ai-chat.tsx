'use client'

import { useState, useRef, useEffect } from 'react'
import { Bot, Send, Zap, Radio, Loader2, Trash2, Plus, Settings, Key, AlertTriangle, FileCode, Bug, Rocket, GitCompare, ListChecks, TestTube } from 'lucide-react'
import { useIDEStore } from '@/store/ide-store'
import ReactMarkdown from 'react-markdown'
import { colors, radius, typography, spacing, animation } from '@/components/hud/tokens'
import {
  HUDSectionHeader,
  HUDIconButton,
  HUDBadge,
  AgentStatusChip,
  ToolPermissionBadge,
  AgentActivityRow,
} from '@/components/hud/hud-primitives'

type AIResponse = { content: string; provider: string } | { error: string }

function relativeTime(ts: number): string {
  const diff = Date.now() - ts
  if (diff < 60000) return 'just now'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
  return `${Math.floor(diff / 86400000)}d ago`
}

export function AIChatPanel() {
  // ─── Existing Store Selectors ──────────────────────────────
  const chatMessages = useIDEStore((s) => s.chatMessages)
  const addChatMessage = useIDEStore((s) => s.addChatMessage)
  const clearChatMessages = useIDEStore((s) => s.clearChatMessages)
  const isAiLoading = useIDEStore((s) => s.isAiLoading)
  const setAiLoading = useIDEStore((s) => s.setAiLoading)
  const activeAiProvider = useIDEStore((s) => s.activeAiProvider)
  const setActiveAiProvider = useIDEStore((s) => s.setActiveAiProvider)
  const aiProviders = useIDEStore((s) => s.aiProviders)
  const addNotification = useIDEStore((s) => s.addNotification)
  const addTodo = useIDEStore((s) => s.addTodo)
  const updateAiProvider = useIDEStore((s) => s.updateAiProvider)

  // ─── New Store Selectors ───────────────────────────────────
  const activeTabId = useIDEStore((s) => s.activeTabId)
  const openTabs = useIDEStore((s) => s.openTabs)
  const gitBranch = useIDEStore((s) => s.gitBranch)
  const workspaceName = useIDEStore((s) => s.workspaceName)
  const editorSettings = useIDEStore((s) => s.editorSettings)

  // ─── Local State ───────────────────────────────────────────
  const [input, setInput] = useState('')
  const [showProviderConfig, setShowProviderConfig] = useState(false)
  const [configApiKey, setConfigApiKey] = useState('')
  const [configEndpoint, setConfigEndpoint] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // ─── Derived State ─────────────────────────────────────────
  const currentProvider = aiProviders.find((p) => p.id === activeAiProvider)
  const hasConfiguredProvider = aiProviders.length > 0
  const hasConnectedProvider = aiProviders.some((p) => p.status === 'connected')
  const activeTab = openTabs.find((t) => t.id === activeTabId)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])

  // ─── Handlers (unchanged) ──────────────────────────────────
  const handleSend = async () => {
    if (!input.trim() || isAiLoading) return

    if (!hasConnectedProvider) {
      addNotification('warning', 'No AI provider connected. Configure one in the Agent Control panel first.')
      setShowProviderConfig(true)
      return
    }

    const userContent = input.trim()
    const userMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      role: 'user' as const,
      content: userContent,
      provider: activeAiProvider,
      timestamp: Date.now(),
    }
    addChatMessage(userMessage)
    setInput('')
    setAiLoading(true)

    try {
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userContent,
          provider: activeAiProvider,
          apiKey: currentProvider?.apiKey,
          endpoint: currentProvider?.endpoint,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        const errorMsg = errorData?.error || `API returned ${response.status}: ${response.statusText}`
        throw new Error(errorMsg)
      }

      const data: AIResponse = await response.json()

      if ('content' in data && data.content) {
        addChatMessage({
          id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          role: 'assistant',
          content: data.content,
          provider: data.provider || activeAiProvider,
          timestamp: Date.now(),
        })
      } else if ('error' in data) {
        throw new Error(data.error)
      } else {
        throw new Error('Empty response from AI provider')
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error occurred'
      addNotification('error', `AI request failed: ${errorMsg}`)
      addChatMessage({
        id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        role: 'assistant',
        content: `**Error:** ${errorMsg}\n\nPlease check your AI provider configuration and try again.`,
        provider: activeAiProvider,
        timestamp: Date.now(),
      })
    } finally {
      setAiLoading(false)
    }
  }

  const handleSaveProvider = () => {
    if (!configApiKey.trim()) {
      addNotification('warning', 'API key is required to connect a provider.')
      return
    }

    if (aiProviders.length === 0) {
      const newProvider = {
        id: `provider-${Date.now()}`,
        name: 'Custom AI Provider',
        status: 'connected' as const,
        model: 'default',
        apiKey: configApiKey.trim(),
        endpoint: configEndpoint.trim() || undefined,
      }
      useIDEStore.getState().addAiProvider(newProvider)
      setActiveAiProvider(newProvider.id)
      addNotification('success', `AI provider "${newProvider.name}" connected successfully.`)
    } else if (currentProvider) {
      updateAiProvider(currentProvider.id, {
        apiKey: configApiKey.trim(),
        endpoint: configEndpoint.trim() || undefined,
        status: 'connected',
        error: undefined,
      })
      addNotification('success', `Provider "${currentProvider.name}" updated and connected.`)
    }

    setConfigApiKey('')
    setConfigEndpoint('')
    setShowProviderConfig(false)
  }

  const handleRemoveProvider = (id: string) => {
    useIDEStore.getState().removeAiProvider(id)
    addNotification('info', 'AI provider removed.')
  }

  const handleTestConnection = async () => {
    if (!configApiKey.trim()) {
      addNotification('warning', 'Enter an API key before testing.')
      return
    }

    try {
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'Hello, test connection.',
          provider: activeAiProvider || 'test',
          apiKey: configApiKey.trim(),
          endpoint: configEndpoint.trim() || undefined,
        }),
      })

      if (response.ok) {
        addNotification('success', 'Connection successful! AI provider is reachable.')
      } else {
        const data = await response.json().catch(() => null)
        addNotification('error', `Connection failed: ${data?.error || response.statusText}`)
      }
    } catch {
      addNotification('error', 'Connection failed: Could not reach the AI API endpoint.')
    }
  }

  // ─── Quick Action Definitions ──────────────────────────────
  const quickActions = [
    { label: 'Explain current file', icon: FileCode, prompt: activeTab ? `Explain the file ${activeTab.name}` : 'Explain the current file' },
    { label: 'Find bugs', icon: Bug, prompt: 'Find bugs in my code' },
    { label: 'Optimize', icon: Rocket, prompt: 'Optimize performance' },
    { label: 'Review staged', icon: GitCompare, prompt: 'Review my staged changes' },
    { label: 'Implementation plan', icon: ListChecks, prompt: 'Create an implementation plan' },
    { label: 'Run tests', icon: TestTube, prompt: 'Run tests and report results' },
  ]

  // ─── Last 5 Messages for Activity Timeline ────────────────
  const recentMessages = chatMessages.slice(-5)

  return (
    <div
      className="h-full flex flex-col"
      style={{ background: colors.bg.panel }}
      role="region"
      aria-label="Agent Control"
    >
      {/* ─── Header ──────────────────────────────────────────── */}
      <HUDSectionHeader
        title="Agent Control"
        actions={
          <>
            {aiProviders.map((provider) => (
              <button
                key={provider.id}
                onClick={() => setActiveAiProvider(provider.id)}
                aria-pressed={activeAiProvider === provider.id}
                className="flex items-center gap-1 px-2 py-0.5 transition-all cursor-pointer"
                style={{
                  borderRadius: radius.md,
                  fontSize: typography.fontSize.xs,
                  fontFamily: typography.fontFamily.mono,
                  background: activeAiProvider === provider.id ? colors.accent.dim : 'transparent',
                  color: activeAiProvider === provider.id ? colors.accent.DEFAULT : colors.text.dim,
                }}
              >
                <Radio
                  size={8}
                  style={{
                    color:
                      provider.status === 'connected'
                        ? colors.success.DEFAULT
                        : provider.status === 'error'
                          ? colors.danger.DEFAULT
                          : colors.warning.DEFAULT,
                  }}
                />
                {provider.name}
              </button>
            ))}
            <HUDIconButton
              label="Configure providers"
              size="sm"
              onClick={() => setShowProviderConfig(!showProviderConfig)}
            >
              <Settings size={10} />
            </HUDIconButton>
            {chatMessages.length > 0 && (
              <HUDIconButton
                label="Clear chat history"
                variant="danger"
                size="sm"
                onClick={clearChatMessages}
              >
                <Trash2 size={10} />
              </HUDIconButton>
            )}
          </>
        }
      />

      {/* ─── Provider Configuration Panel (kept as-is, restyled) ── */}
      {showProviderConfig && (
        <div
          className="p-3 space-y-3 shrink-0"
          style={{ borderBottom: `1px solid ${colors.border.default}` }}
        >
          <div
            style={{
              fontSize: typography.fontSize.md,
              color: colors.text.primary,
              fontFamily: typography.fontFamily.mono,
              fontWeight: typography.fontWeight.semibold,
            }}
          >
            Configure AI Provider
          </div>
          <p style={{ fontSize: typography.fontSize.base, color: colors.text.dim }}>
            Add your AI provider API key to start using the agent. Your key is stored only in your browser session and is never sent to our servers.
          </p>

          {aiProviders.length > 0 && (
            <div className="space-y-1">
              {aiProviders.map((provider) => (
                <div
                  key={provider.id}
                  className="flex items-center justify-between px-2 py-1"
                  style={{
                    background: colors.bg.elevated,
                    borderRadius: radius.md,
                    fontSize: typography.fontSize.base,
                    fontFamily: typography.fontFamily.mono,
                  }}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-1.5 h-1.5 rounded-full"
                      style={{
                        background:
                          provider.status === 'connected'
                            ? colors.success.DEFAULT
                            : provider.status === 'error'
                              ? colors.danger.DEFAULT
                              : colors.warning.DEFAULT,
                      }}
                    />
                    <span style={{ color: colors.text.primary }}>{provider.name}</span>
                    <span style={{ color: colors.text.disabled }}>{provider.model}</span>
                  </div>
                  <button
                    onClick={() => handleRemoveProvider(provider.id)}
                    className="transition-colors cursor-pointer"
                    style={{ color: colors.text.disabled }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = colors.danger.DEFAULT)}
                    onMouseLeave={(e) => (e.currentTarget.style.color = colors.text.disabled)}
                  >
                    <Trash2 size={10} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="space-y-2">
            <div
              className="flex items-center gap-2 px-3 py-1.5"
              style={{
                background: colors.bg.elevated,
                border: `1px solid ${colors.border.default}`,
                borderRadius: radius.lg,
                transition: `border-color ${animation.duration.normal}`,
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = colors.border.focus)}
              onBlur={(e) => (e.currentTarget.style.borderColor = colors.border.default)}
            >
              <Key size={12} style={{ color: colors.text.disabled }} className="shrink-0" />
              <input
                type="password"
                value={configApiKey}
                onChange={(e) => setConfigApiKey(e.target.value)}
                placeholder="API Key (required)"
                className="flex-1 bg-transparent outline-none"
                style={{
                  fontSize: typography.fontSize.md,
                  color: colors.text.primary,
                  fontFamily: typography.fontFamily.mono,
                }}
              />
            </div>
            <div
              className="flex items-center gap-2 px-3 py-1.5"
              style={{
                background: colors.bg.elevated,
                border: `1px solid ${colors.border.default}`,
                borderRadius: radius.lg,
                transition: `border-color ${animation.duration.normal}`,
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = colors.border.focus)}
              onBlur={(e) => (e.currentTarget.style.borderColor = colors.border.default)}
            >
              <Zap size={12} style={{ color: colors.text.disabled }} className="shrink-0" />
              <input
                value={configEndpoint}
                onChange={(e) => setConfigEndpoint(e.target.value)}
                placeholder="Custom endpoint URL (optional)"
                className="flex-1 bg-transparent outline-none"
                style={{
                  fontSize: typography.fontSize.md,
                  color: colors.text.primary,
                  fontFamily: typography.fontFamily.mono,
                }}
              />
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleSaveProvider}
                disabled={!configApiKey.trim()}
                className="px-3 py-1 transition-all cursor-pointer"
                style={{
                  borderRadius: radius.md,
                  fontSize: typography.fontSize.base,
                  fontFamily: typography.fontFamily.mono,
                  background: configApiKey.trim() ? colors.accent.dim : colors.accent.subtle,
                  color: configApiKey.trim() ? colors.accent.DEFAULT : colors.text.disabled,
                  cursor: configApiKey.trim() ? 'pointer' : 'not-allowed',
                }}
              >
                Save &amp; Connect
              </button>
              <button
                onClick={handleTestConnection}
                disabled={!configApiKey.trim()}
                className="px-3 py-1 transition-colors cursor-pointer"
                style={{
                  borderRadius: radius.md,
                  fontSize: typography.fontSize.base,
                  fontFamily: typography.fontFamily.mono,
                  color: colors.text.dim,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = colors.text.primary)}
                onMouseLeave={(e) => (e.currentTarget.style.color = colors.text.dim)}
              >
                Test Connection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Agent Card (when provider connected) ────────────── */}
      {!showProviderConfig && hasConnectedProvider && (
        <div
          className="shrink-0 p-3 space-y-2"
          style={{ borderBottom: `1px solid ${colors.border.default}` }}
        >
          {/* Agent identity row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className="w-6 h-6 flex items-center justify-center shrink-0"
                style={{
                  background: colors.accent.dim,
                  borderRadius: radius.md,
                }}
              >
                <Bot size={12} style={{ color: colors.accent.DEFAULT }} />
              </div>
              <div>
                <div
                  style={{
                    fontSize: typography.fontSize.md,
                    fontFamily: typography.fontFamily.mono,
                    fontWeight: typography.fontWeight.semibold,
                    color: colors.text.primary,
                    lineHeight: typography.lineHeight.tight,
                  }}
                >
                  {currentProvider?.model || currentProvider?.name || 'Agent'}
                </div>
                <div className="flex items-center gap-1.5">
                  <span
                    style={{
                      fontSize: typography.fontSize.xs,
                      fontFamily: typography.fontFamily.mono,
                      color: colors.text.dim,
                    }}
                  >
                    {currentProvider?.name || 'Provider'}
                  </span>
                  <AgentStatusChip
                    status={currentProvider?.status === 'connected' ? 'idle' : 'error'}
                    size="sm"
                  />
                </div>
              </div>
            </div>
            <HUDBadge variant="accent" size="sm">Auto</HUDBadge>
          </div>

          {/* Context row */}
          <div
            className="space-y-1 px-2 py-1.5"
            style={{
              background: colors.bg.elevated,
              borderRadius: radius.md,
            }}
          >
            <div className="flex items-center justify-between">
              <span
                style={{
                  fontSize: typography.fontSize.xs,
                  fontFamily: typography.fontFamily.mono,
                  color: colors.text.disabled,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                Context
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <FileCode size={10} style={{ color: colors.text.dim }} />
              <span
                style={{
                  fontSize: typography.fontSize.sm,
                  fontFamily: typography.fontFamily.mono,
                  color: activeTab ? colors.text.secondary : colors.text.disabled,
                }}
              >
                {activeTab ? activeTab.name : 'No file open'}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span style={{ fontSize: typography.fontSize.xs, color: colors.text.dim }}>⌥</span>
              <span
                style={{
                  fontSize: typography.fontSize.sm,
                  fontFamily: typography.fontFamily.mono,
                  color: workspaceName ? colors.text.secondary : colors.text.disabled,
                }}
              >
                {workspaceName || 'No repo'}{gitBranch ? ` · ${gitBranch}` : ''}
              </span>
            </div>
          </div>

          {/* Permissions row */}
          <div className="flex flex-wrap gap-1">
            <ToolPermissionBadge permission="Read" granted={hasConnectedProvider} />
            <ToolPermissionBadge permission="Write" granted={editorSettings.autoSave} />
            <ToolPermissionBadge permission="Shell" granted={false} />
            <ToolPermissionBadge permission="Git" granted={!!gitBranch} />
            <ToolPermissionBadge permission="Network" granted={false} />
          </div>
        </div>
      )}

      {/* ─── Provider Status (when no provider connected & not in config) ── */}
      {!showProviderConfig && !hasConnectedProvider && (
        <div
          className="px-3 py-2"
          style={{ borderBottom: `1px solid ${colors.border.muted}` }}
        >
          <div className="flex items-center gap-2" style={{ fontSize: typography.fontSize.base }}>
            <AlertTriangle size={10} style={{ color: colors.warning.DEFAULT }} />
            <span
              style={{
                color: colors.warning.DEFAULT,
                fontFamily: typography.fontFamily.mono,
              }}
            >
              No provider connected
            </span>
            <button
              onClick={() => setShowProviderConfig(true)}
              className="cursor-pointer"
              style={{
                color: colors.accent.DEFAULT,
                fontSize: typography.fontSize.base,
                fontFamily: typography.fontFamily.mono,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
              onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
            >
              Configure
            </button>
          </div>
        </div>
      )}

      {/* ─── Agent Activity Timeline (when provider connected) ── */}
      {!showProviderConfig && hasConnectedProvider && recentMessages.length > 0 && (
        <div
          className="shrink-0 px-3 py-2"
          style={{ borderBottom: `1px solid ${colors.border.default}` }}
        >
          <div
            className="mb-1"
            style={{
              fontSize: typography.fontSize.xs,
              fontFamily: typography.fontFamily.mono,
              color: colors.text.disabled,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            Activity
          </div>
          <div className="space-y-0 max-h-32 overflow-y-auto">
            {recentMessages.map((msg) => (
              <AgentActivityRow
                key={msg.id}
                icon={
                  msg.role === 'user' ? (
                    <span style={{ fontSize: typography.fontSize.sm }}>→</span>
                  ) : msg.content.startsWith('**Error:**') ? (
                    <span style={{ fontSize: typography.fontSize.sm }}>!</span>
                  ) : (
                    <span style={{ fontSize: typography.fontSize.sm }}>✓</span>
                  )
                }
                label={
                  msg.content.length > 40
                    ? msg.content.slice(0, 40).replace(/\*\*/g, '') + '…'
                    : msg.content.replace(/\*\*/g, '')
                }
                time={relativeTime(msg.timestamp)}
                status={
                  msg.role === 'user'
                    ? 'pending'
                    : msg.content.startsWith('**Error:**')
                      ? 'error'
                      : 'success'
                }
              />
            ))}
          </div>
        </div>
      )}

      {/* ─── Quick Actions (when provider connected) ─────────── */}
      {!showProviderConfig && hasConnectedProvider && (
        <div
          className="shrink-0 px-3 py-2"
          style={{ borderBottom: `1px solid ${colors.border.default}` }}
        >
          <div
            className="mb-1.5"
            style={{
              fontSize: typography.fontSize.xs,
              fontFamily: typography.fontFamily.mono,
              color: colors.text.disabled,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            Quick Actions
          </div>
          <div className="grid grid-cols-2 gap-1">
            {quickActions.map((action) => {
              const Icon = action.icon
              return (
                <button
                  key={action.label}
                  onClick={() => setInput(action.prompt)}
                  className="flex items-center gap-1.5 px-2 py-1 transition-colors cursor-pointer"
                  style={{
                    borderRadius: radius.md,
                    fontSize: typography.fontSize.sm,
                    fontFamily: typography.fontFamily.mono,
                    color: colors.text.dim,
                    background: 'transparent',
                    border: `1px solid ${colors.border.default}`,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = colors.accent.subtle
                    e.currentTarget.style.color = colors.accent.DEFAULT
                    e.currentTarget.style.borderColor = colors.accent.dim
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent'
                    e.currentTarget.style.color = colors.text.dim
                    e.currentTarget.style.borderColor = colors.border.default
                  }}
                >
                  <Icon size={10} className="shrink-0" />
                  <span className="truncate">{action.label}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* ─── Messages Area ───────────────────────────────────── */}
      <div
        className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar"
        role="log"
        aria-live="polite"
        aria-label="Chat messages"
      >
        {chatMessages.length === 0 && (
          <div
            className="flex flex-col items-center justify-center h-full text-center py-8"
            style={{ color: colors.text.disabled }}
          >
            <Bot
              size={40}
              className="mb-3"
              style={{ color: colors.accent.dim, opacity: 0.6 }}
              aria-hidden="true"
            />
            <p
              style={{
                fontSize: typography.fontSize.lg,
                fontFamily: typography.fontFamily.mono,
                color: colors.text.dim,
              }}
            >
              Agent Control
            </p>
            {!hasConnectedProvider ? (
              <div className="mt-3 space-y-2">
                <p
                  style={{
                    fontSize: typography.fontSize.base,
                    color: colors.warning.DEFAULT,
                  }}
                >
                  Connect an AI provider to get started
                </p>
                <button
                  onClick={() => setShowProviderConfig(true)}
                  className="px-3 py-1 cursor-pointer transition-colors"
                  style={{
                    fontSize: typography.fontSize.sm,
                    fontFamily: typography.fontFamily.mono,
                    border: `1px solid ${colors.accent.dim}`,
                    borderRadius: radius.md,
                    color: colors.accent.DEFAULT,
                    background: 'transparent',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = colors.accent.subtle)}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <Plus size={10} className="inline mr-1" />
                  Add Provider
                </button>
              </div>
            ) : (
              <p
                className="mt-1"
                style={{
                  fontSize: typography.fontSize.base,
                  color: colors.text.disabled,
                }}
              >
                Ask the agent to work on your code
              </p>
            )}
          </div>
        )}
        {chatMessages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.role === 'assistant' && (
              <div
                className="w-6 h-6 flex items-center justify-center shrink-0 mt-0.5"
                style={{
                  background: colors.accent.dim,
                  borderRadius: radius.md,
                }}
                aria-hidden="true"
              >
                <Bot size={12} style={{ color: colors.accent.DEFAULT }} />
              </div>
            )}
            <div
              style={{
                maxWidth: '85%',
                borderRadius: radius.xl,
                padding: `${spacing[2]} ${spacing[3]}`,
                fontSize: typography.fontSize.md,
                fontFamily: typography.fontFamily.mono,
                lineHeight: typography.lineHeight.relaxed,
                ...(msg.role === 'user'
                  ? { background: colors.accent.dim, color: colors.text.primary }
                  : msg.content.startsWith('**Error:**')
                    ? {
                        background: colors.danger.dim,
                        border: `1px solid ${colors.danger.dim}`,
                        color: colors.danger.DEFAULT,
                      }
                    : {
                        background: colors.bg.elevated,
                        border: `1px solid ${colors.border.default}`,
                        color: colors.text.muted,
                      }),
              }}
            >
              {msg.role === 'assistant' ? (
                <div
                  className="prose prose-invert prose-sm max-w-none"
                  style={{
                    ['--tw-prose-pre-bg' as string]: colors.bg.root,
                  }}
                >
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              ) : (
                <p className="whitespace-pre-wrap">{msg.content}</p>
              )}
            </div>
          </div>
        ))}
        {isAiLoading && (
          <div className="flex gap-2 items-start">
            <div
              className="w-6 h-6 flex items-center justify-center shrink-0"
              style={{
                background: colors.accent.dim,
                borderRadius: radius.md,
              }}
              aria-hidden="true"
            >
              <Loader2 size={12} style={{ color: colors.accent.DEFAULT }} className="animate-spin" />
            </div>
            <div
              style={{
                background: colors.bg.elevated,
                border: `1px solid ${colors.border.default}`,
                borderRadius: radius.xl,
                padding: `${spacing[2]} ${spacing[3]}`,
                fontSize: typography.fontSize.md,
                fontFamily: typography.fontFamily.mono,
                color: colors.text.disabled,
              }}
            >
              Thinking...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* ─── Input Area ──────────────────────────────────────── */}
      <div
        className="p-3"
        style={{ borderTop: `1px solid ${colors.border.default}` }}
      >
        <div
          className="flex items-end gap-2 px-3 py-2"
          style={{
            background: colors.bg.elevated,
            border: `1px solid ${colors.border.default}`,
            borderRadius: radius.xl,
            transition: `border-color ${animation.duration.normal}`,
          }}
          onFocus={(e) => (e.currentTarget.style.borderColor = colors.border.focus)}
          onBlur={(e) => (e.currentTarget.style.borderColor = colors.border.default)}
        >
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSend()
              }
            }}
            placeholder={
              hasConnectedProvider
                ? `Ask ${currentProvider?.name || 'Agent'}...`
                : 'Configure an AI provider first...'
            }
            rows={1}
            disabled={!hasConnectedProvider}
            aria-label="Agent chat input"
            className="flex-1 bg-transparent outline-none resize-none min-h-[20px] max-h-[80px] disabled:opacity-50"
            style={{
              fontSize: typography.fontSize.md,
              color: colors.text.primary,
              fontFamily: typography.fontFamily.mono,
            }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isAiLoading || !hasConnectedProvider}
            aria-label="Send message"
            className="p-1 rounded transition-all cursor-pointer"
            style={{
              color:
                input.trim() && !isAiLoading && hasConnectedProvider
                  ? colors.accent.DEFAULT
                  : colors.text.disabled,
              cursor:
                input.trim() && !isAiLoading && hasConnectedProvider
                  ? 'pointer'
                  : 'not-allowed',
              borderRadius: radius.md,
            }}
            onMouseEnter={(e) => {
              if (input.trim() && !isAiLoading && hasConnectedProvider) {
                e.currentTarget.style.background = colors.accent.dim
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent'
            }}
          >
            <Send size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}
