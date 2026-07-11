import prisma from '../prisma/client.js';
import { withId } from '../prisma/serialize.js';

const CATEGORIES = ['prescription', 'lab-report', 'medicine', 'vaccination', 'allergy', 'medical-history'];

// @route GET /api/health-records  (protect) — the customer's own records + counts
export const getMyRecords = async (req, res) => {
  const records = await prisma.healthRecord.findMany({
    where: { userId: req.user.id },
    orderBy: { createdAt: 'desc' },
  });
  const counts = {};
  CATEGORIES.forEach((c) => (counts[c] = 0));
  records.forEach((r) => { counts[r.category] = (counts[r.category] || 0) + 1; });
  res.json({ records: records.map(withId), counts });
};

// @route POST /api/health-records  (protect)
export const createRecord = async (req, res) => {
  const b = req.body || {};
  const category = CATEGORIES.includes(b.category) ? b.category : 'prescription';
  if (!b.title && !b.fileUrl) {
    return res.status(400).json({ message: 'Add a title or upload a file' });
  }
  const record = await prisma.healthRecord.create({
    data: {
      userId: req.user.id,
      category,
      title: String(b.title || '').trim(),
      fileUrl: String(b.fileUrl || '').trim(),
      note: String(b.note || '').trim(),
      recordDate: String(b.recordDate || '').trim(),
    },
  });
  res.status(201).json(withId(record));
};

// @route DELETE /api/health-records/:id  (protect) — only the owner's record
export const deleteRecord = async (req, res) => {
  const rec = await prisma.healthRecord.findUnique({ where: { id: req.params.id } });
  if (!rec || rec.userId !== req.user.id) {
    return res.status(404).json({ message: 'Record not found' });
  }
  await prisma.healthRecord.delete({ where: { id: rec.id } }).catch(() => {});
  res.json({ success: true });
};
