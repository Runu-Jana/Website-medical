import { useEffect, useRef, useState } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiFileText, FiUploadCloud } from 'react-icons/fi';
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
  category: 'Health',
  author: 'DCare Team',
  excerpt: '',
  content: '',
  image: '',
  published: true,
};

const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '';

export default function Posts() {
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
      const { data } = await api.get('/posts');
      setItems(data || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load posts');
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
  const openEdit = (p) => {
    setEditing(p);
    setForm({
      title: p.title || '',
      category: p.category || 'Health',
      author: p.author || 'DCare Team',
      excerpt: p.excerpt || '',
      content: p.content || '',
      image: p.image || '',
      published: p.published !== false,
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
    try {
      if (editing) {
        await api.put(`/posts/${editing._id}`, form);
        toast.success('Post updated');
      } else {
        await api.post('/posts', form);
        toast.success('Post created');
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
      await api.delete(`/posts/${delTarget._id}`);
      toast.success('Post deleted');
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
          <h2 className="text-xl font-bold text-slate-800">Blog Posts</h2>
          <p className="text-sm text-slate-500">
            {items.length} post{items.length === 1 ? '' : 's'} · shown on the storefront blog
          </p>
        </div>
        <button onClick={openCreate} className="btn-primary">
          <FiPlus size={18} /> Add Post
        </button>
      </div>

      {loading ? (
        <div className="card">
          <Loader label="Loading posts..." />
        </div>
      ) : items.length === 0 ? (
        <div className="card">
          <EmptyState icon={FiFileText} title="No posts yet" message="Write your first blog post." />
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((p) => (
            <div key={p._id} className="card flex flex-col gap-4 p-3 sm:flex-row sm:items-center">
              <div className="h-24 w-full shrink-0 overflow-hidden rounded-lg bg-slate-100 sm:w-40">
                {p.image ? (
                  <img src={resolveImg(p.image)} alt={p.title} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <FiFileText className="text-slate-300" size={28} />
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
                    {p.category}
                  </span>
                  <span
                    className={`rounded px-2 py-0.5 text-[11px] font-semibold ${
                      p.published !== false
                        ? 'bg-green-100 text-green-700'
                        : 'bg-slate-200 text-slate-500'
                    }`}
                  >
                    {p.published !== false ? 'Published' : 'Draft'}
                  </span>
                  <span className="text-xs text-slate-400">{formatDate(p.createdAt)}</span>
                </div>
                <p className="mt-1 truncate font-semibold text-slate-800">{p.title}</p>
                <p className="truncate text-sm text-slate-500">{p.excerpt}</p>
              </div>
              <div className="flex shrink-0 gap-2">
                <button
                  onClick={() => openEdit(p)}
                  className="rounded-lg bg-blue-50 p-2 text-primary hover:bg-blue-100"
                >
                  <FiEdit2 size={16} />
                </button>
                <button
                  onClick={() => setDelTarget(p)}
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
        title={editing ? 'Edit Post' : 'Add Post'}
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
              placeholder="e.g. 5 Daily Habits for a Stronger Immune System"
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Category</label>
              <input
                value={form.category}
                onChange={(e) => set('category', e.target.value)}
                className="input"
                placeholder="e.g. Wellness"
              />
            </div>
            <div>
              <label className="label">Author</label>
              <input
                value={form.author}
                onChange={(e) => set('author', e.target.value)}
                className="input"
                placeholder="e.g. Dr. Sarah Lin"
              />
            </div>
          </div>

          <div>
            <label className="label">Cover Image</label>
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
            {form.image && (
              <div className="mt-2 h-32 overflow-hidden rounded-lg bg-slate-50">
                <img src={resolveImg(form.image)} alt="preview" className="h-full w-full object-cover" />
              </div>
            )}
          </div>

          <div>
            <label className="label">Excerpt</label>
            <textarea
              value={form.excerpt}
              onChange={(e) => set('excerpt', e.target.value)}
              rows={2}
              className="input resize-y"
              placeholder="A short summary shown on the blog list..."
            />
          </div>

          <div>
            <label className="label">Content</label>
            <textarea
              value={form.content}
              onChange={(e) => set('content', e.target.value)}
              rows={8}
              className="input resize-y"
              placeholder="Write the full article here. Blank lines start new paragraphs."
            />
          </div>

          <label className="flex cursor-pointer items-center justify-between rounded-lg border border-slate-200 px-3 py-2.5">
            <div>
              <span className="text-sm font-medium text-slate-700">Published</span>
              <p className="text-xs text-slate-400">Show this post on the storefront blog.</p>
            </div>
            <button
              type="button"
              onClick={() => set('published', !form.published)}
              className={`relative h-6 w-11 rounded-full transition ${
                form.published ? 'bg-primary' : 'bg-slate-300'
              }`}
            >
              <span
                className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition ${
                  form.published ? 'left-[22px]' : 'left-0.5'
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
        title="Delete post"
        message={`Delete "${delTarget?.title}"?`}
      />
    </div>
  );
}
