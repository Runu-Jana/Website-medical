import { useEffect, useState } from 'react'

function getRemaining(target) {
  const diff = new Date(target).getTime() - Date.now()
  if (isNaN(diff) || diff <= 0) return null
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  }
}

function Box({ value, label }) {
  return (
    <div className="flex flex-col items-center">
      <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-dark text-base font-bold text-white">
        {String(value).padStart(2, '0')}
      </span>
      <span className="mt-1 text-[10px] uppercase text-slate-500">{label}</span>
    </div>
  )
}

export default function CountdownTimer({ endsAt }) {
  const [remaining, setRemaining] = useState(() => getRemaining(endsAt))

  useEffect(() => {
    const t = setInterval(() => setRemaining(getRemaining(endsAt)), 1000)
    return () => clearInterval(t)
  }, [endsAt])

  if (!remaining) {
    return <span className="text-sm font-semibold text-red-500">Offer ended</span>
  }

  return (
    <div className="flex items-center gap-2">
      <Box value={remaining.days} label="Days" />
      <Box value={remaining.hours} label="Hrs" />
      <Box value={remaining.minutes} label="Min" />
      <Box value={remaining.seconds} label="Sec" />
    </div>
  )
}
