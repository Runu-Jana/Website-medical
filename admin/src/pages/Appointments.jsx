import { useEffect, useState } from 'react';
import { FiCalendar, FiPhone, FiMail } from 'react-icons/fi';
import api from '../lib/api.js';
import { useToast } from '../context/ToastContext.jsx';
import Loader from '../components/Loader.jsx';
import EmptyState from '../components/EmptyState.jsx';

const STATUSES = ['pending', 'confirmed', 'completed', 'cancelled'];
// Colour the text (not the background) by status; cancelled is red.
const statusColor = {
  pending: 'text-amber-600',
  confirmed: 'text-blue-600',
  completed: 'text-green-600',
  cancelled: 'text-red-600',
};

export default function Appointments() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [pending, setPending] = useState(0);
  const [filter, setFilter] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/appointments', { params: { limit: 100, ...(filter ? { status: filter } : {}) } });
      setItems(data.appointments || []);
      setPending(data.pending || 0);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load appointments');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [filter]);

  const setStatus = async (id, status) => {
    try {
      await api.put(`/appointments/${id}`, { status });
      setItems((list) => list.map((a) => (a._id === id ? { ...a, status } : a)));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not update');
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Consultation Bookings</h2>
          <p className="text-sm text-slate-500">{pending} pending · {items.length} shown</p>
        </div>
        <select value={filter} onChange={(e) => setFilter(e.target.value)} className="input w-auto">
          <option value="">All statuses</option>
          {STATUSES.map((s) => <option key={s} value={s} className="capitalize">{s}</option>)}
        </select>
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <Loader label="Loading appointments..." />
        ) : items.length === 0 ? (
          <EmptyState icon={FiCalendar} title="No bookings yet" message="Consultation requests will appear here." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-3">Patient</th>
                  <th className="px-4 py-3">Doctor</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Preferred</th>
                  <th className="px-4 py-3">Fee</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((a) => (
                  <tr key={a._id} className="align-top hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-800">{a.patientName}</p>
                      <p className="flex items-center gap-1 text-xs text-slate-500">{a.patientPhone && <><FiPhone size={11} /> {a.patientPhone}</>}</p>
                      <p className="flex items-center gap-1 text-xs text-slate-500">{a.patientEmail && <><FiMail size={11} /> {a.patientEmail}</>}</p>
                      {a.note && <p className="mt-1 max-w-xs text-xs text-slate-400">{a.note}</p>}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-700">{a.doctorName}</p>
                      <p className="text-xs text-slate-400">{a.specialty}</p>
                    </td>
                    <td className="px-4 py-3 capitalize text-slate-600">{a.consultationType}</td>
                    <td className="px-4 py-3 text-slate-600">
                      {a.preferredDate || '—'}<br /><span className="text-xs text-slate-400">{a.preferredTime}</span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-700">₹{Math.round(a.fee)}</td>
                    <td className="px-4 py-3">
                      <select
                        value={a.status}
                        onChange={(e) => setStatus(a._id, e.target.value)}
                        className={`rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold capitalize focus:border-primary focus:outline-none ${statusColor[a.status] || 'text-slate-700'}`}
                      >
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
