import prisma from '../prisma/client.js';
import { slugify } from '../utils/slugify.js';
import { withId } from '../prisma/serialize.js';

const editable = ['title', 'excerpt', 'content', 'image', 'category', 'author', 'published'];
const makeSlug = (title, id) => `${slugify(title)}-${String(id).slice(-6)}`;

// Public storefront passes ?published=true; admin omits it to manage all posts.
export const getPosts = async (req, res) => {
  const where = req.query.published === 'true' ? { published: true } : {};
  const posts = await prisma.post.findMany({ where, orderBy: { createdAt: 'desc' } });
  res.json(posts.map(withId));
};

export const getPost = async (req, res) => {
  const { idOrSlug } = req.params;
  const post = await prisma.post.findFirst({
    where: { OR: [{ id: idOrSlug }, { slug: idOrSlug }] },
  });
  if (!post) return res.status(404).json({ message: 'Post not found' });
  res.json(withId(post));
};

export const createPost = async (req, res) => {
  const { title } = req.body;
  if (!title) return res.status(400).json({ message: 'Title is required' });
  const data = { title };
  editable.forEach((f) => {
    if (f !== 'title' && req.body[f] !== undefined) data[f] = req.body[f];
  });
  // Temporary unique slug, then finalise with the generated id.
  const created = await prisma.post.create({
    data: { ...data, slug: `${slugify(title)}-${Date.now().toString(36)}` },
  });
  const post = await prisma.post.update({
    where: { id: created.id },
    data: { slug: makeSlug(title, created.id) },
  });
  res.status(201).json(withId(post));
};

export const updatePost = async (req, res) => {
  const data = {};
  editable.forEach((f) => {
    if (req.body[f] !== undefined) data[f] = req.body[f];
  });
  try {
    if (req.body.title) data.slug = makeSlug(req.body.title, req.params.id);
    const post = await prisma.post.update({ where: { id: req.params.id }, data });
    res.json(withId(post));
  } catch {
    res.status(404).json({ message: 'Post not found' });
  }
};

export const deletePost = async (req, res) => {
  try {
    await prisma.post.delete({ where: { id: req.params.id } });
    res.json({ message: 'Post removed' });
  } catch {
    res.status(404).json({ message: 'Post not found' });
  }
};
