import { useEffect, useState, useCallback } from 'react';
import { FiEye, FiShoppingCart, FiMapPin, FiCheckCircle, FiRefreshCcw } from 'react-icons/fi';
import api, { API_URL } from '../lib/api.js';
import { useToast } from '../context/ToastContext.jsx';
import Loader from '../components/Loader.jsx';
import EmptyState from '../components/EmptyState.jsx';
import Pagination from '../components/Pagination.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import Modal from '../components/Modal.jsx';
import OrderFilters, { isComplete } from '../components/OrderFilters.jsx';
import { formatCurrency, formatDateTime } from '../lib/format.js';

const STATUSES = ['', 'pending', 'processing', 'shipped', 'delivered', 'cancelled'];

// Fulfillment stages (separate from the lifecycle status above).
const FULFILLMENT = [
  { value: '', label: '— Not set —' },
  { value: 'packed', label: 'Order Packed' },
  { value: 'verified', label: 'Order Verified' },
  { value: 'ready', label: 'Ready for Dispatch' },
  { value: 'dispatched', label: 'Order Dispatched' },
];

const resolveImg = (u) => {
  if (!u) return '';
  if (u.startsWith('http')) return u;
  return `${API_URL}${u.startsWith('/') ? '' : '/'}${u}`;
};

export default function Orders() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({ orders: [], page: 1, pages: 1, total: 0 });
  const [status, setStatus] = useState('');
  const [filters, setFilters] = useState({ conjunction: 'and', conditions: [] });
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [refunding, setRefunding] = useState(false);
  const [refundAmt, setRefundAmt] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { status, page, limit: 10 };
      const active = filters.conditions.filter(isComplete);
      if (active.length) {
        params.filters = JSON.stringify({ conjunction: filters.conjunction, conditions: active });
      }
      const { data } = await api.get('/orders', { params });
      setData({
        orders: data.orders || [],
        page: data.page || 1,
        pages: data.pages || 1,
        total: data.total || 0,
      });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, [status, filters, page, toast]);

  useEffect(() => {
    load();
  }, [load]);

  const updateStatus = async (newStatus) => {
    if (!selected) return;
    setUpdating(true);
    try {
      await api.put(`/orders/${selected._id}/status`, { status: newStatus });
      toast.success('Order status updated');
      setSelected((s) => ({ ...s, status: newStatus }));
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setUpdating(false);
    }
  };

  // Inline update of the fulfillment stage from the table row.
  const updateFulfillment = async (orderId, value) => {
    // Optimistic UI update.
    setData((d) => ({
      ...d,
      orders: d.orders.map((o) => (o._id === orderId ? { ...o, fulfillmentStatus: value } : o)),
    }));
    try {
      await api.put(`/orders/${orderId}/status`, { fulfillmentStatus: value });
      toast.success('Order status updated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
      load(); // revert to server truth on failure
    }
  };

  const doRefund = async () => {
    if (!selected) return;
    const partial = refundAmt !== '' && Number(refundAmt) > 0;
    const label = partial ? `${formatCurrency(Number(refundAmt))}` : 'the full amount';
    if (!window.confirm(`Refund ${label} for order #${selected.orderNumber || selected._id?.slice(-6)}?`))
      return;
    setRefunding(true);
    try {
      const { data } = await api.post('/payments/refund', {
        orderId: selected._id,
        ...(partial ? { amount: Number(refundAmt) } : {}),
      });
      toast.success('Refund processed');
      setSelected(data.order || selected);
      setRefundAmt('');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Refund failed');
    } finally {
      setRefunding(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Orders</h2>
          <p className="text-sm text-slate-500">{data.total} orders</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={status}
            onChange={(e) => {
              setPage(1);
              setStatus(e.target.value);
            }}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm capitalize outline-none focus:border-primary"
          >
            {STATUSES.map((s) => (
              <option key={s || 'all'} value={s}>
                {s ? s : 'All statuses'}
              </option>
            ))}
          </select>
          <OrderFilters
            value={filters}
            onChange={(next) => {
              setPage(1);
              setFilters(next);
            }}
          />
        </div>
      </div>

      <div className="card">
        {loading ? (
          <Loader label="Loading orders..." />
        ) : data.orders.length === 0 ? (
          <EmptyState icon={FiShoppingCart} title="No orders found" message="Orders will appear here." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-semibold">Order #</th>
                  <th className="px-4 py-3 font-semibold">Customer</th>
                  <th className="px-4 py-3 font-semibold">Total</th>
                  <th className="px-4 py-3 font-semibold">Paid</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Order Status</th>
                  <th className="px-4 py-3 font-semibold">Date</th>
                  <th className="px-4 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.orders.map((o) => (
                  <tr key={o._id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-semibold text-slate-700">
                      #{o.orderNumber || o._id?.slice(-6)}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-700">{o.user?.name || 'Guest'}</p>
                      <p className="text-xs text-slate-500">{o.user?.email}</p>
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-700">{formatCurrency(o.totalPrice)}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={o.isPaid ? 'paid' : 'unpaid'} />
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={o.status} />
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={o.fulfillmentStatus || ''}
                        onChange={(e) => updateFulfillment(o._id, e.target.value)}
                        className={`rounded-lg border px-2 py-1.5 text-xs font-medium outline-none focus:border-primary ${
                          o.fulfillmentStatus
                            ? 'border-primary/40 bg-primary/5 text-primary'
                            : 'border-slate-300 text-slate-500'
                        }`}
                      >
                        {FULFILLMENT.map((f) => (
                          <option key={f.value || 'none'} value={f.value}>
                            {f.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3 text-slate-500">{formatDateTime(o.createdAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end">
                        <button
                          onClick={() => {
                            setRefundAmt('');
                            setSelected(o);
                          }}
                          className="flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-1.5 text-sm font-semibold text-primary hover:bg-blue-100"
                        >
                          <FiEye size={15} /> View
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && data.orders.length > 0 && (
          <div className="border-t border-slate-100">
            <Pagination page={data.page} pages={data.pages} total={data.total} onChange={setPage} />
          </div>
        )}
      </div>

      {/* Order detail modal */}
      <Modal
        open={!!selected}
        onClose={() => setSelected(null)}
        title={`Order #${selected?.orderNumber || selected?._id?.slice(-6) || ''}`}
        size="lg"
      >
        {selected && (
          <div className="space-y-5">
            {/* Summary row */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-lg bg-slate-50 p-3">
                <p className="text-xs text-slate-500">Total</p>
                <p className="font-bold text-slate-800">{formatCurrency(selected.totalPrice)}</p>
              </div>
              <div className="rounded-lg bg-slate-50 p-3">
                <p className="text-xs text-slate-500">Status</p>
                <StatusBadge status={selected.status} />
              </div>
              <div className="rounded-lg bg-slate-50 p-3">
                <p className="text-xs text-slate-500">Payment</p>
                <StatusBadge status={selected.isPaid ? 'paid' : 'unpaid'} />
              </div>
              <div className="rounded-lg bg-slate-50 p-3">
                <p className="text-xs text-slate-500">Date</p>
                <p className="text-sm font-medium text-slate-700">{formatDateTime(selected.createdAt)}</p>
              </div>
            </div>

            {/* Status updater */}
            <div className="rounded-lg border border-slate-200 p-4">
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
                <FiCheckCircle className="text-primary" /> Update Order Status
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={selected.status}
                  onChange={(e) => updateStatus(e.target.value)}
                  disabled={updating}
                  className="input max-w-xs capitalize"
                >
                  {STATUSES.filter(Boolean).map((s) => (
                    <option key={s} value={s} className="capitalize">
                      {s}
                    </option>
                  ))}
                </select>
                {updating && <span className="text-sm text-slate-500">Updating…</span>}
              </div>
            </div>

            {/* Refund (online-paid orders only) */}
            {selected.isPaid && selected.razorpayPaymentId && (
              <div className="rounded-lg border border-slate-200 p-4">
                <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <FiRefreshCcw className="text-red-500" /> Refund Payment
                </div>
                {selected.isRefunded ? (
                  <p className="text-sm text-emerald-600">
                    Fully refunded{selected.refundAmount ? ` — ${formatCurrency(selected.refundAmount)}` : ''}.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {selected.refundAmount > 0 && (
                      <p className="text-xs text-slate-500">
                        Already refunded: {formatCurrency(selected.refundAmount)}
                      </p>
                    )}
                    <div className="flex flex-wrap items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={refundAmt}
                        onChange={(e) => setRefundAmt(e.target.value)}
                        placeholder={`Partial ₹ (blank = full ${formatCurrency(selected.totalPrice)})`}
                        className="input max-w-xs"
                      />
                      <button
                        onClick={doRefund}
                        disabled={refunding}
                        className="rounded-lg bg-red-50 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-100 disabled:opacity-60"
                      >
                        {refunding ? 'Refunding…' : 'Issue Refund'}
                      </button>
                    </div>
                    <p className="text-xs text-slate-500">
                      Leave the amount blank to refund the full order total. Refunds go back to the
                      customer's original payment method via Razorpay.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Shipping address */}
            {selected.shippingAddress && (
              <div className="rounded-lg border border-slate-200 p-4">
                <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <FiMapPin className="text-accent" /> Shipping Address
                </div>
                <div className="text-sm text-slate-600">
                  {selected.shippingAddress.fullName && (
                    <p className="font-medium text-slate-700">{selected.shippingAddress.fullName}</p>
                  )}
                  <p>
                    {[
                      selected.shippingAddress.address,
                      selected.shippingAddress.city,
                      selected.shippingAddress.postalCode,
                      selected.shippingAddress.country,
                    ]
                      .filter(Boolean)
                      .join(', ')}
                  </p>
                  {selected.shippingAddress.phone && <p>Phone: {selected.shippingAddress.phone}</p>}
                </div>
              </div>
            )}

            {/* Items */}
            <div>
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
                <FiShoppingCart className="text-warning" /> Items ({selected.items?.length || 0})
              </div>
              <div className="divide-y divide-slate-100 rounded-lg border border-slate-200">
                {(selected.items || []).map((it, i) => {
                  const img = it.thumbnail || it.image || it.product?.thumbnail || it.product?.images?.[0];
                  return (
                    <div key={i} className="flex items-center gap-3 p-3">
                      <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                        {img ? (
                          <img src={resolveImg(img)} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-slate-300">
                            <FiShoppingCart size={16} />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-slate-700">
                          {it.name || it.product?.name || 'Item'}
                        </p>
                        <p className="text-xs text-slate-500">Qty: {it.qty || it.quantity || 1}</p>
                      </div>
                      <p className="text-sm font-semibold text-slate-700">
                        {formatCurrency((it.price || 0) * (it.qty || it.quantity || 1))}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
