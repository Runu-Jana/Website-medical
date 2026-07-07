import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { FaSearch } from 'react-icons/fa'
import api from '../lib/api'
import { imgFallback } from '../lib/helpers'

const TINTS = [
  'text-sky-600',
  'text-emerald-600',
  'text-rose-600',
  'text-violet-600',
  'text-amber-600',
  'text-indigo-600',
  'text-teal-600',
]

export default function Brands() {
  const [brands, setBrands] = useState([])
  const [loading, setLoading] = useState(true)
  const [keyword, setKeyword] = useState('')

  useEffect(() => {
    let active = true
    api
      .get('/brands')
      .then(({ data }) => active && setBrands(Array.isArray(data) ? data : []))
      .catch(() => active && setBrands([]))
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [])

  // Filter + group A–Z for a clean brand directory.
  const groups = useMemo(() => {
    const filtered = brands
      .filter((b) => b.name?.toLowerCase().includes(keyword.trim().toLowerCase()))
      .sort((a, b) => a.name.localeCompare(b.name))
    const map = {}
    filtered.forEach((b) => {
      const letter = /[a-z]/i.test(b.name?.[0]) ? b.name[0].toUpperCase() : '#'
      ;(map[letter] = map[letter] || []).push(b)
    })
    return Object.keys(map)
      .sort()
      .map((letter) => ({ letter, items: map[letter] }))
  }, [brands, keyword])

  const total = brands.length

  return (
    <div className="container-x py-8">
      {/* Header */}
      <div className="mb-6 overflow-hidden rounded-2xl bg-gradient-to-r from-primary to-primaryDark p-8 text-white sm:p-10">
        <p className="text-xs font-bold uppercase tracking-wider text-white/80">Shop by brand</p>
        <h1 className="mt-1 text-2xl font-extrabold sm:text-3xl">Featured Brands</h1>
        <p className="mt-2 max-w-lg text-sm text-white/90">
          Explore {total || 'our'} trusted healthcare & wellness brands — genuine products,
          delivered to your door.
        </p>
      </div>

      {/* Search */}
      <div className="mx-auto mb-8 max-w-md">
        <div className="flex items-center rounded-xl border border-bordergray bg-white focus-within:border-primary">
          <span className="pl-4 text-slate-400">
            <FaSearch />
          </span>
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="Search brands..."
            className="w-full bg-transparent px-3 py-2.5 text-sm outline-none"
          />
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-3 gap-4 sm:grid-cols-4 lg:grid-cols-6">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-2">
              <div className="h-24 w-24 animate-pulse rounded-full bg-slate-200" />
              <div className="h-3 w-16 animate-pulse rounded bg-slate-200" />
            </div>
          ))}
        </div>
      ) : groups.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-16 text-center">
          <p className="text-sm text-slate-500">No brands found.</p>
        </div>
      ) : (
        <div className="space-y-10">
          {groups.map(({ letter, items }) => (
            <div key={letter}>
              <h2 className="mb-4 border-b border-bordergray pb-2 text-lg font-extrabold text-dark">
                {letter}
              </h2>
              <div className="grid grid-cols-3 gap-4 sm:grid-cols-4 lg:grid-cols-6">
                {items.map((b, i) => (
                  <Link
                    key={b._id}
                    to={`/shop?brand=${b._id}`}
                    className="group flex flex-col items-center gap-2 text-center"
                    title={b.name}
                  >
                    <span className="flex h-24 w-24 items-center justify-center rounded-full border border-bordergray bg-white p-4 shadow-card transition duration-300 group-hover:-translate-y-1 group-hover:border-primary group-hover:shadow-lift sm:h-28 sm:w-28">
                      {b.logo ? (
                        <img
                          src={b.logo}
                          onError={imgFallback}
                          alt={b.name}
                          className="max-h-full max-w-full object-contain"
                        />
                      ) : (
                        <span className={`text-lg font-extrabold ${TINTS[i % TINTS.length]}`}>
                          {b.name}
                        </span>
                      )}
                    </span>
                    <span className="line-clamp-1 text-xs font-medium text-slate-600 group-hover:text-primary">
                      {b.name}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
