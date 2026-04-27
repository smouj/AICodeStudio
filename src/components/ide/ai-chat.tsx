'use client'

import { useState, useRef, useEffect } from 'react'
import { Bot, Send, Zap, Radio, Loader2, Trash2, Plus, Settings, Key, AlertTriangle } from 'lucide-react'
import { useIDEStore } from '@/store/ide-store'
import ReactMarkdown from 'react-markdown'

type AIResponse = { content: string; provider: string } | { error: string }

export function AIChatPanel() {
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

  const [input, setInput] = useState('')
  const [showProviderConfig, setShowProviderConfig] = useState(false)
  const [configApiKey, setConfigApiKey] = useState('')
  const [configEndpoint, setConfigEndpoint] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const currentProvider = aiProviders.find((p) => p.id === activeAiProvider)
  const hasConfiguredProvider = aiProviders.length > 0
  const hasConnectedProvider = aiProviders.some((p) => p.status === 'connected')

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])

  const handleSend = async () => {
    if (!input.trim() || isAiLoading) return

    if (!hasConnectedProvider) {
      addNotification('warning', 'No AI provider connected. Configure one in the AI panel first.')
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

    // If there's no active provider, create a default one
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

  return (
    <div className="h-full flex flex-col" role="region" aria-label="AI Assistant">
      <div className="flex items-center justify-between px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-[#30363d] border-b border-[rgba(0,212,170,0.08)]">
        <span>AI Assistant</span>
        <div className="flex items-center gap-1">
          {aiProviders.map((provider) => (
            <button
              key={provider.id}
              onClick={() => setActiveAiProvider(provider.id)}
              aria-pressed={activeAiProvider === provider.id}
              className={`
                flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono transition-all cursor-pointer
                ${activeAiProvider === provider.id
                  ? 'bg-[rgba(0,212,170,0.12)] text-[#00d4aa]'
                  : 'text-[#30363d] hover:text-[#484f58]'
                }
              `}
            >
              <Radio size={8} className={provider.status === 'connected' ? 'text-[#00d4aa]' : provider.status === 'error' ? 'text-[#f85149]' : 'text-[#ffa657]'} />
              {provider.name}
            </button>
          ))}
          <button
            onClick={() => setShowProviderConfig(!showProviderConfig)}
            className="text-[#30363d] hover:text-[#00d4aa] transition-colors cursor-pointer ml-1"
            aria-label="Configure AI providers"
            title="Configure providers"
          >
            <Settings size={10} />
          </button>
          {chatMessages.length > 0 && (
            <button
              onClick={clearChatMessages}
              className="text-[#30363d] hover:text-[#f85149] transition-colors cursor-pointer"
              aria-label="Clear chat history"
              title="Clear chat"
            >
              <Trash2 size={10} />
            </button>
          )}
        </div>
      </div>

      {/* Provider Configuration Panel */}
      {showProviderConfig && (
        <div className="border-b border-[rgba(0,212,170,0.08)] p-3 space-y-3">
          <div className="text-[12px] text-[#e6edf3] font-mono font-semibold">Configure AI Provider</div>
          <p className="text-[11px] text-[#484f58]">
            Add your AI provider API key to start using the AI assistant. Your key is stored only in your browser session and is never sent to our servers.
          </p>

          {aiProviders.length > 0 && (
            <div className="space-y-1">
              {aiProviders.map((provider) => (
                <div key={provider.id} className="flex items-center justify-between px-2 py-1 bg-[#0d1117] rounded text-[11px] font-mono">
                  <div className="flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${provider.status === 'connected' ? 'bg-[#00d4aa]' : provider.status === 'error' ? 'bg-[#f85149]' : 'bg-[#ffa657]'}`} />
                    <span className="text-[#e6edf3]">{provider.name}</span>
                    <span className="text-[#30363d]">{provider.model}</span>
                  </div>
                  <button
                    onClick={() => handleRemoveProvider(provider.id)}
                    className="text-[#30363d] hover:text-[#f85149] transition-colors cursor-pointer"
                  >
                    <Trash2 size={10} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="space-y-2">
            <div className="flex items-center gap-2 bg-[#0d1117] border border-[rgba(0,212,170,0.08)] rounded px-3 py-1.5 focus-within:border-[rgba(0,212,170,0.25)] transition-colors">
              <Key size={12} className="text-[#30363d] shrink-0" />
              <input
                type="password"
                value={configApiKey}
                onChange={(e) => setConfigApiKey(e.target.value)}
                placeholder="API Key (required)"
                className="flex-1 bg-transparent text-[12px] text-[#e6edf3] placeholder-[#30363d] outline-none font-mono"
              />
            </div>
            <div className="flex items-center gap-2 bg-[#0d1117] border border-[rgba(0,212,170,0.08)] rounded px-3 py-1.5 focus-within:border-[rgba(0,212,170,0.25)] transition-colors">
              <Zap size={12} className="text-[#30363d] shrink-0" />
              <input
                value={configEndpoint}
                onChange={(e) => setConfigEndpoint(e.target.value)}
                placeholder="Custom endpoint URL (optional)"
                className="flex-1 bg-transparent text-[12px] text-[#e6edf3] placeholder-[#30363d] outline-none font-mono"
              />
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleSaveProvider}
                disabled={!configApiKey.trim()}
                className={`
                  px-3 py-1 rounded text-[11px] font-mono transition-all cursor-pointer
                  ${configApiKey.trim()
                    ? 'bg-[rgba(0,212,170,0.12)] text-[#00d4aa] hover:bg-[rgba(0,212,170,0.18)]'
                    : 'bg-[rgba(0,212,170,0.04)] text-[#30363d] cursor-not-allowed'
                  }
                `}
              >
                Save & Connect
              </button>
              <button
                onClick={handleTestConnection}
                disabled={!configApiKey.trim()}
                className="px-3 py-1 rounded text-[11px] font-mono text-[#484f58] hover:text-[#e6edf3] transition-colors cursor-pointer"
              >
                Test Connection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Provider Status */}
      {!showProviderConfig && (
        <div className="px-3 py-2 border-b border-[rgba(0,212,170,0.04)]">
          <div className="flex items-center gap-2 text-[11px]">
            {hasConnectedProvider ? (
              <>
                <div className={`w-1.5 h-1.5 rounded-full ${currentProvider?.status === 'connected' ? 'bg-[#00d4aa]' : 'bg-[#f85149]'}`} />
                <span className="text-[#30363d] font-mono">
                  {currentProvider?.name || 'No provider'} · {currentProvider?.model || '—'}
                </span>
              </>
            ) : (
              <>
                <AlertTriangle size={10} className="text-[#ffa657]" />
                <span className="text-[#ffa657] font-mono">No provider connected</span>
                <button
                  onClick={() => setShowProviderConfig(true)}
                  className="text-[#00d4aa] hover:underline cursor-pointer"
                >
                  Configure
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar" role="log" aria-live="polite" aria-label="Chat messages">
        {chatMessages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-[#30363d] text-center py-8">
            <Bot size={40} className="mb-3 text-[#00d4aa]/20" aria-hidden="true" />
            <p className="text-[13px] font-mono text-[#484f58]">AI Assistant</p>
            {!hasConnectedProvider ? (
              <div className="mt-3 space-y-2">
                <p className="text-[11px] text-[#ffa657]">Connect an AI provider to get started</p>
                <button
                  onClick={() => setShowProviderConfig(true)}
                  className="px-3 py-1 text-[10px] font-mono border border-[rgba(0,212,170,0.12)] rounded text-[#00d4aa] hover:bg-[rgba(0,212,170,0.06)] cursor-pointer transition-colors"
                >
                  <Plus size={10} className="inline mr-1" />
                  Add Provider
                </button>
              </div>
            ) : (
              <>
                <p className="text-[11px] mt-1">Ask me anything about your code</p>
                <div className="flex gap-2 mt-4">
                  {['Explain code', 'Find bugs', 'Optimize'].map((action) => (
                    <button
                      key={action}
                      onClick={() => setInput(action === 'Explain code' ? 'Explain this code' : action === 'Find bugs' ? 'Find bugs in my code' : 'Optimize performance')}
                      className="px-3 py-1 text-[10px] font-mono border border-[rgba(0,212,170,0.12)] rounded text-[#00d4aa]/60 hover:bg-[rgba(0,212,170,0.06)] hover:text-[#00d4aa] cursor-pointer transition-colors"
                    >
                      {action}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
        {chatMessages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.role === 'assistant' && (
              <div className="w-6 h-6 rounded bg-[rgba(0,212,170,0.08)] flex items-center justify-center shrink-0 mt-0.5" aria-hidden="true">
                <Bot size={12} className="text-[#00d4aa]" />
              </div>
            )}
            <div
              className={`
                max-w-[85%] rounded-lg px-3 py-2 text-[12px] font-mono leading-relaxed
                ${msg.role === 'user'
                  ? 'bg-[rgba(0,212,170,0.08)] text-[#e6edf3]'
                  : msg.content.startsWith('**Error:**')
                    ? 'bg-[#f85149]/5 border border-[rgba(248,81,73,0.15)] text-[#f85149]'
                    : 'bg-[#0d1117] border border-[rgba(0,212,170,0.08)] text-[#6e7681]'
                }
              `}
            >
              {msg.role === 'assistant' ? (
                <div className="prose prose-invert prose-sm max-w-none [&_pre]:bg-[#080c12] [&_pre]:rounded [&_pre]:p-2 [&_code]:text-[#00d4aa] [&_code]:text-[11px] [&_p]:mb-2 [&_ul]:mb-2 [&_ol]:mb-2 [&_li]:mb-0.5">
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
            <div className="w-6 h-6 rounded bg-[rgba(0,212,170,0.08)] flex items-center justify-center shrink-0" aria-hidden="true">
              <Loader2 size={12} className="text-[#00d4aa] animate-spin" />
            </div>
            <div className="bg-[#0d1117] border border-[rgba(0,212,170,0.08)] rounded-lg px-3 py-2 text-[12px] text-[#30363d] font-mono">
              Thinking...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-[rgba(0,212,170,0.08)]">
        <div className="flex items-end gap-2 bg-[#0d1117] border border-[rgba(0,212,170,0.08)] rounded-lg px-3 py-2 focus-within:border-[rgba(0,212,170,0.25)] transition-colors">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSend()
              }
            }}
            placeholder={hasConnectedProvider ? `Ask ${currentProvider?.name || 'AI'}...` : 'Configure an AI provider first...'}
            rows={1}
            disabled={!hasConnectedProvider}
            aria-label="AI chat input"
            className="flex-1 bg-transparent text-[12px] text-[#e6edf3] placeholder-[#30363d] outline-none font-mono resize-none min-h-[20px] max-h-[80px] disabled:opacity-50"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isAiLoading || !hasConnectedProvider}
            aria-label="Send message"
            className={`
              p-1 rounded transition-all cursor-pointer
              ${input.trim() && !isAiLoading && hasConnectedProvider
                ? 'text-[#00d4aa] hover:bg-[rgba(0,212,170,0.08)]'
                : 'text-[#30363d] cursor-not-allowed'
              }
            `}
          >
            <Send size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}
