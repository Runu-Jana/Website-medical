import prisma from '../prisma/client.js';
import { withId } from '../prisma/serialize.js';
import { createNotification } from '../lib/notify.js';
import { audit } from '../lib/audit.js';

// @route POST /api/prescriptions  (customer / guest)
export const createPrescription = async (req, res) => {
  const { name, phone, note, fileUrl } = req.body;
  if (!fileUrl && !note) {
    return res.status(400).json({ message: 'Please upload a prescription or describe what you need' });
  }
  const rx = await prisma.prescription.create({
    data: {
      name: name || '',
      phone: phone || '',
      note: note || '',
      fileUrl: fileUrl || '',
      userId: req.user?.id || null,
    },
  });
  res.status(201).json(withId(rx));

  createNotification({
    type: 'prescription',
    title: `Prescription from ${rx.name || 'a customer'}`,
    message: rx.note ? rx.note.slice(0, 80) : 'Awaiting review',
    link: '/prescriptions',
    meta: { prescriptionId: rx.id },
  }).catch(() => {});
};

// @route PUT /api/prescriptions/:id/review  (pharmacist/admin)
// Approve or reject a prescription; propagates the decision to any linked order
// so it can (or cannot) be dispensed, and records an audit entry.
export const reviewPrescription = async (req, res) => {
  const decision = req.body.decision;
  if (!['approved', 'rejected'].includes(decision)) {
    return res.status(400).json({ message: 'decision must be "approved" or "rejected"' });
  }
  const rx = await prisma.prescription
    .update({
      where: { id: req.params.id },
      data: {
        status: decision,
        reviewedBy: req.user?.name || req.user?.id || '',
        reviewedAt: new Date(),
        reviewNote: String(req.body.note || '').trim(),
      },
    })
    .catch(() => null);
  if (!rx) return res.status(404).json({ message: 'Prescription not found' });

  // Propagate to the linked order (and any order that referenced this Rx).
  await prisma.order
    .updateMany({ where: { prescriptionId: rx.id }, data: { rxStatus: decision } })
    .catch(() => {});

  res.json(withId(rx));

  audit(req.user, `rx.${decision}`, 'prescription', rx.id, { orderId: rx.orderId, note: rx.reviewNote });
  createNotification({
    type: 'prescription',
    title: `Prescription ${decision}`,
    message: `${rx.name || 'Customer'}'s prescription was ${decision}${rx.reviewNote ? ` — ${rx.reviewNote}` : ''}`,
    link: '/prescriptions',
    meta: { prescriptionId: rx.id },
  }).catch(() => {});
};

// @route GET /api/prescriptions  (admin)
export const getPrescriptions = async (req, res) => {
  const { status } = req.query;
  const where = status ? { status } : {};
  const list = await prisma.prescription.findMany({ where, orderBy: { createdAt: 'desc' } });
  res.json(list.map(withId));
};

// @route PUT /api/prescriptions/:id  (admin)
export const updatePrescription = async (req, res) => {
  const data = {};
  if (req.body.status !== undefined) data.status = req.body.status;
  if (req.body.note !== undefined) data.note = req.body.note;
  try {
    const rx = await prisma.prescription.update({ where: { id: req.params.id }, data });
    res.json(withId(rx));
  } catch {
    res.status(404).json({ message: 'Prescription not found' });
  }
};

// @route DELETE /api/prescriptions/:id  (admin)
export const deletePrescription = async (req, res) => {
  try {
    await prisma.prescription.delete({ where: { id: req.params.id } });
    res.json({ message: 'Prescription removed' });
  } catch {
    res.status(404).json({ message: 'Prescription not found' });
  }
};
