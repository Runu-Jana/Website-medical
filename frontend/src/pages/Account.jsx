import { useEffect, useMemo, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../lib/api'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import Spinner from '../components/Spinner'
import { formatPrice } from '../lib/helpers'
import AddressAutocomplete from '../components/AddressAutocomplete'

// Lab-booking visit status → label + badge colour (mirrors the admin panel).
const LAB_LABELS = { booked: 'Booked', 'visit-done': 'Visit Done', 'no-show': 'No Show', cancelled: 'Cancelled' }
const LAB_BADGE = {
  booked: 'bg-amber-100 text-amber-700',
  'visit-done': 'bg-emerald-100 text-emerald-700',
  'no-show': 'bg-rose-100 text-rose-700',
  cancelled: 'bg-slate-200 text-slate-500',
}
import {
  FaSignOutAlt, FaUserCircle, FaBoxOpen, FaMapMarkerAlt, FaPrescriptionBottleAlt, FaTimes,
  FaCrown, FaChevronRight, FaWallet, FaRegAddressBook, FaRegCreditCard, FaFileMedical,
  FaGift, FaHeadset, FaTruck, FaClipboardCheck, FaUndoAlt, FaRegClock, FaCalendarCheck, FaVial,
} from 'react-icons/fa'

const scrollTo = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })

// A single tappable menu row (icon · label · value · chevron).
function Row({ icon: Icon, label, value, valueClass, to, onClick, external }) {
  const inner = (
    <div className="flex items-center gap-3 px-4 py-3.5">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-lightbg text-primary">
        <Icon size={16} />
      </span>
      <span className="flex-1 text-sm font-medium text-dark">{label}</span>
      {value != null && <span className={`text-sm font-semibold ${valueClass || 'text-slate-500'}`}>{value}</span>}
      <FaChevronRight className="text-slate-300" size={12} />
    </div>
  )
  if (to) return <Link to={to}>{inner}</Link>
  return (
    <button type="button" onClick={onClick} className="w-full text-left">
      {inner}
    </button>
  )
}

export default function Account() {
  const { user, logout, updateUser } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [refills, setRefills] = useState([])
  const [appointments, setAppointments] = useState([])
  const [labBookings, setLabBookings] = useState([])
  const [orderTab, setOrderTab] = useState('')
  const [rescheduleId, setRescheduleId] = useState(null)
  const [reForm, setReForm] = useState({ date: '', time: '' })
  const [labBusy, setLabBusy] = useState(false)

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
    api.get('/orders/mine')
      .then(({ data }) => active && setOrders(Array.isArray(data) ? data : data.orders || []))
      .catch(() => active && setOrders([]))
      .finally(() => active && setLoading(false))
    api.get('/me/refills').then(({ data }) => active && setRefills(Array.isArray(data) ? data : [])).catch(() => {})
    api.get('/appointments/mine').then(({ data }) => active && setAppointments(Array.isArray(data) ? data : [])).catch(() => {})
    api.get('/lab-bookings/mine').then(({ data }) => active && setLabBookings(Array.isArray(data) ? data : [])).catch(() => {})
    return () => { active = false }
  }, [])

  // Deep-link support: /account#orders (e.g. the "Track Order" tile) scrolls
  // straight to the orders section once it has rendered.
  useEffect(() => {
    if (window.location.hash !== '#orders') return
    const t = setTimeout(() => scrollTo('orders'), 400)
    return () => clearTimeout(t)
  }, [])

  const updateRefill = async (id, body) => {
    try {
      await api.patch(`/me/refills/${id}`, body)
      const { data } = await api.get('/me/refills')
      setRefills(Array.isArray(data) ? data : [])
    } catch { /* ignore */ }
  }

  // Customer cancels their own lab booking (only while it's still "booked").
  const cancelLabBooking = async (id) => {
    if (!window.confirm('Cancel this lab test booking?')) return
    setLabBusy(true)
    try {
      const { data } = await api.put(`/lab-bookings/mine/${id}`, { cancel: true })
      setLabBookings((list) => list.map((b) => (b._id === id ? data : b)))
      showToast({ title: 'Booking cancelled', tone: 'info' })
    } catch (err) {
      showToast({ title: err.response?.data?.message || 'Could not cancel', tone: 'info' })
    } finally { setLabBusy(false) }
  }

  const openReschedule = (b) => {
    setRescheduleId(b._id)
    setReForm({ date: b.preferredDate || '', time: b.preferredTime || '' })
  }

  // Customer picks a new date/time; reflected on the admin panel in real time.
  const saveReschedule = async (id) => {
    if (!reForm.date) { showToast({ title: 'Please choose a date', tone: 'info' }); return }
    setLabBusy(true)
    try {
      const { data } = await api.put(`/lab-bookings/mine/${id}`, { preferredDate: reForm.date, preferredTime: reForm.time })
      setLabBookings((list) => list.map((b) => (b._id === id ? data : b)))
      setRescheduleId(null)
      showToast({ title: 'Visit rescheduled 🎉', tone: 'success' })
    } catch (err) {
      showToast({ title: err.response?.data?.message || 'Could not reschedule', tone: 'info' })
    } finally { setLabBusy(false) }
  }

  const handleLogout = () => { logout(); navigate('/') }
  const activeRefills = refills.filter((r) => r.status !== 'cancelled')

  // Order status breakdown for the "My Orders" row.
  const stages = useMemo(() => {
    const toPay = orders.filter((o) => !o.isPaid && o.status !== 'cancelled' && !o.isDelivered).length
    const toShip = orders.filter((o) => o.isPaid && !o.isDelivered && o.status !== 'cancelled' && o.fulfillmentStatus !== 'dispatched').length
    const toDeliver = orders.filter((o) => !o.isDelivered && o.fulfillmentStatus === 'dispatched').length
    const delivered = orders.filter((o) => o.isDelivered || o.status === 'delivered').length
    const returns = orders.filter((o) => o.status === 'cancelled' || o.isRefunded).length
    return [
      { label: 'To Pay', Icon: FaWallet, count: toPay },
      { label: 'To Ship', Icon: FaBoxOpen, count: toShip },
      { label: 'To Deliver', Icon: FaTruck, count: toDeliver },
      { label: 'Delivered', Icon: FaClipboardCheck, count: delivered },
      { label: 'Returns', Icon: FaUndoAlt, count: returns },
    ]
  }, [orders])

  const addressCount = user?.address?.line1 || user?.address?.city ? 1 : 0
  const goOrders = () => scrollTo('orders')

  return (
    <div className="container-x py-4">
      <div className="mx-auto max-w-2xl space-y-4">
        {/* Profile card */}
        <div className="card flex items-center gap-3 p-4">
          {user?.avatar ? (
            <img src={user.avatar} alt="" className="h-14 w-14 rounded-full object-cover" />
          ) : (
            <FaUserCircle className="text-primary" size={56} />
          )}
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-lg font-bold text-dark">{user?.name || 'My Account'}</h1>
            <p className="truncate text-sm text-slate-500">{user?.phone || user?.email}</p>
            <button onClick={() => scrollTo('profile')} className="mt-0.5 text-xs font-semibold text-primary">
              View &amp; Edit Profile ›
            </button>
          </div>
          <button onClick={handleLogout} title="Logout" className="rounded-lg bg-red-50 p-2 text-danger hover:bg-red-100">
            <FaSignOutAlt size={16} />
          </button>
        </div>

        {/* My Orders */}
        <div className="card p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold text-dark">My Orders</h2>
            <button onClick={goOrders} className="text-xs font-semibold text-primary">View All</button>
          </div>
          <div className="grid grid-cols-5 gap-1">
            {stages.map(({ label, Icon, count }) => (
              <button key={label} onClick={goOrders} className="relative flex flex-col items-center gap-1 py-1 text-center">
                <span className="relative flex h-9 w-9 items-center justify-center rounded-full bg-lightbg text-slate-600">
                  <Icon size={15} />
                  {count > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[9px] font-bold text-white">
                      {count}
                    </span>
                  )}
                </span>
                <span className="text-[10px] font-medium leading-tight text-slate-500">{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Menu list */}
        <div className="card divide-y divide-bordergray overflow-hidden">
          <Row icon={FaWallet} label="Wallet" value={formatPrice(0)} onClick={() => {}} />
          <Row icon={FaRegAddressBook} label="Address Book" value={`${addressCount} Address${addressCount === 1 ? '' : 'es'}`} onClick={() => scrollTo('profile')} />
          <Row icon={FaRegCreditCard} label="Payment Methods" value="At checkout" onClick={() => {}} />
          <Row icon={FaFileMedical} label="My Prescriptions" to="/prescription" />
          <Row icon={FaGift} label="Rewards & Offers" value="0 Points" to="/health-club" valueClass="text-amber-600" />
          <Row
            icon={FaCrown}
            label="Health Club Membership"
            value={user?.isMember ? 'Member' : 'Join now'}
            valueClass={user?.isMember ? 'text-emerald-600' : 'text-primary'}
            to="/health-club"
          />
          <Row icon={FaHeadset} label="Help & Support" to="/contact" />
        </div>

        {/* Bookings (if any) */}
        {appointments.length > 0 && (
          <div className="card p-4">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-dark"><FaCalendarCheck className="text-primary" /> My Consultations</h2>
            <div className="space-y-2">
              {appointments.map((a) => (
                <div key={a._id} className="flex items-center justify-between gap-3 rounded-xl border border-bordergray p-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-dark">{a.doctorName}</p>
                    <p className="text-xs capitalize text-slate-400">{a.consultationType} · {a.preferredDate || 'date TBD'} {a.preferredTime}</p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold capitalize text-primary">{a.status}</span>
                    {a.paymentRequired && (
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${a.isPaid ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                        {a.isPaid ? `Paid ₹${Math.round(a.fee)}` : 'Payment due'}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {labBookings.length > 0 && (
          <div className="card p-4">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-dark"><FaVial className="text-primary" /> My Lab Bookings</h2>
            <div className="space-y-2">
              {labBookings.map((b) => {
                const editing = rescheduleId === b._id
                const canChange = b.status === 'booked'
                return (
                  <div key={b._id} className="rounded-xl border border-bordergray p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-dark">{(b.items || []).map((i) => i.name).join(', ') || 'Lab test'}</p>
                        <p className="text-xs text-slate-400">
                          {formatPrice(b.total)} · {b.preferredDate || 'date TBD'}{b.preferredTime ? ` · ${b.preferredTime}` : ''}
                        </p>
                      </div>
                      <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${LAB_BADGE[b.status] || 'bg-primary/10 text-primary'}`}>
                        {LAB_LABELS[b.status] || b.status}
                      </span>
                    </div>

                    {canChange && !editing && (
                      <div className="mt-2 flex gap-2">
                        <button onClick={() => openReschedule(b)} className="rounded-lg border border-primary px-3 py-1 text-xs font-semibold text-primary hover:bg-primary/5">
                          Reschedule
                        </button>
                        <button onClick={() => cancelLabBooking(b._id)} disabled={labBusy} className="rounded-lg border border-red-300 px-3 py-1 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50">
                          Cancel
                        </button>
                      </div>
                    )}

                    {editing && (
                      <div className="mt-2 space-y-2 rounded-lg bg-lightbg p-2">
                        <p className="text-xs font-medium text-slate-500">Pick a new date &amp; time</p>
                        <div className="grid grid-cols-2 gap-2">
                          <input type="date" value={reForm.date} onChange={(e) => setReForm((f) => ({ ...f, date: e.target.value }))} className="input-base text-sm" />
                          <input type="time" value={reForm.time} onChange={(e) => setReForm((f) => ({ ...f, time: e.target.value }))} className="input-base text-sm" />
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => setRescheduleId(null)} className="btn-outline flex-1 py-1.5 text-xs">Back</button>
                          <button onClick={() => saveReschedule(b._id)} disabled={labBusy} className="btn-primary flex-1 py-1.5 text-xs">{labBusy ? 'Saving…' : 'Save date'}</button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Refill reminders */}
        {activeRefills.length > 0 && (
          <div className="card p-4">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-dark"><FaRegClock className="text-primary" /> Refill Reminders</h2>
            <div className="space-y-2">
              {activeRefills.map((r) => {
                const due = new Date(r.dueDate)
                const overdue = r.status === 'sent' || due <= new Date()
                return (
                  <div key={r._id} className="rounded-xl border border-bordergray p-3">
                    <div className="flex items-start gap-3">
                      {r.thumbnail && <img src={r.thumbnail} alt="" className="h-10 w-10 shrink-0 rounded-lg border border-bordergray object-cover" />}
                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-1 text-sm font-semibold text-dark">{r.productName}</p>
                        <p className={`text-xs ${overdue ? 'font-semibold text-accent' : 'text-slate-500'}`}>{overdue ? 'Due now' : `Refill by ${due.toLocaleDateString()}`}</p>
                      </div>
                      <button onClick={() => updateRefill(r._id, { action: 'cancel' })} className="p-1 text-slate-300 hover:text-red-500" aria-label="Cancel"><FaTimes size={13} /></button>
                    </div>
                    <div className="mt-2 flex gap-2">
                      <Link to={`/product/${r.productSlug || r.productId}`} className="flex-1 rounded-lg bg-primary px-3 py-1.5 text-center text-xs font-semibold text-white hover:bg-primaryDark">Reorder</Link>
                      <button onClick={() => updateRefill(r._id, { action: 'snooze', days: 7 })} className="rounded-lg border border-bordergray px-3 py-1.5 text-xs font-semibold text-slate-600 hover:border-primary hover:text-primary">Snooze 7d</button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Orders list */}
        <div id="orders" className="card p-4">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-dark"><FaBoxOpen className="text-primary" /> Order History</h2>
          <div className="mb-3 flex flex-wrap gap-2">
            {[{ id: '', label: 'All' }, { id: 'processing', label: 'Processing' }, { id: 'delivered', label: 'Delivered' }, { id: 'cancelled', label: 'Cancelled' }].map((t) => (
              <button key={t.id} onClick={() => setOrderTab(t.id)} className={`rounded-full px-3 py-1 text-xs font-semibold transition ${orderTab === t.id ? 'bg-primary text-white' : 'bg-lightbg text-slate-600 hover:bg-primary/10'}`}>{t.label}</button>
            ))}
          </div>
          {loading ? (
            <Spinner />
          ) : orders.filter((o) => !orderTab || (o.status || '') === orderTab).length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-500">{orders.length === 0 ? 'You have no orders yet.' : 'No orders in this status.'}</p>
          ) : (
            <div className="space-y-3">
              {orders.filter((o) => !orderTab || (o.status || '') === orderTab).map((o) => {
                const items = o.items || o.orderItems || []
                const total = o.totalPrice ?? o.total
                return (
                  <div key={o._id} className="rounded-xl border border-bordergray p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-bold">#{o.orderNumber || o._id?.slice(-6)}</p>
                        <p className="text-xs text-slate-400">{o.createdAt ? new Date(o.createdAt).toLocaleDateString() : ''}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-primary">{formatPrice(total)}</p>
                        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">{o.status || (o.isDelivered ? 'Delivered' : 'Processing')}</span>
                      </div>
                    </div>
                    {items.length > 0 && <p className="mt-2 line-clamp-1 text-xs text-slate-500">{items.map((i) => `${i.name} ×${i.qty}`).join(', ')}</p>}
                    <Link to={`/invoice/${o._id}`} state={{ order: o }} className="mt-2 inline-block text-xs font-semibold text-primary hover:underline">Download Invoice</Link>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Edit profile / address */}
        <div id="profile" className="card p-4">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-dark"><FaMapMarkerAlt className="text-primary" /> Profile &amp; Address</h2>
          <form onSubmit={saveAddress} className="space-y-3">
            <AddressAutocomplete onSelect={(a) => setAddr((prev) => ({ ...prev, ...a }))} />
            <input className="input-base" placeholder="Address line" value={addr.line1} onChange={(e) => setAddr({ ...addr, line1: e.target.value })} />
            <div className="grid grid-cols-2 gap-3">
              <input className="input-base" placeholder="City" value={addr.city} onChange={(e) => setAddr({ ...addr, city: e.target.value })} />
              <input className="input-base" placeholder="State" value={addr.state} onChange={(e) => setAddr({ ...addr, state: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input className="input-base" placeholder="Postal code" value={addr.postalCode} onChange={(e) => setAddr({ ...addr, postalCode: e.target.value })} />
              <input className="input-base" placeholder="Country" value={addr.country} onChange={(e) => setAddr({ ...addr, country: e.target.value })} />
            </div>
            {addrMsg && <p className="text-sm font-medium text-accent">{addrMsg}</p>}
            <button type="submit" disabled={savingAddr} className="btn-primary w-full">{savingAddr ? 'Saving...' : 'Save Address'}</button>
          </form>
        </div>
      </div>
    </div>
  )
}
