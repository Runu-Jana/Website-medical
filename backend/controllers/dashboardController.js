import prisma from '../prisma/client.js';
import { serializeProduct, serializeOrder } from '../prisma/serialize.js';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// @route GET /api/dashboard/summary  (admin)
export const getSummary = async (req, res) => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

  const revenueAgg = async (createdAt) => {
    const r = await prisma.order.aggregate({
      where: { status: { not: 'cancelled' }, ...(createdAt ? { createdAt } : {}) },
      _sum: { totalPrice: true },
      _count: true,
    });
    return { total: r._sum.totalPrice || 0, count: r._count || 0 };
  };

  const [
    totalProducts, totalCategories, totalCustomers, totalOrders,
    pendingOrders, lowStock, allTime, thisMonth, prevMonth,
  ] = await Promise.all([
    prisma.product.count(),
    prisma.category.count(),
    prisma.user.count({ where: { role: 'customer' } }),
    prisma.order.count(),
    prisma.order.count({ where: { status: 'pending' } }),
    prisma.product.count({ where: { countInStock: { lte: 5 } } }),
    revenueAgg(null),
    revenueAgg({ gte: startOfMonth }),
    revenueAgg({ gte: startOfPrevMonth, lte: endOfPrevMonth }),
  ]);

  const pct = (cur, prev) => (prev === 0 ? (cur > 0 ? 100 : 0) : Math.round(((cur - prev) / prev) * 100));

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

  const orders = await prisma.order.findMany({
    where: { createdAt: { gte: start }, status: { not: 'cancelled' } },
    select: { createdAt: true, totalPrice: true },
  });

  const map = {};
  for (const o of orders) {
    const d = o.createdAt;
    const key = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
    if (!map[key]) map[key] = { revenue: 0, orders: 0 };
    map[key].revenue += o.totalPrice;
    map[key].orders += 1;
  }

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

  res.json({
    series,
    totalRevenue: series.reduce((a, s) => a + s.revenue, 0),
    totalOrders: series.reduce((a, s) => a + s.orders, 0),
  });
};

// @route GET /api/dashboard/yearly  (admin) — 12 month revenue & orders
export const getYearly = async (req, res) => {
  const year = Number(req.query.year) || new Date().getFullYear();
  const start = new Date(year, 0, 1);
  const end = new Date(year + 1, 0, 1);

  const orders = await prisma.order.findMany({
    where: { createdAt: { gte: start, lt: end }, status: { not: 'cancelled' } },
    select: { createdAt: true, totalPrice: true },
  });

  const map = {};
  for (const o of orders) {
    const m = o.createdAt.getMonth() + 1;
    if (!map[m]) map[m] = { revenue: 0, orders: 0 };
    map[m].revenue += o.totalPrice;
    map[m].orders += 1;
  }

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
  const products = await prisma.product.findMany({
    orderBy: { sold: 'desc' },
    take: 8,
    include: { brand: true, categories: true },
  });
  res.json(products.map(serializeProduct));
};

// @route GET /api/dashboard/category-distribution  (admin)
export const getCategoryDistribution = async (req, res) => {
  const cats = await prisma.category.findMany();
  const result = await Promise.all(
    cats.map(async (c) => {
      const products = await prisma.product.findMany({
        where: { categories: { some: { id: c.id } } },
        select: { sold: true },
      });
      return {
        name: c.name,
        count: products.length,
        sold: products.reduce((a, p) => a + p.sold, 0),
      };
    })
  );
  res.json(result);
};

// @route GET /api/dashboard/recent-orders  (admin)
export const getRecentOrders = async (req, res) => {
  const orders = await prisma.order.findMany({
    include: { user: { select: { id: true, name: true, email: true } } },
    orderBy: { createdAt: 'desc' },
    take: 8,
  });
  res.json(orders.map(serializeOrder));
};

// @route GET /api/dashboard/order-status  (admin)
export const getOrderStatusBreakdown = async (req, res) => {
  const grouped = await prisma.order.groupBy({ by: ['status'], _count: { status: true } });
  const map = {};
  grouped.forEach((g) => (map[g.status] = g._count.status));
  const statuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
  res.json(statuses.map((s) => ({ status: s, count: map[s] || 0 })));
};

// @route GET /api/dashboard/notifications  (admin)
// Activity feed from the Notification store: unread count + latest items.
export const getNotifications = async (req, res) => {
  const [count, rows] = await Promise.all([
    prisma.notification.count({ where: { read: false } }),
    prisma.notification.findMany({ orderBy: { createdAt: 'desc' }, take: 20 }),
  ]);
  res.json({
    count,
    items: rows.map((n) => ({
      id: n.id,
      type: n.type,
      title: n.title,
      subtitle: n.message,
      link: n.link,
      read: n.read,
      time: n.createdAt,
    })),
  });
};

// @route POST /api/dashboard/notifications/read  (admin)
// Mark one (body.id) or all unread notifications as read; returns new count.
export const markNotificationsRead = async (req, res) => {
  const { id } = req.body || {};
  if (id) {
    await prisma.notification.update({ where: { id }, data: { read: true } }).catch(() => {});
  } else {
    await prisma.notification.updateMany({ where: { read: false }, data: { read: true } });
  }
  const count = await prisma.notification.count({ where: { read: false } });
  res.json({ count });
};
