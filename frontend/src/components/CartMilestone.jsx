import { FaTruck, FaGift } from 'react-icons/fa'
import { formatPrice, FREE_SHIPPING_THRESHOLD, FREE_GIFT_THRESHOLD } from '../lib/helpers'

// Progress bar toward free delivery (₹1000) and a free gift (₹1500).
export default function CartMilestone({ subtotal, isMember }) {
  const shipUnlocked = isMember || subtotal >= FREE_SHIPPING_THRESHOLD
  const giftUnlocked = subtotal >= FREE_GIFT_THRESHOLD
  const toShip = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal)
  const toGift = Math.max(0, FREE_GIFT_THRESHOLD - subtotal)

  const pct = Math.min(100, (subtotal / FREE_GIFT_THRESHOLD) * 100)
  const shipMarkerPct = (FREE_SHIPPING_THRESHOLD / FREE_GIFT_THRESHOLD) * 100

  let message
  if (giftUnlocked) {
    message = (
      <span className="font-semibold text-emerald-700">
        🎁 Congratulations! You've unlocked <b>FREE delivery + a FREE gift!</b>
      </span>
    )
  } else if (shipUnlocked) {
    message = (
      <span className="text-slate-700">
        🎉 {isMember ? 'You get' : "You've unlocked"} <b className="text-emerald-700">FREE delivery!</b>{' '}
        Add <b className="text-primary">{formatPrice(toGift)}</b> more to get a <b>FREE gift</b> 🎁
      </span>
    )
  } else {
    message = (
      <span className="text-slate-700">
        Add <b className="text-primary">{formatPrice(toShip)}</b> more to unlock{' '}
        <b className="text-emerald-700">FREE delivery</b> 🚚
      </span>
    )
  }

  return (
    <div className="card p-4">
      <p className="mb-3 text-sm">{message}</p>

      {/* Progress bar with two milestone markers */}
      <div className="relative">
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-gradient-to-r from-primary to-emerald-500 transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>

        {/* Free delivery marker */}
        <Marker
          leftPct={shipMarkerPct}
          reached={shipUnlocked}
          icon={<FaTruck size={11} />}
          label="Free delivery"
        />
        {/* Free gift marker (at the end) */}
        <Marker
          leftPct={100}
          reached={giftUnlocked}
          icon={<FaGift size={11} />}
          label="Free gift"
          alignEnd
        />
      </div>
      <div className="mt-6" />
    </div>
  )
}

function Marker({ leftPct, reached, icon, label, alignEnd }) {
  return (
    <div
      className="absolute top-1/2 -translate-y-1/2"
      style={{ left: `${leftPct}%`, transform: 'translate(-50%, -50%)' }}
    >
      <span
        className={`flex h-6 w-6 items-center justify-center rounded-full ring-2 ring-white ${
          reached ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-400'
        }`}
      >
        {icon}
      </span>
      <span
        className={`absolute top-7 whitespace-nowrap text-[10px] font-semibold ${
          reached ? 'text-emerald-600' : 'text-slate-400'
        } ${alignEnd ? 'right-0' : 'left-1/2 -translate-x-1/2'}`}
      >
        {label}
      </span>
    </div>
  )
}
