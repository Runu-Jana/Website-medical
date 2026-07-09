import prisma from '../prisma/client.js';
import { withId } from '../prisma/serialize.js';
import { aiEnabled, answerSupportQuery } from '../lib/ai.js';
import { createNotification } from '../lib/notify.js';
import { sendMail } from '../lib/mailer.js';

const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || 'geetagurukulindia@gmail.com';

// Pull a few relevant products for the latest customer question.
const findRelevantProducts = async (query) => {
  const words = String(query || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 4)
    .slice(0, 6);
  if (!words.length) return [];
  const or = [];
  for (const w of words) {
    or.push({ name: { contains: w, mode: 'insensitive' } });
    or.push({ saltComposition: { contains: w, mode: 'insensitive' } });
    or.push({ genericName: { contains: w, mode: 'insensitive' } });
    or.push({ categories: { some: { name: { contains: w, mode: 'insensitive' } } } });
  }
  return prisma.product.findMany({
    where: { status: 'active', OR: or },
    take: 6,
    select: {
      name: true,
      price: true,
      countInStock: true,
      requiresPrescription: true,
      shortDescription: true,
      uses: true,
      saltComposition: true,
      slug: true,
    },
  });
};

// Assemble the grounding context string the model is allowed to rely on.
const buildContext = async ({ lastUserMessage, user }) => {
  const parts = [];

  parts.push(
    `STORE: DBL Life Care (operated by Dr. Bhoumik Laboratories Pvt. Ltd.), an online medical & pharmacy store in India. Address: 190/29, Alpha International City, Karnal-132001 (Haryana). Support email: ${SUPPORT_EMAIL}.`
  );
  parts.push(
    `POLICIES:
- Delivery: FREE on orders of ₹1000 or more; otherwise ₹60. Health Club members get FREE delivery + 5% off always. Spend ₹1500+ for a free gift.
- Payments: Cash on Delivery and secure online payment (UPI / cards / netbanking) where enabled.
- Prescription: prescription-only medicines require a valid prescription — customers can use "Upload Prescription" on the site. Verification is done by the pharmacy team.
- Returns/refunds & full policies: refer the customer to the policy pages (Shipping Policy, Refund Policy, Terms, Privacy) linked in the site footer.
- Health Club: paid membership giving free delivery, 5% member discount and other perks (see the Health Club page).`
  );

  try {
    const products = await findRelevantProducts(lastUserMessage);
    if (products.length) {
      const lines = products.map((p) => {
        const bits = [
          `- ${p.name} — ₹${Math.round(p.price)}`,
          p.countInStock > 0 ? 'in stock' : 'out of stock',
          p.requiresPrescription ? 'prescription required' : null,
          p.saltComposition ? `composition: ${p.saltComposition}` : null,
          p.uses ? `uses: ${String(p.uses).slice(0, 160)}` : p.shortDescription ? String(p.shortDescription).slice(0, 160) : null,
        ].filter(Boolean);
        return bits.join(' · ');
      });
      parts.push(`MATCHING PRODUCTS (only mention these if relevant):\n${lines.join('\n')}`);
    } else {
      parts.push('MATCHING PRODUCTS: none found for this query in the catalog.');
    }
  } catch {
    /* ignore product lookup errors */
  }

  try {
    const now = new Date();
    const coupons = await prisma.coupon.findMany({
      where: {
        active: true,
        OR: [{ startsAt: null }, { startsAt: { lte: now } }],
        AND: [{ OR: [{ endsAt: null }, { endsAt: { gte: now } }] }],
      },
      take: 5,
      select: { code: true, description: true, type: true, value: true, minOrder: true },
    });
    if (coupons.length) {
      const lines = coupons.map((c) => {
        const off = c.type === 'percent' ? `${c.value}% off` : `₹${c.value} off`;
        const min = c.minOrder > 0 ? ` (min order ₹${c.minOrder})` : '';
        return `- ${c.code}: ${off}${min}${c.description ? ` — ${c.description}` : ''}`;
      });
      parts.push(`ACTIVE OFFERS / COUPONS:\n${lines.join('\n')}`);
    }
  } catch {
    /* ignore */
  }

  if (user?.id) {
    try {
      const orders = await prisma.order.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          orderNumber: true,
          status: true,
          fulfillmentStatus: true,
          totalPrice: true,
          isPaid: true,
          isDelivered: true,
          createdAt: true,
          items: true,
        },
      });
      if (orders.length) {
        const lines = orders.map((o) => {
          const num = o.orderNumber || o.id.slice(-6);
          const itemCount = Array.isArray(o.items) ? o.items.length : 0;
          const stage = o.fulfillmentStatus ? `, ${o.fulfillmentStatus}` : '';
          const date = new Date(o.createdAt).toLocaleDateString('en-IN');
          return `- Order #${num} (${date}): status ${o.status}${stage}, ${itemCount} item(s), total ₹${Math.round(o.totalPrice)}, ${o.isDelivered ? 'delivered' : o.isPaid ? 'paid' : 'payment pending'}`;
        });
        parts.push(`THIS CUSTOMER'S RECENT ORDERS (${user.name || 'customer'}):\n${lines.join('\n')}`);
      } else {
        parts.push('THIS CUSTOMER has no orders yet.');
      }
    } catch {
      /* ignore */
    }
  } else {
    parts.push('CUSTOMER LOGIN: the customer is NOT logged in, so you cannot look up their orders — ask them to log in for order-specific help.');
  }

  return parts.join('\n\n');
};

// @route GET /api/support/status  (public) — is the assistant available?
export const supportStatus = (req, res) => {
  res.json({ enabled: aiEnabled });
};

// @route POST /api/support/chat  (optional auth, rate-limited)
// Body: { messages: [{role, content}], conversationId?, contact? }
export const chat = async (req, res) => {
  if (!aiEnabled) {
    return res.status(503).json({ message: 'The assistant is currently unavailable.' });
  }
  const { messages, conversationId, contact } = req.body || {};
  if (!Array.isArray(messages) || !messages.length) {
    return res.status(400).json({ message: 'No messages provided.' });
  }
  const lastUser = [...messages].reverse().find((m) => m.role === 'user');
  if (!lastUser) return res.status(400).json({ message: 'No customer message to answer.' });

  let result;
  try {
    const context = await buildContext({ lastUserMessage: lastUser.content, user: req.user });
    result = await answerSupportQuery({ messages, context });
  } catch (err) {
    console.error('Support chat error:', err.message);
    return res.status(err.status || 500).json({ message: 'Sorry, I could not respond right now.' });
  }

  // Persist / update the transcript, so we can return its id to the client.
  const fullThread = [
    ...messages.map((m) => ({ role: m.role, content: String(m.content || '').slice(0, 2000) })),
    { role: 'assistant', content: result.reply },
  ];
  const name = req.user?.name || '';
  const contactStr = req.user?.email || req.user?.phone || (contact || '');

  let chatId = conversationId || null;
  try {
    if (chatId) {
      await prisma.supportChat.update({
        where: { id: chatId },
        data: { messages: fullThread, escalated: result.escalate, contact: contactStr, name },
      });
    } else {
      const created = await prisma.supportChat.create({
        data: {
          userId: req.user?.id || null,
          name,
          contact: contactStr,
          messages: fullThread,
          escalated: result.escalate,
        },
      });
      chatId = created.id;
    }
  } catch (e) {
    console.warn('support transcript save skipped:', e.message);
  }

  res.json({ reply: result.reply, escalate: result.escalate, conversationId: chatId });

  // On escalation, drop it into the admin Messages inbox + notify (async).
  (async () => {
    if (result.escalate) {
      const transcript = messages
        .filter((m) => m.role === 'user' || m.role === 'assistant')
        .slice(-6)
        .map((m) => `${m.role === 'user' ? 'Customer' : 'Assistant'}: ${m.content}`)
        .join('\n');
      try {
        await prisma.contact.create({
          data: {
            name: name || 'Website visitor',
            email: req.user?.email || (contact && contact.includes('@') ? contact : ''),
            phone: req.user?.phone || (contact && !contact.includes('@') ? contact : ''),
            subject: `Support chat needs a human${result.escalationReason ? ` — ${result.escalationReason}` : ''}`,
            message: `${result.escalationReason ? `Reason: ${result.escalationReason}\n\n` : ''}Recent conversation:\n${transcript}`,
          },
        });
      } catch (e) {
        console.warn('escalation contact skipped:', e.message);
      }
      createNotification({
        type: 'message',
        title: `Support chat needs attention${name ? ` — ${name}` : ''}`,
        message: result.escalationReason || lastUser.content.slice(0, 80),
        link: '/messages',
      }).catch(() => {});
      const adminEmail = process.env.NOTIFY_EMAIL || process.env.ADMIN_EMAIL;
      if (adminEmail) {
        sendMail({
          to: adminEmail,
          subject: 'Support chat escalation — a customer needs help',
          text: `A website chat could not be resolved by the assistant.\n\n${result.escalationReason || ''}\n\nConversation:\n${transcript}\n\nContact: ${contactStr || 'not provided'}`,
        }).catch(() => {});
      }
    }
  })();
};

// @route GET /api/support/chats  (admin) — review transcripts
export const getChats = async (req, res) => {
  const { page = 1, limit = 20, escalated } = req.query;
  const where = {};
  if (escalated === 'true') where.escalated = true;
  const pageNum = Math.max(1, Number(page));
  const perPage = Number(limit);
  const [items, total, escalatedCount] = await Promise.all([
    prisma.supportChat.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      skip: (pageNum - 1) * perPage,
      take: perPage,
    }),
    prisma.supportChat.count({ where }),
    prisma.supportChat.count({ where: { escalated: true } }),
  ]);
  res.json({
    chats: items.map(withId),
    escalatedCount,
    page: pageNum,
    pages: Math.ceil(total / perPage),
    total,
  });
};
