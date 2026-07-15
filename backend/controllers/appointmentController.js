import prisma from '../prisma/client.js';
import { withId } from '../prisma/serialize.js';
import { createNotification } from '../lib/notify.js';
import { sendMail } from '../lib/mailer.js';
import { razorpayEnabled } from '../lib/razorpay.js';

const FEE_BY_TYPE = { video: 'videoFee', audio: 'audioFee', chat: 'chatFee' };

// Notify admin (bell + email) about a confirmed consultation. Called once the
// booking is actually secured — immediately when it's free, or after the online
// payment is verified.
export const notifyAppointmentBooked = (appt) => {
  createNotification({
    type: 'message',
    title: `New consultation booking — Dr. ${appt.doctorName}`,
    message: `${appt.patientName} · ${appt.consultationType} · ${appt.preferredDate || 'no date'} ${appt.preferredTime || ''}`.trim(),
    link: '/appointments',
    meta: { appointmentId: appt.id },
  }).catch(() => {});

  const adminEmail = process.env.NOTIFY_EMAIL || process.env.ADMIN_EMAIL;
  if (adminEmail) {
    sendMail({
      to: adminEmail,
      subject: `New consultation booking: Dr. ${appt.doctorName}`,
      text: `Patient: ${appt.patientName} (${appt.patientPhone} ${appt.patientEmail})
Doctor: ${appt.doctorName} — ${appt.specialty}
Type: ${appt.consultationType} · Fee: ₹${appt.fee}
Payment: ${appt.isPaid ? 'Paid online' : 'To be collected'}
Preferred: ${appt.preferredDate} ${appt.preferredTime}
Note: ${appt.note || '—'}`,
    }).catch(() => {});
  }
};

// @route POST /api/appointments  (protect) — book a consultation
export const createAppointment = async (req, res) => {
  const b = req.body || {};
  if (!b.doctorId) return res.status(400).json({ message: 'Doctor is required' });
  if (!b.patientName || !(b.patientPhone || b.patientEmail)) {
    return res.status(400).json({ message: 'Please provide your name and a phone or email' });
  }
  const doctor = await prisma.doctor.findUnique({ where: { id: b.doctorId } });
  if (!doctor) return res.status(404).json({ message: 'Doctor not found' });

  const type = ['video', 'audio', 'chat'].includes(b.consultationType) ? b.consultationType : 'video';
  // Fee is taken from the doctor record server-side (never trusted from client).
  const fee = doctor[FEE_BY_TYPE[type]] || doctor.fee || 0;

  // Online payment is required whenever it's configured and there's a fee to
  // charge. The booking is only confirmed (and admin notified) after the
  // payment is verified. A free consultation is booked straight away.
  const requiresPayment = razorpayEnabled && fee >= 1;

  const appt = await prisma.appointment.create({
    data: {
      doctorId: doctor.id,
      doctorName: doctor.name,
      specialty: doctor.specialty,
      userId: req.user.id,
      patientName: String(b.patientName).trim(),
      patientPhone: String(b.patientPhone || '').trim(),
      patientEmail: String(b.patientEmail || req.user?.email || '').trim(),
      consultationType: type,
      fee,
      preferredDate: String(b.preferredDate || '').trim(),
      preferredTime: String(b.preferredTime || '').trim(),
      note: String(b.note || '').trim(),
      paymentRequired: requiresPayment,
    },
  });

  res.status(201).json({ success: true, appointment: withId(appt), requiresPayment });

  if (!requiresPayment) notifyAppointmentBooked(appt);
};

// Only surface bookings that are actually secured: either no payment was
// required (free), or the online payment has been completed. Bookings still
// awaiting payment (abandoned checkouts) are hidden.
const CONFIRMED_ONLY = { OR: [{ paymentRequired: false }, { isPaid: true }] };

// @route GET /api/appointments/mine  (protect)
export const getMyAppointments = async (req, res) => {
  const appts = await prisma.appointment.findMany({
    where: { userId: req.user.id, ...CONFIRMED_ONLY },
    orderBy: { createdAt: 'desc' },
  });
  res.json(appts.map(withId));
};

// @route GET /api/appointments  (admin)
export const getAppointments = async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  const where = { ...CONFIRMED_ONLY };
  if (status) where.status = status;
  const pageNum = Math.max(1, Number(page));
  const perPage = Number(limit);
  const [items, total, pending] = await Promise.all([
    prisma.appointment.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (pageNum - 1) * perPage,
      take: perPage,
    }),
    prisma.appointment.count({ where }),
    prisma.appointment.count({ where: { status: 'pending', ...CONFIRMED_ONLY } }),
  ]);
  res.json({
    appointments: items.map(withId),
    pending,
    page: pageNum,
    pages: Math.ceil(total / perPage),
    total,
  });
};

// @route PUT /api/appointments/:id  (admin) — update status
export const updateAppointment = async (req, res) => {
  const { status } = req.body;
  const valid = ['pending', 'confirmed', 'completed', 'cancelled'];
  if (status && !valid.includes(status)) {
    return res.status(400).json({ message: 'Invalid status' });
  }
  const updated = await prisma.appointment
    .update({ where: { id: req.params.id }, data: { ...(status ? { status } : {}) } })
    .catch(() => null);
  if (!updated) return res.status(404).json({ message: 'Appointment not found' });
  res.json(withId(updated));
};
