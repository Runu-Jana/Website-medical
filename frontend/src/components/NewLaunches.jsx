import { useEffect, useState } from 'react'
import { FaRegCopy, FaCheck } from 'react-icons/fa'
import ProductCard from './ProductCard'

const COUPON = 'COUPON15'
// A fixed, far-future deadline so the offer always shows a live countdown.
const TARGET = '2027-12-31T23:59:59'

function getRemaining(target) {
  const diff = new Date(target).getTime() - Date.now()
  if (isNaN(diff) || diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 }
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  }
}

function TimeBox({ value, label }) {
  return (
    <div className="flex min-w-[3.25rem] flex-col items-center rounded-lg bg-white px-2 py-1.5">
      <span className="text-lg font-extrabold leading-none text-dark">
        {String(value).padStart(2, '0')}
      </span>
      <span className="mt-1 text-[10px] uppercase tracking-wide text-slate-400">{label}</span>
    </div>
  )
}

function PromoPanel() {
  const [remaining, setRemaining] = useState(() => getRemaining(TARGET))
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const t = setInterval(() => setRemaining(getRemaining(TARGET)), 1000)
    return () => clearInterval(t)
  }, [])

  const copyCoupon = async () => {
    try {
      await navigator.clipboard.writeText(COUPON)
    } catch {
      /* clipboard not available — ignore */
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }

  return (
    <div className="col-span-2 flex flex-col items-center justify-center rounded-2xl bg-[#dcf3e4] p-6 text-center sm:col-span-1">
      <p className="text-2xl font-semibold text-dark">
        Extra <span className="text-4xl font-extrabold">15%</span> off
      </p>
      <p className="mt-3 text-sm text-slate-600">
        For new member sign up
        <br />
        at the first time
      </p>
      <div className="mt-5 flex gap-2">
        <TimeBox value={remaining.days} label="Days" />
        <TimeBox value={remaining.hours} label="Hours" />
        <TimeBox value={remaining.minutes} label="Mins" />
        <TimeBox value={remaining.seconds} label="Secs" />
      </div>
      <p className="mt-4 text-xs text-slate-400">* Limited time offer</p>
      <button
        onClick={copyCoupon}
        className="mt-5 inline-flex items-center gap-2 rounded-xl bg-primaryDark px-6 py-3 text-sm font-bold uppercase tracking-wide text-white transition hover:opacity-90"
      >
        {copied ? <FaCheck /> : <FaRegCopy />}
        {copied ? 'Copied!' : COUPON}
      </button>
    </div>
  )
}

export default function NewLaunches({ products = [] }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
      <PromoPanel />
      {products.slice(0, 4).map((p) => (
        <ProductCard key={p._id} product={p} />
      ))}
    </div>
  )
}
