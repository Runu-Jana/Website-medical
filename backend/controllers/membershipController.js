import prisma from '../prisma/client.js';
import { serializeUser } from '../prisma/serialize.js';
import { createNotification } from '../lib/notify.js';

// @route POST /api/me/membership  (customer) — join the DCare Health Club
export const joinMembership = async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  if (!user) return res.status(404).json({ message: 'User not found' });

  if (user.isMember) {
    return res.json({ user: serializeUser(user), alreadyMember: true });
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { isMember: true, memberSince: new Date() },
  });

  res.json({ user: serializeUser(updated) });

  // Let the admin know someone joined the club.
  createNotification({
    type: 'user',
    title: 'New Health Club member',
    message: `${updated.name || 'A customer'} joined the DCare Health Club`,
    link: '/customers',
    meta: { userId: updated.id },
  }).catch(() => {});
};

// @route DELETE /api/me/membership  (customer) — cancel membership
export const cancelMembership = async (req, res) => {
  const updated = await prisma.user
    .update({
      where: { id: req.user.id },
      data: { isMember: false, memberSince: null },
    })
    .catch(() => null);
  if (!updated) return res.status(404).json({ message: 'User not found' });
  res.json({ user: serializeUser(updated) });
};
