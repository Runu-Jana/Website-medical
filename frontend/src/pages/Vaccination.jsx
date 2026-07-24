import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FaArrowLeft, FaSyringe, FaHome, FaClinicMedical, FaCheckCircle } from 'react-icons/fa'
import api from '../lib/api'
import Seo from '../components/Seo'

// Common vaccines we can arrange — informational + used in the request form.
const VACCINES = [
  'COVID-19', 'Influenza (Flu)', 'Typhoid', 'Hepatitis B', 'Tetanus (TT)',
  'HPV (Cervical Cancer)', 'Chickenpox (Varicella)', 'Pneumococcal', 'MMR',
  'Rabies', 'Child Immunization', 'Travel Vaccines',
]

export default function Vaccination() {
  const navigate = useNavigate()
  const [sent, setSent] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    name: '', phone: '', email: '', vaccine: VACCINES[0], service: 'Home visit', date: '', notes: '',
  })
  const on = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await api.post('/contact', {
        name: form.name,
        email: form.email,
        phone: form.phone,
        subject: `Vaccination request: ${form.vaccine}`,
        message:
          `Vaccine: ${form.vaccine}\n` +
          `Service: ${form.service}\n` +
          `Preferred date: ${form.date || 'Not specified'}\n` +
          `Patient: ${form.name} (${form.phone}${form.email ? `, ${form.email}` : ''})\n` +
          `Address / notes: ${form.notes || '—'}`,
      })
      setSent(true)
    } catch (err) {
      setError(err.response?.data?.message || 'Could not send your request. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="container-x py-6">
      <Seo title="Vaccination Services | DBL Life Care" description="Request a vaccination at home or at our clinic — flu, COVID-19, travel vaccines, child immunization and more." />

      <button
        type="button"
        onClick={() => navigate(-1)}
        aria-label="Back"
        className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-primary"
      >
        <FaArrowLeft size={16} /> Back
      </button>

      {/* Hero */}
      <div className="rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 p-7 text-white sm:p-10">
        <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20">
          <FaSyringe size={22} />
        </span>
        <h1 className="mt-4 text-2xl font-extrabold sm:text-3xl">Vaccination Services</h1>
        <p className="mt-2 max-w-lg text-sm text-white/90">
          Protect yourself and your family. Request a vaccination at home or at our clinic —
          our team will confirm your slot and arrange a qualified professional.
        </p>
      </div>

      {/* Vaccines we cover */}
      <h2 className="mt-8 text-lg font-bold text-dark">Vaccines we can arrange</h2>
      <div className="mt-3 flex flex-wrap gap-2">
        {VACCINES.map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => setForm((f) => ({ ...f, vaccine: v }))}
            className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
              form.vaccine === v
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-bordergray text-slate-600 hover:border-primary/50'
            }`}
          >
            {v}
          </button>
        ))}
      </div>

      {/* Request form */}
      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="space-y-3 text-sm text-slate-600 lg:col-span-1">
          <div className="card flex items-start gap-3 p-4">
            <FaHome className="mt-0.5 shrink-0 text-primary" />
            <div><b className="text-dark">At-home vaccination</b><p>A trained professional visits your home at your preferred time.</p></div>
          </div>
          <div className="card flex items-start gap-3 p-4">
            <FaClinicMedical className="mt-0.5 shrink-0 text-primary" />
            <div><b className="text-dark">At our clinic</b><p>Walk in at a scheduled slot — safe, hygienic and quick.</p></div>
          </div>
        </div>

        <div className="card p-6 lg:col-span-2">
          {sent ? (
            <div className="py-12 text-center">
              <FaCheckCircle className="mx-auto text-accent" size={40} />
              <h3 className="mt-3 text-xl font-bold text-dark">Request received!</h3>
              <p className="mx-auto mt-2 max-w-sm text-sm text-slate-500">
                Thank you. Our team will call you shortly to confirm your vaccination slot and details.
              </p>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium">Full name</label>
                  <input name="name" value={form.name} onChange={on} required className="input-base" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Phone</label>
                  <input name="phone" value={form.phone} onChange={on} required className="input-base" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Email (optional)</label>
                  <input name="email" type="email" value={form.email} onChange={on} className="input-base" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Vaccine</label>
                  <select name="vaccine" value={form.vaccine} onChange={on} className="input-base">
                    {VACCINES.map((v) => <option key={v} value={v}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Service</label>
                  <select name="service" value={form.service} onChange={on} className="input-base">
                    <option>Home visit</option>
                    <option>At clinic</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Preferred date</label>
                  <input name="date" type="date" value={form.date} onChange={on} className="input-base" />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Address / notes</label>
                <textarea name="notes" value={form.notes} onChange={on} rows={3} className="input-base" placeholder="Home address for a visit, or any details we should know." />
              </div>
              {error && <p className="text-sm text-red-500">{error}</p>}
              <button type="submit" disabled={submitting} className="btn-primary">
                {submitting ? 'Sending…' : 'Request vaccination'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
