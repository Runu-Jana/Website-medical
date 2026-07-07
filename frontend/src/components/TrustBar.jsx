import {
  FaCheckCircle,
  FaShippingFast,
  FaLock,
  FaHeadset,
  FaCertificate,
} from 'react-icons/fa'

const items = [
  { icon: FaCheckCircle, label: 'Genuine Medicines' },
  { icon: FaShippingFast, label: 'Fast Delivery' },
  { icon: FaLock, label: 'Secure Payments' },
  { icon: FaHeadset, label: '24×7 Support' },
  { icon: FaCertificate, label: 'Licensed Pharmacy' },
]

export default function TrustBar() {
  return (
    <div className="border-b border-bordergray bg-white">
      <div className="container-x">
        {/* Horizontal scroll on small screens, spread evenly on larger ones */}
        <ul className="flex snap-x gap-3 overflow-x-auto py-3 sm:justify-between sm:gap-4 sm:overflow-visible sm:py-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {items.map((it) => (
            <li
              key={it.label}
              className="flex shrink-0 snap-start items-center gap-2 rounded-xl bg-primary/5 px-3 py-2 sm:bg-transparent sm:px-0 sm:py-0"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <it.icon size={15} />
              </span>
              <span className="whitespace-nowrap text-xs font-semibold text-dark sm:text-sm">
                {it.label}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
