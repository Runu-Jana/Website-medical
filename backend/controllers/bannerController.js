import prisma from '../prisma/client.js';
import { withId } from '../prisma/serialize.js';

const fields = ['title', 'subtitle', 'badge', 'image', 'bgColor', 'buttonText', 'link', 'order', 'active'];

// Public storefront passes ?active=true; admin omits it to manage all banners.
export const getBanners = async (req, res) => {
  const where = req.query.active === 'true' ? { active: true } : {};
  const banners = await prisma.banner.findMany({
    where,
    orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
  });
  res.json(banners.map(withId));
};

export const createBanner = async (req, res) => {
  const { title } = req.body;
  if (!title) return res.status(400).json({ message: 'Title is required' });
  const data = {};
  fields.forEach((f) => {
    if (req.body[f] !== undefined) data[f] = req.body[f];
  });
  if (data.order !== undefined) data.order = Number(data.order) || 0;
  const banner = await prisma.banner.create({ data: { ...data, title } });
  res.status(201).json(withId(banner));
};

export const updateBanner = async (req, res) => {
  const data = {};
  fields.forEach((f) => {
    if (req.body[f] !== undefined) data[f] = req.body[f];
  });
  if (data.order !== undefined) data.order = Number(data.order) || 0;
  try {
    const banner = await prisma.banner.update({ where: { id: req.params.id }, data });
    res.json(withId(banner));
  } catch {
    res.status(404).json({ message: 'Banner not found' });
  }
};

export const deleteBanner = async (req, res) => {
  try {
    await prisma.banner.delete({ where: { id: req.params.id } });
    res.json({ message: 'Banner removed' });
  } catch {
    res.status(404).json({ message: 'Banner not found' });
  }
};
