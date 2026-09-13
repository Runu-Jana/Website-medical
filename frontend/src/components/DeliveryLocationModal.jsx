import { useEffect, useState } from 'react'
import { FaMapMarkerAlt, FaLocationArrow, FaSearch, FaTimes, FaSpinner } from 'react-icons/fa'
import { useDeliveryLocation } from '../context/LocationContext'

// Most frequent { city, state } wins — used to order a shared pincode's areas so
// the district it mostly belongs to (e.g. Chandigarh for 160014) comes first
// instead of an alphabetically-first outlier (Rupnagar).
function pickMajority(rows) {
  const counts = new Map()
  for (const r of rows) {
    if (!r.city) continue
    const key = `${r.city}|${r.state || ''}`
    counts.set(key, (counts.get(key) || 0) + 1)
  }
  let bestKey = null
  let bestN = 0
  for (const [key, n] of counts) {
    if (n > bestN) {
      bestN = n
      bestKey = key
    }
  }
  if (!bestKey) return null
  const [city, state] = bestKey.split('|')
  return { city, state }
}

// "Sector 14 (Chandigarh)" → "Sector 14" for a tidy label.
const cleanArea = (name) => String(name || '').replace(/\s*\(.*?\)\s*$/, '').trim()

// Resolve a 6-digit pincode to a list of selectable areas.
// Returns [] when the pincode is unknown, or null on a network error.
async function lookupAreas(code) {
  try {
    // 1) India Post — richest data (a district per post office).
    const res = await fetch(`https://api.postalpincode.in/pincode/${code}`)
    const d = await res.json()
    const offices = d?.[0]?.PostOffice || []
    if (offices.length) {
      const seen = new Set()
      const opts = []
      for (const o of offices) {
        const key = `${o.Name}|${o.District}`
        if (seen.has(key)) continue
        seen.add(key)
        opts.push({ area: cleanArea(o.Name) || o.Name, city: o.District, state: o.State })
      }
      // Majority-district areas first (Chandigarh before Rupnagar for 160014).
      const maj = pickMajority(offices.map((o) => ({ city: o.District, state: o.State })))
      opts.sort((a, b) => {
        if (maj) {
          const am = a.city === maj.city ? 0 : 1
          const bm = b.city === maj.city ? 0 : 1
          if (am !== bm) return am - bm
        }
        return a.area.localeCompare(b.area)
      })
      return opts
    }

    // 2) Fallback — Zippopotam covers pincodes India Post is missing (e.g. 160016).
    const zres = await fetch(`https://api.zippopotam.us/in/${code}`)
    if (zres.ok) {
      const z = await zres.json()
      const seen = new Set()
      const opts = []
      for (const p of z?.places || []) {
        const nm = p['place name']
        if (!nm || seen.has(nm)) continue
        seen.add(nm)
        opts.push({ area: cleanArea(nm) || nm, city: p.state, state: p.state })
      }
      return opts
    }
    return []
  } catch {
    return null
  }
}

// First-visit "Where do you want the delivery?" prompt. Two ways to set the
// delivery area — detect via the device GPS, or type a pincode and pick the exact
// area. Both run entirely in the customer's browser (free, no API key), so they
// work the same on the website and inside the mobile app.
export default function DeliveryLocationModal() {
  const { promptOpen, closePrompt, saveLocation, location } = useDeliveryLocation()
  const [mode, setMode] = useState('choose') // 'choose' | 'manual'
  const [pin, setPin] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [options, setOptions] = useState([])

  // As soon as a full 6-digit pincode is entered, suggest its areas (debounced).
  useEffect(() => {
    if (mode !== 'manual') return
    if (pin.length !== 6) {
      setOptions([])
      setError('')
      return
    }
    let cancelled = false
    setBusy(true)
    setError('')
    setOptions([])
    const t = setTimeout(async () => {
      const opts = await lookupAreas(pin)
      if (cancelled) return
      setBusy(false)
      if (opts === null) {
        setError('Could not look up that pincode. Please try again.')
      } else if (opts.length === 0) {
        setError('We couldn’t find that pincode. Please check and try again.')
      } else {
        setOptions(opts)
      }
    }, 350)
    return () => {
      cancelled = true
      clearTimeout(t)
    }
  }, [pin, mode])

  if (!promptOpen) return null

  const reset = () => {
    setMode('choose')
    setPin('')
    setError('')
    setBusy(false)
    setOptions([])
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
          saveLocation({
            city,
            area: d.locality || '',
            pincode: d.postcode || '',
            state: d.principalSubdivision || '',
            source: 'gps',
          })
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

  // Customer taps their exact area from the suggested list.
  const choose = (opt) => {
    saveLocation({ city: opt.city, area: opt.area, pincode: pin, state: opt.state, source: 'manual' })
    reset()
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
            <input
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
              inputMode="numeric"
              placeholder="e.g. 160014"
              autoFocus
              className="input-base w-full"
            />

            {busy && (
              <p className="mt-3 flex items-center gap-2 text-sm text-slate-500">
                <FaSpinner className="animate-spin" /> Finding areas for {pin}…
              </p>
            )}

            {!busy && pin.length > 0 && pin.length < 6 && (
              <p className="mt-2 text-xs text-slate-400">Enter all 6 digits to see areas.</p>
            )}

            {!busy && options.length > 0 && (
              <div className="mt-3">
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">Select your area</p>
                <ul className="max-h-56 divide-y divide-slate-100 overflow-y-auto rounded-xl border border-slate-200 dark:divide-slate-800 dark:border-slate-700">
                  {options.map((o, i) => (
                    <li key={`${o.area}-${o.city}-${i}`}>
                      <button
                        onClick={() => choose(o)}
                        className="flex w-full items-start gap-2 px-3 py-2.5 text-left transition hover:bg-primary/5"
                      >
                        <FaMapMarkerAlt className="mt-0.5 shrink-0 text-primary/70" size={13} />
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-semibold text-dark">{o.area}</span>
                          <span className="block truncate text-xs text-slate-500">
                            {o.city}
                            {o.state && o.state !== o.city ? `, ${o.state}` : ''} · {pin}
                          </span>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <button
              onClick={() => {
                setError('')
                setPin('')
                setOptions([])
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
            Keep {location.area || location.city}
            {location.pincode ? `, ${location.pincode}` : ''}
          </button>
        )}
      </div>
    </div>
  )
}
