import { useEffect, useState } from 'react';
import { FiPlus, FiEdit2, FiTrash2 } from 'react-icons/fi';
import { FaFlask } from 'react-icons/fa';
import api from '../lib/api.js';
import { useToast } from '../context/ToastContext.jsx';
import Loader from '../components/Loader.jsx';
import EmptyState from '../components/EmptyState.jsx';
import Modal from '../components/Modal.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';

const emptyForm = {
  name: '', category: 'test', price: '', oldPrice: '', parameters: '',
  sampleType: 'Blood', reportTime: '24 hours', fasting: false, popular: true,
  active: true, order: '', description: '',
};
const F = ({ label, children }) => (<div><label className="label">{label}</label>{children}</div>);

export default function LabTests() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [delTarget, setDelTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const load = async () => {
    setLoading(true);
    try { const { data } = await api.get('/lab-tests/admin/list'); setItems(data || []); }
    catch (err) { toast.error(err.response?.data?.message || 'Failed to load'); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  const openCreate = () => { setEditing(null); setForm(emptyForm); setModalOpen(true); };
  const openEdit = (t) => {
    setEditing(t);
    setForm({
      name: t.name || '', category: t.category || 'test', price: t.price ?? '', oldPrice: t.oldPrice ?? '',
      parameters: t.parameters ?? '', sampleType: t.sampleType || '', reportTime: t.reportTime || '',
      fasting: !!t.fasting, popular: !!t.popular, active: t.active !== false, order: t.order ?? '',
      description: t.description || '',
    });
    setModalOpen(true);
  };

  const save = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('Name is required');
    setSaving(true);
    const payload = {
      ...form,
      price: Number(form.price) || 0, oldPrice: Number(form.oldPrice) || 0,
      parameters: Number(form.parameters) || 0, order: Number(form.order) || 0,
    };
    try {
      if (editing) { await api.put(`/lab-tests/${editing._id}`, payload); toast.success('Updated'); }
      else { await api.post('/lab-tests', payload); toast.success('Added'); }
      setModalOpen(false); load();
    } catch (err) { toast.error(err.response?.data?.message || 'Save failed'); }
    finally { setSaving(false); }
  };

  const confirmDelete = async () => {
    if (!delTarget) return;
    setDeleting(true);
    try { await api.delete(`/lab-tests/${delTarget._id}`); toast.success('Removed'); setDelTarget(null); load(); }
    catch (err) { toast.error(err.response?.data?.message || 'Delete failed'); }
    finally { setDeleting(false); }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Lab Tests & Packages</h2>
          <p className="text-sm text-slate-500">{items.length} item{items.length === 1 ? '' : 's'}</p>
        </div>
        <button onClick={openCreate} className="btn-primary"><FiPlus size={18} /> Add Test / Package</button>
      </div>

      <div className="card overflow-hidden">
        {loading ? <Loader label="Loading..." /> : items.length === 0 ? (
          <EmptyState icon={FaFlask} title="No tests yet" message="Add your first lab test or package." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3">Name</th><th className="px-4 py-3">Type</th><th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Popular</th><th className="px-4 py-3">Active</th><th className="px-4 py-3 text-right">Actions</th>
              </tr></thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((t) => (
                  <tr key={t._id} className="hover:bg-slate-50">
                    <td className="px-4 py-3"><p className="font-semibold text-slate-800">{t.name}</p>{t.parameters > 0 && <p className="text-xs text-slate-400">{t.parameters} tests</p>}</td>
                    <td className="px-4 py-3 capitalize text-slate-600">{t.category}</td>
                    <td className="px-4 py-3 text-slate-700">₹{t.price}{t.oldPrice > t.price && <span className="ml-1 text-xs text-slate-400 line-through">₹{t.oldPrice}</span>}</td>
                    <td className="px-4 py-3">{t.popular ? '⭐' : '—'}</td>
                    <td className="px-4 py-3">{t.active !== false ? <span className="text-green-600">Active</span> : <span className="text-slate-400">Hidden</span>}</td>
                    <td className="px-4 py-3"><div className="flex justify-end gap-2">
                      <button onClick={() => openEdit(t)} className="rounded-lg bg-blue-50 p-2 text-primary hover:bg-blue-100"><FiEdit2 size={14} /></button>
                      <button onClick={() => setDelTarget(t)} className="rounded-lg bg-red-50 p-2 text-danger hover:bg-red-100"><FiTrash2 size={14} /></button>
                    </div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Test' : 'Add Test / Package'}
        footer={<>
          <button className="btn-ghost" onClick={() => setModalOpen(false)} disabled={saving}>Cancel</button>
          <button className="btn-primary" onClick={save} disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
        </>}>
        <div className="space-y-4">
          <F label="Name *"><input value={form.name} onChange={(e) => set('name', e.target.value)} className="input" placeholder="Full Body Checkup" /></F>
          <div className="grid grid-cols-2 gap-4">
            <F label="Type"><select value={form.category} onChange={(e) => set('category', e.target.value)} className="input"><option value="test">Single Test</option><option value="package">Package</option></select></F>
            <F label="Tests included (package)"><input type="number" value={form.parameters} onChange={(e) => set('parameters', e.target.value)} className="input" placeholder="72" /></F>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <F label="Price (₹)"><input type="number" value={form.price} onChange={(e) => set('price', e.target.value)} className="input" placeholder="999" /></F>
            <F label="MRP (₹)"><input type="number" value={form.oldPrice} onChange={(e) => set('oldPrice', e.target.value)} className="input" placeholder="1600" /></F>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <F label="Sample"><input value={form.sampleType} onChange={(e) => set('sampleType', e.target.value)} className="input" placeholder="Blood" /></F>
            <F label="Report time"><input value={form.reportTime} onChange={(e) => set('reportTime', e.target.value)} className="input" placeholder="24 hours" /></F>
            <F label="Order"><input type="number" value={form.order} onChange={(e) => set('order', e.target.value)} className="input" placeholder="1" /></F>
          </div>
          <F label="Description"><textarea rows={2} value={form.description} onChange={(e) => set('description', e.target.value)} className="input resize-y" /></F>
          <div className="grid grid-cols-3 gap-2">
            {[['fasting', 'Fasting'], ['popular', 'Popular'], ['active', 'Active']].map(([k, l]) => (
              <label key={k} className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm">
                <input type="checkbox" checked={form[k]} onChange={(e) => set(k, e.target.checked)} className="h-4 w-4 rounded text-primary" /> {l}
              </label>
            ))}
          </div>
        </div>
      </Modal>

      <ConfirmDialog open={!!delTarget} onClose={() => setDelTarget(null)} onConfirm={confirmDelete}
        loading={deleting} title="Delete test" message={`Delete "${delTarget?.name}"?`} />
    </div>
  );
}
