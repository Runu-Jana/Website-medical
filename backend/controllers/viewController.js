import prisma from '../prisma/client.js';
import { withId } from '../prisma/serialize.js';

// @route GET /api/views?scope=orders  (admin) — list saved views
export const getViews = async (req, res) => {
  const scope = req.query.scope || 'orders';
  const views = await prisma.savedView.findMany({
    where: { scope },
    orderBy: { createdAt: 'asc' },
  });
  res.json(views.map(withId));
};

// @route POST /api/views  (admin) — save a view
export const createView = async (req, res) => {
  const { name, scope = 'orders', config } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ message: 'A view name is required' });
  const view = await prisma.savedView.create({
    data: { name: name.trim(), scope, config: config || {} },
  });
  res.status(201).json(withId(view));
};

// @route DELETE /api/views/:id  (admin)
export const deleteView = async (req, res) => {
  await prisma.savedView.delete({ where: { id: req.params.id } }).catch(() => {});
  res.json({ success: true });
};
