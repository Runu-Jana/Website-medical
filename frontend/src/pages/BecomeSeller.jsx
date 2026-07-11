import { useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../lib/api'
import { FaStore, FaCheckCircle, FaBoxOpen, FaChartLine, FaTruck } from 'react-icons/fa'

const PERKS = [
  { Icon: FaBoxOpen, title: 'List your medicines', text: 'Add your own products, prices and stock in your seller dashboard.' },
  { Icon: FaChartLine, title: 'Reach more customers', text: 'Sell to every customer on DBL Life Care — no storefront to build.' },
  { Icon: FaTruck, title: 'You stay in control', text: 'Manage your catalogue and see your orders in one place.' },
]

export default function BecomeSeller() {
  const [form, setForm] = useState({
    shopName: '', ownerName: '', email: '', phone: '', password: '',
    licenseNumber: '', gstin: '', address: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    if (!form.shopName || !form.ownerName || !form.email || !form.password) {
      setError('Shop name, owner, email and password are required.')
      return
    }
    setSubmitting(true)
    try {
      await api.post('/vendors/register', form)
      setDone(true)
    } catch (err) {
      setError(err.response?.data?.message || 'Could not submit. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (done) {
    return (
      <div className="container-x py-20 text-center">
        <FaCheckCircle className="mx-auto text-emerald-500" size={56} />
        <h1 className="mt-4 text-2xl font-bold">Application submitted 🎉</h1>
        <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
          Thanks for applying to sell on DBL Life Care. Our team will review your details and
          approve your account. Once approved, sign in to the <b>Seller Panel</b> with your email
          and password to add your products.
        </p>
        <Link to="/" className="btn-primary mt-6">Back to Home</Link>
      </div>
    )
  }

  return (
    <div className="container-x py-8">
      {/* Hero */}
      <div className="overflow-hidden rounded-2xl bg-gradient-to-r from-primary to-primaryDark p-6 text-white sm:p-8">
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20"><FaStore size={22} /></span>
          <div>
            <h1 className="text-xl font-bold sm:text-2xl">Sell on DBL Life Care</h1>
            <p className="text-sm text-white/90">Partner with us and reach customers across India.</p>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Perks */}
        <div className="space-y-3 lg:col-span-1">
          {PERKS.map(({ Icon, title, text }) => (
            <div key={title} className="card flex gap-3 p-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><Icon size={18} /></span>
              <div>
                <p className="text-sm font-bold text-dark">{title}</p>
                <p className="text-xs text-slate-500">{text}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Form */}
        <div className="lg:col-span-2">
          <form onSubmit={submit} className="card space-y-4 p-6">
            <h2 className="text-lg font-bold">Seller application</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <input className="input-base" placeholder="Pharmacy / Shop name *" value={form.shopName} onChange={(e) => set('shopName', e.target.value)} />
              <input className="input-base" placeholder="Owner name *" value={form.ownerName} onChange={(e) => set('ownerName', e.target.value)} />
              <input className="input-base" type="email" placeholder="Email *" value={form.email} onChange={(e) => set('email', e.target.value)} />
              <input className="input-base" placeholder="Phone" value={form.phone} onChange={(e) => set('phone', e.target.value)} />
              <input className="input-base" placeholder="Drug licence number" value={form.licenseNumber} onChange={(e) => set('licenseNumber', e.target.value)} />
              <input className="input-base" placeholder="GSTIN" value={form.gstin} onChange={(e) => set('gstin', e.target.value)} />
            </div>
            <input className="input-base" placeholder="Shop address" value={form.address} onChange={(e) => set('address', e.target.value)} />
            <input className="input-base" type="password" placeholder="Create a password *" value={form.password} onChange={(e) => set('password', e.target.value)} />
            {error && <p className="text-sm text-red-500">{error}</p>}
            <button type="submit" disabled={submitting} className="btn-primary w-full sm:w-auto">
              {submitting ? 'Submitting…' : 'Submit Application'}
            </button>
            <p className="text-xs text-slate-400">
              By applying you confirm you hold a valid pharmacy drug licence. Prescription medicines
              require verification. Our team reviews every seller before going live.
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}
