import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FaTimes, FaRegCopy, FaCheck } from 'react-icons/fa'
import api from '../lib/api'
import { imgFallback } from '../lib/helpers'

// Find a coupon-looking code (uppercase, contains a digit) in free text, so a
// popup that mentions a code in its subtitle still gets a copy button even if
// the admin didn't fill the dedicated field.
const detectCode = (text = '') => {
  const m = String(text).match(/\b(?=[A-Z0-9]*\d)[A-Z]{2,}[A-Z0-9]*\b/)
  return m ? m[0] : ''
}

// Only show a popup once per its configured frequency.
//   session → once per browser tab/session
//   daily   → once per calendar day
//   always  → every time the app opens
const DAY = 24 * 60 * 60 * 1000

const wasDismissed = (popup) => {
  const key = `popup_dismissed_${popup._id}`
  try {
    if (popup.frequency === 'always') return false
    if (popup.frequency === 'session') return sessionStorage.getItem(key) === '1'
    // daily
    const ts = Number(localStorage.getItem(key) || 0)
    return ts && Date.now() - ts < DAY
  } catch {
    return false
  }
}

const markDismissed = (popup) => {
  const key = `popup_dismissed_${popup._id}`
  try {
    if (popup.frequency === 'session') sessionStorage.setItem(key, '1')
    else if (popup.frequency === 'daily') localStorage.setItem(key, String(Date.now()))
  } catch {
    /* storage unavailable — ignore */
  }
}

export default function PopupBanner() {
  const navigate = useNavigate()
  const [popup, setPopup] = useState(null)
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    let active = true
    api
      .get('/popups', { params: { active: true } })
      .then(({ data }) => {
        if (!active || !Array.isArray(data)) return
        const next = data.find((p) => !wasDismissed(p))
        if (next) {
          setPopup(next)
          // Small delay so the slide-up plays after first paint.
          setTimeout(() => active && setOpen(true), 350)
        }
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [])

  if (!popup) return null

  const close = () => {
    markDismissed(popup)
    setOpen(false)
    setTimeout(() => setPopup(null), 250)
  }

  const go = () => {
    markDismissed(popup)
    setOpen(false)
    const to = popup.link || '/shop'
    setTimeout(() => {
      setPopup(null)
      if (/^https?:\/\//i.test(to)) window.location.href = to
      else navigate(to)
    }, 200)
  }

  // The coupon code to offer: the admin field, else one detected in the text.
  const code = popup.couponCode || detectCode(popup.subtitle) || detectCode(popup.title)
  const copyCode = async (e) => {
    e.stopPropagation()
    try {
      await navigator.clipboard.writeText(code)
    } catch {
      /* clipboard unavailable — ignore */
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }
  const CopyChip = ({ dark }) => (
    <button
      onClick={copyCode}
      className={`mt-4 inline-flex items-center gap-2 rounded-lg border border-dashed px-4 py-2 text-sm font-bold uppercase tracking-wider transition ${
        dark
          ? 'border-primary/40 bg-primary/5 text-primary hover:bg-primary/10'
          : 'border-white/60 bg-white/15 text-white hover:bg-white/25'
      }`}
      title="Copy coupon code"
    >
      {copied ? <FaCheck /> : <FaRegCopy />}
      {copied ? 'Copied!' : code}
    </button>
  )

  if (!open) {
    // Before the slide-in (and during the closing fade) keep an invisible,
    // click-through placeholder so it never blocks the page.
    return (
      <div
        className="pointer-events-none fixed inset-0 z-[100] opacity-0"
        aria-hidden
      />
    )
  }

  const hasImage = !!popup.image

  return (
    <div
      className="popup-backdrop fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-sm"
      style={{ backgroundColor: 'rgba(15,23,42,0.55)' }}
      onClick={close}
      role="dialog"
      aria-modal="true"
      aria-label={popup.title || 'Offer'}
    >
      <div
        className="popup-card relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button — top-right */}
        <button
          onClick={close}
          aria-label="Close"
          className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-slate-600 shadow-md transition hover:bg-white hover:text-slate-900"
        >
          <FaTimes size={16} />
        </button>

        {hasImage ? (
          <div onClick={go} className="block w-full cursor-pointer text-left">
            <img
              src={popup.image}
              onError={imgFallback}
              alt={popup.title || 'Offer'}
              className="max-h-[70vh] w-full object-cover"
            />
            {(popup.title || popup.buttonText) && (
              <div className="p-4">
                {popup.title && <h3 className="text-lg font-bold text-dark">{popup.title}</h3>}
                {popup.subtitle && <p className="mt-1 text-sm text-slate-500">{popup.subtitle}</p>}
                {code && (
                  <div>
                    <CopyChip dark />
                  </div>
                )}
                {popup.buttonText && (
                  <span className="mt-3 inline-block rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white">
                    {popup.buttonText}
                  </span>
                )}
              </div>
            )}
          </div>
        ) : (
          // Text/gradient card when no image is set (used by the demo popup).
          <div
            className="flex flex-col items-center px-6 py-10 text-center text-white"
            style={{
              background: `linear-gradient(135deg, ${popup.bgColor || '#0e9f8e'}, #0b7d70)`,
            }}
          >
            {popup.badge && (
              <span className="mb-3 rounded-full bg-white/20 px-3 py-1 text-[11px] font-bold uppercase tracking-wide">
                {popup.badge}
              </span>
            )}
            <h3 className="text-2xl font-extrabold leading-tight">{popup.title}</h3>
            {popup.subtitle && (
              <p className="mt-2 max-w-xs text-sm text-white/90">{popup.subtitle}</p>
            )}
            {code && <CopyChip dark={false} />}
            {popup.buttonText && (
              <button
                onClick={go}
                className="mt-4 rounded-xl bg-white px-7 py-3 text-sm font-bold text-primary shadow-lg transition hover:opacity-90"
              >
                {popup.buttonText}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
