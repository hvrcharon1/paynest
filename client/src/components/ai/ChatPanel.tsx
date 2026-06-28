import { useState, useRef, useEffect } from 'react'
import { Send, Sparkles, Bot, User } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useAppStore } from '@/store/useStore'
import { answerLocalQuery } from '@/lib/ai'
import { cn } from '@/lib/utils'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
}

const SUGGESTIONS = [
  "When's my next rent payment?",
  "What's my total spend this month?",
  'What is overdue?',
  'How many bills are on autopay?',
]

export function ChatPanel() {
  const services = useAppStore((s) => s.services)
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: "Hi, I'm your PayNest assistant. Ask me about due dates, totals, overdue bills, or autopay coverage.",
    },
  ])
  const [input, setInput] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages])

  function send(text: string) {
    if (!text.trim()) return
    const userMsg: ChatMessage = { id: `u_${Date.now()}`, role: 'user', content: text.trim() }
    const reply = answerLocalQuery(text, services)
    const botMsg: ChatMessage = { id: `a_${Date.now()}`, role: 'assistant', content: reply }
    setMessages((prev) => [...prev, userMsg, botMsg])
    setInput('')
  }

  return (
    <div className="flex flex-col h-[560px] bg-bg-surface border border-border rounded-2xl overflow-hidden">
      <div className="px-5 py-4 border-b border-border flex items-center gap-2">
        <Sparkles size={16} className="text-brand-light" />
        <p className="font-display font-semibold text-text-primary text-sm">Ask PayNest</p>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto scrollbar-thin px-5 py-4 space-y-4">
        {messages.map((m) => (
          <div key={m.id} className={cn('flex gap-2.5', m.role === 'user' && 'flex-row-reverse')}>
            <div
              className={cn(
                'h-8 w-8 rounded-full flex items-center justify-center shrink-0',
                m.role === 'assistant' ? 'bg-brand/15 text-brand-light' : 'bg-bg-elevated text-text-subtle'
              )}
            >
              {m.role === 'assistant' ? <Bot size={16} /> : <User size={16} />}
            </div>
            <div
              className={cn(
                'rounded-2xl px-4 py-2.5 text-sm max-w-[80%] leading-relaxed',
                m.role === 'assistant' ? 'bg-bg-elevated text-text-primary' : 'bg-brand text-white'
              )}
            >
              {m.content}
            </div>
          </div>
        ))}
      </div>

      <div className="px-5 py-2 flex gap-2 overflow-x-auto scrollbar-thin">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            onClick={() => send(s)}
            className="shrink-0 text-xs px-3 py-1.5 rounded-full border border-border text-text-muted hover:text-text-primary hover:border-brand/40 transition-colors"
          >
            {s}
          </button>
        ))}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          send(input)
        }}
        className="px-4 py-3 border-t border-border flex gap-2"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about a bill, due date, or total…"
          className="flex-1 bg-bg-elevated border border-border rounded-xl px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-brand focus:ring-1 focus:ring-brand outline-none"
        />
        <Button type="submit" aria-label="Send message">
          <Send size={16} />
        </Button>
      </form>
    </div>
  )
}
