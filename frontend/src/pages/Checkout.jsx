import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../lib/api'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { formatPrice, imgFallback, PLACEHOLDER_IMG } from '../lib/helpers'
import AddressAutocomplete from '../components/AddressAutocomplete'
import { FaMoneyBillWave, FaCreditCard } from 'react-icons/fa'

const COD = { id: 'Cash on Delivery', label: 'Cash on Delivery', icon: FaMoneyBillWave }
const ONLINE = { id: 'Razorpay', label: 'Pay Online — UPI / Card / Netbanking', icon: FaCreditCard }

const loadRazorpay = () =>
  new Promise((resolve) => {
    if (window.Razorpay) return resolve(true)
    const s = document.createElement('script')
    s.src = 'https://checkout.razorpay.com/v1/checkout.js'
    s.onload = () => resolve(true)
    s.onerror = () => resolve(false)
    document.body.appendChild(s)
  })

export default function Checkout() {
  const navigate = useNavigate()
  const { items, totals, clearCart } = useCart()
  const { user } = useAuth()

  const [form, setForm] = useState({
    fullName: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    postalCode: '',
    country: '',
  })
  const [paymentMethod, setPaymentMethod] = useState('Cash on Delivery')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [payConfig, setPayConfig] = useState({ razorpay: false })

  useEffect(() => {
    api.get('/payments/config').then(({ data }) => setPayConfig(data || {})).catch(() => {})
  }, [])

  useEffect(() => {
    if (user) {
      setForm((f) => ({
        ...f,
        fullName: f.fullName || user.name || '',
        phone: f.phone || user.phone || '',
        address: f.address || user.address?.line1 || '',
        city: f.city || user.address?.city || '',
        state: f.state || user.address?.state || '',
        postalCode: f.postalCode || user.address?.postalCode || '',
        country: f.country || user.address?.country || '',
      }))
    }
  }, [user])

  useEffect(() => {
    if (items.length === 0) navigate('/cart')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const buildPayload = () => ({
    items: items.map((i) => ({
      product: i._id,
      name: i.name,
      image: i.thumbnail || '',
      price: i.price,
      qty: i.qty,
      gstPercent: i.gstPercent || 0,
      hsn: i.hsnCode || '',
    })),
    shippingAddress: { ...form },
    paymentMethod,
  })

  const payOnline = async (payload) => {
    // Create our order first, then the linked Razorpay order (enables webhook reconcile).
    const { data: order } = await api.post('/orders', payload)
    const { data: pay } = await api.post('/payments/order', {
      amount: totals.total,
      orderId: order._id,
    })
    const ok = await loadRazorpay()
    if (!ok) throw new Error('Could not load the payment window. Check your connection.')

    const rzp = new window.Razorpay({
      key: pay.keyId,
      order_id: pay.id,
      amount: pay.amount,
      currency: pay.currency,
      name: 'DBL Life Care',
      description: 'Order payment',
      prefill: { name: form.fullName, contact: form.phone },
      theme: { color: '#0e9f8e' },
      handler: async (resp) => {
        try {
          await api.post('/payments/verify', { ...resp, orderId: order._id })
          clearCart()
          navigate(`/order-success/${order._id}`, { state: { order } })
        } catch {
          setError('Payment could not be verified. If money was deducted, please contact support.')
          setSubmitting(false)
        }
      },
      modal: { ondismiss: () => setSubmitting(false) },
    })
    rzp.open()
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const payload = buildPayload()
      if (paymentMethod === 'Razorpay') {
        await payOnline(payload)
      } else {
        const { data } = await api.post('/orders', payload)
        clearCart()
        navigate(`/order-success/${data._id || data.id}`, { state: { order: data } })
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Could not place order. Please try again.')
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
                <label className="mb-1 block text-sm font-medium">Find your address</label>
                <AddressAutocomplete
                  onSelect={(a) =>
                    setForm((f) => ({
                      ...f,
                      address: a.line1 || f.address,
                      city: a.city || f.city,
                      state: a.state || f.state,
                      postalCode: a.postalCode || f.postalCode,
                      country: a.country || f.country,
                    }))
                  }
                />
                <p className="mt-1 text-xs text-slate-400">
                  Pick a suggestion to auto-fill address, city, postal code &amp; country.
                </p>
              </div>
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
              <div>
                <label className="mb-1 block text-sm font-medium">State</label>
                <input
                  name="state"
                  value={form.state}
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
              {[COD, ...(payConfig.razorpay ? [ONLINE] : [])].map((m) => (
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
              {totals.memberDiscount > 0 && (
                <div className="flex justify-between text-primary">
                  <dt className="font-medium">👑 Health Club discount</dt>
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
              <div className="flex justify-between border-t border-bordergray pt-2 text-base">
                <dt className="font-bold">Total</dt>
                <dd className="font-bold text-primary">{formatPrice(totals.total)}</dd>
              </div>
            </dl>

            {error && <p className="mt-4 text-sm text-red-500">{error}</p>}

            <button type="submit" disabled={submitting} className="btn-primary mt-5 w-full">
              {submitting
                ? 'Processing…'
                : paymentMethod === 'Razorpay'
                ? `Pay ${formatPrice(totals.total)}`
                : 'Place Order'}
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
