'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft,
  Bot,
  Send,
  Sparkles,
  User,
  Loader2,
  Mic,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useAppStore } from '@/lib/store'
import { useTranslation } from '@/lib/i18n'
import { toast } from 'sonner'

// Inline fallback translations
const fallback: Record<string, string> = {
  'assistant.title': 'AI Health Assistant',
  'assistant.subtitle': 'Ask me anything about medicines, health, and wellness',
  'assistant.placeholder': 'Type your health question...',
  'assistant.send': 'Send',
  'assistant.thinking': 'Thinking',
  'assistant.error': 'Failed to get a response. Please try again.',
  'assistant.welcome': 'Hello! I\'m your AI Health Assistant. How can I help you today?',
  'assistant.quickQuestions': 'Quick Questions',
  'assistant.disclaimer': 'I provide general health information only, not medical advice. Always consult a healthcare professional for personalized guidance.',
  'assistant.typing': 'is typing',
}

// Types
interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
}

const QUICK_QUESTIONS = [
  'What is Paracetamol used for?',
  'Is it safe to take Ibuprofen with Aspirin?',
  'What are the side effects of antibiotics?',
  'How long should I take a course of antibiotics?',
  'What is the difference between Crocin and Dolo?',
  'Can I take painkillers on an empty stomach?',
]

function TypingDots() {
  return (
    <span className="inline-flex gap-1">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="inline-block h-2 w-2 rounded-full bg-primary/60"
          animate={{ opacity: [0.3, 1, 0.3], y: [0, -4, 0] }}
          transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15, ease: 'easeInOut' }}
        />
      ))}
    </span>
  )
}

export default function AIAssistantScreen() {
  const language = useAppStore((s) => s.language)
  const { t } = useTranslation(language)
  const goBack = useAppStore((s) => s.goBack)

  const st = useCallback(
    (key: string) => {
      const val = t(key)
      return val === key && fallback[key] ? fallback[key] : val
    },
    [t]
  )

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: st('assistant.welcome'),
      timestamp: Date.now(),
    },
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, isLoading])

  const sendMessage = useCallback(
    async (content?: string) => {
      const text = (content || input).trim()
      if (!text || isLoading) return

      const userMsg: Message = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: text,
        timestamp: Date.now(),
      }

      setMessages((prev) => [...prev, userMsg])
      setInput('')
      setIsLoading(true)

      try {
        const res = await fetch('/api/ai-assistant', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [...messages, userMsg].map((m) => ({
              role: m.role,
              content: m.content,
            })),
          }),
        })

        if (!res.ok) throw new Error(`Server error: ${res.status}`)

        const data = await res.json()
        const aiMsg: Message = {
          id: `ai-${Date.now()}`,
          role: 'assistant',
          content: data.response || data.message || data.content || data.reply || 'Sorry, I could not process that.',
          timestamp: Date.now(),
        }
        setMessages((prev) => [...prev, aiMsg])
      } catch {
        toast.error(st('assistant.error'))
        const errMsg: Message = {
          id: `err-${Date.now()}`,
          role: 'assistant',
          content: st('assistant.error'),
          timestamp: Date.now(),
        }
        setMessages((prev) => [...prev, errMsg])
      } finally {
        setIsLoading(false)
      }
    },
    [input, isLoading, messages, st]
  )

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        sendMessage()
      }
    },
    [sendMessage]
  )

  const handleQuickQuestion = useCallback(
    (question: string) => {
      sendMessage(question)
    },
    [sendMessage]
  )

  // Simple markdown-like rendering for AI messages
  const renderContent = (content: string) => {
    // Split by ** for bold, and newlines
    const parts = content.split(/(\*\*[^*]+\*\*|\n)/g)
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={i} className="font-semibold">
            {part.slice(2, -2)}
          </strong>
        )
      }
      if (part === '\n') {
        return <br key={i} />
      }
      return <span key={i}>{part}</span>
    })
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-lg border-b">
        <div className="flex items-center gap-3 px-4 py-3 max-w-3xl mx-auto w-full">
          <Button variant="ghost" size="icon" className="shrink-0" onClick={goBack} aria-label="Go back">
            <ArrowLeft className="size-5" />
          </Button>
          <div className="flex items-center gap-2 min-w-0">
            <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Bot className="size-4 text-primary" />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg font-bold truncate">{st('assistant.title')}</h1>
            </div>
          </div>
          <Badge variant="secondary" className="ml-auto gap-1 shrink-0">
            <span className="size-2 rounded-full bg-emerald-500" />
            Online
          </Badge>
        </div>
      </header>

      {/* Messages Area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto w-full px-4 py-4 space-y-4">
          {/* Messages */}
          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {/* AI Avatar */}
                {msg.role === 'assistant' && (
                  <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-1">
                    <Bot className="size-4 text-primary" />
                  </div>
                )}

                {/* Message Bubble */}
                <div
                  className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-primary text-primary-foreground rounded-br-md'
                      : 'bg-muted text-foreground rounded-bl-md'
                  }`}
                >
                  {msg.role === 'assistant' ? renderContent(msg.content) : msg.content}
                </div>

                {/* User Avatar */}
                {msg.role === 'user' && (
                  <div className="size-8 rounded-full bg-primary flex items-center justify-center shrink-0 mt-1">
                    <User className="size-4 text-primary-foreground" />
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Typing Indicator */}
          {isLoading && (
            <motion.div
              className="flex gap-3 justify-start"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-1">
                <Bot className="size-4 text-primary" />
              </div>
              <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <TypingDots />
                  <span className="text-xs">{st('assistant.typing')}</span>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Quick Questions (show only when no user messages) */}
      {messages.length <= 1 && !isLoading && (
        <motion.div
          className="max-w-3xl mx-auto w-full px-4 pb-3"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
            {st('assistant.quickQuestions')}
          </p>
          <div className="flex flex-wrap gap-2 mb-3">
            {QUICK_QUESTIONS.map((q) => (
              <motion.button
                key={q}
                onClick={() => handleQuickQuestion(q)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-secondary text-secondary-foreground hover:bg-primary/10 hover:text-primary border border-transparent hover:border-primary/20 transition-colors cursor-pointer text-left"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Sparkles className="size-3 shrink-0" />
                {q}
              </motion.button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Disclaimer */}
      {messages.length <= 1 && (
        <motion.div
          className="max-w-3xl mx-auto w-full px-4 pb-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <p className="text-[10px] text-muted-foreground text-center leading-relaxed">
            {st('assistant.disclaimer')}
          </p>
        </motion.div>
      )}

      {/* Input Bar */}
      <div className="sticky bottom-0 bg-background/80 backdrop-blur-lg border-t">
        <div className="max-w-3xl mx-auto w-full px-4 py-3">
          <div className="flex items-end gap-2">
            <div className="relative flex-1">
              <Textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={st('assistant.placeholder')}
                className="min-h-[44px] max-h-32 resize-none pr-4 text-base py-3 rounded-xl"
                rows={1}
                disabled={isLoading}
              />
            </div>
            <Button
              onClick={() => sendMessage()}
              disabled={!input.trim() || isLoading}
              size="icon"
              className="h-11 w-11 rounded-xl shrink-0"
              aria-label={st('assistant.send')}
            >
              {isLoading ? (
                <Loader2 className="size-5 animate-spin" />
              ) : (
                <Send className="size-5" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}