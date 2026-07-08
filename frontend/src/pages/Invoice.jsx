import { useEffect, useState } from 'react'
import { useParams, useLocation, Link } from 'react-router-dom'
import api from '../lib/api'
import Spinner from '../components/Spinner'
import { formatPrice } from '../lib/helpers'
import { siteConfig } from '../config/site'
import { business } from '../config/business'
import { FaPrint, FaArrowLeft } from 'react-icons/fa'

const money = (n) => formatPrice(Number(n || 0))

export default function Invoice() {
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
  if (!order) {
    return (
      <div className="container-x py-24 text-center">
        <h2 className="text-2xl font-bold">Invoice not found</h2>
        <Link to="/account" className="btn-primary mt-6">My Orders</Link>
      </div>
    )
  }

  const items = order.items || []
  const a = order.shippingAddress || {}
  const num = order.orderNumber || order._id?.slice(-6) || id?.slice(-6)
  const date = order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-IN') : ''

  // Treat line prices as GST-inclusive (Indian retail). Split tax into
  // taxable value + GST, grouped by rate; CGST/SGST = half each (intra-state).
  let taxableTotal = 0
  let gstTotal = 0
  const byRate = {}
  const lines = items.map((i) => {
    const inclusive = Number(i.price) * Number(i.qty)
    const rate = Number(i.gstPercent) || 0
    const taxable = rate ? (inclusive * 100) / (100 + rate) : inclusive
    const gst = inclusive - taxable
    taxableTotal += taxable
    gstTotal += gst
    if (rate) {
      byRate[rate] = byRate[rate] || { taxable: 0, gst: 0 }
      byRate[rate].taxable += taxable
      byRate[rate].gst += gst
    }
    return { ...i, inclusive, rate, taxable, gst }
  })
  const shipping = Number(order.shippingPrice || 0)
  const memberDiscount = Number(order.discountPrice || 0)
  const grandTotal = Number(order.totalPrice ?? taxableTotal + gstTotal + shipping - memberDiscount)

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 print:py-0">
      {/* Toolbar (hidden when printing) */}
      <div className="mb-4 flex items-center justify-between print:hidden">
        <Link to="/account" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-primary">
          <FaArrowLeft /> Back to orders
        </Link>
        <button onClick={() => window.print()} className="btn-primary">
          <FaPrint /> Print / Save as PDF
        </button>
      </div>

      <div className="rounded-2xl border border-bordergray bg-white p-8 print:border-0 print:p-0">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-bordergray pb-5">
          <div>
            <h1 className="text-2xl font-extrabold text-primary">{business.brand}</h1>
            <p className="mt-1 text-xs leading-relaxed text-slate-500">
              {business.legalName}
              <br />
              {business.address}
              {business.gstin && (
                <>
                  <br />
                  GSTIN: {business.gstin}
                </>
              )}
            </p>
          </div>
          <div className="text-right">
            <h2 className="text-lg font-bold text-dark">TAX INVOICE</h2>
            <p className="mt-1 text-sm text-slate-500">Invoice #: <b>{num}</b></p>
            <p className="text-sm text-slate-500">Date: {date}</p>
            <p className="text-sm text-slate-500">
              Payment: {order.paymentMethod} · {order.isPaid ? 'Paid' : 'Unpaid'}
            </p>
          </div>
        </div>

        {/* Bill to */}
        <div className="grid grid-cols-1 gap-4 border-b border-bordergray py-5 sm:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Bill / Ship To</p>
            <p className="mt-1 text-sm font-semibold text-dark">{a.fullName || '—'}</p>
            <p className="text-sm text-slate-600">
              {[a.address, a.city, a.state, a.postalCode, a.country].filter(Boolean).join(', ')}
            </p>
            {a.phone && <p className="text-sm text-slate-600">Phone: {a.phone}</p>}
          </div>
          <div className="sm:text-right">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Sold By</p>
            <p className="mt-1 text-sm text-slate-600">
              {business.brand} · {siteConfig.email}
              <br />
              {siteConfig.phone}
            </p>
          </div>
        </div>

        {/* Items */}
        <div className="overflow-x-auto py-5">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-primary text-left text-xs uppercase text-slate-500">
                <th className="py-2 pr-2">Item</th>
                <th className="py-2 px-2 text-center">HSN</th>
                <th className="py-2 px-2 text-center">Qty</th>
                <th className="py-2 px-2 text-right">Taxable</th>
                <th className="py-2 px-2 text-right">GST</th>
                <th className="py-2 pl-2 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-bordergray">
              {lines.map((i, idx) => (
                <tr key={idx}>
                  <td className="py-2 pr-2 font-medium text-dark">{i.name}</td>
                  <td className="py-2 px-2 text-center text-slate-500">{i.hsn || '—'}</td>
                  <td className="py-2 px-2 text-center">{i.qty}</td>
                  <td className="py-2 px-2 text-right text-slate-600">{money(i.taxable)}</td>
                  <td className="py-2 px-2 text-right text-slate-600">
                    {i.rate ? `${money(i.gst)} (${i.rate}%)` : '—'}
                  </td>
                  <td className="py-2 pl-2 text-right font-semibold">{money(i.inclusive)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="flex justify-end border-t border-bordergray pt-4">
          <dl className="w-full max-w-xs space-y-1.5 text-sm">
            <div className="flex justify-between">
              <dt className="text-slate-500">Taxable value</dt>
              <dd>{money(taxableTotal)}</dd>
            </div>
            {Object.entries(byRate).map(([rate, v]) => (
              <div key={rate} className="flex justify-between text-slate-500">
                <dt>CGST + SGST @ {rate}%</dt>
                <dd>{money(v.gst)}</dd>
              </div>
            ))}
            {gstTotal === 0 && (
              <div className="flex justify-between text-slate-400">
                <dt>GST</dt>
                <dd>Inclusive</dd>
              </div>
            )}
            {memberDiscount > 0 && (
              <div className="flex justify-between text-primary">
                <dt>Health Club discount</dt>
                <dd>−{money(memberDiscount)}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-slate-500">Shipping</dt>
              <dd>{shipping === 0 ? 'Free' : money(shipping)}</dd>
            </div>
            <div className="flex justify-between border-t border-bordergray pt-2 text-base font-bold">
              <dt>Grand Total</dt>
              <dd className="text-primary">{money(grandTotal)}</dd>
            </div>
          </dl>
        </div>

        <p className="mt-6 border-t border-bordergray pt-4 text-center text-xs text-slate-400">
          This is a computer-generated invoice. Prices are inclusive of GST where applicable.
          Thank you for shopping with {business.brand}.
        </p>
      </div>
    </div>
  )
}
