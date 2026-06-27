import { PrismaClient } from '@prisma/client';

// Reuse a single PrismaClient across hot-reloads in development.
const globalForPrisma = globalThis;
const prisma = globalForPrisma.__prisma || new PrismaClient();
if (process.env.NODE_ENV !== 'production') globalForPrisma.__prisma = prisma;

export default prisma;
