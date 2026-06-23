import Category from '../models/Category.js';
import Product from '../models/Product.js';
import { slugify } from '../utils/slugify.js';

// @route GET /api/categories
export const getCategories = async (req, res) => {
  const categories = await Category.find().sort({ name: 1 });
  // attach product counts
  const withCounts = await Promise.all(
    categories.map(async (c) => {
      const count = await Product.countDocuments({ category: c._id, status: 'active' });
      return { ...c.toObject(), productCount: count };
    })
  );
  res.json(withCounts);
};

// @route GET /api/categories/:idOrSlug
export const getCategory = async (req, res) => {
  const { idOrSlug } = req.params;
  const query = idOrSlug.match(/^[0-9a-fA-F]{24}$/)
    ? { _id: idOrSlug }
    : { slug: idOrSlug };
  const category = await Category.findOne(query);
  if (!category) return res.status(404).json({ message: 'Category not found' });
  res.json(category);
};

// @route POST /api/categories  (admin)
export const createCategory = async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ message: 'Name is required' });
  const category = await Category.create({
    ...req.body,
    slug: slugify(name),
  });
  res.status(201).json(category);
};

// @route PUT /api/categories/:id  (admin)
export const updateCategory = async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) return res.status(404).json({ message: 'Category not found' });
  ['name', 'description', 'image', 'icon', 'featured'].forEach((f) => {
    if (req.body[f] !== undefined) category[f] = req.body[f];
  });
  if (req.body.name) category.slug = slugify(req.body.name);
  res.json(await category.save());
};

// @route DELETE /api/categories/:id  (admin)
export const deleteCategory = async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) return res.status(404).json({ message: 'Category not found' });
  await category.deleteOne();
  res.json({ message: 'Category removed' });
};
