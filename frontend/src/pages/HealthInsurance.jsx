import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FaArrowLeft, FaShieldAlt, FaCheckCircle } from 'react-icons/fa'
import api from '../lib/api'
import Seo from '../components/Seo'

const COVERAGE = ['Individual', 'Family Floater', 'Senior Citizen', 'Critical Illness', 'Not sure — need advice']

const BENEFITS = [
  'Guidance on choosing the right plan for your needs',
  'Cashless hospitalisation options',
  'Coverage for the whole family',
  'Help with claims and paperwork',
]

export default function HealthInsurance() {
  const navigate = useNavigate()
  const [sent, setSent] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ name: '', phone: '', email: '', age: '', coverage: COVERAGE[0], notes: '' })
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
        subject: `Health insurance enquiry: ${form.coverage}`,
        message:
          `Coverage interest: ${form.coverage}\n` +
          `Age: ${form.age || 'Not specified'}\n` +
          `Contact: ${form.name} (${form.phone}${form.email ? `, ${form.email}` : ''})\n` +
          `Notes: ${form.notes || '—'}`,
      })
      setSent(true)
    } catch (err) {
      setError(err.response?.data?.message || 'Could not send your enquiry. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="container-x py-6">
      <Seo title="Health Insurance | DBL Life Care" description="Get expert help choosing the right health insurance plan for you and your family." />

      <button
        type="button"
        onClick={() => navigate(-1)}
        aria-label="Back"
        className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-primary"
      >
        <FaArrowLeft size={16} /> Back
      </button>

      {/* Hero */}
      <div className="rounded-2xl bg-gradient-to-r from-indigo-500 to-blue-600 p-7 text-white sm:p-10">
        <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20">
          <FaShieldAlt size={22} />
        </span>
        <h1 className="mt-4 text-2xl font-extrabold sm:text-3xl">Health Insurance</h1>
        <p className="mt-2 max-w-lg text-sm text-white/90">
          Not sure which plan is right for you? Share a few details and our team will help you
          find suitable health insurance coverage for you and your family.
        </p>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <h2 className="text-lg font-bold text-dark">How we help</h2>
          <ul className="mt-3 space-y-2 text-sm text-slate-600">
            {BENEFITS.map((b) => (
              <li key={b} className="flex items-start gap-2">
                <FaCheckCircle className="mt-0.5 shrink-0 text-accent" /> {b}
              </li>
            ))}
          </ul>
        </div>

        <div className="card p-6 lg:col-span-2">
          {sent ? (
            <div className="py-12 text-center">
              <FaCheckCircle className="mx-auto text-accent" size={40} />
              <h3 className="mt-3 text-xl font-bold text-dark">Enquiry received!</h3>
              <p className="mx-auto mt-2 max-w-sm text-sm text-slate-500">
                Thanks for reaching out. Our team will contact you soon to discuss suitable insurance options.
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
                  <label className="mb-1 block text-sm font-medium">Age (optional)</label>
                  <input name="age" value={form.age} onChange={on} className="input-base" />
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-sm font-medium">Coverage interest</label>
                  <select name="coverage" value={form.coverage} onChange={on} className="input-base">
                    {COVERAGE.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Anything else? (optional)</label>
                <textarea name="notes" value={form.notes} onChange={on} rows={3} className="input-base" placeholder="Family size, existing conditions, budget — anything that helps us advise you." />
              </div>
              {error && <p className="text-sm text-red-500">{error}</p>}
              <button type="submit" disabled={submitting} className="btn-primary">
                {submitting ? 'Sending…' : 'Get insurance help'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
