import Post from '../models/Post.js';
import { slugify } from '../utils/slugify.js';

// Public storefront passes ?published=true; admin omits it to manage all posts.
export const getPosts = async (req, res) => {
  const filter = req.query.published === 'true' ? { published: true } : {};
  res.json(await Post.find(filter).sort({ createdAt: -1 }));
};

export const getPost = async (req, res) => {
  const { idOrSlug } = req.params;
  const byId = idOrSlug.match(/^[0-9a-fA-F]{24}$/);
  const post = byId
    ? await Post.findById(idOrSlug)
    : await Post.findOne({ slug: idOrSlug });
  if (!post) return res.status(404).json({ message: 'Post not found' });
  res.json(post);
};

const makeSlug = (title, id) => `${slugify(title)}-${String(id).slice(-6)}`;

export const createPost = async (req, res) => {
  const { title } = req.body;
  if (!title) return res.status(400).json({ message: 'Title is required' });
  const post = new Post({ ...req.body });
  post.slug = makeSlug(title, post._id.toString());
  await post.save();
  res.status(201).json(post);
};

const editableFields = ['title', 'excerpt', 'content', 'image', 'category', 'author', 'published'];

export const updatePost = async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) return res.status(404).json({ message: 'Post not found' });
  editableFields.forEach((f) => {
    if (req.body[f] !== undefined) post[f] = req.body[f];
  });
  if (req.body.title) post.slug = makeSlug(req.body.title, post._id.toString());
  res.json(await post.save());
};

export const deletePost = async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) return res.status(404).json({ message: 'Post not found' });
  await post.deleteOne();
  res.json({ message: 'Post removed' });
};
