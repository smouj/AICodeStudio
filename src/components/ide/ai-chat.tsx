'use client'

import { useState, useRef, useEffect } from 'react'
import { Bot, Send, Zap, Radio, Loader2 } from 'lucide-react'
import { useIDEStore } from '@/store/ide-store'

export function AIChatPanel() {
  const {
    chatMessages,
    addChatMessage,
    isAiLoading,
    setAiLoading,
    activeAiProvider,
    setActiveAiProvider,
    aiProviders,
  } = useIDEStore()

  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const currentProvider = aiProviders.find((p) => p.id === activeAiProvider)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])

  const handleSend = async () => {
    if (!input.trim() || isAiLoading) return

    const userMessage = {
      id: `msg-${Date.now()}`,
      role: 'user' as const,
      content: input,
      provider: activeAiProvider,
      timestamp: Date.now(),
    }
    addChatMessage(userMessage)
    setInput('')
    setAiLoading(true)

    // Simulate AI response
    setTimeout(() => {
      const responses: Record<string, string[]> = {
        openclaw: [
          "I've analyzed your code. Here are some suggestions:\n\n1. Consider using `useCallback` for event handlers passed as props\n2. The `useEffect` dependency array could be optimized\n3. Type safety can be improved with generic constraints",
          "Based on your query, I recommend:\n\n• Extract the logic into a custom hook\n• Add error boundaries around async components\n• Use `Suspense` for data fetching patterns",
          "Here's a refactored version that improves performance:\n\n```typescript\nconst optimized = useMemo(() => {\n  return data.filter(predicate).map(transform)\n}, [data, predicate, transform])\n```",
        ],
        hermes: [
          "Quick analysis complete:\n→ 3 optimization opportunities found\n→ 2 potential type errors detected\n→ 1 security recommendation\n\nShall I elaborate on any of these?",
          "I've reviewed the architecture. Key improvements:\n\n1. Implement repository pattern for data access\n2. Add middleware for authentication flow\n3. Consider event-driven architecture for decoupling",
          "Code review findings:\n\n✓ Good: Proper TypeScript usage\n✓ Good: Component composition pattern\n⚠ Warning: Missing error handling in async flows\n⚠ Warning: Memory leak potential in subscriptions",
        ],
      }

      const providerResponses = responses[activeAiProvider] || responses.openclaw
      const randomResponse = providerResponses[Math.floor(Math.random() * providerResponses.length)]

      addChatMessage({
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: randomResponse,
        provider: activeAiProvider,
        timestamp: Date.now(),
      })
      setAiLoading(false)
    }, 1200 + Math.random() * 800)
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-[#5a6270] border-b border-[#00e5ff]/10">
        <span>AI Assistant</span>
        <div className="flex items-center gap-1">
          {aiProviders.map((provider) => (
            <button
              key={provider.id}
              onClick={() => setActiveAiProvider(provider.id as 'openclaw' | 'hermes')}
              className={`
                flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono transition-all cursor-pointer
                ${activeAiProvider === provider.id
                  ? 'bg-[#00e5ff]/10 text-[#00e5ff]'
                  : 'text-[#3d4450] hover:text-[#5a6270]'
                }
              `}
            >
              <Radio size={8} className={provider.status === 'connected' ? 'text-[#3fb950]' : 'text-[#f85149]'} />
              {provider.name}
            </button>
          ))}
        </div>
      </div>

      {/* Provider Status */}
      <div className="px-3 py-2 border-b border-[#00e5ff]/5">
        <div className="flex items-center gap-2 text-[11px]">
          <div className={`w-1.5 h-1.5 rounded-full ${currentProvider?.status === 'connected' ? 'bg-[#3fb950]' : 'bg-[#f85149]'}`} />
          <span className="text-[#5a6270] font-mono">
            {currentProvider?.name} · {currentProvider?.model}
          </span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
        {chatMessages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-[#3d4450] text-center py-8">
            <Bot size={40} className="mb-3 text-[#00e5ff]/30" />
            <p className="text-[13px] font-mono">AI Assistant Ready</p>
            <p className="text-[11px] mt-1">Ask me anything about your code</p>
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setInput('Explain this code')}
                className="px-3 py-1 text-[10px] font-mono border border-[#00e5ff]/20 rounded text-[#00e5ff]/70 hover:bg-[#00e5ff]/5 cursor-pointer"
              >
                Explain code
              </button>
              <button
                onClick={() => setInput('Find bugs')}
                className="px-3 py-1 text-[10px] font-mono border border-[#00e5ff]/20 rounded text-[#00e5ff]/70 hover:bg-[#00e5ff]/5 cursor-pointer"
              >
                Find bugs
              </button>
              <button
                onClick={() => setInput('Optimize performance')}
                className="px-3 py-1 text-[10px] font-mono border border-[#00e5ff]/20 rounded text-[#00e5ff]/70 hover:bg-[#00e5ff]/5 cursor-pointer"
              >
                Optimize
              </button>
            </div>
          </div>
        )}
        {chatMessages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.role === 'assistant' && (
              <div className="w-6 h-6 rounded bg-[#00e5ff]/10 flex items-center justify-center shrink-0 mt-0.5">
                {msg.provider === 'openclaw' ? (
                  <Zap size={12} className="text-[#00e5ff]" />
                ) : (
                  <Bot size={12} className="text-[#00e5ff]" />
                )}
              </div>
            )}
            <div
              className={`
                max-w-[85%] rounded-lg px-3 py-2 text-[12px] font-mono leading-relaxed
                ${msg.role === 'user'
                  ? 'bg-[#00e5ff]/10 text-[#e6edf3]'
                  : 'bg-[#0d1117] border border-[#00e5ff]/10 text-[#8b949e]'
                }
              `}
            >
              <pre className="whitespace-pre-wrap">{msg.content}</pre>
            </div>
          </div>
        ))}
        {isAiLoading && (
          <div className="flex gap-2 items-start">
            <div className="w-6 h-6 rounded bg-[#00e5ff]/10 flex items-center justify-center shrink-0">
              <Loader2 size={12} className="text-[#00e5ff] animate-spin" />
            </div>
            <div className="bg-[#0d1117] border border-[#00e5ff]/10 rounded-lg px-3 py-2 text-[12px] text-[#5a6270] font-mono">
              Thinking...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-[#00e5ff]/10">
        <div className="flex items-end gap-2 bg-[#0d1117] border border-[#00e5ff]/20 rounded-lg px-3 py-2 focus-within:border-[#00e5ff]/50 transition-colors">
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
            className="flex-1 bg-transparent text-[12px] text-[#e6edf3] placeholder-[#3d4450] outline-none font-mono resize-none min-h-[20px] max-h-[80px]"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isAiLoading}
            className={`
              p-1 rounded transition-all cursor-pointer
              ${input.trim() && !isAiLoading
                ? 'text-[#00e5ff] hover:bg-[#00e5ff]/10'
                : 'text-[#3d4450] cursor-not-allowed'
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
