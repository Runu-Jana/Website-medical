import { useEffect, useRef, useState } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiImage, FiUploadCloud } from 'react-icons/fi';
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
  title: '',
  subtitle: '',
  badge: '',
  image: '',
  bgColor: '#fbe3ec',
  buttonText: 'Shop Now',
  link: '/shop',
  order: 0,
  active: true,
};

export default function Banners() {
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

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const uploadImage = async (file) => {
    if (!file) return;
    const fd = new FormData();
    fd.append('images', file);
    setUploading(true);
    try {
      const { data } = await api.post('/upload', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
      });
      const url = data.url || data.urls?.[0];
      if (url) {
        set('image', url);
        toast.success('Image uploaded');
      } else {
        toast.error('Upload returned no URL');
      }
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
      const { data } = await api.get('/banners');
      setItems(data || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load banners');
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
    setForm({ ...emptyForm, order: items.length + 1 });
    setModalOpen(true);
  };
  const openEdit = (b) => {
    setEditing(b);
    setForm({
      title: b.title || '',
      subtitle: b.subtitle || '',
      badge: b.badge || '',
      image: b.image || '',
      bgColor: b.bgColor || '#fbe3ec',
      buttonText: b.buttonText || 'Shop Now',
      link: b.link || '/shop',
      order: b.order ?? 0,
      active: b.active !== false,
    });
    setModalOpen(true);
  };

  const save = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) {
      toast.error('Title is required');
      return;
    }
    setSaving(true);
    const payload = { ...form, order: Number(form.order) || 0 };
    try {
      if (editing) {
        await api.put(`/banners/${editing._id}`, payload);
        toast.success('Banner updated');
      } else {
        await api.post('/banners', payload);
        toast.success('Banner created');
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
      await api.delete(`/banners/${delTarget._id}`);
      toast.success('Banner deleted');
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
          <h2 className="text-xl font-bold text-slate-800">Home Banners</h2>
          <p className="text-sm text-slate-500">
            {items.length} banner{items.length === 1 ? '' : 's'} · shown in the storefront hero
            slider
          </p>
        </div>
        <button onClick={openCreate} className="btn-primary">
          <FiPlus size={18} /> Add Banner
        </button>
      </div>

      {loading ? (
        <div className="card">
          <Loader label="Loading banners..." />
        </div>
      ) : items.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={FiImage}
            title="No banners yet"
            message="Create your first home-page banner."
          />
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((b) => (
            <div
              key={b._id}
              className="card flex flex-col gap-4 p-3 sm:flex-row sm:items-center"
            >
              <div
                className="relative flex h-24 w-full shrink-0 items-center justify-center overflow-hidden rounded-lg sm:w-44"
                style={{ backgroundColor: b.bgColor || '#f1f5f9' }}
              >
                {b.image ? (
                  <img
                    src={resolveImg(b.image)}
                    alt={b.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <FiImage className="text-slate-300" size={28} />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  {b.badge && (
                    <span className="rounded bg-red-500 px-2 py-0.5 text-[10px] font-bold uppercase text-white">
                      {b.badge}
                    </span>
                  )}
                  <span
                    className={`rounded px-2 py-0.5 text-[11px] font-semibold ${
                      b.active !== false
                        ? 'bg-green-100 text-green-700'
                        : 'bg-slate-200 text-slate-500'
                    }`}
                  >
                    {b.active !== false ? 'Active' : 'Hidden'}
                  </span>
                  <span className="text-xs text-slate-500">Order: {b.order ?? 0}</span>
                </div>
                <p className="mt-1 truncate font-semibold text-slate-800">{b.title}</p>
                <p className="truncate text-sm text-slate-500">{b.subtitle}</p>
              </div>
              <div className="flex shrink-0 gap-2">
                <button
                  onClick={() => openEdit(b)}
                  className="rounded-lg bg-blue-50 p-2 text-primary hover:bg-blue-100"
                >
                  <FiEdit2 size={16} />
                </button>
                <button
                  onClick={() => setDelTarget(b)}
                  className="rounded-lg bg-red-50 p-2 text-danger hover:bg-red-100"
                >
                  <FiTrash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Banner' : 'Add Banner'}
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
            <label className="label">Title *</label>
            <input
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
              className="input"
              placeholder="e.g. New Collagen Naturally"
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Subtitle</label>
              <input
                value={form.subtitle}
                onChange={(e) => set('subtitle', e.target.value)}
                className="input"
                placeholder="e.g. Orange Flavor Gummies"
              />
            </div>
            <div>
              <label className="label">Badge</label>
              <input
                value={form.badge}
                onChange={(e) => set('badge', e.target.value)}
                className="input"
                placeholder="e.g. HOT, Sale, New"
              />
            </div>
          </div>

          <div>
            <label className="label">Banner Image</label>
            <p className="mb-1.5 text-xs text-slate-500">
              Use a wide product photo — it fills the whole banner. Paste a URL or upload a file.
            </p>
            <input
              value={form.image}
              onChange={(e) => set('image', e.target.value)}
              className="input"
              placeholder="https://... or upload below"
            />
            <div className="mt-2">
              <input
                ref={fileRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp"
                className="hidden"
                onChange={(e) => uploadImage(e.target.files?.[0])}
              />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-600 transition hover:border-primary hover:text-primary disabled:opacity-60"
              >
                <FiUploadCloud size={16} />
                {uploading ? 'Uploading…' : 'Upload image'}
              </button>
            </div>
          </div>

          {form.image && (
            <div
              className="flex h-28 items-center justify-center overflow-hidden rounded-lg"
              style={{ backgroundColor: form.bgColor }}
            >
              <img
                src={resolveImg(form.image)}
                alt="preview"
                className="h-full w-full object-cover"
              />
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Background Colour</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={form.bgColor}
                  onChange={(e) => set('bgColor', e.target.value)}
                  className="h-10 w-12 shrink-0 cursor-pointer rounded border border-slate-200 bg-white"
                />
                <input
                  value={form.bgColor}
                  onChange={(e) => set('bgColor', e.target.value)}
                  className="input"
                  placeholder="#fbe3ec"
                />
              </div>
            </div>
            <div>
              <label className="label">Display Order</label>
              <input
                type="number"
                value={form.order}
                onChange={(e) => set('order', e.target.value)}
                className="input"
                placeholder="1"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Button Text</label>
              <input
                value={form.buttonText}
                onChange={(e) => set('buttonText', e.target.value)}
                className="input"
                placeholder="Shop Now"
              />
            </div>
            <div>
              <label className="label">Button Link</label>
              <input
                value={form.link}
                onChange={(e) => set('link', e.target.value)}
                className="input"
                placeholder="/shop"
              />
            </div>
          </div>

          <label className="flex cursor-pointer items-center justify-between rounded-lg border border-slate-200 px-3 py-2.5">
            <div>
              <span className="text-sm font-medium text-slate-700">Active</span>
              <p className="text-xs text-slate-500">Show this banner in the storefront slider.</p>
            </div>
            <button
              type="button"
              onClick={() => set('active', !form.active)}
              className={`relative h-6 w-11 rounded-full transition ${
                form.active ? 'bg-primary' : 'bg-slate-300'
              }`}
            >
              <span
                className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition ${
                  form.active ? 'left-[22px]' : 'left-0.5'
                }`}
              />
            </button>
          </label>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!delTarget}
        onClose={() => setDelTarget(null)}
        onConfirm={confirmDelete}
        loading={deleting}
        title="Delete banner"
        message={`Delete "${delTarget?.title}"?`}
      />
    </div>
  );
}
