import { useEffect, useRef, useState, useCallback } from 'react';
import { FiBookmark, FiPlus, FiTrash2, FiCheck } from 'react-icons/fi';
import api from '../lib/api.js';
import { useToast } from '../context/ToastContext.jsx';

// Named filter views (Airtable-style), shared across admins via the backend.
export default function SavedViews({ scope = 'orders', current, onApply }) {
  const toast = useToast();
  const [views, setViews] = useState([]);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const ref = useRef(null);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get('/views', { params: { scope } });
      setViews(Array.isArray(data) ? data : []);
    } catch {
      /* ignore */
    }
  }, [scope]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const saveCurrent = async () => {
    const name = window.prompt('Name this view (e.g. "Dispatched COD orders")');
    if (!name || !name.trim()) return;
    setSaving(true);
    try {
      await api.post('/views', { scope, name: name.trim(), config: current });
      toast.success('View saved');
      await load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not save view');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Delete this saved view?')) return;
    try {
      await api.delete(`/views/${id}`);
      setViews((v) => v.filter((x) => x._id !== id));
    } catch {
      toast.error('Could not delete view');
    }
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
      >
        <FiBookmark size={15} /> Views{views.length ? ` (${views.length})` : ''}
      </button>

      {open && (
        <div className="absolute right-0 z-30 mt-2 w-64 rounded-xl border border-slate-200 bg-white p-2 shadow-xl">
          {views.length === 0 ? (
            <p className="px-2 py-3 text-sm text-slate-500">No saved views yet.</p>
          ) : (
            <ul className="max-h-64 overflow-y-auto">
              {views.map((v) => (
                <li key={v._id}>
                  <button
                    onClick={() => {
                      onApply(v.config || {});
                      setOpen(false);
                    }}
                    className="group flex w-full items-center justify-between gap-2 rounded-lg px-2 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      <FiCheck size={14} className="shrink-0 text-primary opacity-0 group-hover:opacity-60" />
                      <span className="truncate">{v.name}</span>
                    </span>
                    <span
                      onClick={(e) => remove(v._id, e)}
                      className="shrink-0 rounded p-1 text-slate-300 hover:bg-red-50 hover:text-red-500"
                      title="Delete view"
                    >
                      <FiTrash2 size={13} />
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          <button
            onClick={saveCurrent}
            disabled={saving}
            className="mt-1 flex w-full items-center gap-1.5 border-t border-slate-100 px-2 pt-2 text-sm font-semibold text-primary hover:underline"
          >
            <FiPlus size={15} /> {saving ? 'Saving…' : 'Save current filters as view'}
          </button>
        </div>
      )}
    </div>
  );
}
