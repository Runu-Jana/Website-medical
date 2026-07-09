import { Link, useNavigate } from 'react-router-dom'
import { FaTrashAlt, FaArrowLeft, FaShoppingCart } from 'react-icons/fa'
import { useCart } from '../context/CartContext'
import QuantitySelector from '../components/QuantitySelector'
import CartMilestone from '../components/CartMilestone'
import { formatPrice, imgFallback, PLACEHOLDER_IMG } from '../lib/helpers'

export default function Cart() {
  const navigate = useNavigate()
  const { items, updateQty, removeFromCart, totals } = useCart()

  // Total saved vs MRP across the cart.
  const totalSavings = items.reduce(
    (sum, i) => sum + (i.oldPrice > i.price ? (i.oldPrice - i.price) * i.qty : 0),
    0
  )

  if (items.length === 0) {
    return (
      <div className="container-x py-20 text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-primary">
          <FaShoppingCart size={32} />
        </div>
        <h2 className="mt-6 text-2xl font-bold">Your cart is empty</h2>
        <p className="mt-2 text-sm text-slate-500">
          Looks like you haven't added anything yet.
        </p>
        <Link to="/shop" className="btn-primary mt-6">
          Continue Shopping
        </Link>
      </div>
    )
  }

  return (
    <div className="container-x py-8">
      <h1 className="mb-6 text-2xl font-bold">Shopping Cart</h1>

      {/* Free-delivery / free-gift progress */}
      <div className="mb-6">
        <CartMilestone subtotal={totals.subtotal} isMember={totals.isMember} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Items */}
        <div className="space-y-3 lg:col-span-2">
          {items.map((item) => (
            <div key={item._id} className="card flex items-center gap-4 p-4">
              <Link
                to={`/product/${item._id}`}
                className="h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-lightbg p-1.5"
              >
                <img
                  src={item.thumbnail || PLACEHOLDER_IMG}
                  onError={imgFallback}
                  alt={item.name}
                  className="h-full w-full object-contain"
                />
              </Link>
              <div className="min-w-0 flex-1">
                <Link
                  to={`/product/${item._id}`}
                  className="line-clamp-2 text-sm font-semibold text-dark hover:text-primary"
                >
                  {item.name}
                </Link>
                <p className="mt-1 flex items-center gap-2 text-sm">
                  <span className="font-semibold text-primary">{formatPrice(item.price)}</span>
                  {item.oldPrice > item.price && (
                    <span className="text-xs text-slate-400 line-through">
                      {formatPrice(item.oldPrice)}
                    </span>
                  )}
                </p>
                {item.unit && <p className="text-xs text-slate-400">per {item.unit}</p>}
              </div>
              <div className="flex flex-col items-end gap-2">
                <QuantitySelector
                  qty={item.qty}
                  setQty={(q) => updateQty(item._id, q)}
                  max={item.countInStock || 99}
                />
                <span className="text-sm font-bold text-dark">
                  {formatPrice(item.price * item.qty)}
                </span>
              </div>
              <button
                onClick={() => removeFromCart(item._id)}
                className="ml-2 p-2 text-slate-400 hover:text-red-500"
                aria-label="Remove"
              >
                <FaTrashAlt />
              </button>
            </div>
          ))}
          <Link to="/shop" className="inline-flex items-center gap-2 text-sm font-semibold text-primary">
            <FaArrowLeft /> Continue Shopping
          </Link>
        </div>

        {/* Summary */}
        <div className="lg:col-span-1">
          <div className="card sticky top-28 p-6">
            <h3 className="mb-4 text-lg font-bold">Order Summary</h3>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-slate-500">Items Price</dt>
                <dd className="font-semibold">{formatPrice(totals.subtotal)}</dd>
              </div>
              {totals.memberDiscount > 0 && (
                <div className="flex justify-between text-primary">
                  <dt className="flex items-center gap-1 font-medium">
                    👑 Health Club discount
                  </dt>
                  <dd className="font-semibold">−{formatPrice(totals.memberDiscount)}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-slate-500">
                  Shipping{totals.isMember && totals.shipping === 0 ? ' (Member)' : ''}
                </dt>
                <dd className="font-semibold">
                  {totals.shipping === 0 ? (
                    <span className="text-accent">Free</span>
                  ) : (
                    formatPrice(totals.shipping)
                  )}
                </dd>
              </div>
              {totals.shipping > 0 && (
                <p className="text-xs text-slate-400">
                  Add {formatPrice(1000 - totals.subtotal)} more for free shipping.
                </p>
              )}
              <div className="flex justify-between border-t border-bordergray pt-3 text-base">
                <dt className="font-bold">Total</dt>
                <dd className="font-bold text-primary">{formatPrice(totals.total)}</dd>
              </div>
            </dl>
            {totalSavings > 0 && (
              <div className="mt-4 rounded-xl bg-emerald-50 px-4 py-2.5 text-center text-sm font-bold text-emerald-700">
                🎉 You'll save {formatPrice(totalSavings)} on this order
              </div>
            )}
            {!totals.isMember && (
              <Link
                to="/health-club"
                className="mt-4 flex items-center justify-between gap-2 rounded-xl border border-primary/30 bg-primary/5 px-4 py-2.5 text-xs font-semibold text-primary hover:bg-primary/10"
              >
                <span>👑 Join the Health Club for FREE delivery + 5% off</span>
                <span className="shrink-0">→</span>
              </Link>
            )}
            <button onClick={() => navigate('/checkout')} className="btn-primary mt-5 w-full">
              Proceed to Checkout
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
