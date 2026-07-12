import { useEffect, useState } from 'react';
import { FiDollarSign } from 'react-icons/fi';
import api from '../lib/api.js';
import { useToast } from '../context/ToastContext.jsx';
import Loader from '../components/Loader.jsx';
import EmptyState from '../components/EmptyState.jsx';
import Modal from '../components/Modal.jsx';

const money = (n) => `₹${Math.round(Number(n) || 0).toLocaleString('en-IN')}`;

export default function Settlements() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [payTarget, setPayTarget] = useState(null);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/vendors/settlements');
      setRows(data.vendors || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load settlements');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  const openPay = (v) => { setPayTarget(v); setAmount(String(v.outstanding > 0 ? v.outstanding : '')); setNote(''); };
  const recordPayout = async () => {
    if (!payTarget) return;
    const amt = Number(amount);
    if (!amt || amt <= 0) return toast.error('Enter a valid amount');
    setSaving(true);
    try {
      await api.post(`/vendors/${payTarget._id}/payouts`, { amount: amt, note });
      toast.success('Payout recorded');
      setPayTarget(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not record payout');
    } finally { setSaving(false); }
  };

  const totalOutstanding = rows.reduce((s, r) => s + (r.outstanding > 0 ? r.outstanding : 0), 0);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Vendor Settlements</h2>
          <p className="text-sm text-slate-500">Total outstanding to sellers: <b>{money(totalOutstanding)}</b></p>
        </div>
      </div>

      <div className="card overflow-hidden">
        {loading ? <Loader label="Loading settlements..." /> : rows.length === 0 ? (
          <EmptyState icon={FiDollarSign} title="No vendors yet" message="Seller earnings will appear here." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-3">Seller</th>
                  <th className="px-4 py-3 text-right">Gross sales</th>
                  <th className="px-4 py-3 text-right">Commission</th>
                  <th className="px-4 py-3 text-right">Net earned</th>
                  <th className="px-4 py-3 text-right">Paid</th>
                  <th className="px-4 py-3 text-right">Outstanding</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((r) => (
                  <tr key={r._id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-800">{r.shopName}</p>
                      <p className="text-xs text-slate-400 capitalize">{r.status} · {r.commissionPercent}% commission</p>
                    </td>
                    <td className="px-4 py-3 text-right text-slate-700">{money(r.grossSales)}</td>
                    <td className="px-4 py-3 text-right text-slate-500">−{money(r.commission)}</td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-800">{money(r.netEarned)}</td>
                    <td className="px-4 py-3 text-right text-slate-500">{money(r.totalPaid)}</td>
                    <td className={`px-4 py-3 text-right font-bold ${r.outstanding > 0 ? 'text-emerald-600' : 'text-slate-400'}`}>{money(r.outstanding)}</td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => openPay(r)} className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90">
                        Record Payout
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal
        open={!!payTarget}
        onClose={() => setPayTarget(null)}
        title={`Record payout — ${payTarget?.shopName || ''}`}
        footer={<>
          <button className="btn-ghost" onClick={() => setPayTarget(null)} disabled={saving}>Cancel</button>
          <button className="btn-primary" onClick={recordPayout} disabled={saving}>{saving ? 'Saving...' : 'Record Payout'}</button>
        </>}
      >
        <div className="space-y-4">
          <p className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">
            Outstanding: <b>{money(payTarget?.outstanding)}</b>. Record what you've paid this seller (bank transfer / UPI done outside the app).
          </p>
          <div>
            <label className="label">Amount (₹)</label>
            <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="input" placeholder="0" />
          </div>
          <div>
            <label className="label">Note / reference (optional)</label>
            <input value={note} onChange={(e) => setNote(e.target.value)} className="input" placeholder="UPI ref, date, etc." />
          </div>
        </div>
      </Modal>
    </div>
  );
}
