import { useEffect, useState, useCallback } from 'react';
import { FiSearch, FiUsers, FiMail, FiPhone, FiShoppingBag } from 'react-icons/fi';
import api from '../lib/api.js';
import { useToast } from '../context/ToastContext.jsx';
import Loader from '../components/Loader.jsx';
import EmptyState from '../components/EmptyState.jsx';
import Pagination from '../components/Pagination.jsx';
import Modal from '../components/Modal.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import { formatCurrency, formatDateTime, formatDate } from '../lib/format.js';

export default function Customers() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({ customers: [], page: 1, pages: 1, total: 0 });
  const [keyword, setKeyword] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/users', { params: { keyword: search, page, limit: 15 } });
      setData({
        customers: data.customers || [],
        page: data.page || 1,
        pages: data.pages || 1,
        total: data.total || 0,
      });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load customers');
    } finally {
      setLoading(false);
    }
  }, [search, page, toast]);

  useEffect(() => {
    load();
  }, [load]);

  const openCustomer = async (c) => {
    setSelected(c);
    setDetail(null);
    try {
      const { data } = await api.get(`/users/${c._id}`);
      setDetail(data);
    } catch {
      setDetail({ customer: c, orders: [] });
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Customers</h2>
          <p className="text-sm text-slate-500">{data.total} registered customers</p>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setPage(1);
            setSearch(keyword);
          }}
          className="relative max-w-xs flex-1"
        >
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="Search name, email or phone..."
            className="input pl-10"
          />
        </form>
      </div>

      <div className="card">
        {loading ? (
          <Loader label="Loading customers..." />
        ) : data.customers.length === 0 ? (
          <EmptyState icon={FiUsers} title="No customers found" message="Registered customers appear here." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-semibold">Customer</th>
                  <th className="px-4 py-3 font-semibold">Contact</th>
                  <th className="px-4 py-3 font-semibold">Orders</th>
                  <th className="px-4 py-3 font-semibold">Total Spent</th>
                  <th className="px-4 py-3 font-semibold">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.customers.map((c) => (
                  <tr
                    key={c._id}
                    onClick={() => openCustomer(c)}
                    className="cursor-pointer hover:bg-slate-50"
                  >
                    <td className="px-4 py-3 font-medium text-slate-800">{c.name || 'Customer'}</td>
                    <td className="px-4 py-3 text-slate-600">
                      <p>{c.email || '—'}</p>
                      <p className="text-xs text-slate-400">{c.phone || ''}</p>
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-700">{c.orderCount}</td>
                    <td className="px-4 py-3 font-semibold text-slate-700">{formatCurrency(c.totalSpent)}</td>
                    <td className="px-4 py-3 text-slate-500">{formatDate(c.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!loading && data.pages > 1 && (
          <div className="border-t border-slate-100">
            <Pagination page={data.page} pages={data.pages} total={data.total} onChange={setPage} />
          </div>
        )}
      </div>

      <Modal open={!!selected} onClose={() => setSelected(null)} title={selected?.name || 'Customer'} size="lg">
        {selected && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="flex items-center gap-2 rounded-lg bg-slate-50 p-3 text-sm">
                <FiMail className="text-primary" /> {selected.email || '—'}
              </div>
              <div className="flex items-center gap-2 rounded-lg bg-slate-50 p-3 text-sm">
                <FiPhone className="text-primary" /> {selected.phone || '—'}
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <FiShoppingBag className="text-accent" /> Orders ({detail?.orders?.length ?? '…'})
            </div>
            {!detail ? (
              <Loader label="Loading orders..." />
            ) : detail.orders.length === 0 ? (
              <p className="rounded-lg border border-dashed border-slate-200 p-4 text-center text-sm text-slate-400">
                No orders yet.
              </p>
            ) : (
              <div className="divide-y divide-slate-100 rounded-lg border border-slate-200">
                {detail.orders.map((o) => (
                  <div key={o._id} className="flex items-center justify-between p-3 text-sm">
                    <div>
                      <p className="font-semibold text-slate-700">#{o.orderNumber || o._id.slice(-6)}</p>
                      <p className="text-xs text-slate-400">{formatDateTime(o.createdAt)}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <StatusBadge status={o.status} />
                      <span className="font-semibold text-slate-700">{formatCurrency(o.totalPrice)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
