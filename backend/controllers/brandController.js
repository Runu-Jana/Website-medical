import Brand from '../models/Brand.js';
import { slugify } from '../utils/slugify.js';

export const getBrands = async (req, res) => {
  res.json(await Brand.find().sort({ name: 1 }));
};

export const createBrand = async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ message: 'Name is required' });
  const brand = await Brand.create({ ...req.body, slug: slugify(name) });
  res.status(201).json(brand);
};

export const updateBrand = async (req, res) => {
  const brand = await Brand.findById(req.params.id);
  if (!brand) return res.status(404).json({ message: 'Brand not found' });
  ['name', 'logo'].forEach((f) => {
    if (req.body[f] !== undefined) brand[f] = req.body[f];
  });
  if (req.body.name) brand.slug = slugify(req.body.name);
  res.json(await brand.save());
};

export const deleteBrand = async (req, res) => {
  const brand = await Brand.findById(req.params.id);
  if (!brand) return res.status(404).json({ message: 'Brand not found' });
  await brand.deleteOne();
  res.json({ message: 'Brand removed' });
};
