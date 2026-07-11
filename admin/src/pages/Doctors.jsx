import { useEffect, useRef, useState } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiUploadCloud } from 'react-icons/fi';
import { FaUserMd } from 'react-icons/fa';
import api, { API_URL } from '../lib/api.js';
import { useToast } from '../context/ToastContext.jsx';
import Loader from '../components/Loader.jsx';
import EmptyState from '../components/EmptyState.jsx';
import Modal from '../components/Modal.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';

const resolveImg = (u) => {
  if (!u) return '';
  if (u.startsWith('http')) return u;
  return `${API_URL}${u.startsWith('/') ? '' : '/'}${u}`;
};

const emptyForm = {
  name: '', photo: '', specialty: '', qualifications: '', experience: '',
  languages: '', fee: '', videoFee: '', audioFee: '', chatFee: '',
  about: '', rating: '', numReviews: '', order: '', active: true,
};

const F = ({ label, children }) => (
  <div>
    <label className="label">{label}</label>
    {children}
  </div>
);

export default function Doctors() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [delTarget, setDelTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const uploadPhoto = async (file) => {
    if (!file) return;
    const fd = new FormData();
    fd.append('images', file);
    setUploading(true);
    try {
      const { data } = await api.post('/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      const url = data.url || data.urls?.[0];
      if (url) { set('photo', url); toast.success('Photo uploaded'); }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/doctors/admin/list');
      setItems(data || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load doctors');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  const openCreate = () => { setEditing(null); setForm(emptyForm); setModalOpen(true); };
  const openEdit = (d) => {
    setEditing(d);
    setForm({
      name: d.name || '', photo: d.photo || '', specialty: d.specialty || '',
      qualifications: d.qualifications || '', experience: d.experience ?? '',
      languages: Array.isArray(d.languages) ? d.languages.join(', ') : (d.languages || ''),
      fee: d.fee ?? '', videoFee: d.videoFee ?? '', audioFee: d.audioFee ?? '', chatFee: d.chatFee ?? '',
      about: d.about || '', rating: d.rating ?? '', numReviews: d.numReviews ?? '',
      order: d.order ?? '', active: d.active !== false,
    });
    setModalOpen(true);
  };

  const save = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('Name is required');
    setSaving(true);
    const payload = {
      ...form,
      experience: Number(form.experience) || 0,
      fee: Number(form.fee) || 0,
      videoFee: Number(form.videoFee) || 0,
      audioFee: Number(form.audioFee) || 0,
      chatFee: Number(form.chatFee) || 0,
      rating: Number(form.rating) || 0,
      numReviews: Number(form.numReviews) || 0,
      order: Number(form.order) || 0,
      languages: form.languages.split(',').map((s) => s.trim()).filter(Boolean),
    };
    try {
      if (editing) { await api.put(`/doctors/${editing._id}`, payload); toast.success('Doctor updated'); }
      else { await api.post('/doctors', payload); toast.success('Doctor added'); }
      setModalOpen(false); load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally { setSaving(false); }
  };

  const confirmDelete = async () => {
    if (!delTarget) return;
    setDeleting(true);
    try { await api.delete(`/doctors/${delTarget._id}`); toast.success('Doctor removed'); setDelTarget(null); load(); }
    catch (err) { toast.error(err.response?.data?.message || 'Delete failed'); }
    finally { setDeleting(false); }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Doctors</h2>
          <p className="text-sm text-slate-500">{items.length} doctor{items.length === 1 ? '' : 's'} · shown on the Consult a Doctor page</p>
        </div>
        <button onClick={openCreate} className="btn-primary"><FiPlus size={18} /> Add Doctor</button>
      </div>

      {loading ? (
        <div className="card"><Loader label="Loading doctors..." /></div>
      ) : items.length === 0 ? (
        <div className="card"><EmptyState icon={FaUserMd} title="No doctors yet" message="Add your first doctor." /></div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((d) => (
            <div key={d._id} className="card flex gap-3 p-3">
              <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                {d.photo ? <img src={resolveImg(d.photo)} alt={d.name} className="h-full w-full object-cover" /> :
                  <div className="flex h-full w-full items-center justify-center text-slate-300"><FaUserMd size={24} /></div>}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate font-semibold text-slate-800">{d.name}</p>
                  {d.active === false && <span className="rounded bg-slate-200 px-1.5 text-[10px] font-semibold text-slate-500">Hidden</span>}
                </div>
                <p className="truncate text-xs text-slate-500">{d.specialty}</p>
                <p className="text-xs text-slate-400">₹{d.fee} · {d.experience}y</p>
                <div className="mt-2 flex gap-2">
                  <button onClick={() => openEdit(d)} className="rounded-lg bg-blue-50 p-1.5 text-primary hover:bg-blue-100"><FiEdit2 size={14} /></button>
                  <button onClick={() => setDelTarget(d)} className="rounded-lg bg-red-50 p-1.5 text-danger hover:bg-red-100"><FiTrash2 size={14} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Doctor' : 'Add Doctor'}
        footer={<>
          <button className="btn-ghost" onClick={() => setModalOpen(false)} disabled={saving}>Cancel</button>
          <button className="btn-primary" onClick={save} disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
        </>}>
        <div className="space-y-4">
          <F label="Name *"><input value={form.name} onChange={(e) => set('name', e.target.value)} className="input" placeholder="Dr. Ramesh Gupta" /></F>
          <div className="grid grid-cols-2 gap-4">
            <F label="Specialty"><input value={form.specialty} onChange={(e) => set('specialty', e.target.value)} className="input" placeholder="General Physician" /></F>
            <F label="Experience (years)"><input type="number" value={form.experience} onChange={(e) => set('experience', e.target.value)} className="input" placeholder="10" /></F>
          </div>
          <F label="Qualifications"><input value={form.qualifications} onChange={(e) => set('qualifications', e.target.value)} className="input" placeholder="MBBS, MD - General Physician" /></F>
          <F label="Languages (comma separated)"><input value={form.languages} onChange={(e) => set('languages', e.target.value)} className="input" placeholder="Hindi, English" /></F>

          <div>
            <label className="label">Photo</label>
            <input value={form.photo} onChange={(e) => set('photo', e.target.value)} className="input" placeholder="https://... or upload" />
            <div className="mt-2">
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => uploadPhoto(e.target.files?.[0])} />
              <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-600 hover:border-primary hover:text-primary disabled:opacity-60">
                <FiUploadCloud size={16} /> {uploading ? 'Uploading…' : 'Upload photo'}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <F label="Base Fee (₹)"><input type="number" value={form.fee} onChange={(e) => set('fee', e.target.value)} className="input" placeholder="399" /></F>
            <F label="Video Fee"><input type="number" value={form.videoFee} onChange={(e) => set('videoFee', e.target.value)} className="input" placeholder="399" /></F>
            <F label="Audio Fee"><input type="number" value={form.audioFee} onChange={(e) => set('audioFee', e.target.value)} className="input" placeholder="299" /></F>
            <F label="Chat Fee"><input type="number" value={form.chatFee} onChange={(e) => set('chatFee', e.target.value)} className="input" placeholder="199" /></F>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <F label="Rating"><input type="number" step="0.1" value={form.rating} onChange={(e) => set('rating', e.target.value)} className="input" placeholder="4.8" /></F>
            <F label="Reviews"><input type="number" value={form.numReviews} onChange={(e) => set('numReviews', e.target.value)} className="input" placeholder="1200" /></F>
            <F label="Order"><input type="number" value={form.order} onChange={(e) => set('order', e.target.value)} className="input" placeholder="1" /></F>
          </div>
          <F label="About"><textarea rows={3} value={form.about} onChange={(e) => set('about', e.target.value)} className="input resize-y" placeholder="About the doctor…" /></F>

          <label className="flex cursor-pointer items-center justify-between rounded-lg border border-slate-200 px-3 py-2.5">
            <span className="text-sm font-medium text-slate-700">Active (visible to customers)</span>
            <button type="button" onClick={() => set('active', !form.active)}
              className={`relative h-6 w-11 rounded-full transition ${form.active ? 'bg-primary' : 'bg-slate-300'}`}>
              <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition ${form.active ? 'left-[22px]' : 'left-0.5'}`} />
            </button>
          </label>
        </div>
      </Modal>

      <ConfirmDialog open={!!delTarget} onClose={() => setDelTarget(null)} onConfirm={confirmDelete}
        loading={deleting} title="Delete doctor" message={`Delete "${delTarget?.name}"?`} />
    </div>
  );
}
