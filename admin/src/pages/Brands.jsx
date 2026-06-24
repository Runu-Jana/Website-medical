import { useEffect, useRef, useState } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiAward, FiUploadCloud } from 'react-icons/fi';
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

const emptyForm = { name: '', logo: '' };

export default function Brands() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [delTarget, setDelTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const logoInputRef = useRef(null);

  const uploadLogo = async (file) => {
    if (!file) return;
    const fd = new FormData();
    fd.append('images', file);
    setUploadingLogo(true);
    try {
      const { data } = await api.post('/upload', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const url = data.url || data.urls?.[0];
      if (url) {
        setForm((f) => ({ ...f, logo: url }));
        toast.success('Logo uploaded');
      } else {
        toast.error('Upload returned no URL');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploadingLogo(false);
      if (logoInputRef.current) logoInputRef.current.value = '';
    }
  };

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/brands');
      setItems(data || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load brands');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  };
  const openEdit = (b) => {
    setEditing(b);
    setForm({ name: b.name || '', logo: b.logo || '' });
    setModalOpen(true);
  };

  const save = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error('Name is required');
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await api.put(`/brands/${editing._id}`, form);
        toast.success('Brand updated');
      } else {
        await api.post('/brands', form);
        toast.success('Brand created');
      }
      setModalOpen(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!delTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/brands/${delTarget._id}`);
      toast.success('Brand deleted');
      setDelTarget(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Brands</h2>
          <p className="text-sm text-slate-500">{items.length} brands</p>
        </div>
        <button onClick={openCreate} className="btn-primary">
          <FiPlus size={18} /> Add Brand
        </button>
      </div>

      <div className="card">
        {loading ? (
          <Loader label="Loading brands..." />
        ) : items.length === 0 ? (
          <EmptyState icon={FiAward} title="No brands yet" message="Create your first brand." />
        ) : (
          <div className="grid grid-cols-2 gap-4 p-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {items.map((b) => (
              <div key={b._id} className="group relative rounded-xl border border-slate-200 p-4 text-center hover:shadow-card">
                <div className="mx-auto flex h-16 w-16 items-center justify-center overflow-hidden rounded-lg bg-slate-100">
                  {b.logo ? (
                    <img src={resolveImg(b.logo)} alt={b.name} className="h-full w-full object-contain" />
                  ) : (
                    <FiAward className="text-slate-300" size={26} />
                  )}
                </div>
                <p className="mt-3 truncate font-medium text-slate-800">{b.name}</p>
                <p className="truncate text-xs text-slate-400">{b.slug}</p>
                <div className="mt-3 flex justify-center gap-2 opacity-0 transition group-hover:opacity-100">
                  <button
                    onClick={() => openEdit(b)}
                    className="rounded-lg bg-blue-50 p-2 text-primary hover:bg-blue-100"
                  >
                    <FiEdit2 size={15} />
                  </button>
                  <button
                    onClick={() => setDelTarget(b)}
                    className="rounded-lg bg-red-50 p-2 text-danger hover:bg-red-100"
                  >
                    <FiTrash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Brand' : 'Add Brand'}
        footer={
          <>
            <button className="btn-ghost" onClick={() => setModalOpen(false)} disabled={saving}>
              Cancel
            </button>
            <button className="btn-primary" onClick={save} disabled={saving}>
              {saving ? 'Saving...' : 'Save'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="label">Name *</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input" placeholder="e.g. Pfizer" />
          </div>
          <div>
            <label className="label">Logo URL</label>
            <input value={form.logo} onChange={(e) => setForm({ ...form, logo: e.target.value })} className="input" placeholder="https://..." />
            <div className="mt-2">
              <input
                ref={logoInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp"
                className="hidden"
                onChange={(e) => uploadLogo(e.target.files?.[0])}
              />
              <button
                type="button"
                onClick={() => logoInputRef.current?.click()}
                disabled={uploadingLogo}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-600 transition hover:border-primary hover:text-primary disabled:opacity-60"
              >
                <FiUploadCloud size={16} />
                {uploadingLogo ? 'Uploading…' : 'Upload logo (PNG / JPG / JPEG)'}
              </button>
            </div>
          </div>
          {form.logo && (
            <div className="flex h-20 items-center justify-center rounded-lg border border-slate-200 bg-slate-50">
              <img src={resolveImg(form.logo)} alt="preview" className="max-h-16 object-contain" />
            </div>
          )}
        </div>
      </Modal>

      <ConfirmDialog
        open={!!delTarget}
        onClose={() => setDelTarget(null)}
        onConfirm={confirmDelete}
        loading={deleting}
        title="Delete brand"
        message={`Delete "${delTarget?.name}"?`}
      />
    </div>
  );
}
