import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { FiArrowLeft, FiSave, FiTrash2, FiX } from 'react-icons/fi';
import api from '../lib/api.js';
import { useToast } from '../context/ToastContext.jsx';
import Loader from '../components/Loader.jsx';
import ImageUploader from '../components/ImageUploader.jsx';

const emptyForm = {
  name: '',
  sku: '',
  shortDescription: '',
  description: '',
  price: '',
  oldPrice: '',
  categories: [],
  brand: '',
  countInStock: '',
  unit: '',
  images: [],
  variants: [],
  tags: '',
  status: 'active',
  isFeatured: false,
  isBestSeller: false,
  isNewArrival: false,
  isTrending: false,
  isDeal: false,
  dealEndsAt: '',
  requiresPrescription: false,
  // Pharma / catalog
  genericName: '',
  manufacturer: '',
  subCategory: '',
  hsnCode: '',
  gstPercent: '',
  purchasePrice: '',
  discountAmount: '',
  minStock: '',
  packSize: '',
  refillDays: '',
  saltComposition: '',
  strength: '',
  dosageForm: '',
  uses: '',
  benefits: '',
  sideEffects: '',
  directions: '',
  storage: '',
  // SEO
  seoTitle: '',
  metaDescription: '',
  metaKeywords: '',
  // Vendor
  vendorId: '',
  vendorName: '',
};

const Toggle = ({ label, checked, onChange, hint }) => (
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
      className={`relative h-6 w-11 rounded-full transition focus:outline-none focus:ring-2 focus:ring-primary-200 ${
        checked ? 'bg-primary' : 'bg-slate-300'
      }`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition ${
          checked ? 'left-[22px]' : 'left-0.5'
        }`}
      />
    </button>
  </label>
);

const Field = ({ label, value, onChange, placeholder = '', type = 'text', step }) => (
  <div>
    <label className="label">{label}</label>
    <input
      type={type}
      step={step}
      min={type === 'number' ? '0' : undefined}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="input"
      placeholder={placeholder}
    />
  </div>
)

const Area = ({ label, value, onChange, placeholder = '', rows = 3 }) => (
  <div>
    <label className="label">{label}</label>
    <textarea
      rows={rows}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="input resize-y"
      placeholder={placeholder}
    />
  </div>
)

export default function ProductForm() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const toast = useToast();

  const [form, setForm] = useState(emptyForm);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  // Snapshot of the last-saved/loaded state, to detect unsaved changes.
  const initialRef = useRef(JSON.stringify(emptyForm));
  const savedRef = useRef(false);
  const isDirty = JSON.stringify(form) !== initialRef.current;

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const toggleCategory = (catId) =>
    setForm((f) => ({
      ...f,
      categories: f.categories.includes(catId)
        ? f.categories.filter((c) => c !== catId)
        : [...f.categories, catId],
    }));

  const addVariant = () =>
    setForm((f) => ({
      ...f,
      variants: [...f.variants, { label: '', color: '#0e9f8e', available: true }],
    }));
  const updateVariant = (i, key, value) =>
    setForm((f) => ({
      ...f,
      variants: f.variants.map((v, idx) => (idx === i ? { ...v, [key]: value } : v)),
    }));
  const removeVariant = (i) =>
    setForm((f) => ({ ...f, variants: f.variants.filter((_, idx) => idx !== i) }));

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const [cats, brs] = await Promise.all([api.get('/categories'), api.get('/brands')]);
        if (!active) return;
        setCategories(cats.data || []);
        setBrands(brs.data || []);

        if (isEdit) {
          const { data } = await api.get(`/products/${id}`);
          // Backend responds with { product, related } — unwrap it.
          const product = data?.product || data;
          if (product && active) {
            const loaded = {
              name: product.name || '',
              sku: product.sku || '',
              shortDescription: product.shortDescription || '',
              description: product.description || '',
              price: product.price ?? '',
              oldPrice: product.oldPrice ?? '',
              categories: (product.categories?.length
                ? product.categories
                : product.category
                ? [product.category]
                : []
              ).map((c) => c?._id || c),
              brand: product.brand?._id || product.brand || '',
              countInStock: product.countInStock ?? '',
              unit: product.unit || '',
              images: product.images || [],
              variants: (product.variants || []).map((v) => ({
                label: v.label || '',
                color: v.color || '#0e9f8e',
                available: v.available !== false,
              })),
              tags: Array.isArray(product.tags) ? product.tags.join(', ') : product.tags || '',
              status: product.status || 'active',
              isFeatured: !!product.isFeatured,
              isBestSeller: !!product.isBestSeller,
              isNewArrival: !!product.isNewArrival,
              isDeal: !!product.isDeal,
              dealEndsAt: product.dealEndsAt ? product.dealEndsAt.slice(0, 16) : '',
              requiresPrescription: !!product.requiresPrescription,
              isTrending: !!product.isTrending,
              genericName: product.genericName || '',
              manufacturer: product.manufacturer || '',
              subCategory: product.subCategory || '',
              hsnCode: product.hsnCode || '',
              gstPercent: product.gstPercent ?? '',
              purchasePrice: product.purchasePrice ?? '',
              discountAmount: product.discountAmount ?? '',
              minStock: product.minStock ?? '',
              packSize: product.packSize || '',
              refillDays: product.refillDays ?? '',
              saltComposition: product.saltComposition || '',
              strength: product.strength || '',
              dosageForm: product.dosageForm || '',
              uses: product.uses || '',
              benefits: product.benefits || '',
              sideEffects: product.sideEffects || '',
              directions: product.directions || '',
              storage: product.storage || '',
              seoTitle: product.seoTitle || '',
              metaDescription: product.metaDescription || '',
              metaKeywords: product.metaKeywords || '',
              vendorId: product.vendorId || '',
              vendorName: product.vendorName || '',
            };
            setForm(loaded);
            initialRef.current = JSON.stringify(loaded);
          }
        }
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to load form data');
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Warn before a full page unload (refresh / close tab) when there are edits.
  useEffect(() => {
    const beforeUnload = (e) => {
      if (isDirty && !savedRef.current) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', beforeUnload);
    return () => window.removeEventListener('beforeunload', beforeUnload);
  }, [isDirty]);

  const cancel = () => {
    if (isDirty && !window.confirm('You have unsaved changes. Leave without saving?')) return;
    navigate('/products');
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (form.price === '' || Number(form.price) < 0) e.price = 'Valid price is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async (ev) => {
    ev.preventDefault();
    if (!validate()) {
      toast.error('Please fix the highlighted fields');
      return;
    }
    setSaving(true);

    const payload = {
      name: form.name.trim(),
      sku: form.sku.trim() || undefined,
      shortDescription: form.shortDescription,
      description: form.description,
      price: Number(form.price),
      oldPrice: form.oldPrice === '' ? undefined : Number(form.oldPrice),
      images: form.images,
      thumbnail: form.images?.[0] || undefined,
      categories: form.categories,
      brand: form.brand || undefined,
      countInStock: form.countInStock === '' ? 0 : Number(form.countInStock),
      unit: form.unit || undefined,
      variants: form.variants
        .filter((v) => (v.label && v.label.trim()) || v.color)
        .map((v) => ({
          label: v.label.trim(),
          color: v.color || '',
          available: v.available !== false,
        })),
      isFeatured: form.isFeatured,
      isBestSeller: form.isBestSeller,
      isNewArrival: form.isNewArrival,
      isTrending: form.isTrending,
      isDeal: form.isDeal,
      dealEndsAt: form.isDeal && form.dealEndsAt ? form.dealEndsAt : undefined,
      requiresPrescription: form.requiresPrescription,
      // Pharma / catalog
      genericName: form.genericName,
      manufacturer: form.manufacturer,
      subCategory: form.subCategory,
      hsnCode: form.hsnCode,
      gstPercent: form.gstPercent === '' ? 0 : Number(form.gstPercent),
      purchasePrice: form.purchasePrice === '' ? 0 : Number(form.purchasePrice),
      discountAmount: form.discountAmount === '' ? 0 : Number(form.discountAmount),
      minStock: form.minStock === '' ? 0 : Number(form.minStock),
      packSize: form.packSize,
      refillDays: Number(form.refillDays) || 0,
      saltComposition: form.saltComposition,
      strength: form.strength,
      dosageForm: form.dosageForm,
      uses: form.uses,
      benefits: form.benefits,
      sideEffects: form.sideEffects,
      directions: form.directions,
      storage: form.storage,
      // SEO
      seoTitle: form.seoTitle,
      metaDescription: form.metaDescription,
      metaKeywords: form.metaKeywords,
      // Vendor
      vendorId: form.vendorId,
      vendorName: form.vendorName,
      tags: form.tags
        ? form.tags.split(',').map((t) => t.trim()).filter(Boolean)
        : [],
      status: form.status,
    };

    try {
      if (isEdit) {
        await api.put(`/products/${id}`, payload);
        toast.success('Product updated');
      } else {
        await api.post('/products', payload);
        toast.success('Product created');
      }
      savedRef.current = true; // suppress the unsaved-changes guard on the redirect
      navigate('/products');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loader label="Loading product..." />;

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link to="/products" className="rounded-lg p-2 text-slate-500 hover:bg-slate-200">
            <FiArrowLeft size={20} />
          </Link>
          <div>
            <h2 className="text-xl font-bold text-slate-800">
              {isEdit ? 'Edit Product' : 'Add Product'}
            </h2>
            <p className="text-sm text-slate-500">Fill in the product details below.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Main column */}
        <div className="space-y-5 lg:col-span-2">
          <div className="card p-5">
            <h3 className="mb-4 font-semibold text-slate-800">Basic Information</h3>
            <div className="space-y-4">
              <div>
                <label className="label">Product Name *</label>
                <input
                  value={form.name}
                  onChange={(e) => set('name', e.target.value)}
                  className={`input ${errors.name ? 'border-danger' : ''}`}
                  placeholder="e.g. Vitamin C 1000mg Tablets"
                />
                {errors.name && <p className="mt-1 text-xs text-danger">{errors.name}</p>}
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="label">SKU</label>
                  <input value={form.sku} onChange={(e) => set('sku', e.target.value)} className="input" placeholder="SKU-0001" />
                </div>
                <div>
                  <label className="label">Unit</label>
                  <input value={form.unit} onChange={(e) => set('unit', e.target.value)} className="input" placeholder="e.g. box, bottle, strip" />
                </div>
              </div>
              <div>
                <label className="label">Short Description</label>
                <input
                  value={form.shortDescription}
                  onChange={(e) => set('shortDescription', e.target.value)}
                  className="input"
                  placeholder="A brief one-line summary"
                />
              </div>
              <div>
                <label className="label">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => set('description', e.target.value)}
                  rows={5}
                  className="input resize-y"
                  placeholder="Full product description..."
                />
              </div>
              <div>
                <label className="label">Tags (comma separated)</label>
                <input value={form.tags} onChange={(e) => set('tags', e.target.value)} className="input" placeholder="vitamins, immunity, supplement" />
              </div>
            </div>
          </div>

          <div className="card p-5">
            <h3 className="mb-1 font-semibold text-slate-800">Product Images</h3>
            <p className="mb-4 text-xs text-slate-500">
              The first image is used as the thumbnail. Use the arrows to reorder, or set any image
              as the thumbnail.
            </p>
            <ImageUploader images={form.images} onChange={(imgs) => set('images', imgs)} />
          </div>

          <div className="card p-5">
            <h3 className="mb-4 font-semibold text-slate-800">Pricing & Inventory</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="label">Sale Price (₹) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.price}
                  onChange={(e) => set('price', e.target.value)}
                  className={`input ${errors.price ? 'border-danger' : ''}`}
                  placeholder="0.00"
                />
                {errors.price && <p className="mt-1 text-xs text-danger">{errors.price}</p>}
              </div>
              <Field label="MRP (₹)" type="number" step="0.01" value={form.oldPrice} onChange={(v) => set('oldPrice', v)} placeholder="0.00" />
              <Field label="Purchase Price (₹)" type="number" step="0.01" value={form.purchasePrice} onChange={(v) => set('purchasePrice', v)} placeholder="0.00" />
              <Field label="Discount Amount (₹)" type="number" step="0.01" value={form.discountAmount} onChange={(v) => set('discountAmount', v)} placeholder="Auto if blank" />
              <Field label="GST %" type="number" step="0.01" value={form.gstPercent} onChange={(v) => set('gstPercent', v)} placeholder="e.g. 12" />
              <Field label="HSN Code" value={form.hsnCode} onChange={(v) => set('hsnCode', v)} placeholder="e.g. 3004" />
              <Field label="Stock Quantity" type="number" value={form.countInStock} onChange={(v) => set('countInStock', v)} placeholder="0" />
              <Field label="Minimum Stock" type="number" value={form.minStock} onChange={(v) => set('minStock', v)} placeholder="e.g. 20" />
              <Field label="Pack Size" value={form.packSize} onChange={(v) => set('packSize', v)} placeholder="e.g. 15 tablets" />
              <Field label="Refill After (days)" type="number" value={form.refillDays} onChange={(v) => set('refillDays', v)} placeholder="0 = default 30" />
            </div>
          </div>

          <div className="card p-5">
            <h3 className="mb-4 font-semibold text-slate-800">Medicine & Catalog Details</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Generic Name" value={form.genericName} onChange={(v) => set('genericName', v)} placeholder="e.g. Paracetamol" />
              <Field label="Manufacturer" value={form.manufacturer} onChange={(v) => set('manufacturer', v)} placeholder="e.g. Micro Labs Ltd" />
              <Field label="Sub Category" value={form.subCategory} onChange={(v) => set('subCategory', v)} placeholder="e.g. Pain Relief" />
              <Field label="Salt Composition" value={form.saltComposition} onChange={(v) => set('saltComposition', v)} placeholder="e.g. Paracetamol (500mg)" />
              <Field label="Strength" value={form.strength} onChange={(v) => set('strength', v)} placeholder="e.g. 500mg" />
              <Field label="Dosage Form" value={form.dosageForm} onChange={(v) => set('dosageForm', v)} placeholder="e.g. Tablet / Syrup" />
            </div>
          </div>

          <div className="card p-5">
            <h3 className="mb-4 font-semibold text-slate-800">Medicine Information</h3>
            <div className="space-y-4">
              <Area label="Uses" value={form.uses} onChange={(v) => set('uses', v)} placeholder="Fever, headache, body ache..." />
              <Area label="Benefits" value={form.benefits} onChange={(v) => set('benefits', v)} placeholder="Fast-acting, gentle on the stomach..." />
              <Area label="Side Effects" value={form.sideEffects} onChange={(v) => set('sideEffects', v)} placeholder="Rare: nausea, rash..." />
              <Area label="Directions to Use" value={form.directions} onChange={(v) => set('directions', v)} placeholder="1 tablet every 6 hours or as directed..." />
              <Area label="Storage Instructions" value={form.storage} onChange={(v) => set('storage', v)} placeholder="Store below 30°C, away from sunlight..." />
            </div>
          </div>

          <div className="card p-5">
            <h3 className="mb-4 font-semibold text-slate-800">SEO</h3>
            <div className="space-y-4">
              <Field label="SEO Title" value={form.seoTitle} onChange={(v) => set('seoTitle', v)} placeholder="Buy Paracetamol 500mg Online | DCare" />
              <Area label="Meta Description" rows={2} value={form.metaDescription} onChange={(v) => set('metaDescription', v)} placeholder="Short description for search engines..." />
              <Field label="Meta Keywords" value={form.metaKeywords} onChange={(v) => set('metaKeywords', v)} placeholder="paracetamol, fever, pain relief" />
            </div>
          </div>

          <div className="card p-5">
            <div className="mb-1 flex items-center justify-between">
              <h3 className="font-semibold text-slate-800">Variants & Availability</h3>
              <button
                type="button"
                onClick={addVariant}
                className="text-sm font-semibold text-primary hover:underline"
              >
                + Add variant
              </button>
            </div>
            <p className="mb-4 text-xs text-slate-500">
              Optional colour / flavour options shown on the product page. Untick “Available” to
              mark a variant as sold out.
            </p>
            {form.variants.length === 0 ? (
              <p className="rounded-lg border border-dashed border-slate-200 px-3 py-4 text-center text-sm text-slate-500">
                No variants yet. Click “Add variant” to offer colour or flavour options.
              </p>
            ) : (
              <div className="space-y-2.5">
                {form.variants.map((v, i) => (
                  <div
                    key={i}
                    className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 p-2.5"
                  >
                    <input
                      type="color"
                      value={v.color || '#0e9f8e'}
                      onChange={(e) => updateVariant(i, 'color', e.target.value)}
                      className="h-9 w-9 shrink-0 cursor-pointer rounded border border-slate-200 bg-white"
                      title="Swatch colour"
                    />
                    <input
                      value={v.label}
                      onChange={(e) => updateVariant(i, 'label', e.target.value)}
                      placeholder="Label e.g. Lavender"
                      className="input min-w-[8rem] flex-1"
                    />
                    <label className="flex cursor-pointer items-center gap-1.5 text-sm text-slate-600">
                      <input
                        type="checkbox"
                        checked={v.available !== false}
                        onChange={(e) => updateVariant(i, 'available', e.target.checked)}
                        className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
                      />
                      Available
                    </label>
                    <button
                      type="button"
                      onClick={() => removeVariant(i)}
                      className="rounded-lg p-2 text-slate-500 hover:bg-red-50 hover:text-danger"
                      title="Remove variant"
                    >
                      <FiTrash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Side column */}
        <div className="space-y-5">
          <div className="card p-5">
            <h3 className="mb-4 font-semibold text-slate-800">Organization</h3>
            <div className="space-y-4">
              <div>
                <label className="label">Categories</label>
                <p className="mb-2 text-xs text-slate-500">Tick one or more categories.</p>
                <div className="max-h-52 space-y-1 overflow-y-auto rounded-lg border border-slate-200 p-2">
                  {categories.length === 0 && (
                    <p className="px-1 py-2 text-sm text-slate-500">No categories yet.</p>
                  )}
                  {categories.map((c) => (
                    <label
                      key={c._id}
                      className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 hover:bg-slate-50"
                    >
                      <input
                        type="checkbox"
                        checked={form.categories.includes(c._id)}
                        onChange={() => toggleCategory(c._id)}
                        className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
                      />
                      <span className="text-sm text-slate-700">{c.name}</span>
                    </label>
                  ))}
                </div>
                {form.categories.length > 0 && (
                  <p className="mt-1.5 text-xs text-slate-500">
                    {form.categories.length} selected
                  </p>
                )}
              </div>
              <div>
                <label className="label">Brand</label>
                <select value={form.brand} onChange={(e) => set('brand', e.target.value)} className="input">
                  <option value="">Select brand</option>
                  {brands.map((b) => (
                    <option key={b._id} value={b._id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Status</label>
                <Toggle
                  label={form.status === 'active' ? 'Active' : 'Inactive'}
                  hint={
                    form.status === 'active'
                      ? 'Visible to customers in the store'
                      : 'Hidden from the store'
                  }
                  checked={form.status === 'active'}
                  onChange={(v) => set('status', v ? 'active' : 'inactive')}
                />
              </div>
            </div>
          </div>

          <div className="card p-5">
            <h3 className="mb-4 font-semibold text-slate-800">Flags & Options</h3>
            <div className="space-y-2.5">
              <Toggle label="Featured" checked={form.isFeatured} onChange={(v) => set('isFeatured', v)} />
              <Toggle label="Best Seller" checked={form.isBestSeller} onChange={(v) => set('isBestSeller', v)} />
              <Toggle label="New Arrival" checked={form.isNewArrival} onChange={(v) => set('isNewArrival', v)} />
              <Toggle label="Trending" checked={form.isTrending} onChange={(v) => set('isTrending', v)} />
              <Toggle label="On Deal" checked={form.isDeal} onChange={(v) => set('isDeal', v)} />
              {form.isDeal && (
                <div className="pl-1">
                  <label className="label">Deal Ends At</label>
                  <input
                    type="datetime-local"
                    value={form.dealEndsAt}
                    onChange={(e) => set('dealEndsAt', e.target.value)}
                    className="input"
                  />
                </div>
              )}
              <Toggle
                label="Requires Prescription"
                checked={form.requiresPrescription}
                onChange={(v) => set('requiresPrescription', v)}
                hint="Rx-only medication"
              />
            </div>
          </div>

          <div className="card p-5">
            <h3 className="mb-4 font-semibold text-slate-800">Vendor (Marketplace)</h3>
            <div className="space-y-4">
              <Field label="Vendor ID" value={form.vendorId} onChange={(v) => set('vendorId', v)} placeholder="Optional" />
              <Field label="Vendor Name" value={form.vendorName} onChange={(v) => set('vendorName', v)} placeholder="Optional" />
            </div>
          </div>
        </div>
      </div>

      {/* Sticky action bar — always reachable on long forms */}
      <div className="sticky bottom-0 z-10 -mx-4 flex items-center gap-2 border-t border-slate-200 bg-white/90 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6">
        {isDirty && (
          <span className="mr-auto text-xs font-medium text-warning">You have unsaved changes</span>
        )}
        <button
          type="button"
          onClick={cancel}
          disabled={saving}
          className={`btn-ghost ${isDirty ? '' : 'ml-auto'}`}
        >
          <FiX size={18} /> Cancel
        </button>
        <button type="submit" disabled={saving} className="btn-primary">
          <FiSave size={18} /> {saving ? 'Saving...' : 'Save Product'}
        </button>
      </div>
    </form>
  );
}
