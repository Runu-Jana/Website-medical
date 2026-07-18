import { useEffect, useMemo, useState } from 'react';
import {
  FiBarChart2, FiSearch, FiChevronUp, FiChevronDown, FiShoppingBag,
  FiMail, FiPhone, FiFileText, FiPackage, FiTrendingUp, FiPercent,
} from 'react-icons/fi';
import api from '../lib/api.js';
import { useToast } from '../context/ToastContext.jsx';
import Loader from '../components/Loader.jsx';
import EmptyState from '../components/EmptyState.jsx';
import Modal from '../components/Modal.jsx';

const money = (n) => `₹${Math.round(Number(n) || 0).toLocaleString('en-IN')}`;
const num = (n) => Number(n || 0).toLocaleString('en-IN');

const statusBadge = {
  approved: 'bg-green-100 text-green-700',
  pending: 'bg-amber-100 text-amber-700',
  rejected: 'bg-red-100 text-red-700',
  suspended: 'bg-slate-200 text-slate-500',
};

// Columns the admin can sort by to compare vendors. `num: true` sorts numerically.
const COLUMNS = [
  { key: 'shopName', label: 'Vendor', align: 'left' },
  { key: 'productCount', label: 'Products', align: 'right', num: true },
  { key: 'outOfStock', label: 'Out of stock', align: 'right', num: true },
  { key: 'avgPrice', label: 'Avg price', align: 'right', num: true },
  { key: 'avgDiscount', label: 'Avg discount', align: 'right', num: true },
  { key: 'unitsSold', label: 'Units sold', align: 'right', num: true },
  { key: 'orderCount', label: 'Orders', align: 'right', num: true },
  { key: 'revenue', label: 'Revenue', align: 'right', num: true },
  { key: 'commissionPercent', label: 'Commission', align: 'right', num: true },
  { key: 'outstanding', label: 'Payable', align: 'right', num: true },
];

function StatCard({ icon: Icon, label, value, tone = 'text-slate-800' }) {
  return (
    <div className="card flex items-center gap-3 p-4">
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Icon size={18} />
      </span>
      <div>
        <p className="text-xs text-slate-500">{label}</p>
        <p className={`text-lg font-bold ${tone}`}>{value}</p>
      </div>
    </div>
  );
}

export default function VendorAnalytics() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState(null);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('all');
  const [sortKey, setSortKey] = useState('unitsSold'); // rank by volume by default
  const [sortDir, setSortDir] = useState('desc');
  const [detail, setDetail] = useState(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const { data } = await api.get('/vendors/analytics');
        setRows(data.vendors || []);
        setSummary(data.summary || null);
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to load vendor analytics');
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleSort = (key) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(key); setSortDir('desc'); }
  };

  const view = useMemo(() => {
    let list = rows;
    if (status !== 'all') list = list.filter((r) => r.status === status);
    const term = q.trim().toLowerCase();
    if (term) {
      list = list.filter((r) =>
        [r.shopName, r.ownerName, r.email, r.phone, r.gstin, r.licenseNumber]
          .some((f) => (f || '').toLowerCase().includes(term))
      );
    }
    const col = COLUMNS.find((c) => c.key === sortKey);
    const dir = sortDir === 'asc' ? 1 : -1;
    return [...list].sort((a, b) => {
      const av = a[sortKey], bv = b[sortKey];
      if (col?.num) return (Number(av || 0) - Number(bv || 0)) * dir;
      return String(av || '').localeCompare(String(bv || '')) * dir;
    });
  }, [rows, status, q, sortKey, sortDir]);

  // Highlight the top-volume seller so the leader stands out at a glance.
  const topVolumeId = useMemo(() => {
    let best = null;
    for (const r of rows) if (!best || r.unitsSold > best.unitsSold) best = r;
    return best && best.unitsSold > 0 ? best._id : null;
  }, [rows]);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-slate-800">Vendor Analytics</h2>
        <p className="text-sm text-slate-500">
          Compare every seller side by side — catalog, discounts, prices, sales volume and payouts.
        </p>
      </div>

      {summary && (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
          <StatCard icon={FiShoppingBag} label="Vendors" value={num(summary.vendorCount)} />
          <StatCard icon={FiShoppingBag} label="Approved" value={num(summary.approvedVendors)} tone="text-green-600" />
          <StatCard icon={FiPackage} label="Total products" value={num(summary.totalProducts)} />
          <StatCard icon={FiTrendingUp} label="Units sold" value={num(summary.totalUnitsSold)} />
          <StatCard icon={FiBarChart2} label="Revenue" value={money(summary.totalRevenue)} />
          <StatCard icon={FiPercent} label="Payable to sellers" value={money(summary.totalOutstanding)} tone="text-emerald-600" />
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search seller, owner, email, GSTIN, licence…"
            className="input pl-9"
          />
        </div>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="input max-w-[180px]">
          <option value="all">All statuses</option>
          <option value="approved">Approved</option>
          <option value="pending">Pending</option>
          <option value="suspended">Suspended</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <Loader label="Loading vendor analytics..." />
        ) : view.length === 0 ? (
          <EmptyState icon={FiBarChart2} title="No vendors to compare" message="Seller metrics will appear here once vendors are added." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                  {COLUMNS.map((c) => (
                    <th
                      key={c.key}
                      onClick={() => toggleSort(c.key)}
                      className={`cursor-pointer select-none px-4 py-3 ${c.align === 'right' ? 'text-right' : 'text-left'} hover:text-slate-700`}
                    >
                      <span className={`inline-flex items-center gap-1 ${c.align === 'right' ? 'flex-row-reverse' : ''}`}>
                        {c.label}
                        {sortKey === c.key && (sortDir === 'asc' ? <FiChevronUp size={12} /> : <FiChevronDown size={12} />)}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {view.map((r) => (
                  <tr
                    key={r._id}
                    onClick={() => setDetail(r)}
                    className={`cursor-pointer hover:bg-slate-50 ${r._id === topVolumeId ? 'bg-primary/5' : ''}`}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-800">{r.shopName}</span>
                        {r._id === topVolumeId && (
                          <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold text-primary">TOP VOLUME</span>
                        )}
                      </div>
                      <span className={`mt-0.5 inline-block rounded px-1.5 py-0.5 text-[10px] font-semibold capitalize ${statusBadge[r.status] || 'bg-slate-100 text-slate-500'}`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-slate-700">
                      {num(r.activeCount)}<span className="text-slate-400">/{num(r.productCount)}</span>
                    </td>
                    <td className={`px-4 py-3 text-right ${r.outOfStock > 0 ? 'text-amber-600' : 'text-slate-400'}`}>{num(r.outOfStock)}</td>
                    <td className="px-4 py-3 text-right text-slate-700">{money(r.avgPrice)}</td>
                    <td className="px-4 py-3 text-right">
                      <span className="font-semibold text-slate-800">{r.avgDiscount}%</span>
                      {r.maxDiscount > 0 && (
                        <span className="block text-[10px] text-slate-400">{r.minDiscount}–{r.maxDiscount}%</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-slate-800">{num(r.unitsSold)}</td>
                    <td className="px-4 py-3 text-right text-slate-600">{num(r.orderCount)}</td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-800">{money(r.revenue)}</td>
                    <td className="px-4 py-3 text-right text-slate-500">{r.commissionPercent}%</td>
                    <td className={`px-4 py-3 text-right font-bold ${r.outstanding > 0 ? 'text-emerald-600' : 'text-slate-400'}`}>{money(r.outstanding)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="text-xs text-slate-400">Tip: click any column header to sort, or a row to see the seller's full contact, licence and payout details.</p>

      {/* Per-vendor detail: contact, KYC, catalog and settlement in one place */}
      <Modal open={!!detail} onClose={() => setDetail(null)} title={detail?.shopName || 'Vendor'} size="lg">
        {detail && (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`rounded px-2 py-0.5 text-xs font-semibold capitalize ${statusBadge[detail.status] || 'bg-slate-100 text-slate-500'}`}>
                {detail.status}
              </span>
              <span className="text-sm text-slate-500">{detail.commissionPercent}% commission</span>
            </div>

            <div>
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Contact & KYC</h4>
              <div className="grid gap-2 sm:grid-cols-2 text-sm">
                <p className="flex items-center gap-2 text-slate-700"><FiShoppingBag className="text-slate-400" /> {detail.ownerName || '—'}</p>
                <p className="flex items-center gap-2 text-slate-700"><FiMail className="text-slate-400" /> {detail.email || '—'}</p>
                <p className="flex items-center gap-2 text-slate-700"><FiPhone className="text-slate-400" /> {detail.phone || '—'}</p>
                <p className="flex items-center gap-2 text-slate-700"><FiFileText className="text-slate-400" /> Licence: {detail.licenseNumber || '—'}</p>
                <p className="flex items-center gap-2 text-slate-700"><FiFileText className="text-slate-400" /> GSTIN: {detail.gstin || '—'}</p>
              </div>
            </div>

            <div>
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Catalog & pricing</h4>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Metric label="Products" value={`${num(detail.activeCount)}/${num(detail.productCount)}`} />
                <Metric label="Out of stock" value={num(detail.outOfStock)} />
                <Metric label="Avg price" value={money(detail.avgPrice)} />
                <Metric label="Discount" value={`${detail.avgDiscount}% (${detail.minDiscount}–${detail.maxDiscount}%)`} />
              </div>
            </div>

            <div>
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Sales & settlement</h4>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Metric label="Units sold" value={num(detail.unitsSold)} />
                <Metric label="Orders" value={num(detail.orderCount)} />
                <Metric label="Revenue" value={money(detail.revenue)} />
                <Metric label="Commission" value={money(detail.commission)} />
                <Metric label="Net earned" value={money(detail.netEarned)} />
                <Metric label="Paid" value={money(detail.totalPaid)} />
                <Metric label="Outstanding" value={money(detail.outstanding)} tone="text-emerald-600" />
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

function Metric({ label, value, tone = 'text-slate-800' }) {
  return (
    <div className="rounded-lg bg-slate-50 px-3 py-2">
      <p className="text-[11px] text-slate-500">{label}</p>
      <p className={`text-sm font-bold ${tone}`}>{value}</p>
    </div>
  );
}
