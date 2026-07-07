import prisma from '../prisma/client.js';
import { serializeUser, serializeOrder } from '../prisma/serialize.js';

// Prepaid = anything that isn't Cash on Delivery (Razorpay/UPI/card/etc.)
const isCod = (method) => /cash on delivery|\bcod\b/i.test(method || '');

// @route GET /api/users  (admin) — list customers with order stats
export const getCustomers = async (req, res) => {
  const { keyword, page = 1, limit = 15, from, to, payment } = req.query;
  const where = { role: 'customer' };
  const AND = [];

  if (keyword) {
    AND.push({
      OR: [
        { name: { contains: keyword, mode: 'insensitive' } },
        { email: { contains: keyword, mode: 'insensitive' } },
        { phone: { contains: keyword } },
      ],
    });
  }

  // Joined-date range filter (inclusive). `to` covers the whole end day.
  if (from || to) {
    const createdAt = {};
    if (from) createdAt.gte = new Date(from);
    if (to) {
      const end = new Date(to);
      end.setHours(23, 59, 59, 999);
      createdAt.lte = end;
    }
    AND.push({ createdAt });
  }

  // Payment-mode filter: customers who have at least one order of that kind.
  if (payment === 'cod') {
    AND.push({ orders: { some: { paymentMethod: { contains: 'Cash on Delivery', mode: 'insensitive' } } } });
  } else if (payment === 'prepaid') {
    AND.push({ orders: { some: { NOT: { paymentMethod: { contains: 'Cash on Delivery', mode: 'insensitive' } } } } });
  }

  if (AND.length) where.AND = AND;

  const pageNum = Math.max(1, Number(page));
  const perPage = Number(limit);

  const [users, total, grouped] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (pageNum - 1) * perPage,
      take: perPage,
    }),
    prisma.user.count({ where }),
    // Group by user + payment method so we can derive each customer's mode.
    prisma.order.groupBy({
      by: ['userId', 'paymentMethod'],
      _count: { _all: true },
      _sum: { totalPrice: true },
    }),
  ]);

  const stats = {};
  grouped.forEach((g) => {
    if (!g.userId) return;
    const s = stats[g.userId] || { orders: 0, spent: 0, cod: false, prepaid: false };
    s.orders += g._count._all;
    s.spent += g._sum.totalPrice || 0;
    if (isCod(g.paymentMethod)) s.cod = true;
    else s.prepaid = true;
    stats[g.userId] = s;
  });

  const paymentModeLabel = (s) => {
    if (!s || s.orders === 0) return '—';
    if (s.cod && s.prepaid) return 'Both';
    if (s.prepaid) return 'Prepaid';
    return 'COD';
  };

  const customers = users.map((u) => ({
    ...serializeUser(u),
    orderCount: stats[u.id]?.orders || 0,
    totalSpent: stats[u.id]?.spent || 0,
    paymentMode: paymentModeLabel(stats[u.id]),
  }));

  res.json({ customers, page: pageNum, pages: Math.ceil(total / perPage), total });
};

// @route GET /api/users/:id  (admin) — a customer with their orders
export const getCustomer = async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.params.id } });
  if (!user) return res.status(404).json({ message: 'Customer not found' });
  const orders = await prisma.order.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
  });
  res.json({ customer: serializeUser(user), orders: orders.map(serializeOrder) });
};
