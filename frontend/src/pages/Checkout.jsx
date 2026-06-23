import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../lib/api'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { formatPrice, imgFallback, PLACEHOLDER_IMG } from '../lib/helpers'
import { FaMoneyBillWave, FaCreditCard, FaMobileAlt } from 'react-icons/fa'

const paymentMethods = [
  { id: 'Cash on Delivery', label: 'Cash on Delivery', icon: FaMoneyBillWave },
  { id: 'Card', label: 'Credit / Debit Card', icon: FaCreditCard },
  { id: 'bKash', label: 'bKash', icon: FaMobileAlt },
]

export default function Checkout() {
  const navigate = useNavigate()
  const { items, totals, clearCart } = useCart()
  const { user } = useAuth()

  const [form, setForm] = useState({
    fullName: '',
    phone: '',
    address: '',
    city: '',
    postalCode: '',
    country: '',
  })
  const [paymentMethod, setPaymentMethod] = useState('Cash on Delivery')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (user) {
      setForm((f) => ({
        ...f,
        fullName: f.fullName || user.name || '',
        phone: f.phone || user.phone || '',
      }))
    }
  }, [user])

  useEffect(() => {
    if (items.length === 0) navigate('/cart')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const payload = {
        items: items.map((i) => ({
          product: i._id,
          name: i.name,
          image: i.thumbnail || '',
          price: i.price,
          qty: i.qty,
        })),
        shippingAddress: { ...form },
        paymentMethod,
      }
      const { data } = await api.post('/orders', payload)
      clearCart()
      const id = data._id || data.order?._id || data.id
      navigate(`/order-success/${id}`, { state: { order: data } })
    } catch (err) {
      setError(err.response?.data?.message || 'Could not place order. Please try again.')
      setSubmitting(false)
    }
  }

  if (items.length === 0) return null

  return (
    <div className="container-x py-8">
      <h1 className="mb-6 text-2xl font-bold">Checkout</h1>
      <form onSubmit={onSubmit} className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Shipping */}
          <div className="card p-6">
            <h3 className="mb-4 text-lg font-bold">Shipping Address</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm font-medium">Full Name</label>
                <input
                  name="fullName"
                  required
                  value={form.fullName}
                  onChange={onChange}
                  className="input-base"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Phone</label>
                <input
                  name="phone"
                  required
                  value={form.phone}
                  onChange={onChange}
                  className="input-base"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">City</label>
                <input
                  name="city"
                  required
                  value={form.city}
                  onChange={onChange}
                  className="input-base"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm font-medium">Address</label>
                <input
                  name="address"
                  required
                  value={form.address}
                  onChange={onChange}
                  className="input-base"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Postal Code</label>
                <input
                  name="postalCode"
                  required
                  value={form.postalCode}
                  onChange={onChange}
                  className="input-base"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Country</label>
                <input
                  name="country"
                  required
                  value={form.country}
                  onChange={onChange}
                  className="input-base"
                />
              </div>
            </div>
          </div>

          {/* Payment */}
          <div className="card p-6">
            <h3 className="mb-4 text-lg font-bold">Payment Method</h3>
            <div className="space-y-3">
              {paymentMethods.map((m) => (
                <label
                  key={m.id}
                  className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition ${
                    paymentMethod === m.id
                      ? 'border-primary bg-primary/5'
                      : 'border-bordergray hover:border-primary'
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    checked={paymentMethod === m.id}
                    onChange={() => setPaymentMethod(m.id)}
                    className="h-4 w-4 text-primary"
                  />
                  <m.icon className="text-primary" size={20} />
                  <span className="text-sm font-semibold">{m.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="lg:col-span-1">
          <div className="card sticky top-28 p-6">
            <h3 className="mb-4 text-lg font-bold">Your Order</h3>
            <ul className="mb-4 max-h-64 space-y-3 overflow-y-auto">
              {items.map((i) => (
                <li key={i._id} className="flex items-center gap-3">
                  <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-lightbg p-1">
                    <img
                      src={i.thumbnail || PLACEHOLDER_IMG}
                      onError={imgFallback}
                      alt={i.name}
                      className="h-full w-full object-contain"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-1 text-sm font-medium">{i.name}</p>
                    <p className="text-xs text-slate-400">
                      {i.qty} × {formatPrice(i.price)}
                    </p>
                  </div>
                  <span className="text-sm font-semibold">{formatPrice(i.price * i.qty)}</span>
                </li>
              ))}
            </ul>
            <dl className="space-y-2 border-t border-bordergray pt-4 text-sm">
              <div className="flex justify-between">
                <dt className="text-slate-500">Subtotal</dt>
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
              <div className="flex justify-between border-t border-bordergray pt-2 text-base">
                <dt className="font-bold">Total</dt>
                <dd className="font-bold text-primary">{formatPrice(totals.total)}</dd>
              </div>
            </dl>

            {error && <p className="mt-4 text-sm text-red-500">{error}</p>}

            <button type="submit" disabled={submitting} className="btn-primary mt-5 w-full">
              {submitting ? 'Placing Order...' : 'Place Order'}
            </button>
            <Link to="/cart" className="mt-3 block text-center text-sm text-slate-500 hover:text-primary">
              Back to Cart
            </Link>
          </div>
        </div>
      </form>
    </div>
  )
}
