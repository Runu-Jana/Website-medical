import prisma from '../prisma/client.js';

// The Vendor business profile that owns the given user account (or null).
export const resolveVendor = (userId) =>
  userId ? prisma.vendor.findUnique({ where: { userId } }) : Promise.resolve(null);
