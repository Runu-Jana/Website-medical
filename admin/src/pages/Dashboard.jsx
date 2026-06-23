import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FiDollarSign,
  FiShoppingBag,
  FiBox,
  FiUsers,
  FiTrendingUp,
  FiClock,
  FiAlertTriangle,
  FiTag,
  FiStar,
} from 'react-icons/fi';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  Line,
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import api, { API_URL } from '../lib/api.js';
import StatCard from '../components/StatCard.jsx';
import MiniStat from '../components/MiniStat.jsx';
import ChartCard from '../components/ChartCard.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import Loader from '../components/Loader.jsx';
import EmptyState from '../components/EmptyState.jsx';
import { formatCurrency, formatCurrencyCompact, formatCompact, formatNumber, formatDate } from '../lib/format.js';

const STATUS_COLORS = {
  pending: '#f59e0b',
  processing: '#3b82f6',
  shipped: '#6366f1',
  delivered: '#16a34a',
  cancelled: '#ef4444',
};
const PIE_PALETTE = ['#1c64f2', '#16a34a', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#84cc16'];

const resolveImg = (u) => {
  if (!u) return '';
  if (u.startsWith('http')) return u;
  return `${API_URL}${u.startsWith('/') ? '' : '/'}${u}`;
};

const ChartTooltip = ({ active, payload, label, money }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-card">
      <p className="mb-1 font-semibold text-slate-700">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} className="flex items-center gap-2" style={{ color: p.color || p.fill }}>
          <span className="capitalize">{p.name}:</span>
          <span className="font-semibold">
            {money && p.dataKey === 'revenue' ? formatCurrency(p.value) : formatNumber(p.value)}
          </span>
        </p>
      ))}
    </div>
  );
};

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [cards, setCards] = useState(null);
  const [weekly, setWeekly] = useState(null);
  const [yearly, setYearly] = useState(null);
  const [topProducts, setTopProducts] = useState([]);
  const [catDist, setCatDist] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [orderStatus, setOrderStatus] = useState([]);

  const [weeklyMetric, setWeeklyMetric] = useState('revenue');
  const [year, setYear] = useState(new Date().getFullYear());

  const years = useMemo(() => {
    const cur = new Date().getFullYear();
    return [cur, cur - 1, cur - 2];
  }, []);

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      try {
        const [s, w, y, tp, cd, ro, os] = await Promise.all([
          api.get('/dashboard/summary'),
          api.get('/dashboard/weekly'),
          api.get(`/dashboard/yearly?year=${year}`),
          api.get('/dashboard/top-products'),
          api.get('/dashboard/category-distribution'),
          api.get('/dashboard/recent-orders'),
          api.get('/dashboard/order-status'),
        ]);
        if (!active) return;
        setCards(s.data?.cards || {});
        setWeekly(w.data || null);
        setYearly(y.data || null);
        setTopProducts(tp.data || []);
        setCatDist(cd.data || []);
        setRecentOrders(ro.data || []);
        setOrderStatus(os.data || []);
      } catch (err) {
        // surfaced by interceptor for 401; otherwise silently degrade
        console.error('Dashboard load error', err);
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-fetch yearly when year changes
  useEffect(() => {
    let active = true;
    api
      .get(`/dashboard/yearly?year=${year}`)
      .then((r) => active && setYearly(r.data))
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [year]);

  if (loading) return <Loader label="Loading dashboard..." />;

  const c = cards || {};
  const totalStatusCount = orderStatus.reduce((a, s) => a + (s.count || 0), 0);

  return (
    <div className="space-y-6">
      {/* Heading */}
      <div>
        <h2 className="text-xl font-bold text-slate-800">Dashboard Overview</h2>
        <p className="text-sm text-slate-500">Key metrics and performance insights for your store.</p>
      </div>

      {/* Top stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total Revenue"
          value={formatCurrencyCompact(c.totalRevenue)}
          icon={FiDollarSign}
          gradient="blue"
          growth={c.revenueGrowth}
        />
        <StatCard
          title="Total Orders"
          value={formatCompact(c.totalOrders)}
          icon={FiShoppingBag}
          gradient="green"
          growth={c.orderGrowth}
        />
        <StatCard
          title="Total Products"
          value={formatCompact(c.totalProducts)}
          icon={FiBox}
          gradient="amber"
          subtitle="In catalog"
        />
        <StatCard
          title="Total Customers"
          value={formatCompact(c.totalCustomers)}
          icon={FiUsers}
          gradient="purple"
          subtitle="Registered users"
        />
      </div>

      {/* Secondary mini stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MiniStat
          title="This Month Revenue"
          value={formatCurrency(c.monthRevenue)}
          icon={FiTrendingUp}
          color="green"
        />
        <MiniStat title="Pending Orders" value={formatNumber(c.pendingOrders)} icon={FiClock} color="amber" />
        <MiniStat title="Low Stock" value={formatNumber(c.lowStock)} icon={FiAlertTriangle} color="red" />
        <MiniStat title="Categories" value={formatNumber(c.totalCategories)} icon={FiTag} color="blue" />
      </div>

      {/* Weekly + Order status */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <ChartCard
          className="xl:col-span-2"
          title="Weekly Performance"
          subtitle={`Last 7 days · ${formatCurrency(weekly?.totalRevenue)} revenue · ${formatNumber(
            weekly?.totalOrders
          )} orders`}
          actions={
            <div className="flex rounded-lg bg-slate-100 p-1 text-sm">
              {['revenue', 'orders'].map((m) => (
                <button
                  key={m}
                  onClick={() => setWeeklyMetric(m)}
                  className={`rounded-md px-3 py-1 font-medium capitalize transition ${
                    weeklyMetric === m ? 'bg-white text-primary shadow' : 'text-slate-500'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          }
        >
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={weekly?.series || []}>
              <defs>
                <linearGradient id="wRev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#1c64f2" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#1c64f2" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="wOrd" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#16a34a" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis
                tick={{ fontSize: 12, fill: '#64748b' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => (weeklyMetric === 'revenue' ? '$' + formatCompact(v) : formatCompact(v))}
              />
              <Tooltip content={<ChartTooltip money={weeklyMetric === 'revenue'} />} />
              <Area
                type="monotone"
                dataKey={weeklyMetric}
                name={weeklyMetric}
                stroke={weeklyMetric === 'revenue' ? '#1c64f2' : '#16a34a'}
                strokeWidth={2.5}
                fill={weeklyMetric === 'revenue' ? 'url(#wRev)' : 'url(#wOrd)'}
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Order Status" subtitle={`${formatNumber(totalStatusCount)} total orders`}>
          {orderStatus.length === 0 ? (
            <EmptyState title="No orders yet" />
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={orderStatus}
                  dataKey="count"
                  nameKey="status"
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={90}
                  paddingAngle={3}
                >
                  {orderStatus.map((s) => (
                    <Cell key={s.status} fill={STATUS_COLORS[s.status] || '#94a3b8'} />
                  ))}
                </Pie>
                <Tooltip formatter={(v, n) => [formatNumber(v), n]} />
                <Legend
                  iconType="circle"
                  formatter={(value) => <span className="text-xs capitalize text-slate-600">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      {/* Yearly + Category distribution */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <ChartCard
          className="xl:col-span-2"
          title="Yearly Revenue Overview"
          subtitle={`${yearly?.year || year} · ${formatCurrency(yearly?.totalRevenue)} revenue · ${formatNumber(
            yearly?.totalOrders
          )} orders`}
          actions={
            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="rounded-lg border border-slate-300 px-2 py-1 text-sm outline-none focus:border-primary"
            >
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          }
        >
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={yearly?.series || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis
                yAxisId="left"
                tick={{ fontSize: 12, fill: '#64748b' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => '$' + formatCompact(v)}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                tick={{ fontSize: 12, fill: '#64748b' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => formatCompact(v)}
              />
              <Tooltip content={<ChartTooltip money />} />
              <Legend
                formatter={(value) => <span className="text-xs capitalize text-slate-600">{value}</span>}
              />
              <Bar yAxisId="left" dataKey="revenue" name="revenue" fill="#1c64f2" radius={[4, 4, 0, 0]} barSize={18} />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="orders"
                name="orders"
                stroke="#16a34a"
                strokeWidth={2.5}
                dot={{ r: 3 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Category Distribution" subtitle="Products per category">
          {catDist.length === 0 ? (
            <EmptyState title="No categories" />
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={catDist} layout="vertical" margin={{ left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={90}
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip formatter={(v, n) => [formatNumber(v), n === 'count' ? 'Products' : 'Sold']} />
                <Bar dataKey="count" name="count" radius={[0, 4, 4, 0]} barSize={16}>
                  {catDist.map((_, i) => (
                    <Cell key={i} fill={PIE_PALETTE[i % PIE_PALETTE.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      {/* Top products + Recent orders */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <ChartCard title="Top Selling Products" subtitle="Best performers by units sold">
          {topProducts.length === 0 ? (
            <EmptyState title="No sales data" />
          ) : (
            <div className="space-y-1">
              {topProducts.map((p, i) => {
                const img = p.thumbnail || p.images?.[0];
                return (
                  <div key={p._id} className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-slate-50">
                    <span className="w-5 text-center text-sm font-bold text-slate-400">{i + 1}</span>
                    <div className="h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                      {img ? (
                        <img src={resolveImg(img)} alt={p.name} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-slate-300">
                          <FiBox />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-800">{p.name}</p>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span className="inline-flex items-center gap-0.5 text-warning">
                          <FiStar size={11} className="fill-current" />
                          {Number(p.rating || 0).toFixed(1)}
                        </span>
                        <span>·</span>
                        <span>{formatNumber(p.sold)} sold</span>
                      </div>
                    </div>
                    <span className="text-sm font-semibold text-slate-700">{formatCurrency(p.price)}</span>
                  </div>
                );
              })}
            </div>
          )}
        </ChartCard>

        <ChartCard
          title="Recent Orders"
          subtitle="Latest customer orders"
          actions={
            <Link to="/orders" className="text-sm font-semibold text-primary hover:underline">
              View all
            </Link>
          }
        >
          {recentOrders.length === 0 ? (
            <EmptyState title="No recent orders" />
          ) : (
            <div className="-mx-2 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wider text-slate-400">
                    <th className="px-2 py-2 font-semibold">Order</th>
                    <th className="px-2 py-2 font-semibold">Customer</th>
                    <th className="px-2 py-2 font-semibold">Total</th>
                    <th className="px-2 py-2 font-semibold">Status</th>
                    <th className="px-2 py-2 font-semibold">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentOrders.map((o) => (
                    <tr key={o._id} className="hover:bg-slate-50">
                      <td className="px-2 py-2.5 font-semibold text-slate-700">
                        #{o.orderNumber || o._id?.slice(-6)}
                      </td>
                      <td className="px-2 py-2.5">
                        <p className="font-medium text-slate-700">{o.user?.name || 'Guest'}</p>
                        <p className="text-xs text-slate-400">{o.user?.email}</p>
                      </td>
                      <td className="px-2 py-2.5 font-semibold text-slate-700">
                        {formatCurrency(o.totalPrice)}
                      </td>
                      <td className="px-2 py-2.5">
                        <StatusBadge status={o.status} />
                      </td>
                      <td className="px-2 py-2.5 text-slate-500">{formatDate(o.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </ChartCard>
      </div>
    </div>
  );
}
