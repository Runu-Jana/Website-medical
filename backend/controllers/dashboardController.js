import Order from '../models/Order.js';
import Product from '../models/Product.js';
import User from '../models/User.js';
import Category from '../models/Category.js';

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// @route GET /api/dashboard/summary  (admin)
export const getSummary = async (req, res) => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

  const revenueAgg = async (match) => {
    const r = await Order.aggregate([
      { $match: { status: { $ne: 'cancelled' }, ...match } },
      { $group: { _id: null, total: { $sum: '$totalPrice' }, count: { $sum: 1 } } },
    ]);
    return r[0] || { total: 0, count: 0 };
  };

  const [
    totalProducts,
    totalCategories,
    totalCustomers,
    totalOrders,
    allTime,
    thisMonth,
    prevMonth,
    pendingOrders,
    lowStock,
  ] = await Promise.all([
    Product.countDocuments(),
    Category.countDocuments(),
    User.countDocuments({ role: 'customer' }),
    Order.countDocuments(),
    revenueAgg({}),
    revenueAgg({ createdAt: { $gte: startOfMonth } }),
    revenueAgg({ createdAt: { $gte: startOfPrevMonth, $lte: endOfPrevMonth } }),
    Order.countDocuments({ status: 'pending' }),
    Product.countDocuments({ countInStock: { $lte: 5 } }),
  ]);

  const pct = (cur, prev) =>
    prev === 0 ? (cur > 0 ? 100 : 0) : Math.round(((cur - prev) / prev) * 100);

  res.json({
    cards: {
      totalRevenue: allTime.total,
      totalOrders,
      totalProducts,
      totalCustomers,
      totalCategories,
      pendingOrders,
      lowStock,
      monthRevenue: thisMonth.total,
      monthOrders: thisMonth.count,
      revenueGrowth: pct(thisMonth.total, prevMonth.total),
      orderGrowth: pct(thisMonth.count, prevMonth.count),
    },
  });
};

// @route GET /api/dashboard/weekly  (admin) — last 7 days revenue & orders
export const getWeekly = async (req, res) => {
  const start = new Date();
  start.setDate(start.getDate() - 6);
  start.setHours(0, 0, 0, 0);

  const agg = await Order.aggregate([
    { $match: { createdAt: { $gte: start }, status: { $ne: 'cancelled' } } },
    {
      $group: {
        _id: {
          y: { $year: '$createdAt' },
          m: { $month: '$createdAt' },
          d: { $dayOfMonth: '$createdAt' },
        },
        revenue: { $sum: '$totalPrice' },
        orders: { $sum: 1 },
      },
    },
  ]);

  const map = {};
  agg.forEach((a) => {
    const key = `${a._id.y}-${a._id.m}-${a._id.d}`;
    map[key] = { revenue: a.revenue, orders: a.orders };
  });

  const series = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const key = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
    series.push({
      label: DAYS[d.getDay()],
      date: d.toISOString().slice(0, 10),
      revenue: map[key]?.revenue || 0,
      orders: map[key]?.orders || 0,
    });
  }

  const totalRevenue = series.reduce((a, s) => a + s.revenue, 0);
  const totalOrders = series.reduce((a, s) => a + s.orders, 0);
  res.json({ series, totalRevenue, totalOrders });
};

// @route GET /api/dashboard/yearly  (admin) — 12 month revenue & orders
export const getYearly = async (req, res) => {
  const year = Number(req.query.year) || new Date().getFullYear();
  const start = new Date(year, 0, 1);
  const end = new Date(year + 1, 0, 1);

  const agg = await Order.aggregate([
    { $match: { createdAt: { $gte: start, $lt: end }, status: { $ne: 'cancelled' } } },
    {
      $group: {
        _id: { $month: '$createdAt' },
        revenue: { $sum: '$totalPrice' },
        orders: { $sum: 1 },
      },
    },
  ]);

  const map = {};
  agg.forEach((a) => (map[a._id] = { revenue: a.revenue, orders: a.orders }));

  const series = MONTHS.map((label, idx) => ({
    label,
    month: idx + 1,
    revenue: map[idx + 1]?.revenue || 0,
    orders: map[idx + 1]?.orders || 0,
  }));

  res.json({
    year,
    series,
    totalRevenue: series.reduce((a, s) => a + s.revenue, 0),
    totalOrders: series.reduce((a, s) => a + s.orders, 0),
  });
};

// @route GET /api/dashboard/top-products  (admin)
export const getTopProducts = async (req, res) => {
  const products = await Product.find()
    .sort({ sold: -1 })
    .limit(8)
    .select('name thumbnail images sold price rating');
  res.json(products);
};

// @route GET /api/dashboard/category-distribution  (admin)
export const getCategoryDistribution = async (req, res) => {
  const agg = await Product.aggregate([
    { $group: { _id: '$category', count: { $sum: 1 }, sold: { $sum: '$sold' } } },
  ]);
  const cats = await Category.find().select('name');
  const nameMap = {};
  cats.forEach((c) => (nameMap[c._id.toString()] = c.name));
  res.json(
    agg.map((a) => ({
      name: a._id ? nameMap[a._id.toString()] || 'Uncategorized' : 'Uncategorized',
      count: a.count,
      sold: a.sold,
    }))
  );
};

// @route GET /api/dashboard/recent-orders  (admin)
export const getRecentOrders = async (req, res) => {
  const orders = await Order.find()
    .populate('user', 'name email')
    .sort({ createdAt: -1 })
    .limit(8);
  res.json(orders);
};

// @route GET /api/dashboard/order-status  (admin)
export const getOrderStatusBreakdown = async (req, res) => {
  const agg = await Order.aggregate([
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);
  const statuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
  const map = {};
  agg.forEach((a) => (map[a._id] = a.count));
  res.json(statuses.map((s) => ({ status: s, count: map[s] || 0 })));
};
