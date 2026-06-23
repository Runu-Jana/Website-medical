import { useEffect, useState } from 'react'
import { useParams, useLocation, Link } from 'react-router-dom'
import api from '../lib/api'
import Spinner from '../components/Spinner'
import { formatPrice } from '../lib/helpers'
import { FaCheckCircle } from 'react-icons/fa'

export default function OrderSuccess() {
  const { id } = useParams()
  const location = useLocation()
  const [order, setOrder] = useState(location.state?.order || null)
  const [loading, setLoading] = useState(!order)

  useEffect(() => {
    if (order) return
    let active = true
    api
      .get(`/orders/${id}`)
      .then(({ data }) => active && setOrder(data))
      .catch(() => {})
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [id, order])

  if (loading) return <Spinner className="py-32" />

  const items = order?.items || order?.orderItems || []
  const total = order?.totalPrice ?? order?.total
  const shipping = order?.shippingPrice ?? order?.shipping

  return (
    <div className="container-x py-12">
      <div className="mx-auto max-w-2xl text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-accent/10 text-accent">
          <FaCheckCircle size={40} />
        </div>
        <h1 className="mt-6 text-3xl font-bold">Order Placed Successfully!</h1>
        <p className="mt-2 text-sm text-slate-500">
          Thank you for your purchase. Your order has been received.
        </p>
        <p className="mt-1 text-sm">
          Order Number:{' '}
          <span className="font-bold text-primary">#{order?._id || id}</span>
        </p>
      </div>

      {items.length > 0 && (
        <div className="card mx-auto mt-8 max-w-2xl p-6 text-left">
          <h3 className="mb-4 text-lg font-bold">Order Summary</h3>
          <ul className="divide-y divide-bordergray">
            {items.map((i, idx) => (
              <li key={idx} className="flex items-center justify-between py-3 text-sm">
                <span className="font-medium">
                  {i.name} <span className="text-slate-400">× {i.qty}</span>
                </span>
                <span className="font-semibold">{formatPrice(i.price * i.qty)}</span>
              </li>
            ))}
          </ul>
          <dl className="mt-4 space-y-2 border-t border-bordergray pt-4 text-sm">
            {shipping !== undefined && (
              <div className="flex justify-between">
                <dt className="text-slate-500">Shipping</dt>
                <dd className="font-semibold">
                  {Number(shipping) === 0 ? (
                    <span className="text-accent">Free</span>
                  ) : (
                    formatPrice(shipping)
                  )}
                </dd>
              </div>
            )}
            {total !== undefined && (
              <div className="flex justify-between text-base">
                <dt className="font-bold">Total</dt>
                <dd className="font-bold text-primary">{formatPrice(total)}</dd>
              </div>
            )}
            {order?.paymentMethod && (
              <div className="flex justify-between">
                <dt className="text-slate-500">Payment</dt>
                <dd className="font-semibold">{order.paymentMethod}</dd>
              </div>
            )}
          </dl>
        </div>
      )}

      <div className="mt-8 flex justify-center gap-3">
        <Link to="/shop" className="btn-primary">
          Continue Shopping
        </Link>
        <Link to="/account" className="btn-outline">
          View My Orders
        </Link>
      </div>
    </div>
  )
}
