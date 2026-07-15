import { useEffect, useState } from 'react';
import { FiClipboard, FiPhone, FiMail, FiMapPin } from 'react-icons/fi';
import api from '../lib/api.js';
import { useToast } from '../context/ToastContext.jsx';
import Loader from '../components/Loader.jsx';
import EmptyState from '../components/EmptyState.jsx';

const STATUSES = ['pending', 'confirmed', 'sample-collected', 'completed', 'cancelled'];
const badge = {
  pending: 'bg-amber-100 text-amber-700',
  confirmed: 'bg-blue-100 text-blue-700',
  'sample-collected': 'bg-violet-100 text-violet-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-slate-200 text-slate-500',
};

export default function LabBookings() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [pending, setPending] = useState(0);
  const [filter, setFilter] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/lab-bookings', { params: { limit: 100, ...(filter ? { status: filter } : {}) } });
      setItems(data.bookings || []); setPending(data.pending || 0);
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to load'); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [filter]);

  const setStatus = async (id, status) => {
    try { await api.put(`/lab-bookings/${id}`, { status }); setItems((l) => l.map((a) => (a._id === id ? { ...a, status } : a))); }
    catch (err) { toast.error(err.response?.data?.message || 'Could not update'); }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Lab Test Bookings</h2>
          <p className="text-sm text-slate-500">{pending} pending · {items.length} shown</p>
        </div>
        <select value={filter} onChange={(e) => setFilter(e.target.value)} className="input w-auto">
          <option value="">All statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div className="card overflow-hidden">
        {loading ? <Loader label="Loading..." /> : items.length === 0 ? (
          <EmptyState icon={FiClipboard} title="No bookings yet" message="Lab test bookings will appear here." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3">Patient</th><th className="px-4 py-3">Tests</th><th className="px-4 py-3">Collection</th>
                <th className="px-4 py-3">Total</th><th className="px-4 py-3">Payment</th><th className="px-4 py-3">Status</th>
              </tr></thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((a) => (
                  <tr key={a._id} className="align-top hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-800">{a.patientName}</p>
                      {a.patientPhone && <p className="flex items-center gap-1 text-xs text-slate-500"><FiPhone size={11} /> {a.patientPhone}</p>}
                      {a.patientEmail && <p className="flex items-center gap-1 text-xs text-slate-500"><FiMail size={11} /> {a.patientEmail}</p>}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {(a.items || []).map((i) => i.name).join(', ')}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {a.address && <p className="flex items-start gap-1"><FiMapPin size={11} className="mt-0.5" /> {a.address}</p>}
                      <p>{a.preferredDate} {a.preferredTime}</p>
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-700">₹{Math.round(a.total)}</td>
                    <td className="px-4 py-3">
                      {a.isPaid ? (
                        <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">Paid</span>
                      ) : (
                        <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-semibold text-slate-500">Unpaid</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <select value={a.status} onChange={(e) => setStatus(a._id, e.target.value)}
                        className={`rounded-lg px-2 py-1 text-xs font-semibold ${badge[a.status] || ''}`}>
                        {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
