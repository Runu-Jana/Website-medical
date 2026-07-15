import prisma from '../prisma/client.js';
import { withId } from '../prisma/serialize.js';
import { createNotification } from '../lib/notify.js';
import { sendMail } from '../lib/mailer.js';

// Notify admin (bell + email) about a confirmed lab booking. Called once the
// booking is actually secured — immediately when it's free, or after the online
// payment is verified.
export const notifyLabBooking = (booking) => {
  const items = Array.isArray(booking.items) ? booking.items : [];
  createNotification({
    type: 'message',
    title: `New lab test booking — ${booking.patientName}`,
    message: `${items.length} item(s) · ₹${booking.total} · ${booking.preferredDate || 'no date'}`,
    link: '/lab-bookings',
    meta: { labBookingId: booking.id },
  }).catch(() => {});

  const adminEmail = process.env.NOTIFY_EMAIL || process.env.ADMIN_EMAIL;
  if (adminEmail) {
    sendMail({
      to: adminEmail,
      subject: `New lab test booking: ${booking.patientName}`,
      text: `Patient: ${booking.patientName} (${booking.patientPhone} ${booking.patientEmail})
Tests: ${items.map((i) => i.name).join(', ')}
Total: ₹${booking.total}
Payment: ${booking.isPaid ? 'Paid online' : 'To be collected'}
Home collection: ${booking.address || '—'}
Preferred: ${booking.preferredDate} ${booking.preferredTime}
Note: ${booking.note || '—'}`,
    }).catch(() => {});
  }
};

// @route POST /api/lab-bookings  (protect)
export const createLabBooking = async (req, res) => {
  const b = req.body || {};
  const ids = Array.isArray(b.items) ? b.items.map((i) => i.id || i._id).filter(Boolean) : [];
  if (!ids.length) return res.status(400).json({ message: 'Select at least one test or package' });
  if (!b.patientName || !(b.patientPhone || b.patientEmail)) {
    return res.status(400).json({ message: 'Please provide your name and a phone or email' });
  }

  // Price the selection from the DB (never trust the client's amounts).
  const tests = await prisma.labTest.findMany({ where: { id: { in: ids }, active: true } });
  if (!tests.length) return res.status(400).json({ message: 'Selected tests are unavailable' });
  const items = tests.map((t) => ({ id: t.id, name: t.name, price: t.price }));
  const total = items.reduce((s, i) => s + i.price, 0);

  // Lab tests are pay-at-visit: the customer books online and pays at the time
  // of sample collection (per lab rules), so a booking is confirmed immediately
  // and never requires online payment.
  const booking = await prisma.labBooking.create({
    data: {
      userId: req.user.id,
      patientName: String(b.patientName).trim(),
      patientPhone: String(b.patientPhone || '').trim(),
      patientEmail: String(b.patientEmail || req.user?.email || '').trim(),
      address: String(b.address || '').trim(),
      preferredDate: String(b.preferredDate || '').trim(),
      preferredTime: String(b.preferredTime || '').trim(),
      items,
      total,
      note: String(b.note || '').trim(),
      paymentRequired: false,
    },
  });

  res.status(201).json({ success: true, booking: withId(booking), requiresPayment: false });

  notifyLabBooking(booking);
};

// Only surface bookings that are actually secured: either no payment was
// required (free), or the online payment has been completed. Bookings still
// awaiting payment (abandoned checkouts) are hidden.
const CONFIRMED_ONLY = { OR: [{ paymentRequired: false }, { isPaid: true }] };

// @route GET /api/lab-bookings/mine  (protect)
export const getMyLabBookings = async (req, res) => {
  const list = await prisma.labBooking.findMany({
    where: { userId: req.user.id, ...CONFIRMED_ONLY },
    orderBy: { createdAt: 'desc' },
  });
  res.json(list.map(withId));
};

// @route GET /api/lab-bookings  (admin)
export const getLabBookings = async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  const where = { ...CONFIRMED_ONLY };
  if (status) where.status = status;
  const pageNum = Math.max(1, Number(page));
  const perPage = Number(limit);
  const [items, total, pending] = await Promise.all([
    prisma.labBooking.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (pageNum - 1) * perPage, take: perPage }),
    prisma.labBooking.count({ where }),
    prisma.labBooking.count({ where: { status: 'pending', ...CONFIRMED_ONLY } }),
  ]);
  res.json({ bookings: items.map(withId), pending, page: pageNum, pages: Math.ceil(total / perPage), total });
};

// @route PUT /api/lab-bookings/:id  (admin)
export const updateLabBooking = async (req, res) => {
  const { status } = req.body;
  const valid = ['pending', 'confirmed', 'sample-collected', 'completed', 'cancelled'];
  if (status && !valid.includes(status)) return res.status(400).json({ message: 'Invalid status' });
  const updated = await prisma.labBooking
    .update({ where: { id: req.params.id }, data: { ...(status ? { status } : {}) } })
    .catch(() => null);
  if (!updated) return res.status(404).json({ message: 'Booking not found' });
  res.json(withId(updated));
};
