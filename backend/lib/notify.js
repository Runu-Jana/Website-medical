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

const rupee = (n) => `₹${Number(n || 0).toFixed(2)}`;

const STATUS_MSG = {
  processing: 'is now being processed',
  shipped: 'has been shipped and is on its way',
  delivered: 'has been delivered',
  cancelled: 'has been cancelled',
};

// Order status changed: email the customer if we have their address.
export const notifyOrderStatus = async ({ order, customerEmail }) => {
  if (!customerEmail) return;
  const num = order.orderNumber || order.id.slice(-6);
  const msg = STATUS_MSG[order.status] || `is now "${order.status}"`;
  await sendMail({
    to: customerEmail,
    subject: `Update on your DCare order #${num}`,
    text: `Your order #${num} ${msg}.`,
    html: `<div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;color:#0f172a">
             <h2 style="color:#0e9f8e;margin:0 0 8px">Order #${num} update</h2>
             <p style="color:#475569">Your order <b>${msg}</b>.</p>
             <p style="font-size:12px;color:#94a3b8;margin-top:20px">— Team DCare</p>
           </div>`,
  });
};

// Order placed: confirmation email to the customer + a heads-up to the admin.
export const notifyOrderPlaced = async ({ order, items = [], customerEmail }) => {
  const num = order.orderNumber || order.id.slice(-6);
  const rows = items
    .map(
      (i) =>
        `<tr><td style="padding:6px 8px;border-bottom:1px solid #eee">${i.name}</td>` +
        `<td align="center" style="padding:6px 8px;border-bottom:1px solid #eee">${i.qty}</td>` +
        `<td align="right" style="padding:6px 8px;border-bottom:1px solid #eee">${rupee(i.price * i.qty)}</td></tr>`
    )
    .join('');
  const textLines = items.map((i) => `- ${i.name} x ${i.qty} = ${rupee(i.price * i.qty)}`).join('\n');
  const a = order.shippingAddress || {};
  const addr = [a.fullName, a.address, a.city, a.state, a.postalCode, a.country]
    .filter(Boolean)
    .join(', ');

  const itemsTable = `
    <table style="width:100%;border-collapse:collapse;font-size:14px;margin-top:8px">
      <thead><tr>
        <th align="left" style="padding:6px 8px;border-bottom:2px solid #0e9f8e">Item</th>
        <th align="center" style="padding:6px 8px;border-bottom:2px solid #0e9f8e">Qty</th>
        <th align="right" style="padding:6px 8px;border-bottom:2px solid #0e9f8e">Amount</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>`;

  if (customerEmail) {
    await sendMail({
      to: customerEmail,
      subject: `Your DCare order #${num} is confirmed`,
      text: `Thank you for your order #${num}.\n\n${textLines}\n\nTotal: ${rupee(order.totalPrice)}\nPayment: ${order.paymentMethod}\nShip to: ${addr}\n\nWe'll notify you as your order progresses.`,
      html: `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#0f172a">
               <h2 style="color:#0e9f8e;margin:0 0 4px">Thank you for your order!</h2>
               <p style="margin:0 0 12px;color:#475569">Order <b>#${num}</b> is confirmed. Here's your summary:</p>
               ${itemsTable}
               <p style="text-align:right;font-size:16px;margin:12px 0"><b>Total: ${rupee(order.totalPrice)}</b></p>
               <p style="font-size:13px;color:#475569;margin:0"><b>Payment:</b> ${order.paymentMethod}<br/><b>Ship to:</b> ${addr}</p>
               <p style="font-size:12px;color:#94a3b8;margin-top:20px">We'll email you as your order progresses. — Team DCare</p>
             </div>`,
    });
  }

  const adminEmail = process.env.NOTIFY_EMAIL || process.env.ADMIN_EMAIL;
  if (adminEmail) {
    await sendMail({
      to: adminEmail,
      subject: `New order #${num} — ${rupee(order.totalPrice)}`,
      text: `New order #${num}\n\n${textLines}\n\nTotal: ${rupee(order.totalPrice)}\nPayment: ${order.paymentMethod}\nShip to: ${addr}`,
      html: `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto">
               <h2 style="margin:0 0 8px">New order #${num}</h2>
               ${itemsTable}
               <p style="text-align:right"><b>Total: ${rupee(order.totalPrice)}</b></p>
               <p style="font-size:13px;color:#475569"><b>Payment:</b> ${order.paymentMethod}<br/><b>Ship to:</b> ${addr}</p>
             </div>`,
    });
  }
};
