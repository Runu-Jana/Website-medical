import {
  FaCheckCircle,
  FaShippingFast,
  FaLock,
  FaHeadset,
  FaCertificate,
} from 'react-icons/fa'

const items = [
  { icon: FaCheckCircle, label: 'Genuine Medicines', color: 'bg-emerald-50 text-emerald-600' },
  { icon: FaShippingFast, label: 'Fast Delivery', color: 'bg-sky-50 text-sky-600' },
  { icon: FaLock, label: 'Secure Payments', color: 'bg-indigo-50 text-indigo-600' },
  { icon: FaHeadset, label: '24×7 Support', color: 'bg-amber-50 text-amber-600' },
  { icon: FaCertificate, label: 'Licensed Pharmacy', color: 'bg-rose-50 text-rose-600' },
]

export default function TrustBar() {
  return (
    <div className="container-x mt-6">
      <div className="card px-3 py-5 sm:px-6">
        <ul className="flex gap-4 overflow-x-auto py-1.5 sm:justify-around sm:gap-6 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {items.map((it) => (
            <li
              key={it.label}
              className="flex min-w-[84px] flex-col items-center gap-2 text-center sm:min-w-0"
            >
              <span
                className={`flex h-14 w-14 items-center justify-center rounded-full text-2xl ring-4 ring-white dark:ring-slate-800 ${it.color}`}
              >
                <it.icon />
              </span>
              <span className="text-xs font-semibold text-dark sm:text-sm">{it.label}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
