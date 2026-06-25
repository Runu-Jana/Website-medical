import Banner from '../models/Banner.js';

// Public storefront passes ?active=true; admin omits it to manage all banners.
export const getBanners = async (req, res) => {
  const filter = req.query.active === 'true' ? { active: true } : {};
  res.json(await Banner.find(filter).sort({ order: 1, createdAt: 1 }));
};

export const createBanner = async (req, res) => {
  const { title } = req.body;
  if (!title) return res.status(400).json({ message: 'Title is required' });
  const banner = await Banner.create({ ...req.body });
  res.status(201).json(banner);
};

const editableFields = [
  'title', 'subtitle', 'badge', 'image', 'bgColor', 'buttonText', 'link', 'order', 'active',
];

export const updateBanner = async (req, res) => {
  const banner = await Banner.findById(req.params.id);
  if (!banner) return res.status(404).json({ message: 'Banner not found' });
  editableFields.forEach((f) => {
    if (req.body[f] !== undefined) banner[f] = req.body[f];
  });
  res.json(await banner.save());
};

export const deleteBanner = async (req, res) => {
  const banner = await Banner.findById(req.params.id);
  if (!banner) return res.status(404).json({ message: 'Banner not found' });
  await banner.deleteOne();
  res.json({ message: 'Banner removed' });
};
