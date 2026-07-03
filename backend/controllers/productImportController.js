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

// Accept common header variations so a real-world sheet maps accurately.
const HEADER_ALIASES = {
  name: ['name', 'product name', 'product', 'title', 'item name', 'item'],
  price: ['price', 'selling price', 'sale price', 'rate', 'sp'],
  oldPrice: ['oldprice', 'old price', 'mrp', 'list price', 'compare price', 'compare at price'],
  sku: ['sku', 'code', 'product code', 'item code'],
  description: ['description', 'desc', 'details', 'long description'],
  shortDescription: ['shortdescription', 'short description', 'summary', 'subtitle'],
  countInStock: ['countinstock', 'count in stock', 'stock', 'quantity', 'qty', 'inventory', 'instock', 'in stock'],
  unit: ['unit', 'uom', 'units'],
  category: ['category', 'categories', 'category name', 'cat'],
  brand: ['brand', 'brand name', 'manufacturer', 'make'],
  images: ['images', 'image', 'image url', 'image urls', 'photo', 'photos', 'image link'],
  tags: ['tags', 'tag', 'keywords', 'labels'],
  status: ['status', 'state'],
  isFeatured: ['isfeatured', 'featured', 'is featured'],
  isBestSeller: ['isbestseller', 'bestseller', 'best seller', 'is best seller'],
  isNewArrival: ['isnewarrival', 'new arrival', 'newarrival', 'new', 'is new'],
  isDeal: ['isdeal', 'deal', 'on deal', 'is deal'],
  requiresPrescription: ['requiresprescription', 'requires prescription', 'prescription', 'rx', 'needs prescription'],
};

const parseBool = (v) => {
  if (typeof v === 'boolean') return v;
  const s = String(v ?? '').trim().toLowerCase();
  return ['1', 'true', 'yes', 'y', 'x'].includes(s);
};

// Numbers that tolerate "₹1,299.00" style cells.
const num = (v) => {
  const n = Number(String(v ?? '').replace(/[^0-9.\-]/g, ''));
  return Number.isFinite(n) ? n : 0;
};

// Split a cell into a clean list on commas, pipes or newlines.
const parseList = (v) =>
  String(v ?? '')
    .split(/[,\n|]+/)
    .map((s) => s.trim())
    .filter(Boolean);

// Lowercase + trim every header so "Price", "price" and " PRICE " all match.
const normalizeRow = (row) => {
  const out = {};
  for (const k of Object.keys(row)) out[String(k).trim().toLowerCase()] = row[k];
  return out;
};

// Pull a field's value from a normalized row using its header aliases.
const pick = (row, field) => {
  for (const alias of HEADER_ALIASES[field]) {
    const val = row[alias];
    if (val !== undefined && String(val).trim() !== '') return val;
  }
  return '';
};

const computeDiscount = (oldPrice, price) =>
  oldPrice && price && oldPrice > price
    ? Math.round(((oldPrice - price) / oldPrice) * 100)
    : 0;

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

  // Pre-load categories & brands once (one query each) instead of per row.
  const [cats, brands] = await Promise.all([
    prisma.category.findMany({ select: { id: true, name: true } }),
    prisma.brand.findMany({ select: { id: true, name: true } }),
  ]);
  const catMap = new Map(cats.map((c) => [c.name.trim().toLowerCase(), c.id]));
  const brandMap = new Map(brands.map((b) => [b.name.trim().toLowerCase(), b.id]));

  const resolve = (map, model) => async (name) => {
    const clean = name.trim();
    const key = clean.toLowerCase();
    if (map.has(key)) return map.get(key);
    const rec = await prisma[model].create({
      data: { name: clean, slug: `${slugify(clean)}-${Date.now().toString(36)}` },
    });
    map.set(key, rec.id);
    return rec.id;
  };
  const resolveCategory = resolve(catMap, 'category');
  const resolveBrand = resolve(brandMap, 'brand');

  const results = { total: rows.length, created: 0, failed: 0, errors: [] };

  for (let i = 0; i < rows.length; i++) {
    const r = normalizeRow(rows[i]);
    const rowNum = i + 2; // +1 for 0-index, +1 for the header row
    const name = String(pick(r, 'name')).trim();
    if (!name) {
      results.failed++;
      results.errors.push({ row: rowNum, message: 'Missing "name"' });
      continue;
    }
    try {
      const price = num(pick(r, 'price'));
      const oldPrice = num(pick(r, 'oldPrice'));
      const images = parseList(pick(r, 'images'));

      const categoryIds = [];
      for (const cn of parseList(pick(r, 'category'))) categoryIds.push(await resolveCategory(cn));
      const brandName = String(pick(r, 'brand')).trim();
      const brandId = brandName ? await resolveBrand(brandName) : null;

      const statusRaw = String(pick(r, 'status')).trim().toLowerCase();
      const status = ['active', 'inactive', 'draft'].includes(statusRaw) ? statusRaw : 'active';

      await prisma.product.create({
        data: {
          name,
          slug: `${slugify(name)}-${Date.now().toString(36)}${i}`,
          sku: String(pick(r, 'sku')).trim(),
          description: String(pick(r, 'description')),
          shortDescription: String(pick(r, 'shortDescription')),
          price,
          oldPrice,
          discountPercent: computeDiscount(oldPrice, price),
          images,
          thumbnail: images[0] || '',
          countInStock: num(pick(r, 'countInStock')),
          unit: String(pick(r, 'unit')).trim() || 'pcs',
          variants: [],
          isFeatured: parseBool(pick(r, 'isFeatured')),
          isBestSeller: parseBool(pick(r, 'isBestSeller')),
          isNewArrival: parseBool(pick(r, 'isNewArrival')),
          isDeal: parseBool(pick(r, 'isDeal')),
          requiresPrescription: parseBool(pick(r, 'requiresPrescription')),
          tags: parseList(pick(r, 'tags')),
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
