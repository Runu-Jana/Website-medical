import { useState } from 'react'
import { FaTag, FaRegCopy, FaCheck } from 'react-icons/fa'

// Prominent strip of active coupons (managed in Admin → Offers, "Show on
// homepage"). Renders nothing when there are no active homepage coupons.
export default function CouponStrip({ coupons = [] }) {
  const [copied, setCopied] = useState('')

  if (!coupons.length) return null

  const copy = async (code) => {
    try {
      await navigator.clipboard.writeText(code)
    } catch {
      /* clipboard unavailable — ignore */
    }
    setCopied(code)
    setTimeout(() => setCopied(''), 1800)
  }

  const offLabel = (c) =>
    c.type === 'percent' ? `${Math.round(c.value)}% OFF` : `₹${Math.round(c.value)} OFF`

  return (
    <section className="container-x mt-6">
      <div className="mb-3 flex items-center gap-2">
        <FaTag className="text-primary" />
        <h2 className="text-lg font-bold text-dark">Offers for you</h2>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-1 no-scrollbar">
        {coupons.map((c) => (
          <div
            key={c._id}
            className="relative flex min-w-[260px] flex-1 items-center justify-between gap-3 overflow-hidden rounded-2xl border border-dashed border-primary/40 bg-gradient-to-r from-primary/5 to-emerald-50 p-4"
          >
            {/* Ticket notches */}
            <span className="absolute -left-2 top-1/2 h-4 w-4 -translate-y-1/2 rounded-full bg-white" />
            <span className="absolute -right-2 top-1/2 h-4 w-4 -translate-y-1/2 rounded-full bg-white" />
            <div className="min-w-0">
              <p className="text-lg font-extrabold text-primary">{offLabel(c)}</p>
              <p className="truncate text-xs text-slate-600">
                {c.description || 'Limited time offer'}
              </p>
              {c.minOrder > 0 && (
                <p className="mt-0.5 text-[11px] text-slate-400">
                  On orders above ₹{Math.round(c.minOrder)}
                </p>
              )}
            </div>
            <button
              onClick={() => copy(c.code)}
              className="flex shrink-0 items-center gap-1.5 rounded-lg border border-primary/40 bg-white px-3 py-2 text-xs font-bold uppercase tracking-wide text-primary transition hover:bg-primary hover:text-white"
              title="Copy code"
            >
              {copied === c.code ? <FaCheck /> : <FaRegCopy />}
              {copied === c.code ? 'Copied' : c.code}
            </button>
          </div>
        ))}
      </div>
    </section>
  )
}
