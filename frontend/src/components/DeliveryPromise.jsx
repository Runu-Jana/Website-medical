import { FaTruck } from 'react-icons/fa'
import { deliveryByLabel } from '../lib/helpers'

// Small "Get it by <date>" trust cue used on cards and the product page.
export default function DeliveryPromise({ className = '', days = 2 }) {
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 ${className}`}>
      <FaTruck size={12} className="text-emerald-600" />
      Get it by <span className="font-semibold">{deliveryByLabel(days)}</span>
    </span>
  )
}
