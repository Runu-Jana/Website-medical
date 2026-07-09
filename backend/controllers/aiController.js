import { aiEnabled, generateProductDetails } from '../lib/ai.js';

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
