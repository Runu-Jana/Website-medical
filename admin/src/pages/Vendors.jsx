import { useEffect, useState } from 'react';
import { FiShoppingBag, FiCheck, FiX, FiSlash, FiPhone, FiMail } from 'react-icons/fi';
import api from '../lib/api.js';
import { useToast } from '../context/ToastContext.jsx';
import Loader from '../components/Loader.jsx';
import EmptyState from '../components/EmptyState.jsx';

const badge = {
  pending: 'bg-amber-100 text-amber-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  suspended: 'bg-slate-200 text-slate-500',
};

export default function Vendors() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [vendors, setVendors] = useState([]);
  const [pending, setPending] = useState(0);
  const [filter, setFilter] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/vendors', { params: filter ? { status: filter } : {} });
      setVendors(data.vendors || []);
      setPending(data.pending || 0);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load vendors');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [filter]);

  const setStatus = async (id, status) => {
    try {
      await api.put(`/vendors/${id}`, { status });
      setVendors((v) => v.map((x) => (x._id === id ? { ...x, status } : x)));
      toast.success(`Vendor ${status}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not update');
    }
  };
  const setCommission = async (id, commissionPercent) => {
    try {
      await api.put(`/vendors/${id}`, { commissionPercent });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not update');
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Vendors / Sellers</h2>
          <p className="text-sm text-slate-500">{pending} awaiting approval · {vendors.length} shown</p>
        </div>
        <select value={filter} onChange={(e) => setFilter(e.target.value)} className="input w-auto">
          <option value="">All statuses</option>
          {['pending', 'approved', 'rejected', 'suspended'].map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="card"><Loader label="Loading vendors..." /></div>
      ) : vendors.length === 0 ? (
        <div className="card"><EmptyState icon={FiShoppingBag} title="No sellers yet" message="Vendor applications will appear here." /></div>
      ) : (
        <div className="space-y-3">
          {vendors.map((v) => (
            <div key={v._id} className="card p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-800">{v.shopName}</h3>
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize ${badge[v.status] || ''}`}>{v.status}</span>
                    <span className="text-xs text-slate-400">{v.productCount} product{v.productCount === 1 ? '' : 's'}</span>
                  </div>
                  <p className="mt-0.5 text-sm text-slate-600">{v.ownerName}</p>
                  <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                    {v.email && <span className="flex items-center gap-1"><FiMail size={11} /> {v.email}</span>}
                    {v.phone && <span className="flex items-center gap-1"><FiPhone size={11} /> {v.phone}</span>}
                    {v.licenseNumber && <span>Licence: {v.licenseNumber}</span>}
                    {v.gstin && <span>GSTIN: {v.gstin}</span>}
                  </div>
                  {v.address && <p className="mt-1 text-xs text-slate-400">{v.address}</p>}
                </div>
                <div className="flex flex-col items-end gap-2">
                  <label className="flex items-center gap-1 text-xs text-slate-500">
                    Commission %
                    <input
                      type="number"
                      defaultValue={v.commissionPercent}
                      onBlur={(e) => setCommission(v._id, e.target.value)}
                      className="input w-20 py-1"
                    />
                  </label>
                  <div className="flex gap-2">
                    {v.status !== 'approved' && (
                      <button onClick={() => setStatus(v._id, 'approved')} className="inline-flex items-center gap-1 rounded-lg bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-700 hover:bg-green-100"><FiCheck size={13} /> Approve</button>
                    )}
                    {v.status !== 'suspended' && v.status === 'approved' && (
                      <button onClick={() => setStatus(v._id, 'suspended')} className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-200"><FiSlash size={13} /> Suspend</button>
                    )}
                    {v.status !== 'rejected' && v.status !== 'approved' && (
                      <button onClick={() => setStatus(v._id, 'rejected')} className="inline-flex items-center gap-1 rounded-lg bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100"><FiX size={13} /> Reject</button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
