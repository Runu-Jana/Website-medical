import prisma from '../prisma/client.js';
import { withId } from '../prisma/serialize.js';

// Basic RFC-5322-ish email check — good enough to reject obvious junk.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// @route POST /api/newsletter  (public) — customer subscribes from the storefront
export const subscribe = async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  if (!EMAIL_RE.test(email)) {
    return res.status(400).json({ message: 'Please enter a valid email address' });
  }
  // Upsert so re-subscribing is idempotent and re-activates a previous opt-out.
  await prisma.subscriber.upsert({
    where: { email },
    update: { active: true },
    create: { email, source: 'website' },
  });
  res.status(201).json({ success: true });
};

// @route GET /api/newsletter  (admin) — list subscribers
export const getSubscribers = async (req, res) => {
  const { page = 1, limit = 25 } = req.query;
  const pageNum = Math.max(1, Number(page));
  const perPage = Math.min(100, Math.max(1, Number(limit)));
  const [items, total, active] = await Promise.all([
    prisma.subscriber.findMany({
      orderBy: { createdAt: 'desc' },
      skip: (pageNum - 1) * perPage,
      take: perPage,
    }),
    prisma.subscriber.count(),
    prisma.subscriber.count({ where: { active: true } }),
  ]);
  res.json({
    subscribers: items.map(withId),
    active,
    page: pageNum,
    pages: Math.ceil(total / perPage) || 1,
    total,
  });
};

// @route GET /api/newsletter/export  (admin) — download the full list as CSV
export const exportSubscribers = async (req, res) => {
  const items = await prisma.subscriber.findMany({ orderBy: { createdAt: 'desc' } });
  const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const rows = [
    ['Email', 'Status', 'Source', 'Subscribed On'],
    ...items.map((s) => [
      s.email,
      s.active ? 'Subscribed' : 'Unsubscribed',
      s.source,
      new Date(s.createdAt).toISOString(),
    ]),
  ];
  const csv = rows.map((r) => r.map(esc).join(',')).join('\r\n');
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="dbl-newsletter-subscribers.csv"');
  res.send('﻿' + csv); // BOM so Excel opens UTF-8 correctly
};

// @route DELETE /api/newsletter/:id  (admin) — remove a subscriber
export const deleteSubscriber = async (req, res) => {
  await prisma.subscriber.delete({ where: { id: req.params.id } }).catch(() => {});
  res.json({ success: true });
};
