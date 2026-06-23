import { Link, useNavigate } from 'react-router-dom'
import { FaTrashAlt, FaArrowLeft, FaShoppingCart } from 'react-icons/fa'
import { useCart } from '../context/CartContext'
import QuantitySelector from '../components/QuantitySelector'
import { formatPrice, imgFallback, PLACEHOLDER_IMG } from '../lib/helpers'

export default function Cart() {
  const navigate = useNavigate()
  const { items, updateQty, removeFromCart, totals } = useCart()

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
                <p className="mt-1 text-sm text-primary">{formatPrice(item.price)}</p>
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
              <div className="flex justify-between">
                <dt className="text-slate-500">Shipping</dt>
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
            <button onClick={() => navigate('/checkout')} className="btn-primary mt-5 w-full">
              Proceed to Checkout
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
