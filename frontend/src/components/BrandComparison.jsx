import { Link } from 'react-router-dom'
import { FaCartPlus, FaCheck } from 'react-icons/fa'
import { formatPrice, productImage, imgFallback } from '../lib/helpers'
import { useCart } from '../context/CartContext'

// "Same composition — compare & save": lists every brand/vendor selling the same
// salt, cheapest first, showing which vendor sells it and how much the customer
// saves versus the product they're currently viewing. The product being viewed
// is pinned in the list for reference and the lowest price is badged.
export default function BrandComparison({ current, substitutes = [] }) {
  const { addToCart } = useCart()
  if (!current) return null

  const seen = new Set()
  const rows = [current, ...substitutes]
    .filter((p) => p && p._id && !seen.has(p._id) && seen.add(p._id))
    .sort((a, b) => (a.price || 0) - (b.price || 0))

  if (rows.length < 2) return null // nothing to compare against

  const cheapestId = rows[0]._id
  const currentPrice = current.price || 0

  return (
    <div className="divide-y divide-bordergray overflow-hidden rounded-xl border border-bordergray">
      {rows.map((p) => {
        const isCurrent = p._id === current._id
        const isCheapest = p._id === cheapestId
        const save = currentPrice - (p.price || 0)
        const outOfStock = (p.countInStock || 0) <= 0
        return (
          <div key={p._id} className={`flex items-center gap-3 p-3 ${isCurrent ? 'bg-primary/5' : ''}`}>
            <Link
              to={`/product/${p.slug || p._id}`}
              className="h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-bordergray bg-white"
            >
              <img src={productImage(p)} onError={imgFallback} alt={p.name} className="h-full w-full object-cover" />
            </Link>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <Link
                  to={`/product/${p.slug || p._id}`}
                  className="truncate text-sm font-semibold text-dark hover:text-primary"
                >
                  {p.name}
                </Link>
                {isCurrent && (
                  <span className="rounded bg-slate-200 px-1.5 py-0.5 text-[10px] font-bold text-slate-600">Viewing</span>
                )}
                {isCheapest && !isCurrent && (
                  <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700">Lowest price</span>
                )}
              </div>
              <p className="truncate text-xs text-slate-500">
                {p.vendorName ? `Sold by ${p.vendorName}` : 'Sold by DBL Life Care'}
                {p.strength ? ` · ${p.strength}` : ''}
                {p.packSize ? ` · ${p.packSize}` : ''}
              </p>
            </div>

            <div className="shrink-0 text-right">
              <div className="flex items-baseline justify-end gap-1.5">
                <span className="text-sm font-bold text-dark">{formatPrice(p.price)}</span>
                {p.oldPrice > p.price && (
                  <span className="text-xs text-slate-400 line-through">{formatPrice(p.oldPrice)}</span>
                )}
              </div>
              {!isCurrent && save > 0 && (
                <p className="text-[11px] font-semibold text-emerald-600">Save {formatPrice(save)}</p>
              )}
              {!isCurrent && save < 0 && (
                <p className="text-[11px] text-slate-400">{formatPrice(-save)} more</p>
              )}
            </div>

            <div className="shrink-0">
              {isCurrent ? (
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-400" title="You're viewing this">
                  <FaCheck size={12} />
                </span>
              ) : (
                <button
                  onClick={() => addToCart(p)}
                  disabled={outOfStock}
                  aria-label={`Add ${p.name} to cart`}
                  title={outOfStock ? 'Out of stock' : 'Add to cart'}
                  className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white transition hover:bg-primaryDark disabled:opacity-50"
                >
                  <FaCartPlus size={13} />
                </button>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
