import { useEffect, useRef, useState } from 'react'
import api from '../lib/api'
import Spinner from '../components/Spinner'
import { useToast } from '../context/ToastContext'
import {
  FaFileMedical, FaFlask, FaPills, FaSyringe, FaNotesMedical, FaExclamationTriangle,
  FaPlus, FaTrashAlt, FaExternalLinkAlt, FaUpload,
} from 'react-icons/fa'

const CATS = [
  { id: 'prescription', label: 'Prescriptions', Icon: FaFileMedical, color: 'bg-sky-100 text-sky-600' },
  { id: 'lab-report', label: 'Lab Reports', Icon: FaFlask, color: 'bg-violet-100 text-violet-600' },
  { id: 'medicine', label: 'Medicines', Icon: FaPills, color: 'bg-emerald-100 text-emerald-600' },
  { id: 'vaccination', label: 'Vaccination', Icon: FaSyringe, color: 'bg-amber-100 text-amber-600' },
  { id: 'allergy', label: 'Allergies', Icon: FaExclamationTriangle, color: 'bg-rose-100 text-rose-600' },
  { id: 'medical-history', label: 'Medical History', Icon: FaNotesMedical, color: 'bg-indigo-100 text-indigo-600' },
]
const labelOf = (id) => CATS.find((c) => c.id === id)?.label || id

export default function HealthRecords() {
  const { showToast } = useToast()
  const [records, setRecords] = useState([])
  const [counts, setCounts] = useState({})
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('') // category id or ''
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

  const save = async (e) => {
    e.preventDefault()
    if (!form.title.trim() && !form.fileUrl) { showToast({ title: 'Add a title or a file', tone: 'info' }); return }
    setSaving(true)
    try {
      await api.post('/health-records', form)
      setShowAdd(false)
      setForm({ category: 'prescription', title: '', recordDate: '', note: '', fileUrl: '' })
      showToast({ title: 'Record added', tone: 'success' })
      load()
    } catch (err) {
      showToast({ title: err.response?.data?.message || 'Could not save', tone: 'info' })
    } finally { setSaving(false) }
  }

  const remove = async (id) => {
    try { await api.delete(`/health-records/${id}`); setRecords((r) => r.filter((x) => x._id !== id)); load() }
    catch { /* ignore */ }
  }

  const shown = filter ? records.filter((r) => r.category === filter) : records

  return (
    <div className="container-x py-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-dark">Health Records</h1>
          <p className="text-sm text-slate-500">All your prescriptions, reports and history in one place.</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="btn-primary shrink-0"><FaPlus /> Add Record</button>
      </div>

      {/* Category tiles */}
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {CATS.map(({ id, label, Icon, color }) => (
          <button
            key={id}
            onClick={() => setFilter(filter === id ? '' : id)}
            className={`card flex items-center gap-3 p-4 text-left transition ${filter === id ? 'ring-2 ring-primary' : ''}`}
          >
            <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${color}`}><Icon size={18} /></span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-dark">{label}</p>
              <p className="text-xs text-slate-400">{counts[id] || 0} record{(counts[id] || 0) === 1 ? '' : 's'}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Records list */}
      <div className="mt-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold text-dark">{filter ? labelOf(filter) : 'All Records'}</h2>
          {filter && <button onClick={() => setFilter('')} className="text-sm font-semibold text-primary">Show all</button>}
        </div>
        {loading ? (
          <Spinner className="py-14" />
        ) : shown.length === 0 ? (
          <div className="card p-10 text-center text-sm text-slate-500">
            No records yet. Tap <b>Add Record</b> to upload your first one.
          </div>
        ) : (
          <div className="space-y-2">
            {shown.map((r) => (
              <div key={r._id} className="card flex items-center gap-3 p-4">
                <span className="rounded-lg bg-lightbg px-2 py-1 text-[10px] font-bold uppercase text-slate-500">{labelOf(r.category)}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-dark">{r.title || 'Untitled record'}</p>
                  <p className="text-xs text-slate-400">{r.recordDate || new Date(r.createdAt).toLocaleDateString('en-IN')}{r.note ? ` · ${r.note}` : ''}</p>
                </div>
                {r.fileUrl && (
                  <a href={r.fileUrl} target="_blank" rel="noreferrer" className="rounded-lg bg-primary/10 p-2 text-primary hover:bg-primary/20" title="View file">
                    <FaExternalLinkAlt size={13} />
                  </a>
                )}
                <button onClick={() => remove(r._id)} className="p-2 text-slate-300 hover:text-red-500" title="Delete"><FaTrashAlt size={13} /></button>
              </div>
            ))}
          </div>
        )}
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
