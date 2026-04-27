'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Bot, Send, Zap, Radio, Loader2, Trash2 } from 'lucide-react'
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

  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const currentProvider = aiProviders.find((p) => p.id === activeAiProvider)

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])

  const callRealAI = useCallback(async (userMessage: string): Promise<string> => {
    try {
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage, provider: activeAiProvider }),
      })

      if (!response.ok) {
        throw new Error(`API returned ${response.status}`)
      }

      const data: AIResponse = await response.json()

      if ('content' in data) {
        return data.content
      }

      throw new Error('error' in data ? data.error : 'Unknown error')
    } catch (error) {
      console.warn('AI API call failed, using simulated response:', error)
      return getSimulatedResponse(userMessage)
    }
  }, [activeAiProvider])

  const getSimulatedResponse = (userMessage: string): string => {
    const responses: Record<string, string[]> = {
      openclaw: [
        "I've analyzed your code. Here are some suggestions:\n\n1. Consider using `useCallback` for event handlers passed as props\n2. The `useEffect` dependency array could be optimized\n3. Type safety can be improved with generic constraints",
        "Based on your query, I recommend:\n\n- Extract the logic into a custom hook\n- Add error boundaries around async components\n- Use `Suspense` for data fetching patterns",
        "Here's a refactored version that improves performance:\n\n```typescript\nconst optimized = useMemo(() => {\n  return data.filter(predicate).map(transform)\n}, [data, predicate, transform])\n```",
      ],
      hermes: [
        "Quick analysis complete:\n→ 3 optimization opportunities found\n→ 2 potential type errors detected\n→ 1 security recommendation\n\nShall I elaborate on any of these?",
        "I've reviewed the architecture. Key improvements:\n\n1. Implement repository pattern for data access\n2. Add middleware for authentication flow\n3. Consider event-driven architecture for decoupling",
        "Code review findings:\n\n✓ Good: Proper TypeScript usage\n✓ Good: Component composition pattern\n⚠ Warning: Missing error handling in async flows\n⚠ Warning: Memory leak potential in subscriptions",
      ],
    }
    const providerResponses = responses[activeAiProvider] || responses.openclaw
    return providerResponses[Math.floor(Math.random() * providerResponses.length)]
  }

  const handleSend = async () => {
    if (!input.trim() || isAiLoading) return

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
      const response = await callRealAI(userContent)

      addChatMessage({
        id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        role: 'assistant',
        content: response,
        provider: activeAiProvider,
        timestamp: Date.now(),
      })
    } catch (error) {
      addNotification('error', 'AI request failed. Please try again.')
      addChatMessage({
        id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        role: 'assistant',
        content: 'Sorry, I encountered an error processing your request. Please try again.',
        provider: activeAiProvider,
        timestamp: Date.now(),
      })
    } finally {
      setAiLoading(false)
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
              onClick={() => setActiveAiProvider(provider.id as 'openclaw' | 'hermes')}
              aria-pressed={activeAiProvider === provider.id}
              className={`
                flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono transition-all cursor-pointer
                ${activeAiProvider === provider.id
                  ? 'bg-[rgba(0,212,170,0.12)] text-[#00d4aa]'
                  : 'text-[#30363d] hover:text-[#484f58]'
                }
              `}
            >
              <Radio size={8} className={provider.status === 'connected' ? 'text-[#00d4aa]' : 'text-[#f85149]'} />
              {provider.name}
            </button>
          ))}
          {chatMessages.length > 0 && (
            <button
              onClick={clearChatMessages}
              className="ml-1 text-[#30363d] hover:text-[#f85149] transition-colors cursor-pointer"
              aria-label="Clear chat history"
              title="Clear chat"
            >
              <Trash2 size={10} />
            </button>
          )}
        </div>
      </div>

      {/* Provider Status */}
      <div className="px-3 py-2 border-b border-[rgba(0,212,170,0.04)]">
        <div className="flex items-center gap-2 text-[11px]">
          <div className={`w-1.5 h-1.5 rounded-full ${currentProvider?.status === 'connected' ? 'bg-[#00d4aa]' : 'bg-[#f85149]'}`} />
          <span className="text-[#30363d] font-mono">
            {currentProvider?.name} · {currentProvider?.model}
          </span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar" role="log" aria-live="polite" aria-label="Chat messages">
        {chatMessages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-[#30363d] text-center py-8">
            <Bot size={40} className="mb-3 text-[#00d4aa]/20" aria-hidden="true" />
            <p className="text-[13px] font-mono text-[#484f58]">AI Assistant Ready</p>
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
          </div>
        )}
        {chatMessages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.role === 'assistant' && (
              <div className="w-6 h-6 rounded bg-[rgba(0,212,170,0.08)] flex items-center justify-center shrink-0 mt-0.5" aria-hidden="true">
                {msg.provider === 'openclaw' ? (
                  <Zap size={12} className="text-[#00d4aa]" />
                ) : (
                  <Bot size={12} className="text-[#00d4aa]" />
                )}
              </div>
            )}
            <div
              className={`
                max-w-[85%] rounded-lg px-3 py-2 text-[12px] font-mono leading-relaxed
                ${msg.role === 'user'
                  ? 'bg-[rgba(0,212,170,0.08)] text-[#e6edf3]'
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
            placeholder={`Ask ${currentProvider?.name}...`}
            rows={1}
            aria-label="AI chat input"
            className="flex-1 bg-transparent text-[12px] text-[#e6edf3] placeholder-[#30363d] outline-none font-mono resize-none min-h-[20px] max-h-[80px]"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isAiLoading}
            aria-label="Send message"
            className={`
              p-1 rounded transition-all cursor-pointer
              ${input.trim() && !isAiLoading
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
