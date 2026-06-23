import { useEffect, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import api from '../lib/api'
import ProductGrid from '../components/ProductGrid'
import Pagination from '../components/Pagination'
import { FaTimes, FaFilter } from 'react-icons/fa'

const sortOptions = [
  { value: 'newest', label: 'Newest' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'rating', label: 'Top Rated' },
  { value: 'popular', label: 'Most Popular' },
]

export default function Shop() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [categories, setCategories] = useState([])
  const [brands, setBrands] = useState([])
  const [data, setData] = useState({ products: [], page: 1, pages: 1, total: 0 })
  const [loading, setLoading] = useState(true)
  const [showFilters, setShowFilters] = useState(false)

  const keyword = searchParams.get('keyword') || ''
  const category = searchParams.get('category') || ''
  const brand = searchParams.get('brand') || ''
  const sort = searchParams.get('sort') || 'newest'
  const page = Number(searchParams.get('page') || 1)
  const minPrice = searchParams.get('minPrice') || ''
  const maxPrice = searchParams.get('maxPrice') || ''
  const inStock = searchParams.get('inStock') === 'true'

  const [minInput, setMinInput] = useState(minPrice)
  const [maxInput, setMaxInput] = useState(maxPrice)

  useEffect(() => {
    setMinInput(minPrice)
    setMaxInput(maxPrice)
  }, [minPrice, maxPrice])

  useEffect(() => {
    Promise.all([api.get('/categories'), api.get('/brands')])
      .then(([c, b]) => {
        setCategories(Array.isArray(c.data) ? c.data : [])
        setBrands(Array.isArray(b.data) ? b.data : [])
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    let active = true
    setLoading(true)
    const params = { sort, page, limit: 12 }
    if (keyword) params.keyword = keyword
    if (category) params.category = category
    if (brand) params.brand = brand
    if (minPrice) params.minPrice = minPrice
    if (maxPrice) params.maxPrice = maxPrice
    if (searchParams.get('featured')) params.featured = true
    if (searchParams.get('bestseller')) params.bestseller = true
    if (searchParams.get('deal')) params.deal = true
    if (searchParams.get('isNew')) params.isNew = true

    api
      .get('/products', { params })
      .then(({ data: d }) => {
        if (!active) return
        let products = d.products || []
        if (inStock) products = products.filter((p) => p.countInStock > 0)
        setData({ ...d, products })
      })
      .catch(() => {
        if (active) setData({ products: [], page: 1, pages: 1, total: 0 })
      })
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams.toString()])

  const updateParam = (key, value) => {
    const next = new URLSearchParams(searchParams)
    if (value === '' || value === null || value === undefined || value === false) {
      next.delete(key)
    } else {
      next.set(key, value)
    }
    if (key !== 'page') next.delete('page')
    setSearchParams(next)
  }

  const applyPrice = () => {
    const next = new URLSearchParams(searchParams)
    if (minInput) next.set('minPrice', minInput)
    else next.delete('minPrice')
    if (maxInput) next.set('maxPrice', maxInput)
    else next.delete('maxPrice')
    next.delete('page')
    setSearchParams(next)
  }

  const clearAll = () => {
    const next = new URLSearchParams()
    if (keyword) next.set('keyword', keyword)
    setSearchParams(next)
  }

  const activeCatName = categories.find((c) => c._id === category)?.name

  return (
    <div className="container-x py-8">
      {/* breadcrumb */}
      <nav className="mb-4 text-sm text-slate-500">
        <Link to="/" className="hover:text-primary">Home</Link> / <span className="text-dark">Shop</span>
        {activeCatName && <> / <span className="text-dark">{activeCatName}</span></>}
        {keyword && <> / <span className="text-dark">"{keyword}"</span></>}
      </nav>

      <div className="flex gap-6">
        {/* Sidebar */}
        <aside
          className={`${
            showFilters ? 'fixed inset-0 z-50 overflow-y-auto bg-white p-5' : 'hidden'
          } w-full shrink-0 lg:static lg:block lg:w-72 lg:bg-transparent lg:p-0`}
        >
          <div className="lg:hidden mb-4 flex items-center justify-between">
            <h3 className="text-lg font-bold">Filters</h3>
            <button onClick={() => setShowFilters(false)}>
              <FaTimes size={20} />
            </button>
          </div>

          <div className="space-y-4">
            {/* Categories */}
            <div className="card p-5">
              <h4 className="mb-3 text-sm font-bold uppercase tracking-wide text-dark">
                Categories
              </h4>
              <ul className="space-y-1.5 text-sm">
                <li>
                  <button
                    onClick={() => updateParam('category', '')}
                    className={`hover:text-primary ${!category ? 'font-semibold text-primary' : 'text-slate-600'}`}
                  >
                    All Categories
                  </button>
                </li>
                {categories.map((c) => (
                  <li key={c._id} className="flex items-center justify-between">
                    <button
                      onClick={() => updateParam('category', c._id)}
                      className={`hover:text-primary ${
                        category === c._id ? 'font-semibold text-primary' : 'text-slate-600'
                      }`}
                    >
                      {c.name}
                    </button>
                    {c.productCount !== undefined && (
                      <span className="text-xs text-slate-400">{c.productCount}</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>

            {/* Brands */}
            {brands.length > 0 && (
              <div className="card p-5">
                <h4 className="mb-3 text-sm font-bold uppercase tracking-wide text-dark">
                  Brands
                </h4>
                <ul className="space-y-1.5 text-sm">
                  <li>
                    <button
                      onClick={() => updateParam('brand', '')}
                      className={`hover:text-primary ${!brand ? 'font-semibold text-primary' : 'text-slate-600'}`}
                    >
                      All Brands
                    </button>
                  </li>
                  {brands.map((b) => (
                    <li key={b._id}>
                      <button
                        onClick={() => updateParam('brand', b._id)}
                        className={`hover:text-primary ${
                          brand === b._id ? 'font-semibold text-primary' : 'text-slate-600'
                        }`}
                      >
                        {b.name}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Price */}
            <div className="card p-5">
              <h4 className="mb-3 text-sm font-bold uppercase tracking-wide text-dark">
                Price Range
              </h4>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  value={minInput}
                  onChange={(e) => setMinInput(e.target.value)}
                  placeholder="Min"
                  className="input-base px-3 py-2"
                />
                <span className="text-slate-400">-</span>
                <input
                  type="number"
                  min="0"
                  value={maxInput}
                  onChange={(e) => setMaxInput(e.target.value)}
                  placeholder="Max"
                  className="input-base px-3 py-2"
                />
              </div>
              <button onClick={applyPrice} className="btn-outline mt-3 w-full">
                Apply
              </button>
            </div>

            {/* In stock */}
            <div className="card p-5">
              <label className="flex cursor-pointer items-center gap-2 text-sm text-dark">
                <input
                  type="checkbox"
                  checked={inStock}
                  onChange={(e) => updateParam('inStock', e.target.checked ? 'true' : false)}
                  className="h-4 w-4 rounded border-bordergray text-primary"
                />
                In stock only
              </label>
            </div>

            <button onClick={clearAll} className="btn-outline w-full">
              Clear All Filters
            </button>
            {showFilters && (
              <button onClick={() => setShowFilters(false)} className="btn-primary w-full lg:hidden">
                Show Results
              </button>
            )}
          </div>
        </aside>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="card mb-5 flex flex-wrap items-center justify-between gap-3 p-4">
            <button
              onClick={() => setShowFilters(true)}
              className="btn-outline lg:hidden"
            >
              <FaFilter /> Filters
            </button>
            <p className="text-sm text-slate-600">
              <span className="font-semibold text-dark">{data.total}</span> products found
            </p>
            <div className="flex items-center gap-2">
              <label className="text-sm text-slate-500">Sort by:</label>
              <select
                value={sort}
                onChange={(e) => updateParam('sort', e.target.value)}
                className="input-base w-auto py-2"
              >
                {sortOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <ProductGrid products={data.products} loading={loading} />

          {!loading && (
            <Pagination
              page={data.page}
              pages={data.pages}
              onChange={(p) => updateParam('page', p)}
            />
          )}
        </div>
      </div>
    </div>
  )
}
