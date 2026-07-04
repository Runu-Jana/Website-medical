import prisma from '../prisma/client.js';
import { withId } from '../prisma/serialize.js';
import { createNotification } from '../lib/notify.js';

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
