import prisma from '../prisma/client.js';
import { slugify } from '../utils/slugify.js';
import { serializeCategory } from '../prisma/serialize.js';

// @route GET /api/categories
export const getCategories = async (req, res) => {
  const cats = await prisma.category.findMany({ orderBy: { name: 'asc' } });
  const withCounts = await Promise.all(
    cats.map(async (c) => {
      const productCount = await prisma.product.count({
        where: { status: 'active', categories: { some: { id: c.id } } },
      });
      return serializeCategory(c, productCount);
    })
  );
  res.json(withCounts);
};

// @route GET /api/categories/:idOrSlug
export const getCategory = async (req, res) => {
  const { idOrSlug } = req.params;
  const category = await prisma.category.findFirst({
    where: { OR: [{ id: idOrSlug }, { slug: idOrSlug }] },
  });
  if (!category) return res.status(404).json({ message: 'Category not found' });
  res.json(serializeCategory(category));
};

// @route POST /api/categories  (admin)
export const createCategory = async (req, res) => {
  const { name, description, image, icon, featured } = req.body;
  if (!name) return res.status(400).json({ message: 'Name is required' });
  const category = await prisma.category.create({
    data: {
      name,
      slug: slugify(name),
      description: description || '',
      image: image || '',
      icon: icon || '',
      featured: !!featured,
    },
  });
  res.status(201).json(serializeCategory(category));
};

// @route PUT /api/categories/:id  (admin)
export const updateCategory = async (req, res) => {
  const data = {};
  ['name', 'description', 'image', 'icon'].forEach((f) => {
    if (req.body[f] !== undefined) data[f] = req.body[f];
  });
  if (req.body.featured !== undefined) data.featured = !!req.body.featured;
  if (req.body.name) data.slug = slugify(req.body.name);
  try {
    const category = await prisma.category.update({ where: { id: req.params.id }, data });
    res.json(serializeCategory(category));
  } catch {
    res.status(404).json({ message: 'Category not found' });
  }
};

// @route DELETE /api/categories/:id  (admin)
export const deleteCategory = async (req, res) => {
  try {
    await prisma.category.delete({ where: { id: req.params.id } });
    res.json({ message: 'Category removed' });
  } catch {
    res.status(404).json({ message: 'Category not found' });
  }
};
