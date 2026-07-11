import prisma from '../prisma/client.js';
import { slugify } from '../utils/slugify.js';
import { withId } from '../prisma/serialize.js';

const fields = [
  'name', 'photo', 'specialty', 'qualifications', 'about',
];
const numFields = ['experience', 'fee', 'videoFee', 'audioFee', 'chatFee', 'order'];

// @route GET /api/doctors  (public) — active doctors, optional specialty/keyword filter
export const getDoctors = async (req, res) => {
  const { specialty, keyword } = req.query;
  const where = { active: true };
  if (specialty) where.specialty = specialty;
  if (keyword) {
    where.OR = [
      { name: { contains: keyword, mode: 'insensitive' } },
      { specialty: { contains: keyword, mode: 'insensitive' } },
      { qualifications: { contains: keyword, mode: 'insensitive' } },
    ];
  }
  const [doctors, specialtyRows] = await Promise.all([
    prisma.doctor.findMany({ where, orderBy: [{ order: 'asc' }, { rating: 'desc' }] }),
    prisma.doctor.findMany({
      where: { active: true },
      select: { specialty: true },
      distinct: ['specialty'],
    }),
  ]);
  const specialties = specialtyRows.map((s) => s.specialty).filter(Boolean).sort();
  res.json({ doctors: doctors.map(withId), specialties });
};

// @route GET /api/doctors/:idOrSlug  (public)
export const getDoctor = async (req, res) => {
  const { idOrSlug } = req.params;
  const doctor = await prisma.doctor.findFirst({
    where: { OR: [{ id: idOrSlug }, { slug: idOrSlug }] },
  });
  if (!doctor) return res.status(404).json({ message: 'Doctor not found' });
  res.json(withId(doctor));
};

// @route GET /api/doctors/admin/list  (admin) — all doctors
export const getDoctorsAdmin = async (req, res) => {
  const doctors = await prisma.doctor.findMany({ orderBy: { createdAt: 'desc' } });
  res.json(doctors.map(withId));
};

const buildData = (b) => {
  const data = {};
  fields.forEach((f) => {
    if (b[f] !== undefined) data[f] = b[f] || '';
  });
  numFields.forEach((f) => {
    if (b[f] !== undefined) data[f] = Number(b[f]) || 0;
  });
  if (b.languages !== undefined) {
    data.languages = Array.isArray(b.languages)
      ? b.languages
      : String(b.languages || '').split(',').map((s) => s.trim()).filter(Boolean);
  }
  if (b.active !== undefined) data.active = !!b.active;
  return data;
};

// @route POST /api/doctors  (admin)
export const createDoctor = async (req, res) => {
  if (!req.body.name) return res.status(400).json({ message: 'Doctor name is required' });
  const data = buildData(req.body);
  data.slug = `${slugify(req.body.name)}-${Date.now().toString(36)}`;
  const doctor = await prisma.doctor.create({ data });
  res.status(201).json(withId(doctor));
};

// @route PUT /api/doctors/:id  (admin)
export const updateDoctor = async (req, res) => {
  const existing = await prisma.doctor.findUnique({ where: { id: req.params.id } });
  if (!existing) return res.status(404).json({ message: 'Doctor not found' });
  const data = buildData(req.body);
  const doctor = await prisma.doctor.update({ where: { id: existing.id }, data });
  res.json(withId(doctor));
};

// @route DELETE /api/doctors/:id  (admin)
export const deleteDoctor = async (req, res) => {
  await prisma.doctor.delete({ where: { id: req.params.id } }).catch(() => {});
  res.json({ success: true });
};
