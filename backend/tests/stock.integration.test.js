import { describe, it, expect, beforeAll, afterAll } from 'vitest';

// Real database test for the concurrency guarantee behind order creation.
// Skipped unless TEST_DATABASE_URL is set (CI provides a Postgres service).
const DB = process.env.TEST_DATABASE_URL;

describe.skipIf(!DB)('atomic stock decrement (integration)', () => {
  let prisma;
  beforeAll(async () => {
    process.env.DATABASE_URL = DB;
    prisma = (await import('../prisma/client.js')).default;
  });
  afterAll(async () => {
    await prisma?.$disconnect();
  });

  it('never lets two concurrent buyers oversell the last unit', async () => {
    const p = await prisma.product.create({
      data: { name: 'ConcTest', slug: 'conc-' + Date.now() + '-' + Math.round(performance.now()), countInStock: 1 },
    });

    // The exact conditional update createOrder uses, fired concurrently.
    const buy = () =>
      prisma.product.updateMany({
        where: { id: p.id, countInStock: { gte: 1 } },
        data: { countInStock: { decrement: 1 } },
      });
    const [a, b] = await Promise.all([buy(), buy()]);

    const winners = [a, b].filter((r) => r.count === 1).length;
    expect(winners).toBe(1); // exactly one buyer gets the unit

    const after = await prisma.product.findUnique({ where: { id: p.id } });
    expect(after.countInStock).toBe(0); // never negative

    await prisma.product.delete({ where: { id: p.id } });
  });
});
