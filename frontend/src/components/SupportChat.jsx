import { useEffect, useRef, useState } from 'react'
import { FaComments, FaTimes, FaPaperPlane, FaHeadset } from 'react-icons/fa'
import api from '../lib/api'
import { siteConfig } from '../config/site'

const GREETING = {
  role: 'assistant',
  content: `Hi! I'm the ${siteConfig.brandName || 'DBL Life Care'} Care Assistant 💊 Ask me about products, offers, delivery, or your orders. For medical advice, please consult a doctor or pharmacist.`,
}

export default function SupportChat() {
  const [enabled, setEnabled] = useState(false)
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([GREETING])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [conversationId, setConversationId] = useState(null)
  const [escalated, setEscalated] = useState(false)
  const scrollRef = useRef(null)
  const panelRef = useRef(null)

  // Close the chat when clicking/tapping anywhere outside the panel.
  useEffect(() => {
    if (!open) return
    const onDown = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('pointerdown', onDown)
    return () => document.removeEventListener('pointerdown', onDown)
  }, [open])

  useEffect(() => {
    api
      .get('/support/status')
      .then(({ data }) => setEnabled(!!data.enabled))
      .catch(() => setEnabled(false))
  }, [])

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [messages, open, sending])

  if (!enabled) return null

  const send = async (e) => {
    e?.preventDefault()
    const text = input.trim()
    if (!text || sending) return
    const next = [...messages, { role: 'user', content: text }]
    setMessages(next)
    setInput('')
    setSending(true)
    try {
      const { data } = await api.post('/support/chat', {
        messages: next.filter((m) => m.role === 'user' || m.role === 'assistant'),
        conversationId,
      })
      if (data.conversationId) setConversationId(data.conversationId)
      if (data.escalate) setEscalated(true)
      setMessages((m) => [...m, { role: 'assistant', content: data.reply }])
    } catch (err) {
      const msg =
        err.response?.data?.message || "Sorry, I couldn't respond right now. Please try again."
      setMessages((m) => [...m, { role: 'assistant', content: msg }])
    } finally {
      setSending(false)
    }
  }

  return (
    <>
      {/* Launcher button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          aria-label="Chat with us"
          className="fixed bottom-20 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white shadow-lg shadow-primary/40 transition hover:scale-105 md:bottom-6 md:right-6"
        >
          <FaComments size={22} />
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[9px] font-bold">
            AI
          </span>
        </button>
      )}

      {/* Chat panel */}
      {open && (
        <div ref={panelRef} className="fixed bottom-20 right-4 z-50 flex h-[70vh] max-h-[560px] w-[calc(100vw-2rem)] max-w-sm flex-col overflow-hidden rounded-2xl bg-white shadow-2xl md:bottom-6 md:right-6">
          {/* Header */}
          <div className="flex items-center justify-between bg-primary px-4 py-3 text-white">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20">
                <FaHeadset size={16} />
              </div>
              <div className="leading-tight">
                <p className="text-sm font-bold">Care Assistant</p>
                <p className="text-[11px] text-white/80">Typically replies instantly</p>
              </div>
            </div>
            <button onClick={() => setOpen(false)} aria-label="Close chat" className="rounded-full p-1.5 hover:bg-white/20">
              <FaTimes size={16} />
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto bg-lightbg p-4">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] whitespace-pre-line rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                    m.role === 'user'
                      ? 'rounded-br-sm bg-primary text-white'
                      : 'rounded-bl-sm bg-white text-slate-700 shadow-sm'
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}
            {sending && (
              <div className="flex justify-start">
                <div className="flex items-center gap-1 rounded-2xl rounded-bl-sm bg-white px-4 py-3 shadow-sm">
                  <span className="h-2 w-2 animate-bounce rounded-full bg-slate-300 [animation-delay:-0.3s]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-slate-300 [animation-delay:-0.15s]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-slate-300" />
                </div>
              </div>
            )}
            {escalated && (
              <p className="rounded-lg bg-amber-50 px-3 py-2 text-center text-xs text-amber-700">
                Our team has been notified and will follow up with you.
              </p>
            )}
          </div>

          {/* Input */}
          <form onSubmit={send} className="flex items-center gap-2 border-t border-bordergray bg-white p-3">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message…"
              className="flex-1 rounded-full border border-bordergray px-4 py-2.5 text-sm focus:border-primary focus:outline-none"
            />
            <button
              type="submit"
              disabled={sending || !input.trim()}
              aria-label="Send"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-white transition hover:opacity-90 disabled:opacity-50"
            >
              <FaPaperPlane size={14} />
            </button>
          </form>
          <p className="bg-white pb-2 text-center text-[10px] text-slate-400">
            AI assistant · not a substitute for professional medical advice
          </p>
        </div>
      )}
    </>
  )
}
