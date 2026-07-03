import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  FiPlus,
  FiSearch,
  FiEdit2,
  FiTrash2,
  FiBox,
  FiUploadCloud,
  FiDownload,
  FiFileText,
} from 'react-icons/fi';
import api, { API_URL } from '../lib/api.js';
import { useToast } from '../context/ToastContext.jsx';
import Loader from '../components/Loader.jsx';
import EmptyState from '../components/EmptyState.jsx';
import Pagination from '../components/Pagination.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import Modal from '../components/Modal.jsx';
import { formatCurrency } from '../lib/format.js';

const resolveImg = (u) => {
  if (!u) return '';
  if (u.startsWith('http')) return u;
  return `${API_URL}${u.startsWith('/') ? '' : '/'}${u}`;
};

export default function Products() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({ products: [], page: 1, pages: 1, total: 0 });
  const [keyword, setKeyword] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [delTarget, setDelTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [file, setFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);
  const [uploaded, setUploaded] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/products/admin', {
        params: { keyword: search, page, limit: 10 },
      });
      setData({
        products: data.products || [],
        page: data.page || 1,
        pages: data.pages || 1,
        total: data.total || 0,
      });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load products');
    } finally {
      setLoading(false);
    }
  }, [search, page, toast]);

  useEffect(() => {
    load();
  }, [load]);

  const onSearch = (e) => {
    e.preventDefault();
    setPage(1);
    setSearch(keyword);
  };

  const confirmDelete = async () => {
    if (!delTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/products/${delTarget._id}`);
      toast.success('Product deleted');
      setDelTarget(null);
      // If last item on page removed, step back a page
      if (data.products.length === 1 && page > 1) setPage((p) => p - 1);
      else load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    } finally {
      setDeleting(false);
    }
  };

  const openImport = () => {
    setResult(null);
    setFile(null);
    setUploaded(false);
    setImportOpen(true);
  };

  const downloadTemplate = async () => {
    try {
      const res = await api.get('/products/import/template', { responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'dcare-products-template.xlsx';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Could not download the template');
    }
  };

  const runImport = async () => {
    if (!file) return;
    setImporting(true);
    setResult(null);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const { data } = await api.post('/products/import', fd);
      setResult(data);
      // File processed — lock the button so the same file can't be re-imported
      // (prevents duplicates). Re-enabled only after closing & reopening the modal.
      setUploaded(true);
      if (data.created > 0) {
        toast.success(`Imported ${data.created} product${data.created > 1 ? 's' : ''}`);
        load();
      } else {
        toast.error('No products were imported — check the errors below');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Import failed');
    } finally {
      setImporting(false);
    }
  };

  const flags = (p) => {
    const f = [];
    if (p.isFeatured) f.push({ label: 'Featured', cls: 'bg-blue-100 text-primary' });
    if (p.isBestSeller) f.push({ label: 'Best', cls: 'bg-emerald-100 text-accent' });
    if (p.isNewArrival) f.push({ label: 'New', cls: 'bg-violet-100 text-violet-600' });
    if (p.isDeal) f.push({ label: 'Deal', cls: 'bg-amber-100 text-warning' });
    return f;
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Products</h2>
          <p className="text-sm text-slate-500">{data.total} products in your catalog</p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={openImport} className="btn-ghost">
            <FiUploadCloud size={18} /> Import Excel
          </button>
          <Link to="/products/new" className="btn-primary">
            <FiPlus size={18} /> Add Product
          </Link>
        </div>
      </div>

      <div className="card">
        <div className="border-b border-slate-100 p-4">
          <form onSubmit={onSearch} className="relative max-w-md">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Search products by name..."
              className="input pl-10"
            />
          </form>
        </div>

        {loading ? (
          <Loader label="Loading products..." />
        ) : data.products.length === 0 ? (
          <EmptyState
            icon={FiBox}
            title="No products found"
            message="Try a different search, or add your first product."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-semibold">Product</th>
                  <th className="px-4 py-3 font-semibold">Category</th>
                  <th className="px-4 py-3 font-semibold">Price</th>
                  <th className="px-4 py-3 font-semibold">Stock</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Flags</th>
                  <th className="px-4 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.products.map((p) => {
                  const img = p.thumbnail || p.images?.[0];
                  const low = (p.countInStock ?? 0) <= 5;
                  return (
                    <tr key={p._id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                            {img ? (
                              <img src={resolveImg(img)} alt={p.name} className="h-full w-full object-cover" />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-slate-300">
                                <FiBox />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-medium text-slate-800 max-w-[220px]">{p.name}</p>
                            <p className="text-xs text-slate-500">{p.sku || '—'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{p.category?.name || '—'}</td>
                      <td className="px-4 py-3">
                        <span className="font-semibold text-slate-800">{formatCurrency(p.price)}</span>
                        {p.oldPrice > p.price && (
                          <span className="ml-1 text-xs text-slate-500 line-through">
                            {formatCurrency(p.oldPrice)}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`font-semibold ${low ? 'text-danger' : 'text-slate-700'}`}>
                          {p.countInStock ?? 0}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={p.status || 'active'} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {flags(p).map((f) => (
                            <span
                              key={f.label}
                              className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${f.cls}`}
                            >
                              {f.label}
                            </span>
                          ))}
                          {flags(p).length === 0 && <span className="text-xs text-slate-300">—</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            to={`/products/${p._id}/edit`}
                            className="rounded-lg p-2 text-slate-500 hover:bg-blue-50 hover:text-primary"
                            title="Edit"
                            aria-label={`Edit ${p.name}`}
                          >
                            <FiEdit2 size={16} />
                          </Link>
                          <button
                            onClick={() => setDelTarget(p)}
                            className="rounded-lg p-2 text-slate-500 hover:bg-red-50 hover:text-danger"
                            title="Delete"
                            aria-label={`Delete ${p.name}`}
                          >
                            <FiTrash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {!loading && data.products.length > 0 && (
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
        title="Delete product"
        message={`Are you sure you want to delete "${delTarget?.name}"? This cannot be undone.`}
      />

      {/* Bulk import from Excel/CSV */}
      <Modal
        open={importOpen}
        onClose={() => !importing && setImportOpen(false)}
        title="Import products from Excel"
        size="lg"
      >
        <div className="space-y-4">
          <div className="rounded-lg bg-slate-50 p-4 text-sm text-slate-600">
            <p className="font-semibold text-slate-700">How it works</p>
            <ol className="mt-2 list-decimal space-y-1 pl-5">
              <li>Download the template and fill one product per row.</li>
              <li>
                Only <span className="font-semibold">name</span> is required. Category &amp; brand
                are matched by name (created automatically if new).
              </li>
              <li>
                <span className="font-semibold">images</span> and <span className="font-semibold">tags</span>{' '}
                accept multiple comma-separated values. Flag columns (isFeatured, isDeal…) accept{' '}
                <span className="font-semibold">yes/no</span>.
              </li>
              <li>Upload the file (.xlsx, .xls or .csv).</li>
            </ol>
          </div>

          <button type="button" onClick={downloadTemplate} className="btn-ghost">
            <FiDownload size={16} /> Download template (.xlsx)
          </button>

          <div>
            <label className="label">Choose a file</label>
            <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-slate-300 p-4 hover:border-primary">
              <FiFileText className="text-slate-500" size={22} />
              <span className="text-sm text-slate-600">
                {file ? file.name : 'Click to select an .xlsx, .xls or .csv file'}
              </span>
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={(e) => {
                  setFile(e.target.files?.[0] || null);
                  setResult(null);
                }}
              />
            </label>
          </div>

          {result && (
            <div className="rounded-lg border border-slate-200 p-4 text-sm">
              <div className="flex flex-wrap gap-4">
                <span className="font-semibold text-emerald-600">Created: {result.created}</span>
                <span className="font-semibold text-red-500">Failed: {result.failed}</span>
                <span className="text-slate-500">Total rows: {result.total}</span>
              </div>
              {result.errors?.length > 0 && (
                <div className="mt-3 max-h-40 overflow-y-auto rounded bg-red-50 p-3">
                  <p className="mb-1 font-semibold text-red-600">Row errors</p>
                  <ul className="space-y-0.5 text-xs text-red-500">
                    {result.errors.map((e, i) => (
                      <li key={i}>
                        Row {e.row}: {e.message}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {uploaded && (
            <p className="rounded-lg bg-amber-50 p-3 text-xs text-amber-700">
              This file has been imported. To import another file, click <b>Close</b> and open
              <b> Import Excel</b> again.
            </p>
          )}

          <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={() => setImportOpen(false)}
              disabled={importing}
              className="btn-ghost"
            >
              Close
            </button>
            <button
              type="button"
              onClick={runImport}
              disabled={!file || importing || uploaded}
              className="btn-primary"
            >
              <FiUploadCloud size={16} />{' '}
              {importing ? 'Importing…' : uploaded ? 'Imported' : 'Upload & Import'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
