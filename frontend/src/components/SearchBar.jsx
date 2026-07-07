import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FaSearch, FaSpinner } from 'react-icons/fa'
import api from '../lib/api'
import { productImage, formatPrice, imgFallback } from '../lib/helpers'

// Rotating placeholder suggestions (1mg-style animated hint).
const HINTS = [
  'medicines',
  'Dolo 650',
  'vitamins & supplements',
  'blood pressure monitor',
  'lab tests',
  'baby care',
  'diabetes care',
]

export default function SearchBar({ variant = 'desktop', onNavigate }) {
  const navigate = useNavigate()
  const [keyword, setKeyword] = useState('')
  const [results, setResults] = useState([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [active, setActive] = useState(-1)
  const [hint, setHint] = useState(0)
  const boxRef = useRef(null)
  const timer = useRef(null)

  // Rotate the placeholder hint while the field is empty.
  useEffect(() => {
    if (keyword) return
    const t = setInterval(() => setHint((h) => (h + 1) % HINTS.length), 2500)
    return () => clearInterval(t)
  }, [keyword])

  // Debounced live product search.
  useEffect(() => {
    const q = keyword.trim()
    clearTimeout(timer.current)
    if (q.length < 2) {
      setResults([])
      setLoading(false)
      return
    }
    setLoading(true)
    timer.current = setTimeout(() => {
      api
        .get('/products', { params: { keyword: q, limit: 6 } })
        .then(({ data }) => setResults(data.products || []))
        .catch(() => setResults([]))
        .finally(() => setLoading(false))
    }, 250)
    return () => clearTimeout(timer.current)
  }, [keyword])

  // Close on outside click.
  useEffect(() => {
    const onClick = (e) => {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const go = (to) => {
    setOpen(false)
    setActive(-1)
    onNavigate?.()
    navigate(to)
  }
  const submit = (e) => {
    e.preventDefault()
    if (active >= 0 && results[active]) return pickProduct(results[active])
    const q = keyword.trim()
    if (q) go(`/shop?keyword=${encodeURIComponent(q)}`)
  }
  const pickProduct = (p) => go(`/product/${p.slug || p._id}`)

  const onKeyDown = (e) => {
    if (!open || results.length === 0) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((i) => Math.min(results.length - 1, i + 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((i) => Math.max(-1, i - 1))
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  const showDropdown = open && keyword.trim().length >= 2

  return (
    <div ref={boxRef} className="relative w-full">
      <form onSubmit={submit}>
        <div
          className={`flex items-center rounded-xl border border-bordergray bg-white focus-within:border-primary ${
            variant === 'mobile' ? '' : ''
          }`}
        >
          <input
            value={keyword}
            onChange={(e) => {
              setKeyword(e.target.value)
              setOpen(true)
              setActive(-1)
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={onKeyDown}
            placeholder={`Search for ${HINTS[hint]}...`}
            className="w-full rounded-l-xl bg-transparent px-4 py-2.5 text-sm outline-none"
          />
          <button
            type="submit"
            className={
              variant === 'mobile'
                ? 'px-4 text-primary'
                : 'flex h-11 items-center gap-2 rounded-r-xl bg-primary px-5 text-sm font-semibold text-white hover:bg-primaryDark'
            }
          >
            <FaSearch /> {variant !== 'mobile' && <span className="hidden lg:inline">Search</span>}
          </button>
        </div>
      </form>

      {showDropdown && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-xl border border-bordergray bg-white shadow-lift">
          {loading && results.length === 0 ? (
            <div className="flex items-center gap-2 px-4 py-4 text-sm text-slate-500">
              <FaSpinner className="animate-spin" /> Searching…
            </div>
          ) : results.length === 0 ? (
            <button
              type="button"
              onClick={() => go(`/shop?keyword=${encodeURIComponent(keyword.trim())}`)}
              className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm text-slate-600 hover:bg-lightbg"
            >
              <FaSearch className="text-primary" /> Search for{' '}
              <span className="font-semibold text-dark">“{keyword.trim()}”</span>
            </button>
          ) : (
            <>
              <ul className="max-h-[22rem] overflow-y-auto">
                {results.map((p, i) => (
                  <li key={p._id}>
                    <button
                      type="button"
                      onMouseEnter={() => setActive(i)}
                      onClick={() => pickProduct(p)}
                      className={`flex w-full items-center gap-3 px-3 py-2.5 text-left transition ${
                        active === i ? 'bg-lightbg' : 'hover:bg-lightbg'
                      }`}
                    >
                      <img
                        src={productImage(p)}
                        onError={imgFallback}
                        alt=""
                        className="h-10 w-10 shrink-0 rounded-lg border border-bordergray object-cover"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-dark">{p.name}</span>
                        <span className="block text-xs text-slate-500">{formatPrice(p.price)}</span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={() => go(`/shop?keyword=${encodeURIComponent(keyword.trim())}`)}
                className="flex w-full items-center gap-2 border-t border-bordergray px-4 py-2.5 text-left text-sm font-semibold text-primary hover:bg-lightbg"
              >
                <FaSearch /> View all results for “{keyword.trim()}”
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}
