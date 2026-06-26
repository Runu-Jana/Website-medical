import { useEffect, useState } from 'react'
import { FaRegCopy, FaCheck } from 'react-icons/fa'
import ProductCard from './ProductCard'

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
    <div className="flex min-w-0 flex-1 flex-col items-center rounded-lg bg-white px-1 py-1.5">
      <span className="text-base font-extrabold leading-none text-dark sm:text-lg">
        {String(value).padStart(2, '0')}
      </span>
      <span className="mt-1 text-[9px] uppercase tracking-wide text-slate-400">{label}</span>
    </div>
  )
}

function PromoPanel({
  discount = '15%',
  subtitle = 'For new member sign up\nat the first time',
  coupon = 'COUPON15',
  bg = 'bg-[#dcf3e4]',
}) {
  const [remaining, setRemaining] = useState(() => getRemaining(TARGET))
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const t = setInterval(() => setRemaining(getRemaining(TARGET)), 1000)
    return () => clearInterval(t)
  }, [])

  const copyCoupon = async () => {
    try {
      await navigator.clipboard.writeText(coupon)
    } catch {
      /* clipboard not available — ignore */
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }

  return (
    <div
      className={`col-span-2 flex flex-col items-center justify-center rounded-2xl p-5 text-center sm:col-span-1 ${bg}`}
    >
      <p className="text-2xl font-semibold text-dark">
        Extra <span className="text-4xl font-extrabold">{discount}</span> off
      </p>
      <p className="mt-3 whitespace-pre-line text-sm text-slate-600">{subtitle}</p>
      <div className="mt-5 flex w-full gap-1.5">
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
        {copied ? 'Copied!' : coupon}
      </button>
    </div>
  )
}

export default function NewLaunches({ products = [], offer = {} }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
      <PromoPanel {...offer} />
      {products.slice(0, 4).map((p) => (
        <ProductCard key={p._id} product={p} />
      ))}
    </div>
  )
}
