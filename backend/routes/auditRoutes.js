import express from 'express';
import prisma from '../prisma/client.js';
import { withId } from '../prisma/serialize.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// @route GET /api/audit  (admin) — recent audit-trail entries, newest first.
router.get('/', protect, admin, async (req, res) => {
  const { entity, entityId, limit = 100 } = req.query;
  const where = {};
  if (entity) where.entity = entity;
  if (entityId) where.entityId = entityId;
  const logs = await prisma.auditLog.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: Math.min(500, Number(limit) || 100),
  });
  res.json(logs.map(withId));
});

export default router;
