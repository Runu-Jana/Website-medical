import prisma from '../prisma/client.js';

// Seed a single demo popup banner the first time the table is empty, so the
// storefront popup is visible for testing right after deploy. The admin can
// edit or delete it and add their own via the Popups panel. It is only ever
// recreated if ALL popups are deleted (i.e. the table is empty again).
export const ensureDefaultPopup = async () => {
  try {
    const count = await prisma.popupBanner.count();
    if (count > 0) return;
    await prisma.popupBanner.create({
      data: {
        title: 'Welcome to DBL Life Care 🎉',
        subtitle: 'Get flat 15% OFF your first order — use code WELCOME15 at checkout.',
        badge: 'LIMITED TIME OFFER',
        image: '',
        bgColor: '#0e9f8e',
        buttonText: 'Shop Now',
        link: '/shop',
        order: 0,
        active: true,
        frequency: 'session',
      },
    });
    console.log('🪧 Seeded a default popup banner (edit it in Admin → Popups).');
  } catch (err) {
    console.error('ensureDefaultPopup skipped:', err.message);
  }
};
