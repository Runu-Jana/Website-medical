import prisma from '../prisma/client.js';
import { serializeProduct } from '../prisma/serialize.js';

const include = { brand: true, categories: true };

// Re-price/validate the saved cart against live products.
const populateCart = async (cart) => {
  const entries = Array.isArray(cart) ? cart : [];
  if (!entries.length) return [];
  const ids = entries.map((e) => e.productId).filter(Boolean);
  const products = await prisma.product.findMany({ where: { id: { in: ids } } });
  const map = Object.fromEntries(products.map((p) => [p.id, p]));
  return entries
    .map((e) => {
      const p = map[e.productId];
      if (!p) return null;
      return {
        _id: p.id,
        name: p.name,
        thumbnail: p.thumbnail || p.images?.[0] || '',
        price: p.price,
        qty: Math.max(1, Math.min(p.countInStock || 99, Number(e.qty) || 1)),
        unit: p.unit || '',
        countInStock: p.countInStock,
      };
    })
    .filter(Boolean);
};

// @route GET /api/me/cart
export const getCart = async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  res.json({ items: await populateCart(user?.cart) });
};

// @route PUT /api/me/cart   body: { items: [{ productId|_id, qty }] }
export const putCart = async (req, res) => {
  const items = Array.isArray(req.body.items) ? req.body.items : [];
  const cart = items
    .map((i) => ({ productId: i.productId || i._id, qty: Math.max(1, Number(i.qty) || 1) }))
    .filter((i) => i.productId);
  await prisma.user.update({ where: { id: req.user.id }, data: { cart } });
  res.json({ items: await populateCart(cart) });
};

// @route GET /api/me/wishlist
export const getWishlist = async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  const ids = Array.isArray(user?.wishlist) ? user.wishlist : [];
  if (!ids.length) return res.json({ items: [] });
  const products = await prisma.product.findMany({ where: { id: { in: ids } }, include });
  res.json({ items: products.map(serializeProduct) });
};

// @route PUT /api/me/wishlist   body: { ids: [productId, ...] }
export const putWishlist = async (req, res) => {
  const ids = Array.isArray(req.body.ids) ? [...new Set(req.body.ids.filter(Boolean))] : [];
  await prisma.user.update({ where: { id: req.user.id }, data: { wishlist: ids } });
  const products = ids.length
    ? await prisma.product.findMany({ where: { id: { in: ids } }, include })
    : [];
  // Preserve the order the client sent.
  const map = Object.fromEntries(products.map((p) => [p.id, serializeProduct(p)]));
  res.json({ items: ids.map((id) => map[id]).filter(Boolean) });
};
