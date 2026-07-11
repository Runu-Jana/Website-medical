import prisma from '../prisma/client.js';
import { withId } from '../prisma/serialize.js';
import { createNotification } from '../lib/notify.js';
import { sendMail } from '../lib/mailer.js';

const FEE_BY_TYPE = { video: 'videoFee', audio: 'audioFee', chat: 'chatFee' };

// @route POST /api/appointments  (optional auth) — book a consultation
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

  const appt = await prisma.appointment.create({
    data: {
      doctorId: doctor.id,
      doctorName: doctor.name,
      specialty: doctor.specialty,
      userId: req.user?.id || null,
      patientName: String(b.patientName).trim(),
      patientPhone: String(b.patientPhone || '').trim(),
      patientEmail: String(b.patientEmail || req.user?.email || '').trim(),
      consultationType: type,
      fee,
      preferredDate: String(b.preferredDate || '').trim(),
      preferredTime: String(b.preferredTime || '').trim(),
      note: String(b.note || '').trim(),
    },
  });

  res.status(201).json({ success: true, appointment: withId(appt) });

  // Notify admin (bell + email).
  createNotification({
    type: 'message',
    title: `New consultation booking — Dr. ${doctor.name}`,
    message: `${appt.patientName} · ${type} · ${appt.preferredDate || 'no date'} ${appt.preferredTime || ''}`.trim(),
    link: '/appointments',
    meta: { appointmentId: appt.id },
  }).catch(() => {});

  const adminEmail = process.env.NOTIFY_EMAIL || process.env.ADMIN_EMAIL;
  if (adminEmail) {
    sendMail({
      to: adminEmail,
      subject: `New consultation booking: Dr. ${doctor.name}`,
      text: `Patient: ${appt.patientName} (${appt.patientPhone} ${appt.patientEmail})
Doctor: ${doctor.name} — ${doctor.specialty}
Type: ${type} · Fee: ₹${fee}
Preferred: ${appt.preferredDate} ${appt.preferredTime}
Note: ${appt.note || '—'}`,
    }).catch(() => {});
  }
};

// @route GET /api/appointments/mine  (protect)
export const getMyAppointments = async (req, res) => {
  const appts = await prisma.appointment.findMany({
    where: { userId: req.user.id },
    orderBy: { createdAt: 'desc' },
  });
  res.json(appts.map(withId));
};

// @route GET /api/appointments  (admin)
export const getAppointments = async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  const where = {};
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
    prisma.appointment.count({ where: { status: 'pending' } }),
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
