import prisma from '../prisma/client.js';
import { sendMail } from './mailer.js';

const DEFAULT_REFILL_DAYS = 30;

// A product is "refillable" (a consumable medicine/supplement, not a device)
// if it looks medicine-like or the admin set an explicit refill window.
const isRefillable = (p) =>
  !!p &&
  (p.refillDays > 0 ||
    p.requiresPrescription ||
    (p.saltComposition && p.saltComposition.trim()) ||
    (p.dosageForm && p.dosageForm.trim()));

const addDays = (date, days) => {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
};

const CLIENT_URL = (process.env.CLIENT_URLS || '').split(',')[0]?.trim() || '';

// When an order is delivered, schedule a refill reminder for each refillable
// item. Fallback: product.refillDays if set, else 30 days. Never throws.
export const scheduleRefillsForOrder = async (order) => {
  try {
    if (!order?.userId || !Array.isArray(order.items)) return;
    const ids = [...new Set(order.items.map((i) => i.product || i.productId).filter(Boolean))];
    if (ids.length === 0) return;

    const products = await prisma.product.findMany({ where: { id: { in: ids } } });
    const byId = new Map(products.map((p) => [p.id, p]));
    const from = order.deliveredAt || new Date();

    for (const item of order.items) {
      const pid = item.product || item.productId;
      const p = byId.get(pid);
      if (!isRefillable(p)) continue;

      // Skip if we already scheduled a reminder for this order+product.
      const exists = await prisma.refillReminder.findFirst({
        where: { orderId: order.id, productId: pid },
      });
      if (exists) continue;

      const days = p.refillDays > 0 ? p.refillDays : DEFAULT_REFILL_DAYS;
      await prisma.refillReminder.create({
        data: {
          userId: order.userId,
          orderId: order.id,
          productId: pid,
          productName: p.name,
          productSlug: p.slug,
          thumbnail: p.thumbnail || (p.images && p.images[0]) || '',
          dueDate: addDays(from, days),
        },
      });
    }
  } catch (err) {
    console.error('scheduleRefillsForOrder failed:', err.message);
  }
};

// Email one reminder and mark it sent. Returns true on success.
const sendReminder = async (r, email) => {
  const link = CLIENT_URL
    ? `${CLIENT_URL}/product/${r.productSlug || r.productId}`
    : '';
  const cta = link
    ? `<a href="${link}" style="display:inline-block;background:#0e9f8e;color:#fff;text-decoration:none;padding:10px 20px;border-radius:10px;font-weight:bold">Reorder now</a>`
    : '';
  await sendMail({
    to: email,
    subject: `Time to refill ${r.productName}`,
    text: `Hi, it looks like your ${r.productName} may be running low. Reorder anytime${link ? `: ${link}` : ''}.`,
    html: `<div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;color:#0f172a">
             <h2 style="color:#0e9f8e;margin:0 0 8px">Time to refill?</h2>
             <p style="color:#475569">Your <b>${r.productName}</b> may be running low. Reorder in a tap to avoid a gap in your treatment.</p>
             ${r.thumbnail ? `<img src="${r.thumbnail}" alt="" width="120" style="border-radius:10px;margin:10px 0"/>` : ''}
             <p style="margin:16px 0">${cta}</p>
             <p style="font-size:12px;color:#94a3b8">You're receiving this because you ordered this item from DCare. — Team DCare</p>
           </div>`,
  });
};

// Find every due, still-scheduled reminder and email it. Never throws.
export const runDueRefillReminders = async () => {
  try {
    const due = await prisma.refillReminder.findMany({
      where: { status: 'scheduled', dueDate: { lte: new Date() } },
      take: 200,
    });
    if (due.length === 0) return;

    // Resolve emails for the users involved.
    const userIds = [...new Set(due.map((r) => r.userId))];
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, email: true },
    });
    const emailById = new Map(users.map((u) => [u.id, u.email]));

    for (const r of due) {
      const email = emailById.get(r.userId);
      try {
        if (email) await sendReminder(r, email);
        await prisma.refillReminder.update({
          where: { id: r.id },
          data: { status: 'sent', sentAt: new Date() },
        });
      } catch (err) {
        console.error(`Refill reminder ${r.id} failed:`, err.message);
      }
    }
    console.log(`💊 Sent ${due.length} refill reminder(s).`);
  } catch (err) {
    console.error('runDueRefillReminders failed:', err.message);
  }
};

// In-process scheduler: check on boot, then every 6 hours. Disable with
// REFILL_REMINDERS=false.
export const startRefillScheduler = () => {
  if (process.env.REFILL_REMINDERS === 'false') return;
  const SIX_HOURS = 6 * 60 * 60 * 1000;
  setTimeout(() => runDueRefillReminders(), 30 * 1000); // shortly after boot
  setInterval(() => runDueRefillReminders(), SIX_HOURS);
};
