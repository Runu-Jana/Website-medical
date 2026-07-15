import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../lib/api'
import Spinner from '../components/Spinner'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { formatPrice } from '../lib/helpers'
import { payForBooking, PAYMENT_DISMISSED } from '../lib/payment'
import { FaFlask, FaSearch, FaHome, FaFileMedical, FaCheckCircle, FaVial, FaClock } from 'react-icons/fa'

function PackageCard({ t, selected, onToggle }) {
  return (
    <div className="card flex flex-col p-4">
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-sm font-bold text-dark">{t.name}</h3>
        {t.discountPercent > 0 && (
          <span className="shrink-0 rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700">
            {t.discountPercent}% OFF
          </span>
        )}
      </div>
      {t.parameters > 0 && <p className="mt-1 text-xs text-slate-500">Includes {t.parameters} tests</p>}
      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-slate-400">
        {t.sampleType && <span className="flex items-center gap-1"><FaVial size={10} /> {t.sampleType}</span>}
        {t.reportTime && <span className="flex items-center gap-1"><FaClock size={10} /> {t.reportTime}</span>}
        {t.fasting && <span>Fasting required</span>}
      </div>
      <div className="mt-auto flex items-center justify-between pt-3">
        <div>
          <span className="text-base font-bold text-dark">{formatPrice(t.price)}</span>
          {t.oldPrice > t.price && (
            <span className="ml-1 text-xs text-slate-400 line-through">{formatPrice(t.oldPrice)}</span>
          )}
        </div>
        <button
          onClick={() => onToggle(t)}
          className={`rounded-lg px-4 py-1.5 text-xs font-bold transition ${
            selected ? 'bg-emerald-500 text-white' : 'border border-primary text-primary hover:bg-primary hover:text-white'
          }`}
        >
          {selected ? '✓ Added' : 'Add'}
        </button>
      </div>
    </div>
  )
}

export default function LabTests() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { showToast } = useToast()
  const [tests, setTests] = useState([])
  const [loading, setLoading] = useState(true)
  const [keyword, setKeyword] = useState('')
  const [selected, setSelected] = useState([]) // [{id,name,price}]
  const [showForm, setShowForm] = useState(false)
  const [booking, setBooking] = useState(false)
  const [done, setDone] = useState(false)
  const [form, setForm] = useState({
    patientName: '', patientPhone: '', patientEmail: '', address: '', preferredDate: '', preferredTime: '', note: '',
  })

  useEffect(() => {
    let on = true
    api.get('/lab-tests')
      .then(({ data }) => on && setTests(data.tests || []))
      .catch(() => on && setTests([]))
      .finally(() => on && setLoading(false))
    return () => { on = false }
  }, [])

  useEffect(() => {
    if (user) setForm((f) => ({ ...f, patientName: f.patientName || user.name || '', patientEmail: f.patientEmail || user.email || '', patientPhone: f.patientPhone || user.phone || '' }))
  }, [user])

  const isSel = (id) => selected.some((s) => s.id === id)
  const toggle = (t) => setSelected((s) => (isSel(t.id) ? s.filter((x) => x.id !== t.id) : [...s, { id: t.id, name: t.name, price: t.price }]))
  const total = useMemo(() => selected.reduce((s, i) => s + i.price, 0), [selected])

  const filtered = useMemo(() => {
    if (!keyword) return tests
    const k = keyword.toLowerCase()
    return tests.filter((t) => t.name.toLowerCase().includes(k))
  }, [tests, keyword])
  const packages = filtered.filter((t) => t.category === 'package')
  const singles = filtered.filter((t) => t.category === 'test')

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  // Booking requires an account so tests tie to the customer; send guests to log in.
  const openForm = () => {
    if (!user) {
      showToast({ title: 'Please log in to book a lab test', tone: 'info' })
      navigate('/login', { state: { from: '/lab-tests' } })
      return
    }
    setShowForm(true)
  }

  const book = async (e) => {
    e.preventDefault()
    if (!user) {
      showToast({ title: 'Please log in to book a lab test', tone: 'info' })
      navigate('/login', { state: { from: '/lab-tests' } })
      return
    }
    if (!form.patientName.trim() || !(form.patientPhone.trim() || form.patientEmail.trim())) {
      showToast({ title: 'Please add your name and a phone or email', tone: 'info' }); return
    }
    setBooking(true)
    try {
      const { data } = await api.post('/lab-bookings', { items: selected, ...form })
      // When online payment is required, the booking is only confirmed after
      // the customer pays and the payment is verified server-side.
      if (data.requiresPayment) {
        await payForBooking({
          type: 'labBooking',
          id: data.booking._id,
          name: form.patientName,
          contact: form.patientPhone,
          description: `Lab tests (${selected.length} item${selected.length > 1 ? 's' : ''})`,
        })
      }
      setDone(true)
      showToast({ title: 'Lab test booked 🎉', subtitle: 'Our team will confirm your home collection.', tone: 'success' })
    } catch (err) {
      if (err.message === PAYMENT_DISMISSED) {
        showToast({ title: 'Payment cancelled — your lab test is not booked yet', tone: 'info' })
      } else {
        showToast({ title: err.response?.data?.message || err.message || 'Could not book. Try again.', tone: 'info' })
      }
    } finally { setBooking(false) }
  }

  if (done) {
    return (
      <div className="container-x py-20 text-center">
        <FaCheckCircle className="mx-auto text-emerald-500" size={54} />
        <h2 className="mt-4 text-2xl font-bold">Lab test booked</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
          We've received your booking for {selected.length} item(s). Our team will call you to confirm the
          home sample collection slot.
        </p>
      </div>
    )
  }

  return (
    <div className="container-x py-6 pb-28">
      {/* Hero */}
      <div className="overflow-hidden rounded-2xl bg-gradient-to-r from-sky-500 to-blue-600 p-6 text-white sm:p-8">
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20"><FaFlask size={22} /></span>
          <div>
            <h1 className="text-xl font-bold sm:text-2xl">Book Lab Tests</h1>
            <p className="flex items-center gap-1.5 text-sm text-white/90"><FaHome size={12} /> Accurate reports · Free home sample collection</p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative mt-5">
        <FaSearch className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
        <input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="Search tests & packages…" className="input-base w-full pl-10" />
      </div>

      {loading ? (
        <Spinner className="py-16" />
      ) : (
        <>
          {packages.length > 0 && (
            <section className="mt-6">
              <h2 className="mb-3 text-lg font-bold text-dark">Popular Health Packages</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {packages.map((t) => <PackageCard key={t._id} t={t} selected={isSel(t._id)} onToggle={toggle} />)}
              </div>
            </section>
          )}

          {singles.length > 0 && (
            <section className="mt-8">
              <h2 className="mb-3 text-lg font-bold text-dark">Popular Tests</h2>
              <div className="card divide-y divide-bordergray">
                {singles.map((t) => (
                  <div key={t._id} className="flex items-center gap-3 p-4">
                    <FaFileMedical className="shrink-0 text-primary" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-dark">{t.name}</p>
                      <p className="text-xs text-slate-400">
                        {formatPrice(t.price)}
                        {t.oldPrice > t.price && <span className="ml-1 line-through">{formatPrice(t.oldPrice)}</span>}
                        {t.reportTime ? ` · ${t.reportTime}` : ''}
                      </p>
                    </div>
                    <button
                      onClick={() => toggle(t)}
                      className={`rounded-lg px-4 py-1.5 text-xs font-bold transition ${
                        isSel(t._id) ? 'bg-emerald-500 text-white' : 'border border-primary text-primary hover:bg-primary hover:text-white'
                      }`}
                    >
                      {isSel(t._id) ? '✓ Added' : 'Add'}
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      )}

      {/* Sticky selection bar */}
      {selected.length > 0 && !showForm && (
        <div className="fixed inset-x-0 bottom-16 z-40 border-t border-bordergray bg-white p-3 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] md:bottom-0">
          <div className="container-x flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-dark">{selected.length} selected · {formatPrice(total)}</p>
              <p className="text-xs text-slate-400">Free home sample collection</p>
            </div>
            <button onClick={openForm} className="btn-primary">Book Now</button>
          </div>
        </div>
      )}

      {/* Booking form modal */}
      {showForm && (
        <div className="fixed inset-0 z-[90] flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4" onClick={() => setShowForm(false)}>
          <div className="w-full max-w-md rounded-t-2xl bg-white p-5 sm:rounded-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold">Book Home Collection</h3>
            <div className="mt-2 rounded-lg bg-lightbg px-3 py-2 text-sm">
              <div className="flex justify-between"><span className="text-slate-500">{selected.length} item(s)</span><span className="font-bold text-primary">{formatPrice(total)}</span></div>
            </div>
            <form onSubmit={book} className="mt-3 space-y-3">
              <input className="input-base" placeholder="Patient name *" value={form.patientName} onChange={(e) => set('patientName', e.target.value)} required />
              <div className="grid grid-cols-2 gap-2">
                <input className="input-base" placeholder="Phone" value={form.patientPhone} onChange={(e) => set('patientPhone', e.target.value)} />
                <input className="input-base" type="email" placeholder="Email" value={form.patientEmail} onChange={(e) => set('patientEmail', e.target.value)} />
              </div>
              <input className="input-base" placeholder="Home collection address" value={form.address} onChange={(e) => set('address', e.target.value)} />
              <div className="grid grid-cols-2 gap-2">
                <input className="input-base" type="date" value={form.preferredDate} onChange={(e) => set('preferredDate', e.target.value)} />
                <input className="input-base" type="time" value={form.preferredTime} onChange={(e) => set('preferredTime', e.target.value)} />
              </div>
              <textarea className="input-base" rows={2} placeholder="Note (optional)" value={form.note} onChange={(e) => set('note', e.target.value)} />
              <div className="flex gap-2">
                <button type="button" onClick={() => setShowForm(false)} className="btn-outline flex-1">Back</button>
                <button type="submit" disabled={booking} className="btn-primary flex-1">{booking ? 'Booking…' : `Pay ${formatPrice(total)} & Book`}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
