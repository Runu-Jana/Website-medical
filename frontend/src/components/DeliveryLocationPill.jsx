import { FaMapMarkerAlt, FaChevronDown } from 'react-icons/fa'
import { useDeliveryLocation } from '../context/LocationContext'

// Tappable "Deliver to …" chip. Shows the saved area and opens the location
// prompt so the customer can change it. Used in the navbar (desktop + mobile).
export default function DeliveryLocationPill({ className = '', compact = false }) {
  const { location, openPrompt } = useDeliveryLocation()

  return (
    <button
      type="button"
      onClick={openPrompt}
      title="Set delivery location"
      className={`flex items-center gap-2 text-left ${className}`}
    >
      <FaMapMarkerAlt className="shrink-0 text-primary" size={compact ? 15 : 20} />
      <span className="leading-tight">
        {!compact && <span className="block text-[11px] text-slate-500">Deliver to</span>}
        <span className="flex items-center gap-1">
          <span className={`block max-w-[10rem] truncate font-bold text-dark ${compact ? 'text-xs' : 'text-sm'}`}>
            {location ? `${location.city}${location.pincode ? `, ${location.pincode}` : ''}` : 'Select location'}
          </span>
          <FaChevronDown className="shrink-0 text-slate-400" size={compact ? 9 : 11} />
        </span>
      </span>
    </button>
  )
}
