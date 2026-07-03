import xlsx from 'xlsx';
import prisma from '../prisma/client.js';
import { slugify } from '../utils/slugify.js';

// Columns the importer understands (header row, case-insensitive).
const TEMPLATE_COLUMNS = [
  'name',
  'price',
  'oldPrice',
  'sku',
  'description',
  'shortDescription',
  'countInStock',
  'unit',
  'category',
  'brand',
  'images',
  'tags',
  'status',
  'isFeatured',
  'isBestSeller',
  'isNewArrival',
  'isDeal',
  'requiresPrescription',
];

const parseBool = (v) => {
  if (typeof v === 'boolean') return v;
  const s = String(v ?? '').trim().toLowerCase();
  return ['1', 'true', 'yes', 'y'].includes(s);
};

// Split a cell into a clean list on commas, pipes or newlines.
const parseList = (v) =>
  String(v ?? '')
    .split(/[,\n|]+/)
    .map((s) => s.trim())
    .filter(Boolean);

// Lowercase every header so "Price", "price" and " PRICE " all match.
const normalizeRow = (row) => {
  const out = {};
  for (const k of Object.keys(row)) out[String(k).trim().toLowerCase()] = row[k];
  return out;
};

const computeDiscount = (oldPrice, price) =>
  oldPrice && price && oldPrice > price
    ? Math.round(((oldPrice - price) / oldPrice) * 100)
    : 0;

// Find a category/brand by name (case-insensitive) or create it; cached per import.
const makeResolver = (model, cache) => async (name) => {
  const key = name.toLowerCase();
  if (cache.has(key)) return cache.get(key);
  let rec = await prisma[model].findFirst({
    where: { name: { equals: name, mode: 'insensitive' } },
  });
  if (!rec) {
    rec = await prisma[model].create({
      data: { name, slug: `${slugify(name)}-${Date.now().toString(36)}` },
    });
  }
  cache.set(key, rec.id);
  return rec.id;
};

// @route POST /api/products/import  (admin) — bulk-create products from a spreadsheet
export const importProducts = async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

  let rows;
  try {
    const wb = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheet = wb.Sheets[wb.SheetNames[0]];
    if (!sheet) return res.status(400).json({ message: 'The file has no sheets' });
    rows = xlsx.utils.sheet_to_json(sheet, { defval: '' });
  } catch {
    return res.status(400).json({ message: 'Could not read the file. Use .xlsx, .xls or .csv.' });
  }
  if (!rows.length) return res.status(400).json({ message: 'The sheet has no data rows' });

  const resolveCategory = makeResolver('category', new Map());
  const resolveBrand = makeResolver('brand', new Map());

  const results = { total: rows.length, created: 0, failed: 0, errors: [] };

  for (let i = 0; i < rows.length; i++) {
    const r = normalizeRow(rows[i]);
    const rowNum = i + 2; // +1 for 0-index, +1 for the header row
    const name = String(r.name ?? '').trim();
    if (!name) {
      results.failed++;
      results.errors.push({ row: rowNum, message: 'Missing "name"' });
      continue;
    }
    try {
      const price = Number(r.price) || 0;
      const oldPrice = Number(r.oldprice) || 0;
      const images = parseList(r.images);

      const categoryIds = [];
      for (const cn of parseList(r.category)) categoryIds.push(await resolveCategory(cn));
      const brandName = String(r.brand ?? '').trim();
      const brandId = brandName ? await resolveBrand(brandName) : null;

      const statusRaw = String(r.status ?? '').trim().toLowerCase();
      const status = ['active', 'inactive', 'draft'].includes(statusRaw) ? statusRaw : 'active';

      await prisma.product.create({
        data: {
          name,
          slug: `${slugify(name)}-${Date.now().toString(36)}${i}`,
          sku: String(r.sku ?? '').trim(),
          description: String(r.description ?? ''),
          shortDescription: String(r.shortdescription ?? ''),
          price,
          oldPrice,
          discountPercent: computeDiscount(oldPrice, price),
          images,
          thumbnail: images[0] || '',
          countInStock: Number(r.countinstock) || 0,
          unit: String(r.unit ?? '').trim() || 'pcs',
          variants: [],
          isFeatured: parseBool(r.isfeatured),
          isBestSeller: parseBool(r.isbestseller),
          isNewArrival: parseBool(r.isnewarrival),
          isDeal: parseBool(r.isdeal),
          requiresPrescription: parseBool(r.requiresprescription),
          tags: parseList(r.tags),
          status,
          reviews: [],
          ...(brandId ? { brand: { connect: { id: brandId } } } : {}),
          ...(categoryIds.length ? { categories: { connect: categoryIds.map((id) => ({ id })) } } : {}),
        },
      });
      results.created++;
    } catch (err) {
      results.failed++;
      results.errors.push({ row: rowNum, message: err.message || 'Could not create product' });
    }
  }

  results.errors = results.errors.slice(0, 50); // keep the response small
  res.json(results);
};

// @route GET /api/products/import/template  (admin) — download a ready-to-fill .xlsx
export const downloadTemplate = (req, res) => {
  const example = {
    name: 'Paracetamol 500mg Tablets',
    price: 45,
    oldPrice: 60,
    sku: 'MED-PARA-500',
    description: 'Effective relief from fever and mild pain. Pack of 15 tablets.',
    shortDescription: 'Fever & pain relief',
    countInStock: 200,
    unit: 'strip',
    category: 'Medicines, Pain Relief',
    brand: 'DCare',
    images: 'https://example.com/para-1.jpg, https://example.com/para-2.jpg',
    tags: 'fever, pain, tablet',
    status: 'active',
    isFeatured: 'yes',
    isBestSeller: 'no',
    isNewArrival: 'yes',
    isDeal: 'no',
    requiresPrescription: 'no',
  };
  const ws = xlsx.utils.json_to_sheet([example], { header: TEMPLATE_COLUMNS });
  const wb = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(wb, ws, 'Products');
  const buf = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });
  res.setHeader(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  );
  res.setHeader('Content-Disposition', 'attachment; filename="dcare-products-template.xlsx"');
  res.send(buf);
};
