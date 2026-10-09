import { deliveryByLabel } from '../lib/helpers'

// Small "Get it by <date>" trust cue used on cards and the product page.
export default function DeliveryPromise({ className = '', days = 2 }) {
  return (
    <span className={`whitespace-nowrap text-[11px] font-medium text-emerald-700 ${className}`}>
      Get it by <span className="font-semibold">{deliveryByLabel(days)}</span>
    </span>
  )
}
