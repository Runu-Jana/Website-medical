import { useEffect, useState, useCallback } from 'react';
import { FiRefreshCw } from 'react-icons/fi';
import api from '../lib/api.js';
import { useToast } from '../context/ToastContext.jsx';
import Loader from '../components/Loader.jsx';
import EmptyState from '../components/EmptyState.jsx';
import Pagination from '../components/Pagination.jsx';
import { formatDate } from '../lib/format.js';

const STATUS_STYLES = {
  scheduled: 'bg-amber-100 text-amber-700',
  sent: 'bg-emerald-100 text-emerald-700',
};

export default function Refills() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({ refills: [], page: 1, pages: 1, total: 0 });
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/refills', { params: { page, limit: 20 } });
      setData({
        refills: data.refills || [],
        page: data.page || 1,
        pages: data.pages || 1,
        total: data.total || 0,
      });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load refills');
    } finally {
      setLoading(false);
    }
  }, [page, toast]);

  useEffect(() => {
    load();
  }, [load]);

  const isDue = (r) => r.status === 'sent' || new Date(r.dueDate) <= new Date();

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-slate-800">Upcoming Refills</h2>
        <p className="text-sm text-slate-500">
          {data.total} active reminder(s) — customers are emailed automatically when due.
        </p>
      </div>

      <div className="card">
        {loading ? (
          <Loader label="Loading refills..." />
        ) : data.refills.length === 0 ? (
          <EmptyState
            icon={FiRefreshCw}
            title="No refill reminders yet"
            message="Reminders are created when an order is delivered."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-semibold">Product</th>
                  <th className="px-4 py-3 font-semibold">Customer</th>
                  <th className="px-4 py-3 font-semibold">Contact</th>
                  <th className="px-4 py-3 font-semibold">Due</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.refills.map((r) => (
                  <tr key={r._id} className={isDue(r) ? 'bg-amber-50/40' : ''}>
                    <td className="px-4 py-3 font-medium text-slate-800">{r.productName}</td>
                    <td className="px-4 py-3 text-slate-700">{r.customer?.name || '—'}</td>
                    <td className="px-4 py-3 text-slate-600">
                      <p>{r.customer?.email || '—'}</p>
                      <p className="text-xs text-slate-400">{r.customer?.phone || ''}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{formatDate(r.dueDate)}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block rounded-full px-2.5 py-1 text-xs font-semibold ${
                          STATUS_STYLES[r.status] || 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {r.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!loading && data.pages > 1 && (
          <div className="border-t border-slate-100">
            <Pagination page={data.page} pages={data.pages} total={data.total} onChange={setPage} />
          </div>
        )}
      </div>
    </div>
  );
}
