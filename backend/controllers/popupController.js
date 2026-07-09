import prisma from '../prisma/client.js';
import { withId } from '../prisma/serialize.js';

const fields = [
  'title',
  'subtitle',
  'badge',
  'image',
  'bgColor',
  'buttonText',
  'link',
  'order',
  'active',
  'frequency',
];

// Public storefront passes ?active=true; admin omits it to manage all popups.
export const getPopups = async (req, res) => {
  const where = req.query.active === 'true' ? { active: true } : {};
  const popups = await prisma.popupBanner.findMany({
    where,
    orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
  });
  res.json(popups.map(withId));
};

export const createPopup = async (req, res) => {
  const data = {};
  fields.forEach((f) => {
    if (req.body[f] !== undefined) data[f] = req.body[f];
  });
  if (data.order !== undefined) data.order = Number(data.order) || 0;
  if (!data.title && !data.image) {
    return res.status(400).json({ message: 'Add a title or an image for the popup.' });
  }
  const popup = await prisma.popupBanner.create({ data });
  res.status(201).json(withId(popup));
};

export const updatePopup = async (req, res) => {
  const data = {};
  fields.forEach((f) => {
    if (req.body[f] !== undefined) data[f] = req.body[f];
  });
  if (data.order !== undefined) data.order = Number(data.order) || 0;
  try {
    const popup = await prisma.popupBanner.update({ where: { id: req.params.id }, data });
    res.json(withId(popup));
  } catch {
    res.status(404).json({ message: 'Popup not found' });
  }
};

export const deletePopup = async (req, res) => {
  try {
    await prisma.popupBanner.delete({ where: { id: req.params.id } });
    res.json({ message: 'Popup removed' });
  } catch {
    res.status(404).json({ message: 'Popup not found' });
  }
};
