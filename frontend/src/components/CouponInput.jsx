import { useState } from 'react'
import { FaTag, FaCheckCircle, FaTimes } from 'react-icons/fa'
import { useCart } from '../context/CartContext'

// Coupon entry + applied state, shared by the Cart and Checkout summaries.
export default function CouponInput() {
  const { coupon, applyCoupon, removeCoupon } = useCart()
  const [code, setCode] = useState('')
  const [msg, setMsg] = useState(null) // { ok, text }
  const [busy, setBusy] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setMsg(null)
    const res = await applyCoupon(code)
    setMsg({ ok: res.ok, text: res.message })
    if (res.ok) setCode('')
    setBusy(false)
  }

  if (coupon) {
    return (
      <div className="flex items-center justify-between gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5">
        <div className="flex items-center gap-2 text-sm">
          <FaCheckCircle className="text-emerald-600" />
          <span className="font-bold text-emerald-700">{coupon.code}</span>
          <span className="text-emerald-700">applied</span>
        </div>
        <button
          onClick={removeCoupon}
          className="flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-red-500"
        >
          <FaTimes /> Remove
        </button>
      </div>
    )
  }

  return (
    <div>
      <form onSubmit={submit} className="flex gap-2">
        <div className="relative flex-1">
          <FaTag className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="Coupon code"
            className="input-base w-full pl-8 uppercase"
          />
        </div>
        <button type="submit" disabled={busy || !code.trim()} className="btn-outline shrink-0 px-4">
          {busy ? '…' : 'Apply'}
        </button>
      </form>
      {msg && (
        <p className={`mt-1.5 text-xs font-medium ${msg.ok ? 'text-emerald-600' : 'text-red-500'}`}>
          {msg.text}
        </p>
      )}
    </div>
  )
}
