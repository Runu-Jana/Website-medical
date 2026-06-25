import mongoose from 'mongoose';

const bannerSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    subtitle: { type: String, default: '' },
    badge: { type: String, default: '' }, // small tag e.g. "HOT", "Sale"
    image: { type: String, default: '' }, // full-bleed product image
    bgColor: { type: String, default: '#fbe3ec' }, // banner background / wash colour
    buttonText: { type: String, default: 'Shop Now' },
    link: { type: String, default: '/shop' },
    order: { type: Number, default: 0 }, // display order (lower first)
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model('Banner', bannerSchema);
