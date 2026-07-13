import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../lib/api'
import { FaArrowLeft, FaSyncAlt, FaMicrophone, FaArrowUp } from 'react-icons/fa'

const GREETING =
  "Hi! I'm your AI Health Assistant. Tell me your symptoms or ask about medicines, orders or offers. For medical advice, please consult a doctor or pharmacist."

const QUICK = [
  { label: 'Find Medicine', to: '/shop' },
  { label: 'Book Doctor', to: '/doctors' },
  { label: 'Book Lab Test', to: '/lab-tests' },
]

const fmtTime = (t) =>
  new Date(t).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })

// Render an assistant reply, turning "-", "•" or "*" lines into a bullet list.
function AssistantText({ text }) {
  const lines = String(text).split('\n').map((l) => l.trim()).filter(Boolean)
  return (
    <>
      {lines.map((l, i) => {
        const isBullet = /^[-•*]\s?/.test(l)
        if (isBullet) {
          return (
            <div key={i} className="mt-1 flex gap-2">
              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
              <span>{l.replace(/^[-•*]\s?/, '')}</span>
            </div>
          )
        }
        return (
          <p key={i} className={i > 0 ? 'mt-2' : ''}>
            {l}
          </p>
        )
      })}
    </>
  )
}

export default function HealthAssistant() {
  const navigate = useNavigate()
  const [enabled, setEnabled] = useState(null)
  const [messages, setMessages] = useState(() => [{ role: 'assistant', content: GREETING, at: Date.now() }])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [conversationId, setConversationId] = useState(null)
  const scrollRef = useRef(null)

  useEffect(() => {
    api.get('/support/status').then(({ data }) => setEnabled(!!data.enabled)).catch(() => setEnabled(false))
  }, [])
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [messages, sending])

  const reset = () => {
    setMessages([{ role: 'assistant', content: GREETING, at: Date.now() }])
    setConversationId(null)
    setInput('')
  }

  const send = async (e) => {
    e?.preventDefault()
    const text = input.trim()
    if (!text || sending) return
    const next = [...messages, { role: 'user', content: text, at: Date.now() }]
    setMessages(next)
    setInput('')
    setSending(true)
    try {
      const { data } = await api.post('/support/chat', {
        messages: next.filter((m) => m.role === 'user' || m.role === 'assistant').map((m) => ({ role: m.role, content: m.content })),
        conversationId,
      })
      if (data.conversationId) setConversationId(data.conversationId)
      setMessages((m) => [...m, { role: 'assistant', content: data.reply, at: Date.now() }])
    } catch (err) {
      setMessages((m) => [
        ...m,
        { role: 'assistant', content: err.response?.data?.message || "Sorry, I couldn't respond right now.", at: Date.now() },
      ])
    } finally {
      setSending(false)
    }
  }

  // Optional voice input (Web Speech API) — no-op if the browser doesn't support it.
  const startVoice = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) return
    const rec = new SR()
    rec.lang = 'en-IN'
    rec.interimResults = false
    rec.onresult = (ev) => setInput((prev) => `${prev ? prev + ' ' : ''}${ev.results[0][0].transcript}`)
    try {
      rec.start()
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="mx-auto w-full max-w-2xl md:px-6 md:py-4">
      <div className="flex h-[100dvh] w-full flex-col overflow-hidden border-bordergray bg-white md:h-[calc(100vh-11rem)] md:max-h-[820px] md:min-h-[420px] md:rounded-2xl md:border md:shadow-card">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-bordergray px-2 py-2.5">
          <button onClick={() => navigate(-1)} aria-label="Back" className="rounded-full p-2 text-slate-600 hover:bg-lightbg">
            <FaArrowLeft size={16} />
          </button>
          <h1 className="text-base font-bold text-dark">AI Health Assistant</h1>
          <button onClick={reset} aria-label="New chat" title="New chat" className="rounded-full p-2 text-slate-500 hover:bg-lightbg">
            <FaSyncAlt size={15} />
          </button>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto bg-lightbg px-3 py-4">
          {messages.map((m, i) => (
            <div key={i} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
              <div
                className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                  m.role === 'user'
                    ? 'rounded-br-md bg-emerald-100 text-slate-800'
                    : 'rounded-bl-md bg-white text-slate-700 shadow-sm'
                }`}
              >
                {m.role === 'assistant' ? <AssistantText text={m.content} /> : m.content}
              </div>
              <span className="mt-1 px-1 text-[10px] text-slate-400">{fmtTime(m.at)}</span>
            </div>
          ))}
          {sending && (
            <div className="flex justify-start">
              <div className="flex items-center gap-1 rounded-2xl rounded-bl-md bg-white px-4 py-3 shadow-sm">
                <span className="h-2 w-2 animate-bounce rounded-full bg-slate-300 [animation-delay:-0.3s]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-slate-300 [animation-delay:-0.15s]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-slate-300" />
              </div>
            </div>
          )}
        </div>

        {/* Quick action pills */}
        <div className="flex gap-2 overflow-x-auto border-t border-bordergray px-3 py-2 no-scrollbar">
          {QUICK.map((q) => (
            <button
              key={q.label}
              onClick={() => navigate(q.to)}
              className="whitespace-nowrap rounded-full border border-primary/40 px-3.5 py-1.5 text-xs font-semibold text-primary transition hover:bg-primary/5"
            >
              {q.label}
            </button>
          ))}
        </div>

        {/* Input */}
        <form onSubmit={send} className="flex items-center gap-2 border-t border-bordergray px-3 py-2.5">
          <div className="flex flex-1 items-center gap-2 rounded-full bg-lightbg px-4">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={enabled === false ? 'Assistant not available' : 'Type your message...'}
              disabled={enabled === false}
              className="flex-1 bg-transparent py-2.5 text-sm outline-none disabled:cursor-not-allowed"
            />
            <button type="button" onClick={startVoice} aria-label="Voice input" className="text-slate-400 hover:text-primary">
              <FaMicrophone size={15} />
            </button>
          </div>
          <button
            type="submit"
            disabled={sending || !input.trim() || enabled === false}
            aria-label="Send"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-white transition hover:bg-primaryDark disabled:opacity-50"
          >
            <FaArrowUp size={15} />
          </button>
        </form>
      </div>
      <p className="mx-auto mt-2 hidden max-w-2xl text-center text-[11px] text-slate-400 md:block">
        AI assistant · not a substitute for professional medical advice
      </p>
    </div>
  )
}
