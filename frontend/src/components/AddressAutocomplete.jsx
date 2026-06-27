import { useEffect, useRef, useState } from 'react'
import { FaMapMarkerAlt, FaSpinner } from 'react-icons/fa'

// Free address autocomplete via Photon (OpenStreetMap) — no API key, CORS-enabled.
const buildLabel = (p = {}) =>
  [
    p.name,
    p.housenumber && p.street ? `${p.housenumber} ${p.street}` : p.street,
    p.city || p.district || p.town || p.village,
    p.state,
    p.postcode,
    p.country,
  ]
    .filter(Boolean)
    .filter((v, i, a) => a.indexOf(v) === i)
    .join(', ')

export default function AddressAutocomplete({ onSelect }) {
  const [q, setQ] = useState('')
  const [results, setResults] = useState([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const boxRef = useRef(null)
  const timer = useRef(null)

  useEffect(() => {
    const onClick = (e) => {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const search = (text) => {
    setQ(text)
    if (timer.current) clearTimeout(timer.current)
    if (text.trim().length < 3) {
      setResults([])
      setOpen(false)
      return
    }
    timer.current = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await fetch(
          `https://photon.komoot.io/api/?q=${encodeURIComponent(text)}&limit=6`
        )
        const data = await res.json()
        setResults(Array.isArray(data.features) ? data.features : [])
        setOpen(true)
      } catch {
        setResults([])
      } finally {
        setLoading(false)
      }
    }, 350)
  }

  const pick = (feature) => {
    const p = feature.properties || {}
    onSelect({
      line1: [p.housenumber, p.street].filter(Boolean).join(' ') || p.name || '',
      city: p.city || p.district || p.town || p.village || p.county || '',
      state: p.state || '',
      postalCode: p.postcode || '',
      country: p.country || '',
    })
    setQ(buildLabel(p))
    setOpen(false)
  }

  return (
    <div ref={boxRef} className="relative">
      <div className="relative">
        <FaMapMarkerAlt className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          value={q}
          onChange={(e) => search(e.target.value)}
          onFocus={() => results.length && setOpen(true)}
          placeholder="Search your address…"
          autoComplete="off"
          className="input-base pl-9"
        />
        {loading && (
          <FaSpinner className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-slate-400" />
        )}
      </div>
      {open && results.length > 0 && (
        <ul className="absolute z-50 mt-1 max-h-64 w-full overflow-y-auto rounded-xl border border-bordergray bg-white py-1 shadow-lift">
          {results.map((f, i) => (
            <li key={i}>
              <button
                type="button"
                onClick={() => pick(f)}
                className="flex w-full items-start gap-2 px-3 py-2 text-left text-sm hover:bg-lightbg"
              >
                <FaMapMarkerAlt className="mt-0.5 shrink-0 text-primary" size={13} />
                <span>{buildLabel(f.properties || {})}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
