import { useEffect, useState } from 'react';
import { FiFileText, FiTrash2, FiExternalLink } from 'react-icons/fi';
import api, { API_URL } from '../lib/api.js';
import { useToast } from '../context/ToastContext.jsx';
import Loader from '../components/Loader.jsx';
import EmptyState from '../components/EmptyState.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';

const STATUSES = ['pending', 'reviewed', 'quoted', 'completed'];
const resolveImg = (u) => (!u ? '' : u.startsWith('http') ? u : `${API_URL}${u.startsWith('/') ? '' : '/'}${u}`);
const formatDate = (d) => (d ? new Date(d).toLocaleString() : '');

export default function Prescriptions() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [delTarget, setDelTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/prescriptions');
      setItems(data || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load prescriptions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setStatus = async (rx, status) => {
    try {
      await api.put(`/prescriptions/${rx._id}`, { status });
      setItems((list) => list.map((r) => (r._id === rx._id ? { ...r, status } : r)));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    }
  };

  const confirmDelete = async () => {
    if (!delTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/prescriptions/${delTarget._id}`);
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
      <div>
        <h2 className="text-xl font-bold text-slate-800">Prescriptions</h2>
        <p className="text-sm text-slate-500">{items.length} uploaded by customers</p>
      </div>

      {loading ? (
        <div className="card">
          <Loader label="Loading prescriptions..." />
        </div>
      ) : items.length === 0 ? (
        <div className="card">
          <EmptyState icon={FiFileText} title="No prescriptions yet" message="Customer uploads will appear here." />
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((rx) => (
            <div key={rx._id} className="card flex flex-col gap-4 p-3 sm:flex-row sm:items-center">
              <a
                href={resolveImg(rx.fileUrl)}
                target="_blank"
                rel="noreferrer"
                className="relative flex h-24 w-full shrink-0 items-center justify-center overflow-hidden rounded-lg bg-slate-100 sm:w-32"
              >
                {rx.fileUrl ? (
                  <img src={resolveImg(rx.fileUrl)} alt="rx" className="h-full w-full object-cover" />
                ) : (
                  <FiFileText className="text-slate-300" size={28} />
                )}
              </a>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-slate-800">{rx.name || 'Customer'}</p>
                <p className="text-sm text-slate-500">{rx.phone || '—'}</p>
                {rx.note && <p className="mt-1 line-clamp-2 text-sm text-slate-500">{rx.note}</p>}
                <p className="mt-1 text-xs text-slate-400">{formatDate(rx.createdAt)}</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {rx.fileUrl && (
                  <a
                    href={resolveImg(rx.fileUrl)}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-lg bg-blue-50 p-2 text-primary hover:bg-blue-100"
                    title="Open file"
                  >
                    <FiExternalLink size={16} />
                  </a>
                )}
                <select
                  value={rx.status}
                  onChange={(e) => setStatus(rx, e.target.value)}
                  className="input w-auto py-1.5 text-sm capitalize"
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => setDelTarget(rx)}
                  className="rounded-lg bg-red-50 p-2 text-danger hover:bg-red-100"
                >
                  <FiTrash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!delTarget}
        onClose={() => setDelTarget(null)}
        onConfirm={confirmDelete}
        loading={deleting}
        title="Delete prescription"
        message="Remove this prescription upload?"
      />
    </div>
  );
}
