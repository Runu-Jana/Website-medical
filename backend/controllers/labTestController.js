import prisma from '../prisma/client.js';
import { slugify } from '../utils/slugify.js';
import { withId } from '../prisma/serialize.js';

const strFields = ['name', 'description', 'category', 'sampleType', 'reportTime', 'image'];
const numFields = ['price', 'oldPrice', 'parameters', 'order'];
const boolFields = ['fasting', 'popular', 'active'];

const discountPercent = (o, p) => (o && p && o > p ? Math.round(((o - p) / o) * 100) : 0);
const serialize = (t) => (t ? { ...withId(t), discountPercent: discountPercent(t.oldPrice, t.price) } : t);

// @route GET /api/lab-tests  (public)
export const getLabTests = async (req, res) => {
  const { category, keyword, popular } = req.query;
  const where = { active: true };
  if (category) where.category = category;
  if (popular === 'true') where.popular = true;
  if (keyword) {
    where.OR = [
      { name: { contains: keyword, mode: 'insensitive' } },
      { description: { contains: keyword, mode: 'insensitive' } },
    ];
  }
  const tests = await prisma.labTest.findMany({ where, orderBy: [{ order: 'asc' }, { createdAt: 'asc' }] });
  res.json({ tests: tests.map(serialize) });
};

// @route GET /api/lab-tests/admin/list  (admin)
export const getLabTestsAdmin = async (req, res) => {
  const tests = await prisma.labTest.findMany({ orderBy: { createdAt: 'desc' } });
  res.json(tests.map(serialize));
};

const buildData = (b) => {
  const data = {};
  strFields.forEach((f) => { if (b[f] !== undefined) data[f] = b[f] || ''; });
  numFields.forEach((f) => { if (b[f] !== undefined) data[f] = Number(b[f]) || 0; });
  boolFields.forEach((f) => { if (b[f] !== undefined) data[f] = !!b[f]; });
  if (data.category && !['test', 'package'].includes(data.category)) data.category = 'test';
  return data;
};

// @route POST /api/lab-tests  (admin)
export const createLabTest = async (req, res) => {
  if (!req.body.name) return res.status(400).json({ message: 'Name is required' });
  const data = buildData(req.body);
  data.slug = `${slugify(req.body.name)}-${Date.now().toString(36)}`;
  const test = await prisma.labTest.create({ data });
  res.status(201).json(serialize(test));
};

// @route PUT /api/lab-tests/:id  (admin)
export const updateLabTest = async (req, res) => {
  const existing = await prisma.labTest.findUnique({ where: { id: req.params.id } });
  if (!existing) return res.status(404).json({ message: 'Lab test not found' });
  const test = await prisma.labTest.update({ where: { id: existing.id }, data: buildData(req.body) });
  res.json(serialize(test));
};

// @route DELETE /api/lab-tests/:id  (admin)
export const deleteLabTest = async (req, res) => {
  await prisma.labTest.delete({ where: { id: req.params.id } }).catch(() => {});
  res.json({ success: true });
};
