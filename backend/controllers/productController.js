import Product from '../models/Product.js';
import { slugify } from '../utils/slugify.js';

// @route GET /api/products  (storefront listing with filters)
export const getProducts = async (req, res) => {
  const {
    keyword,
    category,
    brand,
    minPrice,
    maxPrice,
    sort,
    featured,
    bestseller,
    deal,
    isNew,
    page = 1,
    limit = 12,
  } = req.query;

  const filter = { status: 'active' };

  if (keyword) filter.name = { $regex: keyword, $options: 'i' };
  if (category) filter.category = category;
  if (brand) filter.brand = brand;
  if (featured === 'true') filter.isFeatured = true;
  if (bestseller === 'true') filter.isBestSeller = true;
  if (deal === 'true') filter.isDeal = true;
  if (isNew === 'true') filter.isNewArrival = true;
  if (minPrice || maxPrice) {
    filter.price = {};
    if (minPrice) filter.price.$gte = Number(minPrice);
    if (maxPrice) filter.price.$lte = Number(maxPrice);
  }

  const sortMap = {
    'price-asc': { price: 1 },
    'price-desc': { price: -1 },
    newest: { createdAt: -1 },
    rating: { rating: -1 },
    popular: { sold: -1 },
  };
  const sortBy = sortMap[sort] || { createdAt: -1 };

  const pageNum = Math.max(1, Number(page));
  const perPage = Math.min(60, Number(limit));

  const [items, total] = await Promise.all([
    Product.find(filter)
      .populate('category', 'name slug')
      .populate('brand', 'name slug')
      .sort(sortBy)
      .skip((pageNum - 1) * perPage)
      .limit(perPage),
    Product.countDocuments(filter),
  ]);

  res.json({
    products: items,
    page: pageNum,
    pages: Math.ceil(total / perPage),
    total,
  });
};

// @route GET /api/products/admin  (admin listing, all statuses)
export const getProductsAdmin = async (req, res) => {
  const { keyword, page = 1, limit = 15 } = req.query;
  const filter = {};
  if (keyword) filter.name = { $regex: keyword, $options: 'i' };
  const pageNum = Math.max(1, Number(page));
  const perPage = Number(limit);
  const [items, total] = await Promise.all([
    Product.find(filter)
      .populate('category', 'name')
      .populate('brand', 'name')
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * perPage)
      .limit(perPage),
    Product.countDocuments(filter),
  ]);
  res.json({ products: items, page: pageNum, pages: Math.ceil(total / perPage), total });
};

// @route GET /api/products/:idOrSlug
export const getProduct = async (req, res) => {
  const { idOrSlug } = req.params;
  const query = idOrSlug.match(/^[0-9a-fA-F]{24}$/)
    ? { _id: idOrSlug }
    : { slug: idOrSlug };
  const product = await Product.findOne(query)
    .populate('category', 'name slug')
    .populate('brand', 'name slug');
  if (!product) return res.status(404).json({ message: 'Product not found' });

  const related = await Product.find({
    category: product.category,
    _id: { $ne: product._id },
    status: 'active',
  })
    .limit(6)
    .select('name slug price oldPrice thumbnail images rating numReviews');

  res.json({ product, related });
};

// @route POST /api/products  (admin)
export const createProduct = async (req, res) => {
  const data = { ...req.body };
  if (!data.name) return res.status(400).json({ message: 'Name is required' });
  data.slug = `${slugify(data.name)}-${Date.now().toString(36)}`;
  if (data.oldPrice && data.price && data.oldPrice > data.price) {
    data.discountPercent = Math.round(((data.oldPrice - data.price) / data.oldPrice) * 100);
  }
  if (!data.thumbnail && Array.isArray(data.images) && data.images.length) {
    data.thumbnail = data.images[0];
  }
  const product = await Product.create(data);
  res.status(201).json(product);
};

// @route PUT /api/products/:id  (admin)
export const updateProduct = async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) return res.status(404).json({ message: 'Product not found' });

  const fields = [
    'name', 'sku', 'description', 'shortDescription', 'price', 'oldPrice',
    'images', 'thumbnail', 'category', 'brand', 'countInStock', 'unit',
    'isFeatured', 'isBestSeller', 'isNewArrival', 'isDeal', 'dealEndsAt',
    'requiresPrescription', 'tags', 'status',
  ];
  fields.forEach((f) => {
    if (req.body[f] !== undefined) product[f] = req.body[f];
  });

  if (req.body.name) {
    product.slug = `${slugify(req.body.name)}-${product._id.toString().slice(-6)}`;
  }
  if (product.oldPrice && product.price && product.oldPrice > product.price) {
    product.discountPercent = Math.round(
      ((product.oldPrice - product.price) / product.oldPrice) * 100
    );
  } else {
    product.discountPercent = 0;
  }
  if (!product.thumbnail && product.images?.length) {
    product.thumbnail = product.images[0];
  }

  const updated = await product.save();
  res.json(updated);
};

// @route DELETE /api/products/:id  (admin)
export const deleteProduct = async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) return res.status(404).json({ message: 'Product not found' });
  await product.deleteOne();
  res.json({ message: 'Product removed' });
};

// @route POST /api/products/:id/reviews
export const createReview = async (req, res) => {
  const { rating, comment } = req.body;
  const product = await Product.findById(req.params.id);
  if (!product) return res.status(404).json({ message: 'Product not found' });

  const review = {
    name: req.user.name,
    rating: Number(rating),
    comment,
    user: req.user._id,
  };
  product.reviews.push(review);
  product.numReviews = product.reviews.length;
  product.rating =
    product.reviews.reduce((a, r) => a + r.rating, 0) / product.reviews.length;
  await product.save();
  res.status(201).json({ message: 'Review added' });
};
