import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import api from '../lib/api'
import Spinner from '../components/Spinner'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { imgFallback } from '../lib/helpers'
import { payForBooking, PAYMENT_DISMISSED } from '../lib/payment'
import {
  FaUserMd, FaStar, FaArrowLeft, FaVideo, FaPhoneAlt, FaCommentDots, FaCheckCircle, FaLanguage,
} from 'react-icons/fa'

const TYPES = [
  { id: 'video', label: 'Video Consultation', Icon: FaVideo, feeKey: 'videoFee' },
  { id: 'audio', label: 'Audio Consultation', Icon: FaPhoneAlt, feeKey: 'audioFee' },
  { id: 'chat', label: 'Chat Consultation', Icon: FaCommentDots, feeKey: 'chatFee' },
]

export default function DoctorProfile() {
  const { idOrSlug } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { showToast } = useToast()

  const [doc, setDoc] = useState(null)
  const [loading, setLoading] = useState(true)
  const [type, setType] = useState('video')
  const [booking, setBooking] = useState(false)
  const [done, setDone] = useState(false)
  const [form, setForm] = useState({
    patientName: '', patientPhone: '', patientEmail: '', preferredDate: '', preferredTime: '', note: '',
  })

  useEffect(() => {
    let on = true
    setLoading(true)
    api
      .get(`/doctors/${idOrSlug}`)
      .then(({ data }) => on && setDoc(data))
      .catch(() => on && setDoc(null))
      .finally(() => on && setLoading(false))
    return () => {
      on = false
    }
  }, [idOrSlug])

  useEffect(() => {
    if (user) {
      setForm((f) => ({
        ...f,
        patientName: f.patientName || user.name || '',
        patientEmail: f.patientEmail || user.email || '',
        patientPhone: f.patientPhone || user.phone || '',
      }))
    }
  }, [user])

  if (loading) return <Spinner className="py-32" />
  if (!doc) {
    return (
      <div className="container-x py-24 text-center">
        <h2 className="text-2xl font-bold">Doctor not found</h2>
        <Link to="/doctors" className="btn-primary mt-6">Back to Doctors</Link>
      </div>
    )
  }

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))
  const feeFor = (t) => doc[TYPES.find((x) => x.id === t).feeKey] || doc.fee || 0

  const book = async (e) => {
    e.preventDefault()
    // Booking requires an account so the appointment ties to the customer.
    if (!user) {
      showToast({ title: 'Please log in to book an appointment', tone: 'info' })
      navigate('/login', { state: { from: `/doctors/${idOrSlug}` } })
      return
    }
    if (!form.patientName.trim() || !(form.patientPhone.trim() || form.patientEmail.trim())) {
      showToast({ title: 'Please add your name and a phone or email', tone: 'info' })
      return
    }
    setBooking(true)
    try {
      const { data } = await api.post('/appointments', { doctorId: doc._id, consultationType: type, ...form })
      // When online payment is required, the booking is only confirmed after
      // the customer pays and the payment is verified server-side.
      if (data.requiresPayment) {
        await payForBooking({
          type: 'appointment',
          id: data.appointment._id,
          name: form.patientName,
          contact: form.patientPhone,
          description: `${type} consultation — ${doc.name}`,
        })
      }
      setDone(true)
      showToast({ title: 'Appointment confirmed 🎉', subtitle: 'Our team will confirm the slot shortly.', tone: 'success' })
    } catch (err) {
      if (err.message === PAYMENT_DISMISSED) {
        showToast({ title: 'Payment cancelled — your appointment is not booked yet', tone: 'info' })
      } else {
        showToast({ title: err.response?.data?.message || err.message || 'Could not book. Try again.', tone: 'info' })
      }
    } finally {
      setBooking(false)
    }
  }

  return (
    <div className="container-x py-6">
      <Link to="/doctors" className="mb-4 inline-flex items-center gap-2 text-sm text-slate-500 hover:text-primary">
        <FaArrowLeft /> All Doctors
      </Link>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: profile */}
        <div className="space-y-5 lg:col-span-2">
          <div className="card p-5">
            <div className="flex gap-4">
              <div className="h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-lightbg">
                {doc.photo ? (
                  <img src={doc.photo} onError={imgFallback} alt={doc.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-primary"><FaUserMd size={38} /></div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-xl font-bold text-dark">{doc.name}</h1>
                <p className="text-sm text-slate-500">{doc.qualifications}</p>
                {doc.experience > 0 && <p className="mt-0.5 text-sm text-slate-500">{doc.experience}+ years experience</p>}
                <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
                  {doc.rating > 0 && (
                    <span className="flex items-center gap-1 font-semibold text-amber-500">
                      <FaStar size={13} /> {doc.rating} <span className="font-normal text-slate-400">({doc.numReviews})</span>
                    </span>
                  )}
                  {doc.languages?.length > 0 && (
                    <span className="flex items-center gap-1 text-slate-500">
                      <FaLanguage /> {doc.languages.join(', ')}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {doc.about && (
            <div className="card p-5">
              <h2 className="mb-2 font-bold text-dark">About Doctor</h2>
              <p className="text-sm leading-relaxed text-slate-600">{doc.about}</p>
            </div>
          )}

          {/* Consultation types */}
          <div className="card p-5">
            <h2 className="mb-3 font-bold text-dark">Consultation Types</h2>
            <div className="space-y-2.5">
              {TYPES.map(({ id, label, Icon, feeKey }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setType(id)}
                  className={`flex w-full items-center justify-between rounded-xl border p-3 text-left transition ${
                    type === id ? 'border-primary bg-primary/5' : 'border-bordergray hover:border-primary'
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${type === id ? 'bg-primary text-white' : 'bg-lightbg text-primary'}`}>
                      <Icon size={15} />
                    </span>
                    <span className="text-sm font-semibold text-dark">{label}</span>
                  </span>
                  <span className="text-sm font-bold text-dark">₹{Math.round(doc[feeKey] || doc.fee || 0)}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right: booking */}
        <div className="lg:col-span-1">
          <div className="card sticky top-28 p-5">
            {done ? (
              <div className="py-6 text-center">
                <FaCheckCircle className="mx-auto text-emerald-500" size={44} />
                <h3 className="mt-3 text-lg font-bold">Appointment requested</h3>
                <p className="mt-1 text-sm text-slate-500">
                  We've received your request for a {type} consultation with {doc.name}. Our team will
                  confirm the slot shortly.
                </p>
                <Link to="/doctors" className="btn-outline mt-5 w-full">Consult another doctor</Link>
              </div>
            ) : (
              <form onSubmit={book} className="space-y-3">
                <h3 className="text-lg font-bold">Book Appointment</h3>
                <div className="flex items-center justify-between rounded-lg bg-lightbg px-3 py-2 text-sm">
                  <span className="capitalize text-slate-600">{type} consultation</span>
                  <span className="font-bold text-primary">₹{Math.round(feeFor(type))}</span>
                </div>
                <input className="input-base" placeholder="Patient name *" value={form.patientName} onChange={(e) => set('patientName', e.target.value)} required />
                <input className="input-base" placeholder="Phone number" value={form.patientPhone} onChange={(e) => set('patientPhone', e.target.value)} />
                <input className="input-base" type="email" placeholder="Email" value={form.patientEmail} onChange={(e) => set('patientEmail', e.target.value)} />
                <div className="grid grid-cols-2 gap-2">
                  <input className="input-base" type="date" value={form.preferredDate} onChange={(e) => set('preferredDate', e.target.value)} />
                  <input className="input-base" type="time" value={form.preferredTime} onChange={(e) => set('preferredTime', e.target.value)} />
                </div>
                <textarea className="input-base" rows={2} placeholder="Describe your problem (optional)" value={form.note} onChange={(e) => set('note', e.target.value)} />
                <button type="submit" disabled={booking} className="btn-primary w-full">
                  {booking
                    ? 'Booking…'
                    : feeFor(type) >= 1
                    ? `Pay ₹${Math.round(feeFor(type))} & Book`
                    : 'Book Appointment'}
                </button>
                <p className="text-center text-[11px] text-slate-400">
                  Pay securely online to confirm your appointment. Our team will then finalise the slot.
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
