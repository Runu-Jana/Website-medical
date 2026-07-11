import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../lib/api'
import { useAuth } from '../context/AuthContext'
import Spinner from '../components/Spinner'
import { formatPrice } from '../lib/helpers'
import AddressAutocomplete from '../components/AddressAutocomplete'
import {
  FaSignOutAlt,
  FaUserCircle,
  FaBoxOpen,
  FaMapMarkerAlt,
  FaPrescriptionBottleAlt,
  FaTimes,
  FaCrown,
  FaFileMedical,
  FaNotesMedical,
  FaUserMd,
  FaFlask,
  FaHeadset,
  FaCalendarCheck,
  FaVial,
} from 'react-icons/fa'

const QUICK_LINKS = [
  { to: '/prescription', label: 'Upload Rx', Icon: FaFileMedical, color: 'bg-amber-100 text-amber-600' },
  { to: '/health-records', label: 'Health Records', Icon: FaNotesMedical, color: 'bg-cyan-100 text-cyan-600' },
  { to: '/doctors', label: 'Consult Doctor', Icon: FaUserMd, color: 'bg-sky-100 text-sky-600' },
  { to: '/lab-tests', label: 'Lab Tests', Icon: FaFlask, color: 'bg-violet-100 text-violet-600' },
  { to: '/health-club', label: 'Health Club', Icon: FaCrown, color: 'bg-rose-100 text-rose-600' },
  { to: '/contact', label: 'Help & Support', Icon: FaHeadset, color: 'bg-emerald-100 text-emerald-600' },
]

const ORDER_TABS = [
  { id: '', label: 'All' },
  { id: 'processing', label: 'Processing' },
  { id: 'delivered', label: 'Delivered' },
  { id: 'cancelled', label: 'Cancelled' },
]

export default function Account() {
  const { user, logout, updateUser } = useAuth()
  const navigate = useNavigate()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [refills, setRefills] = useState([])
  const [appointments, setAppointments] = useState([])
  const [labBookings, setLabBookings] = useState([])
  const [orderTab, setOrderTab] = useState('')

  const [addr, setAddr] = useState({
    line1: user?.address?.line1 || '',
    city: user?.address?.city || '',
    state: user?.address?.state || '',
    postalCode: user?.address?.postalCode || '',
    country: user?.address?.country || '',
  })
  const [savingAddr, setSavingAddr] = useState(false)
  const [addrMsg, setAddrMsg] = useState('')

  const saveAddress = async (e) => {
    e.preventDefault()
    setSavingAddr(true)
    setAddrMsg('')
    try {
      const { data } = await api.put('/auth/profile', { address: addr })
      updateUser(data.user)
      setAddrMsg('Address saved!')
    } catch (err) {
      setAddrMsg(err.response?.data?.message || 'Could not save address')
    } finally {
      setSavingAddr(false)
    }
  }

  useEffect(() => {
    let active = true
    api
      .get('/orders/mine')
      .then(({ data }) => active && setOrders(Array.isArray(data) ? data : data.orders || []))
      .catch(() => active && setOrders([]))
      .finally(() => active && setLoading(false))
    api
      .get('/me/refills')
      .then(({ data }) => active && setRefills(Array.isArray(data) ? data : []))
      .catch(() => active && setRefills([]))
    api
      .get('/appointments/mine')
      .then(({ data }) => active && setAppointments(Array.isArray(data) ? data : []))
      .catch(() => active && setAppointments([]))
    api
      .get('/lab-bookings/mine')
      .then(({ data }) => active && setLabBookings(Array.isArray(data) ? data : []))
      .catch(() => active && setLabBookings([]))
    return () => {
      active = false
    }
  }, [])

  const updateRefill = async (id, body) => {
    try {
      await api.patch(`/me/refills/${id}`, body)
      const { data } = await api.get('/me/refills')
      setRefills(Array.isArray(data) ? data : [])
    } catch {
      /* ignore */
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  // Only show reminders that are still upcoming/active.
  const activeRefills = refills.filter((r) => r.status !== 'cancelled')

  return (
    <div className="container-x py-8">
      <h1 className="mb-6 text-2xl font-bold">My Account</h1>

      {/* Quick links */}
      <div className="mb-6 grid grid-cols-3 gap-3 sm:grid-cols-6">
        {QUICK_LINKS.map(({ to, label, Icon, color }) => (
          <Link key={to} to={to} className="card flex flex-col items-center gap-2 p-3 text-center transition hover:ring-2 hover:ring-primary">
            <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${color}`}><Icon size={16} /></span>
            <span className="text-[11px] font-semibold text-slate-600">{label}</span>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Profile */}
        <div className="lg:col-span-1">
          <div className="card p-6 text-center">
            <FaUserCircle size={64} className="mx-auto text-primary" />
            <h3 className="mt-3 text-lg font-bold">{user?.name}</h3>
            <p className="text-sm text-slate-500">{user?.email}</p>
            {user?.phone && <p className="text-sm text-slate-500">{user.phone}</p>}
            {user?.isMember ? (
              <Link
                to="/health-club"
                className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700"
              >
                <FaCrown size={11} /> Health Club Member
              </Link>
            ) : (
              <Link
                to="/health-club"
                className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary hover:bg-primary/20"
              >
                <FaCrown size={11} /> Join Health Club
              </Link>
            )}
            <button onClick={handleLogout} className="btn-outline mt-5 w-full">
              <FaSignOutAlt /> Logout
            </button>
          </div>

          {/* Delivery address */}
          <div className="card mt-6 p-6">
            <h3 className="mb-4 flex items-center gap-2 text-lg font-bold">
              <FaMapMarkerAlt className="text-primary" /> Delivery Address
            </h3>
            <form onSubmit={saveAddress} className="space-y-3">
              <div>
                <AddressAutocomplete
                  onSelect={(a) => setAddr((prev) => ({ ...prev, ...a }))}
                />
                <p className="mt-1 text-xs text-slate-400">
                  Start typing and pick a suggestion — city, state, country &amp; postal code fill
                  in automatically.
                </p>
              </div>
              <input
                className="input-base"
                placeholder="Address line"
                value={addr.line1}
                onChange={(e) => setAddr({ ...addr, line1: e.target.value })}
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  className="input-base"
                  placeholder="City"
                  value={addr.city}
                  onChange={(e) => setAddr({ ...addr, city: e.target.value })}
                />
                <input
                  className="input-base"
                  placeholder="State"
                  value={addr.state}
                  onChange={(e) => setAddr({ ...addr, state: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input
                  className="input-base"
                  placeholder="Postal code"
                  value={addr.postalCode}
                  onChange={(e) => setAddr({ ...addr, postalCode: e.target.value })}
                />
                <input
                  className="input-base"
                  placeholder="Country"
                  value={addr.country}
                  onChange={(e) => setAddr({ ...addr, country: e.target.value })}
                />
              </div>
              {addrMsg && <p className="text-sm font-medium text-accent">{addrMsg}</p>}
              <button type="submit" disabled={savingAddr} className="btn-primary w-full">
                {savingAddr ? 'Saving...' : 'Save Address'}
              </button>
            </form>
          </div>

          {/* Refill reminders */}
          {activeRefills.length > 0 && (
            <div className="card mt-6 p-6">
              <h3 className="mb-1 flex items-center gap-2 text-lg font-bold">
                <FaPrescriptionBottleAlt className="text-primary" /> Refill Reminders
              </h3>
              <p className="mb-4 text-xs text-slate-400">
                We'll email you when it's time to reorder.
              </p>
              <div className="space-y-3">
                {activeRefills.map((r) => {
                  const due = new Date(r.dueDate)
                  const overdue = r.status === 'sent' || due <= new Date()
                  return (
                    <div key={r._id} className="rounded-xl border border-bordergray p-3">
                      <div className="flex items-start gap-3">
                        {r.thumbnail ? (
                          <img
                            src={r.thumbnail}
                            alt=""
                            className="h-10 w-10 shrink-0 rounded-lg border border-bordergray object-cover"
                          />
                        ) : null}
                        <div className="min-w-0 flex-1">
                          <p className="line-clamp-1 text-sm font-semibold text-dark">
                            {r.productName}
                          </p>
                          <p className={`text-xs ${overdue ? 'font-semibold text-accent' : 'text-slate-500'}`}>
                            {overdue ? 'Due now' : `Refill by ${due.toLocaleDateString()}`}
                          </p>
                        </div>
                        <button
                          onClick={() => updateRefill(r._id, { action: 'cancel' })}
                          className="p-1 text-slate-300 hover:text-red-500"
                          aria-label="Cancel reminder"
                          title="Cancel reminder"
                        >
                          <FaTimes size={13} />
                        </button>
                      </div>
                      <div className="mt-2 flex gap-2">
                        <Link
                          to={`/product/${r.productSlug || r.productId}`}
                          className="flex-1 rounded-lg bg-primary px-3 py-1.5 text-center text-xs font-semibold text-white hover:bg-primaryDark"
                        >
                          Reorder
                        </Link>
                        <button
                          onClick={() => updateRefill(r._id, { action: 'snooze', days: 7 })}
                          className="rounded-lg border border-bordergray px-3 py-1.5 text-xs font-semibold text-slate-600 hover:border-primary hover:text-primary"
                        >
                          Snooze 7d
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Orders */}
        <div className="lg:col-span-2">
          <div className="card p-6">
            <h3 className="mb-4 flex items-center gap-2 text-lg font-bold">
              <FaBoxOpen className="text-primary" /> My Orders
            </h3>
            {/* Status tabs */}
            <div className="mb-4 flex flex-wrap gap-2">
              {ORDER_TABS.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setOrderTab(t.id)}
                  className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                    orderTab === t.id ? 'bg-primary text-white' : 'bg-lightbg text-slate-600 hover:bg-primary/10'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
            {loading ? (
              <Spinner />
            ) : orders.filter((o) => !orderTab || (o.status || '') === orderTab).length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-500">
                {orders.length === 0 ? 'You have no orders yet.' : 'No orders in this status.'}
              </p>
            ) : (
              <div className="space-y-3">
                {orders.filter((o) => !orderTab || (o.status || '') === orderTab).map((o) => {
                  const items = o.items || o.orderItems || []
                  const total = o.totalPrice ?? o.total
                  return (
                    <div key={o._id} className="rounded-xl border border-bordergray p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <p className="text-sm font-bold">#{o._id}</p>
                          <p className="text-xs text-slate-400">
                            {o.createdAt
                              ? new Date(o.createdAt).toLocaleDateString()
                              : ''}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-primary">{formatPrice(total)}</p>
                          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                            {o.status || (o.isDelivered ? 'Delivered' : 'Processing')}
                          </span>
                        </div>
                      </div>
                      {items.length > 0 && (
                        <p className="mt-2 line-clamp-1 text-xs text-slate-500">
                          {items.map((i) => `${i.name} ×${i.qty}`).join(', ')}
                        </p>
                      )}
                      <Link
                        to={`/invoice/${o._id}`}
                        state={{ order: o }}
                        className="mt-2 inline-block text-xs font-semibold text-primary hover:underline"
                      >
                        Download Invoice
                      </Link>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* My consultations */}
          {appointments.length > 0 && (
            <div className="card mt-6 p-6">
              <h3 className="mb-4 flex items-center gap-2 text-lg font-bold">
                <FaCalendarCheck className="text-primary" /> My Consultations
              </h3>
              <div className="space-y-3">
                {appointments.map((a) => (
                  <div key={a._id} className="flex items-center justify-between gap-3 rounded-xl border border-bordergray p-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-dark">{a.doctorName}</p>
                      <p className="text-xs text-slate-400 capitalize">
                        {a.consultationType} · {a.preferredDate || 'date TBD'} {a.preferredTime}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold capitalize text-primary">
                      {a.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* My lab bookings */}
          {labBookings.length > 0 && (
            <div className="card mt-6 p-6">
              <h3 className="mb-4 flex items-center gap-2 text-lg font-bold">
                <FaVial className="text-primary" /> My Lab Bookings
              </h3>
              <div className="space-y-3">
                {labBookings.map((b) => (
                  <div key={b._id} className="flex items-center justify-between gap-3 rounded-xl border border-bordergray p-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-dark">
                        {(b.items || []).map((i) => i.name).join(', ') || 'Lab test'}
                      </p>
                      <p className="text-xs text-slate-400">
                        {formatPrice(b.total)} · {b.preferredDate || 'date TBD'}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                      {b.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
