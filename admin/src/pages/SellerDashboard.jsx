import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiDollarSign, FiShoppingBag, FiBox, FiClock, FiAlertTriangle, FiPlus, FiTrendingUp } from 'react-icons/fi';
import api from '../lib/api.js';
import Loader from '../components/Loader.jsx';

const money = (n) => `₹${Math.round(Number(n) || 0).toLocaleString('en-IN')}`;

const Tile = ({ icon: Icon, label, value, color }) => (
  <div className="card flex items-center gap-3 p-4">
    <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${color}`}><Icon size={20} /></span>
    <div>
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-lg font-bold text-slate-800">{value}</p>
    </div>
  </div>
);

export default function SellerDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/vendors/stats')
      .then(({ data }) => setStats(data))
      .catch(() => setStats(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader label="Loading your dashboard..." />;
  if (!stats) return <div className="card p-8 text-center text-slate-500">Could not load your shop data.</div>;

  const notApproved = stats.status !== 'approved';

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-800">{stats.shopName || 'My Shop'}</h2>
          <p className="text-sm text-slate-500">Seller dashboard · commission {stats.commissionPercent}%</p>
        </div>
        <Link to="/products/new" className="btn-primary"><FiPlus size={18} /> Add Product</Link>
      </div>

      {notApproved && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Your shop is <b>{stats.status}</b>. Your products go live once an admin approves your account.
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <Tile icon={FiDollarSign} label="Revenue (your items)" value={money(stats.revenue)} color="bg-emerald-100 text-emerald-600" />
        <Tile icon={FiShoppingBag} label="Orders" value={stats.orderCount} color="bg-sky-100 text-sky-600" />
        <Tile icon={FiTrendingUp} label="Items sold" value={stats.itemsSold} color="bg-violet-100 text-violet-600" />
        <Tile icon={FiBox} label="Products (active)" value={`${stats.productCount} (${stats.activeCount})`} color="bg-indigo-100 text-indigo-600" />
        <Tile icon={FiClock} label="Pending orders" value={stats.pending} color="bg-amber-100 text-amber-600" />
        <Tile icon={FiAlertTriangle} label="Out of stock" value={stats.outOfStock} color="bg-rose-100 text-rose-600" />
      </div>

      <div className="card p-5">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-semibold text-slate-800">Recent Orders</h3>
          <Link to="/orders" className="text-sm font-semibold text-primary hover:underline">View all</Link>
        </div>
        {stats.recent.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-500">No orders with your products yet.</p>
        ) : (
          <div className="space-y-2">
            {stats.recent.map((o) => (
              <div key={o.id} className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 p-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-800">
                    #{o.orderNumber || o.id.slice(-6)} · {o.customer}
                  </p>
                  <p className="truncate text-xs text-slate-500">
                    {o.items.map((i) => `${i.name} ×${i.qty}`).join(', ')}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-slate-800">{money(o.subtotal)}</p>
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold capitalize text-primary">{o.status}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
