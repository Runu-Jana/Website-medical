import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../lib/api'
import Spinner from '../components/Spinner'
import { useToast } from '../context/ToastContext'
import {
  FaFileMedical, FaFlask, FaPills, FaSyringe, FaNotesMedical, FaExclamationTriangle,
  FaArrowLeft, FaChevronRight, FaTrashAlt, FaExternalLinkAlt, FaUpload, FaFolderOpen,
} from 'react-icons/fa'

const pad = (n) => String(n).padStart(2, '0')

const CATS = [
  { id: 'prescription', label: 'Prescriptions', Icon: FaFileMedical, color: 'bg-blue-50 text-blue-600', desc: (n) => `${pad(n)} Records` },
  { id: 'lab-report', label: 'Lab Reports', Icon: FaFlask, color: 'bg-rose-50 text-rose-500', desc: (n) => `${pad(n)} Records` },
  { id: 'medicine', label: 'Medicines', Icon: FaPills, color: 'bg-teal-50 text-teal-600', desc: () => 'Ongoing & History' },
  { id: 'vaccination', label: 'Vaccination', Icon: FaSyringe, color: 'bg-sky-50 text-sky-600', desc: (n) => `${pad(n)} Records` },
  { id: 'allergy', label: 'Allergies', Icon: FaExclamationTriangle, color: 'bg-amber-50 text-amber-500', desc: (n) => `${pad(n)} Records` },
  { id: 'medical-history', label: 'Medical History', Icon: FaNotesMedical, color: 'bg-pink-50 text-pink-500', desc: () => 'View History' },
]
const catOf = (id) => CATS.find((c) => c.id === id)

export default function HealthRecords() {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [records, setRecords] = useState([])
  const [counts, setCounts] = useState({})
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState(null) // null = category list, or a category id
  const [showAdd, setShowAdd] = useState(false)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef(null)
  const [form, setForm] = useState({ category: 'prescription', title: '', recordDate: '', note: '', fileUrl: '' })

  const load = async () => {
    try {
      const { data } = await api.get('/health-records')
      setRecords(data.records || [])
      setCounts(data.counts || {})
    } catch {
      setRecords([])
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { load() }, [])

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const upload = async (file) => {
    if (!file) return
    if (file.size > 10 * 1024 * 1024) {
      showToast({ title: 'File too large', subtitle: 'Please upload a file under 10 MB.', tone: 'info' })
      return
    }
    const fd = new FormData()
    fd.append('images', file)
    setUploading(true)
    try {
      const { data } = await api.post('/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      const url = data.url || data.urls?.[0]
      if (url) { set('fileUrl', url); showToast({ title: 'File uploaded', tone: 'success' }) }
    } catch (err) {
      showToast({ title: err.response?.data?.message || 'Upload failed', tone: 'info' })
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const openAdd = () => {
    setForm({ category: view || 'prescription', title: '', recordDate: '', note: '', fileUrl: '' })
    setShowAdd(true)
  }

  const save = async (e) => {
    e.preventDefault()
    if (!form.title.trim() && !form.fileUrl) { showToast({ title: 'Add a title or a file', tone: 'info' }); return }
    setSaving(true)
    try {
      await api.post('/health-records', form)
      setShowAdd(false)
      showToast({ title: 'Record added', tone: 'success' })
      load()
    } catch (err) {
      showToast({ title: err.response?.data?.message || 'Could not save', tone: 'info' })
    } finally { setSaving(false) }
  }

  const remove = async (id) => {
    try { await api.delete(`/health-records/${id}`); load() } catch { /* ignore */ }
  }

  const recordsInView = view ? records.filter((r) => r.category === view) : []

  return (
    <div className="container-x py-4">
      <div className="mx-auto flex min-h-[70vh] max-w-lg flex-col">
        {/* Header */}
        <div className="relative mb-4 flex items-center">
          <button
            onClick={() => (view ? setView(null) : navigate(-1))}
            aria-label="Back"
            className="absolute left-0 rounded-full p-2 text-slate-600 hover:bg-lightbg"
          >
            <FaArrowLeft size={16} />
          </button>
          <h1 className="mx-auto text-lg font-bold text-dark">{view ? catOf(view)?.label : 'Health Records'}</h1>
        </div>

        {loading ? (
          <Spinner className="py-16" />
        ) : view ? (
          /* ── Records inside a category ── */
          <div className="flex-1 space-y-2">
            {recordsInView.length === 0 ? (
              <div className="card flex flex-col items-center gap-2 p-10 text-center text-slate-500">
                <FaFolderOpen size={30} className="text-slate-300" />
                <p className="text-sm">No {catOf(view)?.label.toLowerCase()} yet.</p>
              </div>
            ) : (
              recordsInView.map((r) => (
                <div key={r._id} className="card flex items-center gap-3 p-3.5">
                  <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${catOf(view)?.color}`}>
                    {(() => { const I = catOf(view)?.Icon; return I ? <I size={16} /> : null })()}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-dark">{r.title || 'Untitled record'}</p>
                    <p className="text-xs text-slate-400">{r.recordDate || new Date(r.createdAt).toLocaleDateString('en-IN')}{r.note ? ` · ${r.note}` : ''}</p>
                  </div>
                  {r.fileUrl && (
                    <a href={r.fileUrl} target="_blank" rel="noreferrer" className="rounded-lg bg-primary/10 p-2 text-primary hover:bg-primary/20" title="View file">
                      <FaExternalLinkAlt size={12} />
                    </a>
                  )}
                  <button onClick={() => remove(r._id)} className="p-2 text-slate-300 hover:text-red-500" title="Delete"><FaTrashAlt size={12} /></button>
                </div>
              ))
            )}
          </div>
        ) : (
          /* ── Category list ── */
          <div className="flex-1 space-y-3">
            {CATS.map((c) => (
              <button key={c.id} onClick={() => setView(c.id)} className="card flex w-full items-center gap-4 p-4 text-left transition hover:shadow-lift">
                <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${c.color}`}>
                  <c.Icon size={22} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-dark">{c.label}</p>
                  <p className="text-xs text-slate-400">{c.desc(counts[c.id] || 0)}</p>
                </div>
                <FaChevronRight className="text-slate-300" size={14} />
              </button>
            ))}
          </div>
        )}

        {/* Add New Record */}
        <button onClick={openAdd} className="btn-primary mt-5 w-full py-3 text-base">
          Add New Record
        </button>
      </div>

      {/* Add modal */}
      {showAdd && (
        <div className="fixed inset-0 z-[90] flex items-end justify-center bg-black/50 sm:items-center sm:p-4" onClick={() => setShowAdd(false)}>
          <div className="w-full max-w-md rounded-t-2xl bg-white p-5 sm:rounded-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold">Add Health Record</h3>
            <form onSubmit={save} className="mt-3 space-y-3">
              <select className="input-base" value={form.category} onChange={(e) => set('category', e.target.value)}>
                {CATS.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
              <input className="input-base" placeholder="Title (e.g. Dr. Gupta prescription)" value={form.title} onChange={(e) => set('title', e.target.value)} />
              <input className="input-base" type="date" value={form.recordDate} onChange={(e) => set('recordDate', e.target.value)} />
              <textarea className="input-base" rows={2} placeholder="Note (optional)" value={form.note} onChange={(e) => set('note', e.target.value)} />
              <div>
                <input ref={fileRef} type="file" accept="image/*,application/pdf" className="hidden" onChange={(e) => upload(e.target.files?.[0])} />
                <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-600 hover:border-primary hover:text-primary disabled:opacity-60">
                  <FaUpload size={13} /> {uploading ? 'Uploading…' : form.fileUrl ? 'Change file' : 'Upload file'}
                </button>
                {form.fileUrl && <span className="ml-2 text-xs text-emerald-600">✓ attached</span>}
                <p className="mt-1.5 text-xs text-slate-400">Accepted formats: PDF, JPG or PNG (max 10 MB).</p>
              </div>
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => setShowAdd(false)} className="btn-outline flex-1">Cancel</button>
                <button type="submit" disabled={saving} className="btn-primary flex-1">{saving ? 'Saving…' : 'Save Record'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
