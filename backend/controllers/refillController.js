import prisma from '../prisma/client.js';
import { withId } from '../prisma/serialize.js';

// @route GET /api/me/refills  (customer) — upcoming + past reminders
export const getMyRefills = async (req, res) => {
  const list = await prisma.refillReminder.findMany({
    where: { userId: req.user.id, status: { not: 'cancelled' } },
    orderBy: { dueDate: 'asc' },
  });
  res.json(list.map(withId));
};

// @route PATCH /api/me/refills/:id  (customer) — snooze or cancel
export const updateMyRefill = async (req, res) => {
  const reminder = await prisma.refillReminder.findFirst({
    where: { id: req.params.id, userId: req.user.id },
  });
  if (!reminder) return res.status(404).json({ message: 'Reminder not found' });

  const data = {};
  if (req.body.action === 'cancel') {
    data.status = 'cancelled';
  } else if (req.body.action === 'snooze') {
    const days = Math.min(90, Math.max(1, Number(req.body.days) || 7));
    const base = reminder.dueDate > new Date() ? reminder.dueDate : new Date();
    const due = new Date(base);
    due.setDate(due.getDate() + days);
    data.dueDate = due;
    data.status = 'scheduled'; // re-arm even if it was already sent
    data.sentAt = null;
  } else {
    return res.status(400).json({ message: 'Unknown action' });
  }

  const updated = await prisma.refillReminder.update({ where: { id: reminder.id }, data });
  res.json(withId(updated));
};

// @route GET /api/refills  (admin) — upcoming refills across all customers
export const getRefills = async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const pageNum = Math.max(1, Number(page));
  const perPage = Number(limit);
  const where = { status: { not: 'cancelled' } };

  const [items, total] = await Promise.all([
    prisma.refillReminder.findMany({
      where,
      orderBy: { dueDate: 'asc' },
      skip: (pageNum - 1) * perPage,
      take: perPage,
    }),
    prisma.refillReminder.count({ where }),
  ]);

  // Attach customer name/contact.
  const userIds = [...new Set(items.map((r) => r.userId))];
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, name: true, email: true, phone: true },
  });
  const byId = new Map(users.map((u) => [u.id, u]));

  const refills = items.map((r) => ({
    ...withId(r),
    customer: byId.get(r.userId) || null,
  }));

  res.json({ refills, page: pageNum, pages: Math.ceil(total / perPage), total });
};
