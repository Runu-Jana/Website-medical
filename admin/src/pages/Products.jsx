import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { FiPlus, FiSearch, FiEdit2, FiTrash2, FiBox } from 'react-icons/fi';
import api, { API_URL } from '../lib/api.js';
import { useToast } from '../context/ToastContext.jsx';
import Loader from '../components/Loader.jsx';
import EmptyState from '../components/EmptyState.jsx';
import Pagination from '../components/Pagination.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
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
        <Link to="/products/new" className="btn-primary">
          <FiPlus size={18} /> Add Product
        </Link>
      </div>

      <div className="card">
        <div className="border-b border-slate-100 p-4">
          <form onSubmit={onSearch} className="relative max-w-md">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
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
                            <p className="text-xs text-slate-400">{p.sku || '—'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{p.category?.name || '—'}</td>
                      <td className="px-4 py-3">
                        <span className="font-semibold text-slate-800">{formatCurrency(p.price)}</span>
                        {p.oldPrice > p.price && (
                          <span className="ml-1 text-xs text-slate-400 line-through">
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
                          >
                            <FiEdit2 size={16} />
                          </Link>
                          <button
                            onClick={() => setDelTarget(p)}
                            className="rounded-lg p-2 text-slate-500 hover:bg-red-50 hover:text-danger"
                            title="Delete"
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
    </div>
  );
}
