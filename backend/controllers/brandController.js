import prisma from '../prisma/client.js';
import { slugify } from '../utils/slugify.js';
import { serializeBrand } from '../prisma/serialize.js';

export const getBrands = async (req, res) => {
  const brands = await prisma.brand.findMany({ orderBy: { name: 'asc' } });
  res.json(brands.map(serializeBrand));
};

export const createBrand = async (req, res) => {
  const { name, logo } = req.body;
  if (!name) return res.status(400).json({ message: 'Name is required' });
  const brand = await prisma.brand.create({
    data: { name, slug: slugify(name), logo: logo || '' },
  });
  res.status(201).json(serializeBrand(brand));
};

export const updateBrand = async (req, res) => {
  const data = {};
  if (req.body.name !== undefined) {
    data.name = req.body.name;
    data.slug = slugify(req.body.name);
  }
  if (req.body.logo !== undefined) data.logo = req.body.logo;
  try {
    const brand = await prisma.brand.update({ where: { id: req.params.id }, data });
    res.json(serializeBrand(brand));
  } catch {
    res.status(404).json({ message: 'Brand not found' });
  }
};

export const deleteBrand = async (req, res) => {
  try {
    await prisma.brand.delete({ where: { id: req.params.id } });
    res.json({ message: 'Brand removed' });
  } catch {
    res.status(404).json({ message: 'Brand not found' });
  }
};
