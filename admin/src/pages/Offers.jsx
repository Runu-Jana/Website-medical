import { useEffect, useState } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiTag, FiZap, FiSearch, FiX } from 'react-icons/fi';
import api from '../lib/api.js';
import { useToast } from '../context/ToastContext.jsx';
import Loader from '../components/Loader.jsx';
import EmptyState from '../components/EmptyState.jsx';
import Modal from '../components/Modal.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';

const emptyForm = {
  code: '',
  description: '',
  type: 'percent',
  value: '',
  maxDiscount: '',
  minOrder: '',
  scope: 'all',
  productIds: [],
  categoryIds: [],
  usageLimit: '',
  perUserLimit: '',
  startsAt: '',
  endsAt: '',
  active: true,
  showOnHome: false,
  stackable: true,
};

const toLocalInput = (d) => (d ? new Date(d).toISOString().slice(0, 16) : '');

const Field = ({ label, children, hint }) => (
  <div>
    <label className="label">{label}</label>
    {children}
    {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
  </div>
);

const Switch = ({ label, checked, onChange, hint }) => (
  <label className="flex cursor-pointer items-center justify-between rounded-lg border border-slate-200 px-3 py-2.5">
    <div>
      <span className="text-sm font-medium text-slate-700">{label}</span>
      {hint && <p className="text-xs text-slate-500">{hint}</p>}
    </div>
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 shrink-0 rounded-full transition ${checked ? 'bg-primary' : 'bg-slate-300'}`}
    >
      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition ${checked ? 'left-[22px]' : 'left-0.5'}`} />
    </button>
  </label>
);

export default function Offers() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [aiEnabled, setAiEnabled] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [aiBusy, setAiBusy] = useState(false);
  const [delTarget, setDelTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Product picker (for scope = products)
  const [prodQuery, setProdQuery] = useState('');
  const [prodResults, setProdResults] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]); // [{id, name}]

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const load = async () => {
    setLoading(true);
    try {
      const [cpns, cats] = await Promise.all([api.get('/coupons/admin'), api.get('/categories')]);
      setItems(cpns.data || []);
      setCategories(cats.data || []);
      api.get('/ai/status').then(({ data }) => setAiEnabled(!!data.enabled)).catch(() => {});
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load offers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounced product search when scope = products.
  useEffect(() => {
    if (form.scope !== 'products' || !prodQuery.trim()) {
      setProdResults([]);
      return;
    }
    const t = setTimeout(async () => {
      try {
        const { data } = await api.get('/products/admin', { params: { keyword: prodQuery, limit: 8 } });
        setProdResults(data.products || []);
      } catch {
        setProdResults([]);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [prodQuery, form.scope]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setSelectedProducts([]);
    setProdQuery('');
    setModalOpen(true);
  };

  const openEdit = (c) => {
    setEditing(c);
    setForm({
      code: c.code || '',
      description: c.description || '',
      type: c.type || 'percent',
      value: c.value ?? '',
      maxDiscount: c.maxDiscount || '',
      minOrder: c.minOrder || '',
      scope: c.scope || 'all',
      productIds: c.productIds || [],
      categoryIds: c.categoryIds || [],
      usageLimit: c.usageLimit || '',
      perUserLimit: c.perUserLimit || '',
      startsAt: toLocalInput(c.startsAt),
      endsAt: toLocalInput(c.endsAt),
      active: c.active !== false,
      showOnHome: !!c.showOnHome,
      stackable: c.stackable !== false,
    });
    setSelectedProducts([]);
    setProdQuery('');
    setModalOpen(true);
  };

  const toggleCategory = (id) =>
    setForm((f) => ({
      ...f,
      categoryIds: f.categoryIds.includes(id)
        ? f.categoryIds.filter((c) => c !== id)
        : [...f.categoryIds, id],
    }));

  const addProduct = (p) => {
    if (!form.productIds.includes(p._id)) {
      set('productIds', [...form.productIds, p._id]);
      setSelectedProducts((s) => [...s, { id: p._id, name: p.name }]);
    }
    setProdQuery('');
    setProdResults([]);
  };
  const removeProduct = (id) => {
    set('productIds', form.productIds.filter((p) => p !== id));
    setSelectedProducts((s) => s.filter((p) => p.id !== id));
  };

  const generateAI = async () => {
    setAiBusy(true);
    try {
      const { data } = await api.post('/coupons/ai-suggest', { brief: form.description });
      setForm((f) => ({
        ...f,
        code: data.code || f.code,
        description: data.description || f.description,
        type: data.type || f.type,
        value: data.value ?? f.value,
        maxDiscount: data.maxDiscount ?? f.maxDiscount,
        minOrder: data.minOrder ?? f.minOrder,
      }));
      toast.success('AI drafted an offer — review and save.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'AI suggestion failed');
    } finally {
      setAiBusy(false);
    }
  };

  const save = async (e) => {
    e.preventDefault();
    if (!form.code.trim()) return toast.error('Coupon code is required');
    if (!form.value || Number(form.value) <= 0) return toast.error('Enter a discount value');
    setSaving(true);
    const payload = {
      ...form,
      value: Number(form.value),
      maxDiscount: form.maxDiscount === '' ? 0 : Number(form.maxDiscount),
      minOrder: form.minOrder === '' ? 0 : Number(form.minOrder),
      usageLimit: form.usageLimit === '' ? 0 : Number(form.usageLimit),
      perUserLimit: form.perUserLimit === '' ? 0 : Number(form.perUserLimit),
      startsAt: form.startsAt || null,
      endsAt: form.endsAt || null,
      productIds: form.scope === 'products' ? form.productIds : [],
      categoryIds: form.scope === 'categories' ? form.categoryIds : [],
    };
    try {
      if (editing) {
        await api.put(`/coupons/${editing._id}`, payload);
        toast.success('Offer updated');
      } else {
        await api.post('/coupons', payload);
        toast.success('Offer created');
      }
      setModalOpen(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (c) => {
    try {
      await api.put(`/coupons/${c._id}`, { active: !c.active });
      setItems((list) => list.map((x) => (x._id === c._id ? { ...x, active: !c.active } : x)));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not update');
    }
  };

  const confirmDelete = async () => {
    if (!delTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/coupons/${delTarget._id}`);
      toast.success('Offer deleted');
      setDelTarget(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    } finally {
      setDeleting(false);
    }
  };

  const discountLabel = (c) =>
    c.type === 'percent' ? `${c.value}% off` : `₹${c.value} off`;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Offers & Coupons</h2>
          <p className="text-sm text-slate-500">{items.length} coupons</p>
        </div>
        <button onClick={openCreate} className="btn-primary">
          <FiPlus size={18} /> Create Offer
        </button>
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <Loader label="Loading offers..." />
        ) : items.length === 0 ? (
          <EmptyState icon={FiTag} title="No offers yet" message="Create your first coupon to start running promotions." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-3">Code</th>
                  <th className="px-4 py-3">Discount</th>
                  <th className="px-4 py-3">Conditions</th>
                  <th className="px-4 py-3">Used</th>
                  <th className="px-4 py-3">Homepage</th>
                  <th className="px-4 py-3">Active</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((c) => (
                  <tr key={c._id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <span className="rounded-md bg-slate-100 px-2 py-1 font-bold text-slate-800">{c.code}</span>
                      {c.description && <p className="mt-1 max-w-xs truncate text-xs text-slate-500">{c.description}</p>}
                    </td>
                    <td className="px-4 py-3 font-semibold text-emerald-600">{discountLabel(c)}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {c.minOrder > 0 && <div>Min ₹{c.minOrder}</div>}
                      {c.scope !== 'all' && <div className="capitalize">Scope: {c.scope}</div>}
                      {c.endsAt && <div>Ends {new Date(c.endsAt).toLocaleDateString('en-IN')}</div>}
                      {c.minOrder === 0 && c.scope === 'all' && !c.endsAt && <span>—</span>}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {c.usedCount}
                      {c.usageLimit > 0 ? ` / ${c.usageLimit}` : ''}
                    </td>
                    <td className="px-4 py-3">
                      {c.showOnHome ? (
                        <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-primary">Shown</span>
                      ) : (
                        <span className="text-xs text-slate-400">Hidden</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleActive(c)}
                        className={`relative h-5 w-9 rounded-full transition ${c.active ? 'bg-emerald-500' : 'bg-slate-300'}`}
                        aria-label="Toggle active"
                      >
                        <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition ${c.active ? 'left-[18px]' : 'left-0.5'}`} />
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => openEdit(c)} className="rounded-lg bg-blue-50 p-2 text-primary hover:bg-blue-100">
                          <FiEdit2 size={15} />
                        </button>
                        <button onClick={() => setDelTarget(c)} className="rounded-lg bg-red-50 p-2 text-danger hover:bg-red-100">
                          <FiTrash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Offer' : 'Create Offer'}
        footer={
          <>
            <button className="btn-ghost" onClick={() => setModalOpen(false)} disabled={saving}>
              Cancel
            </button>
            <button className="btn-primary" onClick={save} disabled={saving}>
              {saving ? 'Saving...' : 'Save Offer'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          {aiEnabled && (
            <button
              type="button"
              onClick={generateAI}
              disabled={aiBusy}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
            >
              <FiZap size={16} /> {aiBusy ? 'Drafting…' : 'Generate offer with AI'}
            </button>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Coupon Code *">
              <input value={form.code} onChange={(e) => set('code', e.target.value.toUpperCase())} className="input uppercase" placeholder="MONSOON20" />
            </Field>
            <Field label="Discount Type">
              <select value={form.type} onChange={(e) => set('type', e.target.value)} className="input">
                <option value="percent">Percentage (%)</option>
                <option value="fixed">Fixed amount (₹)</option>
              </select>
            </Field>
          </div>

          <Field label="Description" hint="Shown to customers and on the homepage promo panel.">
            <input value={form.description} onChange={(e) => set('description', e.target.value)} className="input" placeholder="20% off immunity essentials this monsoon" />
          </Field>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Field label={form.type === 'percent' ? 'Percentage *' : 'Amount (₹) *'}>
              <input type="number" min="0" value={form.value} onChange={(e) => set('value', e.target.value)} className="input" placeholder={form.type === 'percent' ? '20' : '100'} />
            </Field>
            {form.type === 'percent' && (
              <Field label="Max Discount (₹)" hint="0 = no cap">
                <input type="number" min="0" value={form.maxDiscount} onChange={(e) => set('maxDiscount', e.target.value)} className="input" placeholder="300" />
              </Field>
            )}
            <Field label="Min Order (₹)" hint="0 = none">
              <input type="number" min="0" value={form.minOrder} onChange={(e) => set('minOrder', e.target.value)} className="input" placeholder="500" />
            </Field>
          </div>

          <Field label="Applies To">
            <select value={form.scope} onChange={(e) => set('scope', e.target.value)} className="input">
              <option value="all">Entire cart</option>
              <option value="categories">Specific categories</option>
              <option value="products">Specific products</option>
            </select>
          </Field>

          {form.scope === 'categories' && (
            <div className="max-h-40 space-y-1 overflow-y-auto rounded-lg border border-slate-200 p-2">
              {categories.map((c) => (
                <label key={c._id} className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 hover:bg-slate-50">
                  <input type="checkbox" checked={form.categoryIds.includes(c._id)} onChange={() => toggleCategory(c._id)} className="h-4 w-4 rounded border-slate-300 text-primary" />
                  <span className="text-sm text-slate-700">{c.name}</span>
                </label>
              ))}
            </div>
          )}

          {form.scope === 'products' && (
            <div>
              <div className="relative">
                <FiSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                <input value={prodQuery} onChange={(e) => setProdQuery(e.target.value)} className="input pl-9" placeholder="Search products to add…" />
              </div>
              {prodResults.length > 0 && (
                <div className="mt-1 max-h-40 overflow-y-auto rounded-lg border border-slate-200">
                  {prodResults.map((p) => (
                    <button key={p._id} type="button" onClick={() => addProduct(p)} className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-slate-50">
                      <span className="truncate">{p.name}</span>
                      <FiPlus size={14} className="text-primary" />
                    </button>
                  ))}
                </div>
              )}
              {(selectedProducts.length > 0 || form.productIds.length > 0) && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {selectedProducts.map((p) => (
                    <span key={p.id} className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-700">
                      {p.name}
                      <button type="button" onClick={() => removeProduct(p.id)}><FiX size={12} /></button>
                    </span>
                  ))}
                  {/* When editing, product names aren't preloaded — show the count. */}
                  {editing && selectedProducts.length === 0 && form.productIds.length > 0 && (
                    <span className="text-xs text-slate-500">{form.productIds.length} product(s) selected. Add more above or clear by re-selecting.</span>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Total Usage Limit" hint="0 = unlimited">
              <input type="number" min="0" value={form.usageLimit} onChange={(e) => set('usageLimit', e.target.value)} className="input" placeholder="0" />
            </Field>
            <Field label="Per-Customer Limit" hint="0 = unlimited">
              <input type="number" min="0" value={form.perUserLimit} onChange={(e) => set('perUserLimit', e.target.value)} className="input" placeholder="1" />
            </Field>
            <Field label="Starts At">
              <input type="datetime-local" value={form.startsAt} onChange={(e) => set('startsAt', e.target.value)} className="input" />
            </Field>
            <Field label="Ends At">
              <input type="datetime-local" value={form.endsAt} onChange={(e) => set('endsAt', e.target.value)} className="input" />
            </Field>
          </div>

          <div className="space-y-2.5">
            <Switch label="Active" checked={form.active} onChange={(v) => set('active', v)} hint="Customers can redeem it" />
            <Switch label="Show on homepage" checked={form.showOnHome} onChange={(v) => set('showOnHome', v)} hint="Displays as a promo panel on the storefront" />
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!delTarget}
        onClose={() => setDelTarget(null)}
        onConfirm={confirmDelete}
        loading={deleting}
        title="Delete offer"
        message={`Delete coupon "${delTarget?.code}"? This cannot be undone.`}
      />
    </div>
  );
}
