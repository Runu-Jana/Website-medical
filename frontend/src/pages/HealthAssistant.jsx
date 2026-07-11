import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../lib/api'
import { FaHeadset, FaPaperPlane, FaPills, FaUserMd, FaFlask, FaRobot } from 'react-icons/fa'

const GREETING = {
  role: 'assistant',
  content:
    "Hi! I'm the DBL Life Care Health Assistant 🤖 Tell me your symptoms or ask about products, orders, or offers. For medical advice, please consult a doctor or pharmacist.",
}

const QUICK = [
  { label: 'Find Medicine', Icon: FaPills, to: '/shop' },
  { label: 'Book Doctor', Icon: FaUserMd, to: '/doctors' },
  { label: 'Book Lab Test', Icon: FaFlask, to: '/lab-tests' },
]

export default function HealthAssistant() {
  const navigate = useNavigate()
  const [enabled, setEnabled] = useState(null) // null=loading
  const [messages, setMessages] = useState([GREETING])
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
      setMessages((m) => [...m, { role: 'assistant', content: data.reply }])
    } catch (err) {
      setMessages((m) => [...m, { role: 'assistant', content: err.response?.data?.message || "Sorry, I couldn't respond right now." }])
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="container-x py-6">
      {/* Header */}
      <div className="flex items-center gap-3 rounded-2xl bg-gradient-to-r from-primary to-primaryDark p-5 text-white">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20"><FaRobot size={24} /></span>
        <div>
          <h1 className="text-xl font-bold">AI Health Assistant</h1>
          <p className="text-sm text-white/85">Symptoms, products, orders & more — instantly.</p>
        </div>
      </div>

      {/* Quick actions */}
      <div className="mt-4 grid grid-cols-3 gap-3">
        {QUICK.map(({ label, Icon, to }) => (
          <button key={label} onClick={() => navigate(to)} className="card flex flex-col items-center gap-1.5 p-3 text-center hover:ring-2 hover:ring-primary">
            <Icon className="text-primary" size={18} />
            <span className="text-xs font-semibold text-dark">{label}</span>
          </button>
        ))}
      </div>

      {/* Chat */}
      <div className="mt-4 flex h-[60vh] flex-col overflow-hidden rounded-2xl border border-bordergray bg-white">
        <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto bg-lightbg p-4">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] whitespace-pre-line rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                m.role === 'user' ? 'rounded-br-sm bg-primary text-white' : 'rounded-bl-sm bg-white text-slate-700 shadow-sm'
              }`}>
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
          {enabled === false && (
            <p className="rounded-lg bg-amber-50 px-3 py-2 text-center text-xs text-amber-700">
              The live assistant isn't switched on yet. You can still use the quick actions above.
            </p>
          )}
        </div>
        <form onSubmit={send} className="flex items-center gap-2 border-t border-bordergray p-3">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={enabled === false ? 'Assistant unavailable' : 'Describe your problem…'}
            disabled={enabled === false}
            className="flex-1 rounded-full border border-bordergray px-4 py-2.5 text-sm focus:border-primary focus:outline-none disabled:bg-slate-50"
          />
          <button type="submit" disabled={sending || !input.trim() || enabled === false}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-white disabled:opacity-50">
            <FaPaperPlane size={14} />
          </button>
        </form>
      </div>
      <p className="mt-2 flex items-center justify-center gap-1.5 text-center text-[11px] text-slate-400">
        <FaHeadset size={11} /> AI assistant · not a substitute for professional medical advice
      </p>
    </div>
  )
}
