import prisma from '../prisma/client.js';
import { slugify } from '../utils/slugify.js';
import { serializeProduct } from '../prisma/serialize.js';

const include = { brand: true, categories: true };

const sortMap = {
  'price-asc': { price: 'asc' },
  'price-desc': { price: 'desc' },
  newest: { createdAt: 'desc' },
  rating: { rating: 'desc' },
  popular: { sold: 'desc' },
};

// @route GET /api/products/meta/price-range
export const getPriceRange = async (req, res) => {
  const agg = await prisma.product.aggregate({
    where: { status: 'active' },
    _min: { price: true },
    _max: { price: true },
  });
  res.json({
    min: Math.floor(agg._min.price ?? 0),
    max: Math.ceil(agg._max.price ?? 1000),
  });
};

// @route GET /api/products  (storefront listing with filters)
export const getProducts = async (req, res) => {
  const {
    keyword, category, brand, minPrice, maxPrice, sort,
    featured, bestseller, deal, isNew, page = 1, limit = 12,
  } = req.query;

  const where = { status: 'active' };
  const AND = [];
  if (keyword) {
    AND.push({
      OR: [
        { name: { contains: keyword, mode: 'insensitive' } },
        { categories: { some: { name: { contains: keyword, mode: 'insensitive' } } } },
      ],
    });
  }
  if (category) AND.push({ categories: { some: { id: category } } });
  if (AND.length) where.AND = AND;
  if (brand) where.brandId = brand;
  if (featured === 'true') where.isFeatured = true;
  if (bestseller === 'true') where.isBestSeller = true;
  if (deal === 'true') where.isDeal = true;
  if (isNew === 'true') where.isNewArrival = true;
  if (minPrice || maxPrice) {
    where.price = {};
    if (minPrice) where.price.gte = Number(minPrice);
    if (maxPrice) where.price.lte = Number(maxPrice);
  }

  const pageNum = Math.max(1, Number(page));
  const perPage = Math.min(60, Number(limit));
  const orderBy = sortMap[sort] || { createdAt: 'desc' };

  const [items, total] = await Promise.all([
    prisma.product.findMany({
      where, include, orderBy,
      skip: (pageNum - 1) * perPage,
      take: perPage,
    }),
    prisma.product.count({ where }),
  ]);

  res.json({
    products: items.map(serializeProduct),
    page: pageNum,
    pages: Math.ceil(total / perPage),
    total,
  });
};

// @route GET /api/products/admin  (admin listing, all statuses)
export const getProductsAdmin = async (req, res) => {
  const { keyword, page = 1, limit = 15 } = req.query;
  const where = {};
  if (keyword) {
    where.OR = [
      { name: { contains: keyword, mode: 'insensitive' } },
      { sku: { contains: keyword, mode: 'insensitive' } },
      { categories: { some: { name: { contains: keyword, mode: 'insensitive' } } } },
    ];
  }
  const pageNum = Math.max(1, Number(page));
  const perPage = Number(limit);
  const [items, total] = await Promise.all([
    prisma.product.findMany({
      where, include,
      orderBy: { createdAt: 'desc' },
      skip: (pageNum - 1) * perPage,
      take: perPage,
    }),
    prisma.product.count({ where }),
  ]);
  res.json({ products: items.map(serializeProduct), page: pageNum, pages: Math.ceil(total / perPage), total });
};

// @route GET /api/products/:idOrSlug
export const getProduct = async (req, res) => {
  const { idOrSlug } = req.params;
  const product = await prisma.product.findFirst({
    where: { OR: [{ id: idOrSlug }, { slug: idOrSlug }] },
    include,
  });
  if (!product) return res.status(404).json({ message: 'Product not found' });

  const firstCatId = product.categories[0]?.id;
  const related = await prisma.product.findMany({
    where: {
      status: 'active',
      id: { not: product.id },
      ...(firstCatId ? { categories: { some: { id: firstCatId } } } : {}),
    },
    include,
    take: 6,
  });

  res.json({ product: serializeProduct(product), related: related.map(serializeProduct) });
};

const computeDiscount = (oldPrice, price) =>
  oldPrice && price && oldPrice > price
    ? Math.round(((oldPrice - price) / oldPrice) * 100)
    : 0;

// @route POST /api/products  (admin)
export const createProduct = async (req, res) => {
  const b = req.body;
  if (!b.name) return res.status(400).json({ message: 'Name is required' });

  const price = Number(b.price) || 0;
  const oldPrice = Number(b.oldPrice) || 0;
  const images = Array.isArray(b.images) ? b.images : [];
  const thumbnail = b.thumbnail || images[0] || '';
  const categoryIds = (b.categories || []).filter(Boolean);

  const product = await prisma.product.create({
    data: {
      name: b.name,
      slug: `${slugify(b.name)}-${Date.now().toString(36)}`,
      sku: b.sku || '',
      description: b.description || '',
      shortDescription: b.shortDescription || '',
      price,
      oldPrice,
      discountPercent: computeDiscount(oldPrice, price),
      images,
      thumbnail,
      countInStock: Number(b.countInStock) || 0,
      unit: b.unit || 'pcs',
      variants: b.variants ?? [],
      isFeatured: !!b.isFeatured,
      isBestSeller: !!b.isBestSeller,
      isNewArrival: !!b.isNewArrival,
      isDeal: !!b.isDeal,
      dealEndsAt: b.dealEndsAt ? new Date(b.dealEndsAt) : null,
      requiresPrescription: !!b.requiresPrescription,
      tags: Array.isArray(b.tags) ? b.tags : [],
      status: b.status || 'active',
      reviews: [],
      ...(b.brand ? { brand: { connect: { id: b.brand } } } : {}),
      ...(categoryIds.length ? { categories: { connect: categoryIds.map((id) => ({ id })) } } : {}),
    },
    include,
  });
  res.status(201).json(serializeProduct(product));
};

// @route PUT /api/products/:id  (admin)
export const updateProduct = async (req, res) => {
  const existing = await prisma.product.findUnique({ where: { id: req.params.id } });
  if (!existing) return res.status(404).json({ message: 'Product not found' });

  const b = req.body;
  const data = {};
  ['name', 'sku', 'description', 'shortDescription', 'thumbnail', 'unit', 'status'].forEach((f) => {
    if (b[f] !== undefined) data[f] = b[f];
  });
  if (b.price !== undefined) data.price = Number(b.price);
  if (b.oldPrice !== undefined) data.oldPrice = Number(b.oldPrice);
  if (b.countInStock !== undefined) data.countInStock = Number(b.countInStock);
  if (b.images !== undefined) data.images = Array.isArray(b.images) ? b.images : [];
  if (b.tags !== undefined) data.tags = Array.isArray(b.tags) ? b.tags : [];
  if (b.variants !== undefined) data.variants = b.variants;
  ['isFeatured', 'isBestSeller', 'isNewArrival', 'isDeal', 'requiresPrescription'].forEach((f) => {
    if (b[f] !== undefined) data[f] = !!b[f];
  });
  if (b.dealEndsAt !== undefined) data.dealEndsAt = b.dealEndsAt ? new Date(b.dealEndsAt) : null;
  if (b.name) data.slug = `${slugify(b.name)}-${existing.id.slice(-6)}`;

  if (b.brand !== undefined) {
    data.brand = b.brand ? { connect: { id: b.brand } } : { disconnect: true };
  }
  if (b.categories !== undefined) {
    data.categories = { set: (b.categories || []).filter(Boolean).map((id) => ({ id })) };
  }

  const price = b.price !== undefined ? Number(b.price) : existing.price;
  const oldPrice = b.oldPrice !== undefined ? Number(b.oldPrice) : existing.oldPrice;
  data.discountPercent = computeDiscount(oldPrice, price);
  if (!existing.thumbnail && Array.isArray(b.images) && b.images.length) {
    data.thumbnail = b.images[0];
  }

  const updated = await prisma.product.update({ where: { id: existing.id }, data, include });
  res.json(serializeProduct(updated));
};

// @route DELETE /api/products/:id  (admin)
export const deleteProduct = async (req, res) => {
  try {
    await prisma.product.delete({ where: { id: req.params.id } });
    res.json({ message: 'Product removed' });
  } catch {
    res.status(404).json({ message: 'Product not found' });
  }
};

// @route POST /api/products/:id/reviews
export const createReview = async (req, res) => {
  const { rating, comment } = req.body;
  const product = await prisma.product.findUnique({ where: { id: req.params.id } });
  if (!product) return res.status(404).json({ message: 'Product not found' });

  const reviews = Array.isArray(product.reviews) ? product.reviews : [];
  reviews.push({
    name: req.user.name,
    rating: Number(rating),
    comment: comment || '',
    user: req.user.id,
    createdAt: new Date().toISOString(),
  });
  const numReviews = reviews.length;
  const avg = reviews.reduce((a, r) => a + Number(r.rating), 0) / numReviews;

  await prisma.product.update({
    where: { id: product.id },
    data: { reviews, numReviews, rating: avg },
  });
  res.status(201).json({ message: 'Review added' });
};
