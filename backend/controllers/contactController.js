import prisma from '../prisma/client.js';
import { withId } from '../prisma/serialize.js';
import { createNotification } from '../lib/notify.js';
import { sendMail } from '../lib/mailer.js';

// @route POST /api/contact  (public) — customer sends a message
export const createContact = async (req, res) => {
  const { name, email, phone, subject, message } = req.body;
  if (!message || !message.trim()) {
    return res.status(400).json({ message: 'Please enter a message' });
  }
  const contact = await prisma.contact.create({
    data: {
      name: (name || '').trim(),
      email: (email || '').trim(),
      phone: (phone || '').trim(),
      subject: (subject || '').trim(),
      message: message.trim(),
    },
  });
  res.status(201).json({ success: true, id: contact.id });

  // Notify admin (bell + email).
  createNotification({
    type: 'message',
    title: `New message from ${contact.name || 'a customer'}`,
    message: contact.subject || contact.message.slice(0, 80),
    link: '/messages',
    meta: { contactId: contact.id },
  }).catch(() => {});

  const adminEmail = process.env.NOTIFY_EMAIL || process.env.ADMIN_EMAIL;
  if (adminEmail) {
    sendMail({
      to: adminEmail,
      subject: `New contact message: ${contact.subject || 'No subject'}`,
      text: `From: ${contact.name} (${contact.email} ${contact.phone})\n\n${contact.message}`,
      html: `<h3>New contact message</h3>
             <p><b>From:</b> ${contact.name} &lt;${contact.email}&gt; ${contact.phone}</p>
             <p><b>Subject:</b> ${contact.subject || '—'}</p>
             <p style="white-space:pre-line">${contact.message}</p>`,
    }).catch(() => {});
  }
};

// @route GET /api/contact  (admin) — list messages
export const getContacts = async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const pageNum = Math.max(1, Number(page));
  const perPage = Number(limit);
  const [items, total, unread] = await Promise.all([
    prisma.contact.findMany({
      orderBy: { createdAt: 'desc' },
      skip: (pageNum - 1) * perPage,
      take: perPage,
    }),
    prisma.contact.count(),
    prisma.contact.count({ where: { read: false } }),
  ]);
  res.json({
    messages: items.map(withId),
    unread,
    page: pageNum,
    pages: Math.ceil(total / perPage),
    total,
  });
};

// @route PATCH /api/contact/:id  (admin) — mark read/unread
export const updateContact = async (req, res) => {
  const read = req.body.read !== false;
  const updated = await prisma.contact
    .update({ where: { id: req.params.id }, data: { read } })
    .catch(() => null);
  if (!updated) return res.status(404).json({ message: 'Message not found' });
  res.json(withId(updated));
};

// @route DELETE /api/contact/:id  (admin)
export const deleteContact = async (req, res) => {
  await prisma.contact.delete({ where: { id: req.params.id } }).catch(() => {});
  res.json({ success: true });
};
