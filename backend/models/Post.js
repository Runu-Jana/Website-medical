import mongoose from 'mongoose';

const postSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    excerpt: { type: String, default: '' },
    content: { type: String, default: '' },
    image: { type: String, default: '' },
    category: { type: String, default: 'Health' },
    author: { type: String, default: 'DCare Team' },
    published: { type: Boolean, default: true },
  },
  { timestamps: true }
);

postSchema.index({ title: 'text', excerpt: 'text', content: 'text' });

export default mongoose.model('Post', postSchema);
