'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import {
  Mic,
  MicOff,
  Volume2,
  Languages,
  History,
  Sparkles,
  Check,
  X,
  AlertTriangle,
  Loader2,
  Code2,
  Bug,
  Lightbulb,
  Wand2,
  ChevronDown,
  Copy,
  Play,
} from 'lucide-react'
import { useIDEStore } from '@/store/ide-store'
import type { VoiceCommand } from '@/store/ide-store'

// ─── Voice Commands Registry ────────────────────────────────

const VOICE_COMMANDS = [
  { pattern: /^create function\s+(.+)/i, label: 'Create function', icon: Code2, description: 'Generates a function template' },
  { pattern: /^add import\s+(.+)/i, label: 'Add import', icon: Play, description: 'Adds an import statement' },
  { pattern: /^explain (this )?code/i, label: 'Explain code', icon: Lightbulb, description: 'Triggers AI code explanation' },
  { pattern: /^find bugs/i, label: 'Find bugs', icon: Bug, description: 'Triggers AI bug analysis' },
  { pattern: /^refactor/i, label: 'Refactor', icon: Wand2, description: 'Triggers AI refactoring suggestion' },
] as const

const LANGUAGES = [
  { code: 'en-US', label: 'English (US)' },
  { code: 'es-ES', label: 'Español' },
  { code: 'fr-FR', label: 'Français' },
  { code: 'de-DE', label: 'Deutsch' },
  { code: 'zh-CN', label: '中文 (简体)' },
  { code: 'ja-JP', label: '日本語' },
]

// ─── Waveform Animation Component ───────────────────────────

function WaveformVisualizer({ active }: { active: boolean }) {
  const bars = 24

  return (
    <div className="flex items-center justify-center gap-[2px] h-10" aria-hidden="true">
      {Array.from({ length: bars }).map((_, i) => (
        <div
          key={i}
          className="w-[3px] rounded-full transition-all duration-150"
          style={{
            backgroundColor: active ? '#00d4aa' : 'rgba(0,212,170,0.12)',
            height: active
              ? `${8 + Math.sin(Date.now() / 200 + i * 0.5) * 16 + Math.random() * 8}px`
              : '4px',
            animation: active
              ? `waveformBar ${0.4 + Math.random() * 0.4}s ease-in-out ${i * 0.03}s infinite alternate`
              : 'none',
          }}
        />
      ))}
      <style>{`
        @keyframes waveformBar {
          0% { height: 4px; opacity: 0.4; }
          100% { height: ${12 + Math.random() * 20}px; opacity: 1; }
        }
      `}</style>
    </div>
  )
}

// ─── AI Code Suggestion Card ────────────────────────────────

interface CodeSuggestion {
  id: string
  command: string
  code: string
  language: string
  timestamp: number
}

function CodeSuggestionCard({
  suggestion,
  onApply,
  onDismiss,
}: {
  suggestion: CodeSuggestion
  onApply: (code: string) => void
  onDismiss: () => void
}) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(suggestion.code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="border border-[rgba(0,212,170,0.12)] rounded-lg overflow-hidden bg-[#0d1117]">
      <div className="flex items-center justify-between px-3 py-1.5 bg-[rgba(0,212,170,0.06)] border-b border-[rgba(0,212,170,0.08)]">
        <div className="flex items-center gap-2">
          <Sparkles size={10} className="text-[#00d4aa]" />
          <span className="text-[10px] font-mono text-[#00d4aa] uppercase tracking-wider">AI Suggestion</span>
          <span className="text-[10px] font-mono text-[#30363d]">— {suggestion.command}</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handleCopy}
            className="p-1 text-[#30363d] hover:text-[#e6edf3] transition-colors cursor-pointer"
            aria-label="Copy code"
          >
            {copied ? <Check size={10} className="text-[#00d4aa]" /> : <Copy size={10} />}
          </button>
          <button
            onClick={onDismiss}
            className="p-1 text-[#30363d] hover:text-[#f85149] transition-colors cursor-pointer"
            aria-label="Dismiss suggestion"
          >
            <X size={10} />
          </button>
        </div>
      </div>
      <pre className="p-3 text-[12px] font-mono text-[#e6edf3] leading-relaxed overflow-x-auto max-h-48 overflow-y-auto custom-scrollbar">
        <code>{suggestion.code}</code>
      </pre>
      <div className="flex items-center gap-2 px-3 py-2 border-t border-[rgba(0,212,170,0.08)]">
        <button
          onClick={() => onApply(suggestion.code)}
          className="flex items-center gap-1.5 px-3 py-1 rounded text-[11px] font-mono bg-[rgba(0,212,170,0.12)] text-[#00d4aa] hover:bg-[rgba(0,212,170,0.18)] transition-colors cursor-pointer"
        >
          <Check size={10} />
          Apply
        </button>
        <button
          onClick={() => onApply(suggestion.code)}
          className="flex items-center gap-1.5 px-3 py-1 rounded text-[11px] font-mono text-[#484f58] hover:text-[#e6edf3] hover:bg-[rgba(255,255,255,0.03)] transition-colors cursor-pointer"
        >
          <Code2 size={10} />
          Insert at Cursor
        </button>
      </div>
    </div>
  )
}

// ─── Main Voice Panel Component ─────────────────────────────

export function VoicePanel() {
  const voiceListening = useIDEStore((s) => s.voiceListening)
  const voiceSupported = useIDEStore((s) => s.voiceSupported)
  const voiceLanguage = useIDEStore((s) => s.voiceLanguage)
  const voiceTranscript = useIDEStore((s) => s.voiceTranscript)
  const startListening = useIDEStore((s) => s.startListening)
  const stopListening = useIDEStore((s) => s.stopListening)
  const setVoiceLanguage = useIDEStore((s) => s.setVoiceLanguage)
  const addNotification = useIDEStore((s) => s.addNotification)
  const addOutputEntry = useIDEStore((s) => s.addOutputEntry)

  const [commandHistory, setCommandHistory] = useState<VoiceCommand[]>([])
  const [suggestions, setSuggestions] = useState<CodeSuggestion[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [showLangDropdown, setShowLangDropdown] = useState(false)
  const [interimTranscript, setInterimTranscript] = useState('')
  const recognitionRef = useRef<unknown>(null)
  const langDropdownRef = useRef<HTMLDivElement>(null)

  // Close language dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (langDropdownRef.current && !langDropdownRef.current.contains(e.target as Node)) {
        setShowLangDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Process transcript when it changes
  useEffect(() => {
    if (voiceTranscript && !voiceListening) {
      processTranscript(voiceTranscript)
    }
    }, [voiceTranscript, voiceListening])

  const processTranscript = useCallback(
    async (transcript: string) => {
      // Add to command history
      const command: VoiceCommand = {
        id: `vc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        transcript,
        confidence: 0.92,
        timestamp: Date.now(),
      }
      setCommandHistory((prev) => [command, ...prev].slice(0, 20))

      // Check for matching voice command
      const matchedCommand = VOICE_COMMANDS.find((cmd) => cmd.pattern.test(transcript))

      if (matchedCommand) {
        setIsProcessing(true)
        try {
          const res = await fetch('/api/voice', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              transcript,
              command: matchedCommand.label,
              language: voiceLanguage,
            }),
          })

          if (res.ok) {
            const data = await res.json()
            const suggestion: CodeSuggestion = {
              id: `sug-${Date.now()}`,
              command: matchedCommand.label,
              code: data.code || data.content || generateFallbackCode(matchedCommand.label, transcript),
              language: data.language || 'typescript',
              timestamp: Date.now(),
            }
            setSuggestions((prev) => [suggestion, ...prev].slice(0, 5))
            addNotification('success', `Voice command processed: ${matchedCommand.label}`)
          } else {
            // Fallback: generate template code locally
            const suggestion: CodeSuggestion = {
              id: `sug-${Date.now()}`,
              command: matchedCommand.label,
              code: generateFallbackCode(matchedCommand.label, transcript),
              language: 'typescript',
              timestamp: Date.now(),
            }
            setSuggestions((prev) => [suggestion, ...prev].slice(0, 5))
            addNotification('info', `Voice command processed locally: ${matchedCommand.label}`)
          }
        } catch {
          // Offline fallback
          const suggestion: CodeSuggestion = {
            id: `sug-${Date.now()}`,
            command: matchedCommand.label,
            code: generateFallbackCode(matchedCommand.label, transcript),
            language: 'typescript',
            timestamp: Date.now(),
          }
          setSuggestions((prev) => [suggestion, ...prev].slice(0, 5))
          addOutputEntry('Voice', 'AI processing unavailable — generated template locally', 'warn')
        } finally {
          setIsProcessing(false)
        }
      }
    },
    [voiceLanguage, addNotification, addOutputEntry]
  )

  const generateFallbackCode = (commandLabel: string, transcript: string): string => {
    switch (commandLabel) {
      case 'Create function': {
        const match = transcript.match(/create function\s+(.+)/i)
        const fnName = match?.[1]?.replace(/\s+/g, '') || 'myFunction'
        return `function ${fnName}(): void {\n  // TODO: Implement ${fnName}\n}\n\nexport { ${fnName} };`
      }
      case 'Add import': {
        const match = transcript.match(/add import\s+(.+)/i)
        const modName = match?.[1]?.trim() || 'module'
        return `import { ${modName} } from '${modName.toLowerCase()}';`
      }
      case 'Explain code':
        return '// AI Explanation: This code section needs review.\n// Use the AI chat panel for detailed explanations.'
      case 'Find bugs':
        return '// AI Bug Analysis: Common issues to check:\n// 1. Null/undefined references\n// 2. Unhandled promise rejections\n// 3. Missing error boundaries'
      case 'Refactor':
        return '// AI Refactoring Suggestion:\n// Consider extracting this logic into a separate function\n// for better readability and testability.'
      default:
        return `// Voice command: ${transcript}`
    }
  }

  const handleToggleListening = useCallback(() => {
    if (voiceListening) {
      stopListening()
      try {
        const recognition = recognitionRef.current as { stop: () => void } | null
        recognition?.stop()
      } catch {
        // Ignore
      }
    } else {
      if (!voiceSupported) {
        addNotification('error', 'Speech recognition is not supported in this browser')
        return
      }

      try {
        const SpeechRecognitionAPI =
          (window as unknown as Record<string, unknown>).SpeechRecognition ||
          (window as unknown as Record<string, unknown>).webkitSpeechRecognition

        if (SpeechRecognitionAPI) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const recognition = new (SpeechRecognitionAPI as any)()
          recognition.lang = voiceLanguage
          recognition.continuous = true
          recognition.interimResults = true

          recognition.onresult = (event: any) => {
            let interim = ''
            let final = ''
            for (let i = event.resultIndex; i < event.results.length; i++) {
              const result = event.results[i]
              if (result.isFinal) {
                final += result[0].transcript
              } else {
                interim += result[0].transcript
              }
            }
            if (interim) setInterimTranscript(interim)
            if (final) {
              useIDEStore.getState().startListening() // keep listening state on
              useIDEStore.setState({ voiceTranscript: final })
              setInterimTranscript('')
            }
          }

          recognition.onerror = () => {
            stopListening()
            setInterimTranscript('')
            addNotification('error', 'Speech recognition error occurred')
          }

          recognition.onend = () => {
            useIDEStore.setState({ voiceListening: false })
            setInterimTranscript('')
          }

          recognitionRef.current = recognition
          recognition.start()
          startListening()
          setInterimTranscript('')
        } else {
          addNotification('error', 'Speech Recognition API not available')
        }
      } catch (err) {
        addNotification('error', `Failed to start voice: ${(err as Error).message}`)
      }
    }
  }, [voiceListening, voiceSupported, voiceLanguage, startListening, stopListening, addNotification])

  const handleApplyCode = useCallback(
    (code: string) => {
      // Insert into the active editor tab
      const state = useIDEStore.getState()
      const activeTab = state.openTabs.find((t) => t.id === state.activeTabId)
      if (activeTab) {
        const newContent = activeTab.content + '\n' + code
        state.updateTabContent(activeTab.id, newContent)
        addNotification('success', 'Code applied to active editor')
      } else {
        addNotification('warning', 'No active editor tab — copy the code instead')
        navigator.clipboard.writeText(code)
      }
    },
    [addNotification]
  )

  const handleDismissSuggestion = useCallback((id: string) => {
    setSuggestions((prev) => prev.filter((s) => s.id !== id))
  }, [])

  const formatTime = (ts: number) => {
    const d = new Date(ts)
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  }

  const currentLang = LANGUAGES.find((l) => l.code === voiceLanguage)

  return (
    <div className="h-full flex flex-col" role="region" aria-label="Voice to Code">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-[#30363d] border-b border-[rgba(0,212,170,0.08)]">
        <span className="flex items-center gap-2">
          <Mic size={12} className="text-[#00d4aa]" />
          Voice to Code
        </span>
        {isProcessing && (
          <span className="flex items-center gap-1 text-[#ffa657]">
            <Loader2 size={10} className="animate-spin" />
            Processing...
          </span>
        )}
      </div>

      {/* Browser Support Notice */}
      {!voiceSupported && (
        <div className="mx-3 mt-3 px-3 py-2 rounded-lg bg-[rgba(248,81,73,0.06)] border border-[rgba(248,81,73,0.12)] text-[11px] font-mono flex items-start gap-2">
          <AlertTriangle size={12} className="text-[#f85149] shrink-0 mt-0.5" />
          <div>
            <span className="text-[#f85149] font-semibold">Web Speech API not supported</span>
            <p className="text-[#484f58] mt-1">
              Voice recognition requires Chrome, Edge, or Safari. Try using a Chromium-based browser for the best experience.
            </p>
          </div>
        </div>
      )}

      {/* Microphone Button & Waveform */}
      <div className="flex flex-col items-center py-6 gap-4">
        <button
          onClick={handleToggleListening}
          disabled={!voiceSupported}
          className={`
            relative w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 cursor-pointer
            disabled:opacity-30 disabled:cursor-not-allowed
            ${voiceListening
              ? 'bg-[rgba(0,212,170,0.15)] shadow-[0_0_30px_rgba(0,212,170,0.2)] scale-110'
              : 'bg-[rgba(0,212,170,0.06)] hover:bg-[rgba(0,212,170,0.12)] hover:shadow-[0_0_20px_rgba(0,212,170,0.1)]'
            }
          `}
          aria-label={voiceListening ? 'Stop voice recording' : 'Start voice recording'}
          aria-pressed={voiceListening}
        >
          {voiceListening ? (
            <MicOff size={28} className="text-[#00d4aa] animate-pulse" />
          ) : (
            <Mic size={28} className="text-[#00d4aa]/60" />
          )}
          {voiceListening && (
            <span className="absolute inset-0 rounded-full border-2 border-[#00d4aa] animate-ping opacity-30" />
          )}
        </button>

        <div className="text-center">
          <p className="text-[12px] font-mono text-[#e6edf3]">
            {voiceListening ? 'Listening...' : 'Click to speak'}
          </p>
          <p className="text-[10px] font-mono text-[#30363d] mt-0.5">
            {voiceListening ? 'Say a command like "Create function handleSubmit"' : 'Microphone off'}
          </p>
        </div>

        {/* Waveform Visualizer */}
        <WaveformVisualizer active={voiceListening} />
      </div>

      {/* Language Selection */}
      <div className="px-4 pb-3">
        <div className="relative" ref={langDropdownRef}>
          <button
            onClick={() => setShowLangDropdown(!showLangDropdown)}
            className="w-full flex items-center justify-between gap-2 px-3 py-1.5 bg-[#0d1117] border border-[rgba(0,212,170,0.08)] rounded text-[12px] font-mono text-[#e6edf3] hover:border-[rgba(0,212,170,0.18)] transition-colors cursor-pointer"
            aria-label="Select voice recognition language"
            aria-expanded={showLangDropdown}
          >
            <div className="flex items-center gap-2">
              <Languages size={12} className="text-[#00d4aa]" />
              <span>{currentLang?.label || voiceLanguage}</span>
            </div>
            <ChevronDown size={12} className={`text-[#30363d] transition-transform ${showLangDropdown ? 'rotate-180' : ''}`} />
          </button>
          {showLangDropdown && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-[#0d1117] border border-[rgba(0,212,170,0.12)] rounded shadow-lg z-10 overflow-hidden">
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => {
                    setVoiceLanguage(lang.code)
                    setShowLangDropdown(false)
                  }}
                  className={`
                    w-full flex items-center justify-between px-3 py-2 text-[12px] font-mono transition-colors cursor-pointer
                    ${voiceLanguage === lang.code
                      ? 'bg-[rgba(0,212,170,0.1)] text-[#00d4aa]'
                      : 'text-[#e6edf3] hover:bg-[rgba(255,255,255,0.03)]'
                    }
                  `}
                >
                  <span>{lang.label}</span>
                  {voiceLanguage === lang.code && <Check size={10} className="text-[#00d4aa]" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Live Transcript */}
      <div className="px-4 pb-3">
        <div className="bg-[#0d1117] border border-[rgba(0,212,170,0.08)] rounded-lg p-3 min-h-[48px]">
          <div className="text-[10px] font-mono text-[#30363d] uppercase tracking-wider mb-1.5">Live Transcript</div>
          {voiceTranscript || interimTranscript ? (
            <p className="text-[12px] font-mono text-[#e6edf3] leading-relaxed">
              {voiceTranscript}
              {interimTranscript && (
                <span className="text-[#00d4aa]/50 italic">{interimTranscript}</span>
              )}
            </p>
          ) : (
            <p className="text-[12px] font-mono text-[#30363d] italic">
              {voiceListening ? 'Speak now...' : 'Transcript will appear here'}
            </p>
          )}
        </div>
      </div>

      {/* Voice Commands Reference */}
      <div className="px-4 pb-3">
        <div className="text-[10px] font-mono text-[#30363d] uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <Volume2 size={10} />
          Voice Commands
        </div>
        <div className="space-y-1">
          {VOICE_COMMANDS.map((cmd) => {
            const Icon = cmd.icon
            return (
              <div
                key={cmd.label}
                className="flex items-center gap-2 px-2 py-1.5 rounded bg-[#0d1117] border border-[rgba(0,212,170,0.04)] hover:border-[rgba(0,212,170,0.12)] transition-colors"
              >
                <Icon size={11} className="text-[#00d4aa] shrink-0" />
                <span className="text-[11px] font-mono text-[#e6edf3]">{cmd.label}</span>
                <span className="text-[10px] font-mono text-[#30363d] ml-auto">{cmd.description}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* AI Code Suggestions */}
      {suggestions.length > 0 && (
        <div className="px-4 pb-3">
          <div className="text-[10px] font-mono text-[#30363d] uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Sparkles size={10} />
            AI Suggestions ({suggestions.length})
          </div>
          <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
            {suggestions.map((s) => (
              <CodeSuggestionCard
                key={s.id}
                suggestion={s}
                onApply={handleApplyCode}
                onDismiss={() => handleDismissSuggestion(s.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Command History */}
      <div className="flex-1 flex flex-col min-h-0 px-4 pb-3">
        <div className="text-[10px] font-mono text-[#30363d] uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <History size={10} />
          Command History
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-1 max-h-48">
          {commandHistory.length === 0 ? (
            <p className="text-[11px] font-mono text-[#30363d] italic px-2 py-4 text-center">
              No voice commands yet
            </p>
          ) : (
            commandHistory.map((cmd) => (
              <div
                key={cmd.id}
                className="flex items-start gap-2 px-2 py-1.5 rounded bg-[#0d1117] border border-[rgba(0,212,170,0.04)]"
              >
                <Mic size={9} className="text-[#00d4aa]/50 shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-mono text-[#e6edf3] truncate">{cmd.transcript}</p>
                  <p className="text-[10px] font-mono text-[#30363d]">
                    {formatTime(cmd.timestamp)} · {Math.round(cmd.confidence * 100)}%
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
