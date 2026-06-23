import { FaMinus, FaPlus } from 'react-icons/fa'

export default function QuantitySelector({ qty, setQty, max = 99 }) {
  const dec = () => setQty(Math.max(1, qty - 1))
  const inc = () => setQty(Math.min(max, qty + 1))
  return (
    <div className="inline-flex items-center rounded-xl border border-bordergray">
      <button
        type="button"
        onClick={dec}
        className="flex h-10 w-10 items-center justify-center text-slate-600 hover:text-primary"
        aria-label="Decrease quantity"
      >
        <FaMinus size={12} />
      </button>
      <span className="w-10 text-center text-sm font-semibold">{qty}</span>
      <button
        type="button"
        onClick={inc}
        className="flex h-10 w-10 items-center justify-center text-slate-600 hover:text-primary"
        aria-label="Increase quantity"
      >
        <FaPlus size={12} />
      </button>
    </div>
  )
}
