import prisma from '../prisma/client.js';
import { aiEnabled, generateProductDetails, generateProductDetailsFromText } from '../lib/ai.js';

// @route GET /api/ai/status  (admin) — lets the UI show/hide the AI button.
export const getAiStatus = (req, res) => {
  res.json({ enabled: aiEnabled });
};

// @route POST /api/ai/product-details  (admin)
// Body: { name?, category?, imageUrls: string[] }
export const productDetails = async (req, res) => {
  const { name, category, imageUrls } = req.body || {};
  try {
    const data = await generateProductDetails({ name, category, imageUrls });
    res.json({ data });
  } catch (err) {
    console.error('AI product-details error:', err.message);
    res.status(err.status || 500).json({ message: err.message || 'AI generation failed.' });
  }
};

// A product "needs AI" when it has no long description yet.
const NEEDS_AI = { description: '' };

// @route GET /api/ai/bulk/status  (admin) — how many products still need details.
export const getBulkStatus = async (req, res) => {
  const pending = await prisma.product.count({ where: NEEDS_AI });
  res.json({ enabled: aiEnabled, pending });
};

// Copy a generated value onto the product only when the product's field is
// currently blank — never overwrite content the admin already entered.
const setIfEmpty = (data, field, value, current) => {
  if (value && String(value).trim() && !String(current || '').trim()) {
    data[field] = String(value);
  }
};

// @route POST /api/ai/bulk/generate  (admin)
// Body: { limit }. Fills empty catalog fields for up to `limit` products that
// have no description, using the low-cost text model. Runs in small batches so
// the admin controls the spend; returns counts + how many remain.
export const bulkGenerate = async (req, res) => {
  if (!aiEnabled) {
    return res.status(503).json({ message: 'AI is not configured. Set ANTHROPIC_API_KEY in the backend .env.' });
  }
  // Hard cap per call (spend control) — the admin repeats to do more.
  const limit = Math.min(100, Math.max(1, Number(req.body?.limit) || 20));

  const products = await prisma.product.findMany({
    where: NEEDS_AI,
    orderBy: { createdAt: 'asc' },
    take: limit,
    select: {
      id: true, name: true, saltComposition: true, strength: true, genericName: true,
      description: true, shortDescription: true, dosageForm: true, manufacturer: true,
      uses: true, benefits: true, directions: true, sideEffects: true, storage: true,
      dosAndDonts: true, faqs: true,
    },
  });

  let processed = 0;
  let updated = 0;
  let failed = 0;
  const errors = [];

  for (const p of products) {
    processed += 1;
    try {
      const gen = await generateProductDetailsFromText({
        name: p.name,
        saltComposition: p.saltComposition,
        strength: p.strength,
        genericName: p.genericName,
      });

      const data = {};
      setIfEmpty(data, 'description', gen.description, p.description);
      setIfEmpty(data, 'shortDescription', gen.shortDescription, p.shortDescription);
      setIfEmpty(data, 'saltComposition', gen.saltComposition, p.saltComposition);
      setIfEmpty(data, 'strength', gen.strength, p.strength);
      setIfEmpty(data, 'dosageForm', gen.dosageForm, p.dosageForm);
      setIfEmpty(data, 'manufacturer', gen.manufacturer, p.manufacturer);
      setIfEmpty(data, 'uses', gen.uses, p.uses);
      setIfEmpty(data, 'benefits', gen.benefits, p.benefits);
      setIfEmpty(data, 'directions', gen.directions, p.directions);
      setIfEmpty(data, 'sideEffects', gen.sideEffects, p.sideEffects);
      setIfEmpty(data, 'storage', gen.storage, p.storage);
      setIfEmpty(data, 'dosAndDonts', gen.dosAndDonts, p.dosAndDonts);
      // FAQs: only set when the product has none yet.
      const hasFaqs = Array.isArray(p.faqs) && p.faqs.length > 0;
      if (!hasFaqs && Array.isArray(gen.faqs) && gen.faqs.length) data.faqs = gen.faqs;

      if (Object.keys(data).length) {
        await prisma.product.update({ where: { id: p.id }, data });
        updated += 1;
      }
    } catch (err) {
      failed += 1;
      if (errors.length < 10) errors.push({ product: p.name, message: err.message || 'generation failed' });
    }
  }

  const remaining = await prisma.product.count({ where: NEEDS_AI });
  res.json({ processed, updated, failed, remaining, errors });
};
