import prisma from '../prisma/client.js';
import { withId } from '../prisma/serialize.js';
import { sendMail } from '../lib/mailer.js';

// Basic RFC-5322-ish email check — good enough to reject obvious junk.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const BRAND = 'DBL Life Care';
// First storefront URL (for the "Start shopping" button), if configured.
const STOREFRONT_URL = (process.env.CLIENT_URLS || '').split(',')[0]?.trim() || '';

// Branded welcome email sent once, when someone first joins the list.
function welcomeEmail(email) {
  const shopBtn = STOREFRONT_URL
    ? `<a href="${STOREFRONT_URL}" style="display:inline-block;margin-top:20px;background:#0e9f8e;color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:10px;font-weight:700;font-size:15px">Start shopping</a>`
    : '';
  return {
    to: email,
    subject: `Welcome to ${BRAND} 💊`,
    text: `Welcome to ${BRAND}!\n\nThanks for subscribing. You'll be the first to hear about offers, health tips and new products.${STOREFRONT_URL ? `\n\nStart shopping: ${STOREFRONT_URL}` : ''}\n\nStay healthy,\nThe ${BRAND} Team`,
    html: `<div style="margin:0;padding:24px;background:#f0fdfa;font-family:Arial,Helvetica,sans-serif">
      <div style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(14,159,142,0.12)">
        <div style="background:#0e9f8e;padding:26px 24px;text-align:center">
          <span style="color:#ffffff;font-size:22px;font-weight:800;letter-spacing:-0.3px">${BRAND}</span>
        </div>
        <div style="padding:32px 28px;color:#1e293b">
          <h1 style="margin:0 0 12px;font-size:22px;color:#0f172a">Welcome aboard! 🎉</h1>
          <p style="margin:0 0 14px;font-size:15px;line-height:1.6;color:#475569">
            Thanks for subscribing to the ${BRAND} newsletter. You'll be the first to hear about
            exclusive offers, practical health tips and new products in our pharmacy.
          </p>
          <p style="margin:0;font-size:15px;line-height:1.6;color:#475569">
            Genuine medicines, doctor consultations and lab tests — all delivered to your door.
          </p>
          ${shopBtn}
        </div>
        <div style="padding:18px 24px;background:#f8fafc;text-align:center;color:#94a3b8;font-size:12px">
          You're receiving this because you subscribed at ${BRAND}.
        </div>
      </div>
    </div>`,
  };
}

// @route POST /api/newsletter  (public) — customer subscribes from the storefront
export const subscribe = async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  if (!EMAIL_RE.test(email)) {
    return res.status(400).json({ message: 'Please enter a valid email address' });
  }
  // Was this address already an active subscriber? If so, don't re-send the welcome.
  const existing = await prisma.subscriber.findUnique({ where: { email } });
  const isNew = !existing || !existing.active;

  // Upsert so re-subscribing is idempotent and re-activates a previous opt-out.
  await prisma.subscriber.upsert({
    where: { email },
    update: { active: true },
    create: { email, source: 'website' },
  });
  res.status(201).json({ success: true });

  // Fire-and-forget welcome email — only for genuinely new / re-activated joins.
  if (isNew) sendMail(welcomeEmail(email)).catch(() => {});
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
