import { useState } from 'react'
import { FaMapMarkerAlt, FaLocationArrow, FaSearch, FaTimes, FaSpinner } from 'react-icons/fa'
import { useDeliveryLocation } from '../context/LocationContext'

// First-visit "Where do you want the delivery?" prompt. Two ways to set the
// delivery area — detect via the device GPS, or type a pincode. Both run
// entirely in the customer's browser (free, no API key), so they work the same
// on the website and inside the mobile app.
export default function DeliveryLocationModal() {
  const { promptOpen, closePrompt, saveLocation, location } = useDeliveryLocation()
  const [mode, setMode] = useState('choose') // 'choose' | 'manual'
  const [pin, setPin] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  if (!promptOpen) return null

  const reset = () => {
    setMode('choose')
    setPin('')
    setError('')
    setBusy(false)
  }
  const close = () => {
    reset()
    closePrompt()
  }

  // Detect the customer's area from the device location.
  const detect = () => {
    setError('')
    if (!('geolocation' in navigator)) {
      setError('Location is not available on this device. Please select manually.')
      setMode('manual')
      return
    }
    setBusy(true)
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const res = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${coords.latitude}&longitude=${coords.longitude}&localityLanguage=en`
          )
          const d = await res.json()
          const city = d.city || d.locality || d.principalSubdivision || 'Your area'
          saveLocation({ city, pincode: d.postcode || '', state: d.principalSubdivision || '', source: 'gps' })
          reset()
        } catch {
          setError('Could not detect your area. Please select manually.')
          setMode('manual')
        } finally {
          setBusy(false)
        }
      },
      () => {
        setBusy(false)
        setError('Location permission denied. Please select manually.')
        setMode('manual')
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }
    )
  }

  // Look up an Indian pincode → city/district (free India Post API).
  const applyPincode = async () => {
    const code = pin.trim()
    if (!/^\d{6}$/.test(code)) {
      setError('Please enter a valid 6-digit pincode.')
      return
    }
    setBusy(true)
    setError('')
    try {
      const res = await fetch(`https://api.postalpincode.in/pincode/${code}`)
      const d = await res.json()
      const po = d?.[0]?.PostOffice?.[0]
      if (!po) {
        setError('We couldn’t find that pincode. Please check and try again.')
        setBusy(false)
        return
      }
      saveLocation({ city: po.District, pincode: code, state: po.State, source: 'manual' })
      reset()
    } catch {
      setError('Could not look up that pincode. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-start justify-center px-4 pt-24 sm:items-center sm:pt-0">
      <div className="absolute inset-0 bg-black/40" onClick={close} />
      <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900">
        <button
          onClick={close}
          aria-label="Close"
          className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-lightbg hover:text-slate-600"
        >
          <FaTimes />
        </button>

        <div className="flex items-center gap-2 text-primary">
          <FaMapMarkerAlt />
          <span className="text-xs font-semibold uppercase tracking-wide">Delivery location</span>
        </div>
        <h2 className="mt-2 text-xl font-bold text-dark">Where do you want the delivery?</h2>
        <p className="mt-1 text-sm text-slate-500">
          Set your location to check product availability, offers and faster delivery.
        </p>

        {error && (
          <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700 dark:bg-amber-950/40">{error}</p>
        )}

        {mode === 'choose' ? (
          <div className="mt-5 space-y-3">
            <button
              onClick={detect}
              disabled={busy}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-primaryDark disabled:opacity-60"
            >
              {busy ? <FaSpinner className="animate-spin" /> : <FaLocationArrow />} Enable location
            </button>
            <button
              onClick={() => {
                setError('')
                setMode('manual')
              }}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-primary/40 px-5 py-3 text-sm font-bold text-primary transition hover:bg-primary/5"
            >
              <FaSearch /> Select manually
            </button>
          </div>
        ) : (
          <div className="mt-5">
            <label className="mb-1.5 block text-sm font-semibold text-dark">Enter your pincode</label>
            <div className="flex gap-2">
              <input
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                onKeyDown={(e) => e.key === 'Enter' && applyPincode()}
                inputMode="numeric"
                placeholder="e.g. 110001"
                autoFocus
                className="input-base flex-1"
              />
              <button
                onClick={applyPincode}
                disabled={busy}
                className="flex items-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-white transition hover:bg-primaryDark disabled:opacity-60"
              >
                {busy ? <FaSpinner className="animate-spin" /> : 'Apply'}
              </button>
            </div>
            <button
              onClick={() => {
                setError('')
                setMode('choose')
              }}
              className="mt-3 text-sm font-semibold text-slate-500 hover:text-primary"
            >
              ← Use my current location instead
            </button>
          </div>
        )}

        {location && (
          <button onClick={close} className="mt-4 block w-full text-center text-xs font-medium text-slate-400 hover:text-slate-600">
            Keep {location.city}
            {location.pincode ? `, ${location.pincode}` : ''}
          </button>
        )}
      </div>
    </div>
  )
}
