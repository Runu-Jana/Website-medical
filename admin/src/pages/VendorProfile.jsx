import { useEffect, useState } from 'react';
import { FiShoppingBag, FiSave } from 'react-icons/fi';
import api from '../lib/api.js';
import { useToast } from '../context/ToastContext.jsx';
import Loader from '../components/Loader.jsx';

const F = ({ label, children }) => (<div><label className="label">{label}</label>{children}</div>);

export default function VendorProfile() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [vendor, setVendor] = useState(null);
  const [form, setForm] = useState({ shopName: '', ownerName: '', phone: '', licenseNumber: '', gstin: '', address: '' });
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  useEffect(() => {
    api.get('/vendors/me')
      .then(({ data }) => {
        setVendor(data);
        setForm({
          shopName: data.shopName || '', ownerName: data.ownerName || '', phone: data.phone || '',
          licenseNumber: data.licenseNumber || '', gstin: data.gstin || '', address: data.address || '',
        });
      })
      .catch((err) => toast.error(err.response?.data?.message || 'Failed to load profile'))
      .finally(() => setLoading(false));
    // eslint-disable-next-line
  }, []);

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await api.put('/vendors/me', form);
      setVendor(data);
      toast.success('Profile saved');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally { setSaving(false); }
  };

  if (loading) return <Loader label="Loading your shop..." />;

  const status = vendor?.status;
  const banner = {
    pending: { c: 'bg-amber-50 text-amber-800 border-amber-200', t: 'Your seller account is awaiting admin approval. You can set up your shop now, but your products go live only after approval.' },
    approved: { c: 'bg-green-50 text-green-800 border-green-200', t: 'Your shop is approved and live. Add products from the Products page.' },
    rejected: { c: 'bg-red-50 text-red-800 border-red-200', t: 'Your application was not approved. Please contact support.' },
    suspended: { c: 'bg-slate-100 text-slate-600 border-slate-200', t: 'Your shop is currently suspended. Your products are hidden from the store.' },
  }[status] || {};

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div className="flex items-center gap-2">
        <FiShoppingBag className="text-primary" size={22} />
        <h2 className="text-xl font-bold text-slate-800">My Shop</h2>
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold capitalize text-slate-600">{status}</span>
      </div>

      {banner.t && <div className={`rounded-lg border px-4 py-3 text-sm ${banner.c}`}>{banner.t}</div>}

      <form onSubmit={save} className="card space-y-4 p-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <F label="Shop Name"><input value={form.shopName} onChange={(e) => set('shopName', e.target.value)} className="input" /></F>
          <F label="Owner Name"><input value={form.ownerName} onChange={(e) => set('ownerName', e.target.value)} className="input" /></F>
          <F label="Phone"><input value={form.phone} onChange={(e) => set('phone', e.target.value)} className="input" /></F>
          <F label="Drug Licence No."><input value={form.licenseNumber} onChange={(e) => set('licenseNumber', e.target.value)} className="input" /></F>
          <F label="GSTIN"><input value={form.gstin} onChange={(e) => set('gstin', e.target.value)} className="input" /></F>
          <F label="Commission %"><input value={vendor?.commissionPercent ?? ''} disabled className="input bg-slate-50" /></F>
        </div>
        <F label="Address"><textarea rows={2} value={form.address} onChange={(e) => set('address', e.target.value)} className="input resize-y" /></F>
        <button type="submit" disabled={saving} className="btn-primary"><FiSave size={16} /> {saving ? 'Saving...' : 'Save Profile'}</button>
      </form>
    </div>
  );
}
