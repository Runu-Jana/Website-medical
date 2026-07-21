import Anthropic from '@anthropic-ai/sdk';

// Reads the ANTHROPIC_API_KEY like every other integration (Firebase, Razorpay,
// SMTP): the feature is simply "disabled" when the key is absent, so the site
// keeps working without it. Add ANTHROPIC_API_KEY to backend .env to enable.
const { ANTHROPIC_API_KEY } = process.env;
export const aiEnabled = !!ANTHROPIC_API_KEY;

const MODEL = 'claude-opus-4-8';
// Support chat is high-volume and customer-facing — use the fast, low-cost model.
const SUPPORT_MODEL = 'claude-haiku-4-5';

const client = aiEnabled ? new Anthropic({ apiKey: ANTHROPIC_API_KEY }) : null;

// JSON shape Claude must return. `strict` schema keeps every field present.
const PRODUCT_SCHEMA = {
  type: 'object',
  properties: {
    shortDescription: {
      type: 'string',
      description: 'One-line summary (max ~140 chars) of what this product is.',
    },
    saltComposition: {
      type: 'string',
      description:
        'Active salt / ingredient composition with strengths if visible, e.g. "Paracetamol (500mg)". Empty string if not a medicine or not visible.',
    },
    strength: { type: 'string', description: 'Strength, e.g. "500mg". Empty if N/A.' },
    dosageForm: {
      type: 'string',
      description: 'Dosage form, e.g. "Tablet", "Syrup", "Cream". Empty if N/A.',
    },
    manufacturer: { type: 'string', description: 'Manufacturer / marketer if visible. Empty if unknown.' },
    uses: {
      type: 'string',
      description:
        'What the product is used for / treats. For medicines list the indications. Plain sentences, may use bullet lines separated by newlines.',
    },
    benefits: {
      type: 'string',
      description: 'Key benefits / how it helps the patient. Newline-separated points.',
    },
    directions: {
      type: 'string',
      description:
        'How to use / dosage directions in plain language. For medicines, general guidance plus "or as directed by your physician".',
    },
    sideEffects: {
      type: 'string',
      description: 'Common possible side effects. Newline-separated. Empty if not applicable.',
    },
    storage: {
      type: 'string',
      description: 'Storage instructions, e.g. "Store below 30°C, away from direct sunlight".',
    },
    dosAndDonts: {
      type: 'string',
      description:
        "Practical Do's and Don'ts for the customer. Prefix each line with 'Do: ' or 'Don\\'t: '. Newline-separated.",
    },
    faqs: {
      type: 'array',
      description: '4 to 6 context-aware FAQs a customer would ask about THIS product.',
      items: {
        type: 'object',
        properties: {
          question: { type: 'string' },
          answer: { type: 'string' },
        },
        required: ['question', 'answer'],
        additionalProperties: false,
      },
    },
  },
  required: [
    'shortDescription',
    'saltComposition',
    'strength',
    'dosageForm',
    'manufacturer',
    'uses',
    'benefits',
    'directions',
    'sideEffects',
    'storage',
    'dosAndDonts',
    'faqs',
  ],
  additionalProperties: false,
};

const SYSTEM_PROMPT = `You are a pharmacist and product-catalog expert for an Indian online medical & pharmacy store (DBL Life Care).
You are shown one or more photos of a product's carton/packaging (and optionally its name and category).
Read the packaging carefully and produce accurate, customer-friendly catalog content in clear, simple English.

Rules:
- Base everything you can on what is actually printed on the packaging. Do not invent a brand, salt, or strength that is not visible or not well-established for the product.
- If a field genuinely cannot be determined, return an empty string for it (or an empty list for faqs) rather than guessing.
- For medicines/supplements, be medically responsible: include a reminder to consult a doctor/pharmacist where relevant, and never encourage misuse or overdosing.
- Keep each text field concise and scannable. Use newline-separated points where a list reads better than a paragraph.
- FAQs must be specific to THIS product (its uses, dosage, safety, storage, prescription need), not generic store FAQs.
- Do not include markdown symbols like ** or #. Plain text only.`;

// Map a fetched image's content-type to an Anthropic-supported media_type.
const mediaTypeFor = (contentType = '') => {
  const t = contentType.toLowerCase();
  if (t.includes('png')) return 'image/png';
  if (t.includes('webp')) return 'image/webp';
  if (t.includes('gif')) return 'image/gif';
  return 'image/jpeg';
};

// Fetch a remote image (ImageKit/uploads URL) and return an Anthropic image block.
const toImageBlock = async (url) => {
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`Image fetch failed (${resp.status}) for ${url}`);
  const contentType = resp.headers.get('content-type') || '';
  const buf = Buffer.from(await resp.arrayBuffer());
  return {
    type: 'image',
    source: {
      type: 'base64',
      media_type: mediaTypeFor(contentType),
      data: buf.toString('base64'),
    },
  };
};

/**
 * Read a product's carton image(s) and generate catalog details + FAQs.
 * @param {{ name?: string, category?: string, imageUrls: string[] }} input
 * @returns {Promise<object>} the validated PRODUCT_SCHEMA object
 */
export const generateProductDetails = async ({ name = '', category = '', imageUrls = [] }) => {
  if (!aiEnabled) {
    const err = new Error('AI is not configured. Set ANTHROPIC_API_KEY in the backend .env.');
    err.status = 503;
    throw err;
  }
  const urls = (imageUrls || []).filter(Boolean).slice(0, 4); // cap cost/latency
  if (!urls.length) {
    const err = new Error('At least one product image is required to read the carton.');
    err.status = 400;
    throw err;
  }

  // Fetch images server-side (they may be behind hosts the browser can't reach
  // for base64), then send them alongside a text instruction.
  const imageBlocks = [];
  for (const url of urls) {
    try {
      imageBlocks.push(await toImageBlock(url));
    } catch (e) {
      console.warn('AI image skip:', e.message);
    }
  }
  if (!imageBlocks.length) {
    const err = new Error('Could not read any of the product images.');
    err.status = 400;
    throw err;
  }

  const hint = [
    name && `Known product name: ${name}`,
    category && `Store category: ${category}`,
    'Read the packaging in the image(s) and fill in the catalog fields and FAQs.',
  ]
    .filter(Boolean)
    .join('\n');

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 4000,
    system: SYSTEM_PROMPT,
    output_config: { format: { type: 'json_schema', schema: PRODUCT_SCHEMA } },
    messages: [
      {
        role: 'user',
        content: [...imageBlocks, { type: 'text', text: hint }],
      },
    ],
  });

  // With json_schema output, the text block is the JSON document.
  const textBlock = response.content.find((b) => b.type === 'text');
  if (!textBlock) throw new Error('AI returned no content.');
  let parsed;
  try {
    parsed = JSON.parse(textBlock.text);
  } catch {
    throw new Error('AI returned malformed JSON.');
  }
  // Normalise faqs to a clean array of {question, answer}.
  parsed.faqs = Array.isArray(parsed.faqs)
    ? parsed.faqs
        .filter((f) => f && f.question && f.answer)
        .map((f) => ({ question: String(f.question), answer: String(f.answer) }))
    : [];
  return parsed;
};

// ── Bulk, text-only generation (no carton image) ───────────────────────────
// Uses the low-cost model to write catalog content from a product's NAME and
// any known facts — for filling in thousands of imported rows cheaply.
const BULK_MODEL = 'claude-haiku-4-5';

// Same fields as the carton reader, plus a longer `description` paragraph.
const BULK_PRODUCT_SCHEMA = {
  type: 'object',
  properties: {
    description: {
      type: 'string',
      description: 'A clear 2–4 sentence customer-facing overview of the product in plain English.',
    },
    ...PRODUCT_SCHEMA.properties,
  },
  required: ['description', ...PRODUCT_SCHEMA.required],
  additionalProperties: false,
};

const BULK_SYSTEM_PROMPT = `You are a pharmacist and product-catalog expert for an Indian online medical & pharmacy store (DBL Life Care).
You are given a product's NAME and possibly its salt/composition, strength, generic name, brand or category — but NO image.
Write accurate, customer-friendly catalog content in clear, simple English.

Rules:
- Work from the product name and the facts provided. Product names usually encode the molecule and strength (e.g. "Paracetamol 500mg Tablet") — use that.
- Only state salt, strength, uses, etc. that are well-established for this molecule. Do NOT invent a brand, manufacturer, or specific claim that isn't given or well-known. If a field genuinely can't be determined, return an empty string (or empty list for faqs).
- Be medically responsible: include a reminder to consult a doctor/pharmacist where relevant; never encourage misuse or overdosing.
- Keep each field concise and scannable; use newline-separated points where a list reads better.
- FAQs must be specific to THIS product. Plain text only — no markdown symbols like ** or #.`;

/**
 * Generate catalog details from a product's name + known facts (no image).
 * @param {{ name?, brand?, category?, saltComposition?, strength?, genericName? }} input
 * @returns {Promise<object>} validated BULK_PRODUCT_SCHEMA object
 */
export const generateProductDetailsFromText = async ({
  name = '',
  brand = '',
  category = '',
  saltComposition = '',
  strength = '',
  genericName = '',
} = {}) => {
  if (!aiEnabled) {
    const err = new Error('AI is not configured. Set ANTHROPIC_API_KEY in the backend .env.');
    err.status = 503;
    throw err;
  }
  if (!String(name).trim()) {
    const err = new Error('Product name is required.');
    err.status = 400;
    throw err;
  }

  const facts = [
    `Product name: ${name}`,
    genericName && `Generic name: ${genericName}`,
    saltComposition && `Salt / composition: ${saltComposition}`,
    strength && `Strength: ${strength}`,
    brand && `Brand: ${brand}`,
    category && `Category: ${category}`,
  ]
    .filter(Boolean)
    .join('\n');

  const response = await client.messages.create({
    model: BULK_MODEL,
    max_tokens: 2000,
    system: BULK_SYSTEM_PROMPT,
    output_config: { format: { type: 'json_schema', schema: BULK_PRODUCT_SCHEMA } },
    messages: [
      {
        role: 'user',
        content: `${facts}\n\nWrite the catalog fields and FAQs for this product.`,
      },
    ],
  });

  const textBlock = response.content.find((b) => b.type === 'text');
  if (!textBlock) throw new Error('AI returned no content.');
  let parsed;
  try {
    parsed = JSON.parse(textBlock.text);
  } catch {
    throw new Error('AI returned malformed JSON.');
  }
  parsed.faqs = Array.isArray(parsed.faqs)
    ? parsed.faqs
        .filter((f) => f && f.question && f.answer)
        .map((f) => ({ question: String(f.question), answer: String(f.answer) }))
    : [];
  return parsed;
};

// JSON shape for an AI-drafted promotional offer.
const OFFER_SCHEMA = {
  type: 'object',
  properties: {
    code: {
      type: 'string',
      description: 'Short uppercase promo code, letters+digits only, 4-12 chars, e.g. "MONSOON20".',
    },
    description: {
      type: 'string',
      description: 'One-line customer-facing description of the offer, e.g. "20% off immunity essentials this monsoon".',
    },
    type: { type: 'string', enum: ['percent', 'fixed'], description: 'percent or fixed ₹ off.' },
    value: { type: 'number', description: 'The discount amount: percent (e.g. 20) or rupees (e.g. 100).' },
    maxDiscount: {
      type: 'number',
      description: 'Cap in ₹ for percent coupons (0 if none). Keep sensible for margins.',
    },
    minOrder: { type: 'number', description: 'Minimum cart value in ₹ to qualify (0 for none).' },
    headline: {
      type: 'string',
      description: 'Punchy homepage headline for the promo panel, e.g. "Monsoon Immunity Sale".',
    },
  },
  required: ['code', 'description', 'type', 'value', 'maxDiscount', 'minOrder', 'headline'],
  additionalProperties: false,
};

/**
 * Draft a promotional offer (code + discount + copy) from a short brief.
 * @param {{ brief?: string }} input
 */
export const generateOfferSuggestion = async ({ brief = '' } = {}) => {
  if (!aiEnabled) {
    const err = new Error('AI is not configured. Set ANTHROPIC_API_KEY in the backend .env.');
    err.status = 503;
    throw err;
  }
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 1200,
    system:
      'You are a growth-marketing expert for an Indian online medical & pharmacy store (DBL Life Care). ' +
      'Draft a single, sensible promotional coupon that would drive sales without destroying margins. ' +
      'Discounts for a pharmacy are usually modest (5-25% or ₹50-₹300). Codes must be uppercase, memorable, ' +
      'and letters/digits only. Return realistic, ready-to-use values.',
    output_config: { format: { type: 'json_schema', schema: OFFER_SCHEMA } },
    messages: [
      {
        role: 'user',
        content:
          (brief && brief.trim()
            ? `Brief for the offer: ${brief.trim()}`
            : 'Suggest a strong general-purpose promotional offer for the store.') +
          '\nReturn one coupon.',
      },
    ],
  });
  const textBlock = response.content.find((b) => b.type === 'text');
  if (!textBlock) throw new Error('AI returned no content.');
  try {
    return JSON.parse(textBlock.text);
  } catch {
    throw new Error('AI returned malformed JSON.');
  }
};

// Structured reply for the storefront support assistant.
const SUPPORT_SCHEMA = {
  type: 'object',
  properties: {
    reply: {
      type: 'string',
      description: 'The helpful, friendly answer to show the customer (plain text, no markdown symbols).',
    },
    escalate: {
      type: 'boolean',
      description:
        'True if the query needs a human (complaint, refund/return request, payment dispute, prescription verification, anything you cannot answer confidently, or the customer asks for a person).',
    },
    escalationReason: {
      type: 'string',
      description: 'Short internal note on why it should reach a human (empty when escalate is false).',
    },
  },
  required: ['reply', 'escalate', 'escalationReason'],
  additionalProperties: false,
};

const SUPPORT_SYSTEM = `You are "Care Assistant", the friendly customer-support assistant for DBL Life Care, an Indian online medical & pharmacy store (operated by Dr. Bhoumik Laboratories Pvt. Ltd.).

Your job: answer customer questions about products, orders, delivery, payments, offers, prescriptions and store policies, using ONLY the store information provided to you in the context. Be warm, concise and helpful.

STRICT MEDICAL SAFETY RULES (this is a pharmacy — non-negotiable):
- You are NOT a doctor. Never diagnose conditions, never prescribe, and never tell a customer to start, stop, combine, or change the dose of any medicine.
- For any symptom or "what should I take" question, give only general, safe information and clearly advise them to consult a qualified doctor or pharmacist. When appropriate, suggest they use the store's "Upload Prescription" option.
- Never recommend or promise to sell prescription-only medicines without a valid prescription.
- For emergencies, tell them to contact a doctor or emergency services immediately.

GROUNDING RULES:
- Only state product names, prices, stock and offers that appear in the provided context. If something isn't in the context, say you're not sure and offer to connect them with the team — do NOT invent details.
- For order-status questions from a customer who is not logged in, ask them to log in so you can look up their order securely.
- Keep answers short (a few sentences). Use plain text only — no markdown, asterisks or headings.

ESCALATION:
- Set escalate=true for complaints, refund/return requests, wrong/damaged items, payment failures, prescription verification, or anything you cannot answer confidently from the context, or when the customer asks to talk to a human. Still give a polite holding reply telling them the team will follow up.`;

/**
 * Answer a storefront support conversation.
 * @param {{ messages: Array<{role:'user'|'assistant', content:string}>, context: string }} input
 * @returns {Promise<{reply:string, escalate:boolean, escalationReason:string}>}
 */
export const answerSupportQuery = async ({ messages = [], context = '' }) => {
  if (!aiEnabled) {
    const err = new Error('AI is not configured. Set ANTHROPIC_API_KEY in the backend .env.');
    err.status = 503;
    throw err;
  }
  const trimmed = messages
    .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && m.content)
    .slice(-12) // keep the last few turns to bound cost
    .map((m) => ({ role: m.role, content: String(m.content).slice(0, 2000) }));
  if (!trimmed.length || trimmed[trimmed.length - 1].role !== 'user') {
    const err = new Error('No customer message to answer.');
    err.status = 400;
    throw err;
  }

  const response = await client.messages.create({
    model: SUPPORT_MODEL,
    max_tokens: 700,
    system: [
      { type: 'text', text: SUPPORT_SYSTEM },
      { type: 'text', text: `STORE CONTEXT (the only facts you may rely on):\n${context}` },
    ],
    output_config: { format: { type: 'json_schema', schema: SUPPORT_SCHEMA } },
    messages: trimmed,
  });

  const textBlock = response.content.find((b) => b.type === 'text');
  if (!textBlock) throw new Error('AI returned no content.');
  let parsed;
  try {
    parsed = JSON.parse(textBlock.text);
  } catch {
    throw new Error('AI returned malformed JSON.');
  }
  return {
    reply: String(parsed.reply || '').trim() || "I'm sorry, I couldn't process that. Let me connect you with our team.",
    escalate: !!parsed.escalate,
    escalationReason: String(parsed.escalationReason || '').trim(),
  };
};
