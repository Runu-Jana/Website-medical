import { useState } from 'react'
import { FaMapMarkerAlt, FaPhoneAlt, FaEnvelope, FaClock } from 'react-icons/fa'
import { siteConfig } from '../config/site'
import api from '../lib/api'

const info = [
  { icon: FaMapMarkerAlt, title: 'Address', text: '123 Health Street, Medical City' },
  { icon: FaPhoneAlt, title: 'Phone', text: siteConfig.phone },
  { icon: FaEnvelope, title: 'Email', text: siteConfig.email },
  { icon: FaClock, title: 'Hours', text: 'Open 24/7' },
]

export default function Contact() {
  const [sent, setSent] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '' })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const on = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await api.post('/contact', form)
      setSent(true)
    } catch (err) {
      setError(err.response?.data?.message || 'Could not send. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="container-x py-10">
      <h1 className="text-3xl font-bold">Contact Us</h1>
      <p className="mt-2 text-sm text-slate-500">
        We'd love to hear from you. Reach out anytime.
      </p>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-1">
          {info.map((i) => (
            <div key={i.title} className="card flex items-start gap-3 p-5">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <i.icon size={18} />
              </span>
              <div>
                <h4 className="text-sm font-bold">{i.title}</h4>
                <p className="text-sm text-slate-500">{i.text}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="card p-6 lg:col-span-2">
          {sent ? (
            <div className="py-12 text-center">
              <h3 className="text-xl font-bold text-accent">Message Sent!</h3>
              <p className="mt-2 text-sm text-slate-500">
                Thank you for reaching out. We'll get back to you soon.
              </p>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium">Name</label>
                  <input name="name" value={form.name} onChange={on} required className="input-base" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Email</label>
                  <input name="email" type="email" value={form.email} onChange={on} required className="input-base" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Phone (optional)</label>
                  <input name="phone" value={form.phone} onChange={on} className="input-base" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Subject</label>
                  <input name="subject" value={form.subject} onChange={on} required className="input-base" />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Message</label>
                <textarea name="message" value={form.message} onChange={on} required rows={5} className="input-base" />
              </div>
              {error && <p className="text-sm text-red-500">{error}</p>}
              <button type="submit" disabled={submitting} className="btn-primary">
                {submitting ? 'Sending…' : 'Send Message'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
