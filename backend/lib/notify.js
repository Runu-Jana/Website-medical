import prisma from '../prisma/client.js';
import { sendMail } from './mailer.js';

export const LOW_STOCK_THRESHOLD = 5;

// Record an in-app notification for the admin bell. Never throws.
export const createNotification = async ({ type, title, message = '', link = '', meta = null }) => {
  try {
    return await prisma.notification.create({ data: { type, title, message, link, meta } });
  } catch (err) {
    console.error('createNotification failed:', err.message);
    return null;
  }
};

// New member: in-app notification + email to the admin. Fire-and-forget.
export const notifyNewMember = async (user) => {
  const who = user.email || user.phone || 'a new customer';
  await createNotification({
    type: 'user',
    title: 'New member joined',
    message: `${user.name || 'Customer'} · ${who}`,
    link: '/',
    meta: { userId: user.id },
  });

  const adminEmail = process.env.NOTIFY_EMAIL || process.env.ADMIN_EMAIL;
  if (adminEmail) {
    await sendMail({
      to: adminEmail,
      subject: 'New member joined DCare',
      text: `A new member just signed up on your store.\n\nName: ${user.name || 'Customer'}\nContact: ${who}\nJoined: ${new Date().toLocaleString()}`,
      html: `<h2 style="margin:0 0 8px">New member joined DCare</h2>
             <p>A new member just signed up on your store.</p>
             <ul>
               <li><b>Name:</b> ${user.name || 'Customer'}</li>
               <li><b>Contact:</b> ${who}</li>
               <li><b>Joined:</b> ${new Date().toLocaleString()}</li>
             </ul>`,
    });
  }
};
