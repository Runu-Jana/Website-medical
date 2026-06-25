import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, default: '' },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    sku: { type: String, default: '' },
    description: { type: String, default: '' },
    shortDescription: { type: String, default: '' },

    // Pricing
    price: { type: Number, required: true, default: 0 },
    oldPrice: { type: Number, default: 0 }, // for showing discounts
    discountPercent: { type: Number, default: 0 },

    // Media — supports high-resolution images (up to 1GB per upload)
    images: [{ type: String }],
    thumbnail: { type: String, default: '' },

    // Relations
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
    categories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category' }],
    brand: { type: mongoose.Schema.Types.ObjectId, ref: 'Brand' },

    // Inventory
    countInStock: { type: Number, required: true, default: 0 },
    unit: { type: String, default: 'pcs' }, // strip / box / bottle / pcs

    // Variants (e.g. colour / flavour options) with their own availability
    variants: [
      {
        label: { type: String, default: '' }, // e.g. "Lavender", "Original"
        color: { type: String, default: '' }, // hex swatch, e.g. "#7c3aed"
        available: { type: Boolean, default: true },
      },
    ],

    // Flags used by the storefront sections
    isFeatured: { type: Boolean, default: false },
    isBestSeller: { type: Boolean, default: false },
    isNewArrival: { type: Boolean, default: false },
    isDeal: { type: Boolean, default: false }, // deal of the day
    dealEndsAt: { type: Date },

    // Medical specific
    requiresPrescription: { type: Boolean, default: false },
    tags: [{ type: String }],

    // Ratings
    rating: { type: Number, default: 0 },
    numReviews: { type: Number, default: 0 },
    reviews: [reviewSchema],

    // Sales tracking (used by analytics)
    sold: { type: Number, default: 0 },

    status: {
      type: String,
      enum: ['active', 'inactive', 'draft', 'archived'],
      default: 'active',
    },
  },
  { timestamps: true }
);

productSchema.index({ name: 'text', description: 'text', tags: 'text' });

export default mongoose.model('Product', productSchema);
