import { useEffect, useState, useCallback } from 'react';
import { FiMail, FiTrash2, FiDownload } from 'react-icons/fi';
import api from '../lib/api.js';
import { useToast } from '../context/ToastContext.jsx';
import Loader from '../components/Loader.jsx';
import EmptyState from '../components/EmptyState.jsx';
import Pagination from '../components/Pagination.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import { formatDateTime } from '../lib/format.js';

export default function Subscribers() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({ subscribers: [], page: 1, pages: 1, total: 0, active: 0 });
  const [page, setPage] = useState(1);
  const [delTarget, setDelTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [exporting, setExporting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/newsletter', { params: { page, limit: 25 } });
      setData({
        subscribers: data.subscribers || [],
        page: data.page || 1,
        pages: data.pages || 1,
        total: data.total || 0,
        active: data.active || 0,
      });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load subscribers');
    } finally {
      setLoading(false);
    }
  }, [page, toast]);

  useEffect(() => {
    load();
  }, [load]);

  const exportCsv = async () => {
    setExporting(true);
    try {
      const res = await api.get('/newsletter/export', { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([res.data], { type: 'text/csv' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = 'dbl-newsletter-subscribers.csv';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Export failed');
    } finally {
      setExporting(false);
    }
  };

  const confirmDelete = async () => {
    if (!delTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/newsletter/${delTarget._id}`);
      toast.success('Subscriber removed');
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
          <h2 className="text-xl font-bold text-slate-800">Newsletter</h2>
          <p className="text-sm text-slate-500">
            {data.total} subscribers · {data.active} active
          </p>
        </div>
        <button
          onClick={exportCsv}
          disabled={exporting || data.total === 0}
          className="btn-primary"
        >
          <FiDownload size={16} /> {exporting ? 'Exporting…' : 'Export CSV'}
        </button>
      </div>

      <div className="card">
        {loading ? (
          <Loader label="Loading subscribers..." />
        ) : data.subscribers.length === 0 ? (
          <EmptyState
            icon={FiMail}
            title="No subscribers yet"
            message="Emails from the storefront newsletter signup appear here."
          />
        ) : (
          <ul className="divide-y divide-slate-100">
            {data.subscribers.map((s) => (
              <li key={s._id} className="flex items-center gap-3 p-4 hover:bg-slate-50">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary">
                  <FiMail size={16} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-slate-800">{s.email}</p>
                  <p className="text-xs text-slate-400">
                    Subscribed {formatDateTime(s.createdAt)}
                    {!s.active && ' · unsubscribed'}
                  </p>
                </div>
                {!s.active && (
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
                    Inactive
                  </span>
                )}
                <button
                  onClick={() => setDelTarget(s)}
                  className="rounded-lg p-2 text-slate-500 hover:bg-red-50 hover:text-danger"
                  aria-label="Remove subscriber"
                  title="Remove"
                >
                  <FiTrash2 size={16} />
                </button>
              </li>
            ))}
          </ul>
        )}
        {!loading && data.subscribers.length > 0 && (
          <div className="border-t border-slate-100">
            <Pagination page={data.page} pages={data.pages} total={data.total} onChange={setPage} />
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!delTarget}
        onClose={() => setDelTarget(null)}
        onConfirm={confirmDelete}
        loading={deleting}
        title="Remove subscriber"
        message={`Remove ${delTarget?.email || 'this subscriber'} from the list?`}
      />
    </div>
  );
}
