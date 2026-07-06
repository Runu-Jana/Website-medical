import prisma from '../prisma/client.js';
import { seedDatabase } from '../seed/seed.js';

// On a brand-new (empty) database, create the admin account + demo catalog so a
// fresh deployment is immediately usable — no separate seed step needed.
// Runs at most once (skips the moment any data exists). Disable with AUTO_SEED=false.
export const autoSeedIfEmpty = async () => {
  if (process.env.AUTO_SEED === 'false') return;
  try {
    const [users, products] = await Promise.all([
      prisma.user.count(),
      prisma.product.count(),
    ]);
    if (users === 0 && products === 0) {
      console.log('🌱 Empty database detected — seeding initial data (admin + demo catalog)...');
      const { adminEmail } = await seedDatabase();
      console.log(`✅ Initial seed complete. Admin login: ${adminEmail}`);
    }
  } catch (err) {
    console.error('Auto-seed skipped:', err.message);
  }
};
