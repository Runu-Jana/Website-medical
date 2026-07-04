import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../lib/api'
import { useAuth } from '../context/AuthContext'
import { waLink, telLink } from '../config/site'
import {
  FaPrescriptionBottleAlt,
  FaQuestionCircle,
  FaUserMd,
  FaFlask,
  FaHeadset,
  FaWhatsapp,
  FaCloudUploadAlt,
  FaCheckCircle,
  FaArrowRight,
  FaTimes,
} from 'react-icons/fa'


const quickActions = [
  { icon: FaPrescriptionBottleAlt, label: 'Request Medicine', to: '/shop' },
  { icon: FaQuestionCircle, label: 'Ask Question', to: '/contact' },
  { icon: FaUserMd, label: 'Doctor Appointment', to: '/contact' },
  { icon: FaFlask, label: 'Lab Tests', to: '/shop?keyword=lab' },
]

export default function PrescriptionUpload() {
  const { user } = useAuth()
  const fileRef = useRef(null)
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState('')
  const [uploadedUrl, setUploadedUrl] = useState('')
  const [form, setForm] = useState({
    name: user?.name && user.name !== 'Customer' ? user.name : '',
    phone: user?.phone || '',
    note: '',
  })
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  const pickFile = async (f) => {
    if (!f) return
    setError('')
    setFile(f)
    setPreview(f.type.startsWith('image/') ? URL.createObjectURL(f) : '')
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('images', f)
      const { data } = await api.post('/upload', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
      })
      setUploadedUrl(data.url || data.urls?.[0] || '')
    } catch (err) {
      setError(err.response?.data?.message || 'Upload failed. Please try a clear photo.')
      setFile(null)
      setPreview('')
    } finally {
      setUploading(false)
    }
  }

  const clearFile = () => {
    setFile(null)
    setPreview('')
    setUploadedUrl('')
    if (fileRef.current) fileRef.current.value = ''
  }

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    if (!uploadedUrl && !form.note.trim()) {
      setError('Please upload your prescription or tell us what you need.')
      return
    }
    setSubmitting(true)
    try {
      await api.post('/prescriptions', { ...form, fileUrl: uploadedUrl })
      setDone(true)
    } catch (err) {
      setError(err.response?.data?.message || 'Could not submit. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="container-x py-8">
      {/* Hero */}
      <div className="mb-6 overflow-hidden rounded-2xl bg-gradient-to-r from-primary to-primaryDark p-8 text-white sm:p-10">
        <h1 className="text-2xl font-extrabold sm:text-3xl">Take Care of Your Health</h1>
        <p className="mt-2 max-w-lg text-sm text-white/90">
          With our trusted pharmacy — upload your prescription and get up to 60% off on genuine
          medicines delivered to your door.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Upload card */}
        <div className="lg:col-span-2">
          <div className="card p-6 sm:p-8">
            <h2 className="text-xl font-bold text-dark">Upload Prescription</h2>
            <p className="mt-1 text-sm text-slate-500">
              Upload your prescription and tell us what you need. We do the best!
            </p>

            {done ? (
              <div className="mt-6 flex flex-col items-center rounded-2xl bg-primary/5 py-12 text-center">
                <FaCheckCircle className="text-primary" size={48} />
                <p className="mt-4 text-lg font-bold text-dark">Prescription submitted!</p>
                <p className="mt-1 max-w-sm text-sm text-slate-500">
                  Our pharmacist will review it and contact you shortly with the available medicines
                  and pricing.
                </p>
                <button
                  onClick={() => {
                    setDone(false)
                    clearFile()
                    setForm((f) => ({ ...f, note: '' }))
                  }}
                  className="btn-outline mt-6"
                >
                  Upload another
                </button>
              </div>
            ) : (
              <form onSubmit={submit} className="mt-5 space-y-4">
                {/* Dropzone */}
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => fileRef.current?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault()
                    pickFile(e.dataTransfer.files?.[0])
                  }}
                  className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-bordergray bg-lightbg px-6 py-10 text-center transition hover:border-primary"
                >
                  {preview ? (
                    <div className="relative">
                      <img src={preview} alt="prescription" className="max-h-48 rounded-lg" />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          clearFile()
                        }}
                        className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white"
                      >
                        <FaTimes size={11} />
                      </button>
                    </div>
                  ) : (
                    <>
                      <FaCloudUploadAlt size={40} className="text-primary" />
                      <p className="mt-2 font-semibold text-dark">
                        {uploading ? 'Uploading…' : 'Click or drag your prescription here'}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">JPG, PNG (a clear photo works best)</p>
                    </>
                  )}
                  {file && !preview && (
                    <p className="mt-2 text-sm text-slate-600">{file.name}</p>
                  )}
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/webp"
                    className="hidden"
                    onChange={(e) => pickFile(e.target.files?.[0])}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium">Your name</label>
                    <input
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="input-base"
                      placeholder="Full name"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">Phone</label>
                    <input
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      className="input-base"
                      placeholder="For order updates"
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Tell us what you need (optional)
                  </label>
                  <textarea
                    rows={3}
                    value={form.note}
                    onChange={(e) => setForm({ ...form, note: e.target.value })}
                    className="input-base resize-y"
                    placeholder="e.g. quantity, brand preference, delivery instructions…"
                  />
                </div>

                {error && <p className="text-sm text-red-500">{error}</p>}

                <button type="submit" disabled={submitting || uploading} className="btn-primary w-full">
                  {submitting ? 'Submitting…' : 'Upload Now'} <FaArrowRight size={13} />
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Side: quick actions + contact */}
        <div className="space-y-6">
          <div className="card p-5">
            <h3 className="mb-4 font-bold text-dark">Other services</h3>
            <div className="grid grid-cols-2 gap-3">
              {quickActions.map((a) => (
                <Link
                  key={a.label}
                  to={a.to}
                  className="flex flex-col items-center gap-2 rounded-xl border border-bordergray p-4 text-center transition hover:border-primary hover:shadow-card"
                >
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <a.icon size={20} />
                  </span>
                  <span className="text-sm font-semibold text-dark">{a.label}</span>
                </Link>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3">
            <a
              href={telLink()}
              className="flex items-center justify-between rounded-2xl bg-amber-500 p-5 text-white"
            >
              <span className="text-lg font-bold">Call Us</span>
              <FaHeadset size={28} className="opacity-80" />
            </a>
            <a
              href={waLink()}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-between rounded-2xl bg-green-500 p-5 text-white"
            >
              <span className="text-lg font-bold">WhatsApp</span>
              <FaWhatsapp size={28} className="opacity-90" />
            </a>
          </div>

          <div className="overflow-hidden rounded-2xl bg-primaryDark p-6 text-white">
            <p className="text-2xl font-extrabold">Flat 25% OFF</p>
            <p className="text-sm text-white/90">on your first order + up to ₹500</p>
            <Link
              to="/shop"
              className="mt-4 inline-block rounded-full bg-white px-5 py-2 text-sm font-bold text-primary"
            >
              Order Now
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
