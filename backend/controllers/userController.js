import prisma from '../prisma/client.js';
import { serializeUser, serializeOrder } from '../prisma/serialize.js';

// @route GET /api/users  (admin) — list customers with order stats
export const getCustomers = async (req, res) => {
  const { keyword, page = 1, limit = 15 } = req.query;
  const where = { role: 'customer' };
  if (keyword) {
    where.OR = [
      { name: { contains: keyword, mode: 'insensitive' } },
      { email: { contains: keyword, mode: 'insensitive' } },
      { phone: { contains: keyword } },
    ];
  }
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
    prisma.order.groupBy({ by: ['userId'], _count: { _all: true }, _sum: { totalPrice: true } }),
  ]);

  const stats = {};
  grouped.forEach((g) => {
    if (g.userId) stats[g.userId] = { orders: g._count._all, spent: g._sum.totalPrice || 0 };
  });

  const customers = users.map((u) => ({
    ...serializeUser(u),
    orderCount: stats[u.id]?.orders || 0,
    totalSpent: stats[u.id]?.spent || 0,
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
