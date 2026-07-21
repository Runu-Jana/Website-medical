import fs from 'fs';
import path from 'path';
import xlsx from 'xlsx';
import prisma from '../prisma/client.js';
import { slugify } from '../utils/slugify.js';
import { extractSheetImages } from '../lib/xlsxImages.js';
import { imagekit, imagekitEnabled } from '../lib/imagekit.js';

// The full column set for the template, in display order. `key` is the
// internal field; `header` is the human column name written to the sheet.
const COLUMNS = [
  { key: 'sku', header: 'Product ID / SKU' },
  { key: 'name', header: 'Product Name' },
  { key: 'genericName', header: 'Generic Name' },
  { key: 'brand', header: 'Brand Name' },
  { key: 'manufacturer', header: 'Manufacturer' },
  { key: 'category', header: 'Category' },
  { key: 'subCategory', header: 'Sub Category' },
  { key: 'hsnCode', header: 'HSN Code' },
  { key: 'gstPercent', header: 'GST %' },
  { key: 'mrp', header: 'MRP' },
  { key: 'salePrice', header: 'Sale Price' },
  { key: 'purchasePrice', header: 'Purchase Price' },
  { key: 'discountPercent', header: 'Discount (%)' },
  { key: 'discountAmount', header: 'Discount Amount' },
  { key: 'stock', header: 'Stock Quantity' },
  { key: 'minStock', header: 'Minimum Stock' },
  { key: 'unit', header: 'Unit' },
  { key: 'packSize', header: 'Pack Size' },
  { key: 'saltComposition', header: 'Salt Composition' },
  { key: 'strength', header: 'Strength' },
  { key: 'dosageForm', header: 'Dosage Form' },
  { key: 'prescriptionRequired', header: 'Prescription Required' },
  { key: 'mainImage', header: 'Main Image URL' },
  { key: 'image2', header: 'Image 2 URL' },
  { key: 'image3', header: 'Image 3 URL' },
  { key: 'image4', header: 'Image 4 URL' },
  { key: 'shortDescription', header: 'Short Description' },
  { key: 'fullDescription', header: 'Full Description' },
  { key: 'uses', header: 'Uses' },
  { key: 'benefits', header: 'Benefits' },
  { key: 'sideEffects', header: 'Side Effects' },
  { key: 'directions', header: 'Directions to Use' },
  { key: 'storage', header: 'Storage Instructions' },
  { key: 'seoTitle', header: 'SEO Title' },
  { key: 'metaDescription', header: 'Meta Description' },
  { key: 'metaKeywords', header: 'Meta Keywords' },
  { key: 'slug', header: 'Slug' },
  { key: 'status', header: 'Status' },
  { key: 'featured', header: 'Featured' },
  { key: 'bestseller', header: 'Bestseller' },
  { key: 'trending', header: 'Trending' },
  { key: 'newArrival', header: 'New Arrival' },
  { key: 'vendorId', header: 'Vendor ID' },
  { key: 'vendorName', header: 'Vendor Name' },
];

// Header variations accepted per field (all lowercased). The display header
// is auto-included, so real-world sheets map even with different labels.
const ALIASES = {
  sku: ['product id', 'productid', 'code', 'product code', 'item code'],
  name: ['product', 'title', 'item name', 'item'],
  genericName: ['generic', 'generic name'],
  brand: ['brand', 'brandname'],
  manufacturer: ['mfg', 'made by', 'company', 'manufactured by'],
  category: ['categories', 'category name', 'cat'],
  subCategory: ['sub-category', 'subcat'],
  hsnCode: ['hsn'],
  gstPercent: ['gst', 'gst percent', 'gst%', 'tax %', 'tax'],
  mrp: ['oldprice', 'old price', 'list price', 'maximum retail price', 'compare price'],
  salePrice: ['price', 'selling price', 'sp', 'sale price'],
  purchasePrice: ['cost price', 'cost', 'cp'],
  discountPercent: ['discount %', 'discount percent', 'discount%', 'discount'],
  discountAmount: ['discount amt', 'disc amount'],
  stock: ['stock', 'quantity', 'qty', 'countinstock', 'count in stock', 'inventory', 'instock', 'in stock'],
  minStock: ['min stock', 'reorder level', 'minimum stock'],
  unit: ['uom', 'units'],
  packSize: ['pack', 'pack size'],
  saltComposition: ['salt', 'composition', 'salt composition'],
  strength: ['potency'],
  dosageForm: ['form', 'dosage', 'dosage form'],
  prescriptionRequired: ['prescription', 'rx', 'requiresprescription', 'requires prescription', 'prescription required'],
  mainImage: ['main image', 'image', 'image url', 'image 1 url', 'image1', 'main image link', 'images'],
  image2: ['image 2', 'image2 url'],
  image3: ['image 3', 'image3 url'],
  image4: ['image 4', 'image4 url'],
  shortDescription: ['short description', 'summary', 'short desc'],
  fullDescription: ['full description', 'description', 'desc', 'details', 'long description'],
  uses: ['use', 'indications'],
  benefits: ['benefit'],
  sideEffects: ['side effects', 'side effect'],
  directions: ['directions to use', 'how to use', 'usage directions', 'dosage instructions'],
  storage: ['storage instructions', 'store'],
  seoTitle: ['seo title', 'meta title'],
  metaDescription: ['meta description'],
  metaKeywords: ['keywords', 'meta keywords'],
  slug: ['url slug', 'permalink'],
  status: ['state'],
  featured: ['isfeatured', 'is featured'],
  bestseller: ['best seller', 'isbestseller'],
  trending: ['istrending', 'is trending'],
  newArrival: ['new arrival', 'isnewarrival', 'new'],
  vendorId: ['vendor id'],
  vendorName: ['vendor', 'vendor name'],
};

// Build a per-field list of accepted header keys (header + explicit aliases).
const FIELD_KEYS = {};
for (const { key, header } of COLUMNS) {
  FIELD_KEYS[key] = [...new Set([key.toLowerCase(), header.toLowerCase(), ...(ALIASES[key] || [])])];
}

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

const parseList = (v) =>
  String(v ?? '')
    .split(/[,\n|]+/)
    .map((s) => s.trim())
    .filter(Boolean);

const normalizeRow = (row) => {
  const out = {};
  for (const k of Object.keys(row)) out[String(k).trim().toLowerCase()] = row[k];
  return out;
};

// Read a field from a normalized row using its accepted header keys.
const pick = (row, field) => {
  for (const alias of FIELD_KEYS[field] || []) {
    const val = row[alias];
    if (val !== undefined && String(val).trim() !== '') return val;
  }
  return '';
};

const computeDiscount = (oldPrice, price) =>
  oldPrice && price && oldPrice > price
    ? Math.round(((oldPrice - price) / oldPrice) * 100)
    : 0;

const makeResolver = (model, cache) => async (name) => {
  const clean = name.trim();
  const key = clean.toLowerCase();
  if (cache.has(key)) return cache.get(key);
  const rec = await prisma[model].create({
    data: { name: clean, slug: `${slugify(clean)}-${Date.now().toString(36)}` },
  });
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

  // Pre-load categories & brands once (one query each) instead of per row.
  const [cats, brands] = await Promise.all([
    prisma.category.findMany({ select: { id: true, name: true } }),
    prisma.brand.findMany({ select: { id: true, name: true } }),
  ]);
  const catMap = new Map(cats.map((c) => [c.name.trim().toLowerCase(), c.id]));
  const brandMap = new Map(brands.map((b) => [b.name.trim().toLowerCase(), b.id]));
  const resolveCategory = makeResolver('category', catMap);
  const resolveBrand = makeResolver('brand', brandMap);

  // Pictures embedded directly in the sheet, mapped to their row. Image-URL
  // columns take priority; these are the per-row fallback (hybrid import).
  let embeddedImages = new Map();
  try {
    embeddedImages = await extractSheetImages(req.file.buffer);
  } catch {
    embeddedImages = new Map();
  }

  // Push one embedded picture to storage (ImageKit in prod, local /uploads in dev).
  const uploadEmbedded = async (buf, ext, baseName) => {
    if (imagekitEnabled) {
      const r = await imagekit.upload({ file: buf, fileName: `${baseName}.${ext}`, folder: '/dcare' });
      return r.url;
    }
    const dir = path.join(process.cwd(), 'uploads');
    fs.mkdirSync(dir, { recursive: true });
    const fname = `${baseName}-${Date.now().toString(36)}.${ext}`;
    fs.writeFileSync(path.join(dir, fname), buf);
    return `${req.protocol}://${req.get('host')}/uploads/${fname}`;
  };

  const results = { total: rows.length, created: 0, failed: 0, errors: [] };

  for (let i = 0; i < rows.length; i++) {
    const r = normalizeRow(rows[i]);
    const rowNum = i + 2; // +1 for 0-index, +1 for the header row
    const name = String(pick(r, 'name')).trim();
    if (!name) {
      results.failed++;
      results.errors.push({ row: rowNum, message: 'Missing "Product Name"' });
      continue;
    }
    try {
      // Pricing: Sale Price is the live price, MRP is the strike-through.
      const salePrice = num(pick(r, 'salePrice'));
      const mrp = num(pick(r, 'mrp'));
      const price = salePrice || mrp;
      const oldPrice = mrp || 0;
      const discInput = num(pick(r, 'discountPercent'));
      const discountPercent = discInput || computeDiscount(oldPrice, price);
      const discAmt = num(pick(r, 'discountAmount')) || (oldPrice > price ? oldPrice - price : 0);

      // Images (hybrid): image-URL columns first (main may be comma-separated).
      const images = [
        ...parseList(pick(r, 'mainImage')),
        ...parseList(pick(r, 'image2')),
        ...parseList(pick(r, 'image3')),
        ...parseList(pick(r, 'image4')),
      ];
      // If this row has no image URLs, fall back to any pictures embedded in the
      // sheet on this row — upload each to storage and use those.
      if (!images.length) {
        const embedded = embeddedImages.get(rowNum) || [];
        for (let k = 0; k < embedded.length && images.length < 4; k++) {
          try {
            const url = await uploadEmbedded(embedded[k].buffer, embedded[k].ext, `${slugify(name)}-${k + 1}`);
            if (url) images.push(url);
          } catch {
            /* skip a failed image — still create the product */
          }
        }
      }

      // Categories (+ sub-category if given) resolved/created by name.
      const categoryIds = [];
      for (const cn of parseList(pick(r, 'category'))) categoryIds.push(await resolveCategory(cn));
      const subCat = String(pick(r, 'subCategory')).trim();
      const brandName = String(pick(r, 'brand')).trim();
      const brandId = brandName ? await resolveBrand(brandName) : null;

      const statusRaw = String(pick(r, 'status')).trim().toLowerCase();
      const status = ['active', 'inactive', 'draft'].includes(statusRaw) ? statusRaw : 'active';

      // Slug: explicit column wins, otherwise from the name. Kept unique.
      const slugInput = String(pick(r, 'slug')).trim();
      const slug = `${slugify(slugInput || name)}-${Date.now().toString(36)}${i}`;

      await prisma.product.create({
        data: {
          name,
          slug,
          sku: String(pick(r, 'sku')).trim(),
          description: String(pick(r, 'fullDescription')),
          shortDescription: String(pick(r, 'shortDescription')),
          price,
          oldPrice,
          discountPercent,
          discountAmount: discAmt,
          purchasePrice: num(pick(r, 'purchasePrice')),
          images,
          thumbnail: images[0] || '',
          countInStock: num(pick(r, 'stock')),
          minStock: num(pick(r, 'minStock')),
          unit: String(pick(r, 'unit')).trim() || 'pcs',
          packSize: String(pick(r, 'packSize')).trim(),
          variants: [],
          // Pharma details
          genericName: String(pick(r, 'genericName')).trim(),
          manufacturer: String(pick(r, 'manufacturer')).trim(),
          subCategory: subCat,
          hsnCode: String(pick(r, 'hsnCode')).trim(),
          gstPercent: num(pick(r, 'gstPercent')),
          saltComposition: String(pick(r, 'saltComposition')).trim(),
          strength: String(pick(r, 'strength')).trim(),
          dosageForm: String(pick(r, 'dosageForm')).trim(),
          uses: String(pick(r, 'uses')),
          benefits: String(pick(r, 'benefits')),
          sideEffects: String(pick(r, 'sideEffects')),
          directions: String(pick(r, 'directions')),
          storage: String(pick(r, 'storage')),
          // SEO
          seoTitle: String(pick(r, 'seoTitle')).trim(),
          metaDescription: String(pick(r, 'metaDescription')),
          metaKeywords: String(pick(r, 'metaKeywords')),
          // Flags
          requiresPrescription: parseBool(pick(r, 'prescriptionRequired')),
          isFeatured: parseBool(pick(r, 'featured')),
          isBestSeller: parseBool(pick(r, 'bestseller')),
          isTrending: parseBool(pick(r, 'trending')),
          isNewArrival: parseBool(pick(r, 'newArrival')),
          // Vendor
          vendorId: String(pick(r, 'vendorId')).trim(),
          vendorName: String(pick(r, 'vendorName')).trim(),
          tags: [],
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

  results.errors = results.errors.slice(0, 50);
  res.json(results);
};

// @route GET /api/products/import/template  (admin) — download a ready-to-fill .xlsx
export const downloadTemplate = (req, res) => {
  const example = {
    'Product ID / SKU': 'MED-PARA-500',
    'Product Name': 'Paracetamol 500mg Tablets',
    'Generic Name': 'Paracetamol',
    'Brand Name': 'Dolo',
    Manufacturer: 'Micro Labs Ltd',
    Category: 'Medicines',
    'Sub Category': 'Pain Relief',
    'HSN Code': '3004',
    'GST %': 12,
    MRP: 60,
    'Sale Price': 45,
    'Purchase Price': 32,
    'Discount (%)': 25,
    'Discount Amount': 15,
    'Stock Quantity': 200,
    'Minimum Stock': 20,
    Unit: 'strip',
    'Pack Size': '15 tablets',
    'Salt Composition': 'Paracetamol (500mg)',
    Strength: '500mg',
    'Dosage Form': 'Tablet',
    'Prescription Required': 'No',
    'Main Image URL': 'https://example.com/para-1.jpg',
    'Image 2 URL': 'https://example.com/para-2.jpg',
    'Image 3 URL': '',
    'Image 4 URL': '',
    'Short Description': 'Fever & pain relief',
    'Full Description': 'Paracetamol 500mg provides effective relief from fever and mild to moderate pain.',
    Uses: 'Fever, headache, body ache',
    Benefits: 'Fast-acting, gentle on the stomach',
    'Side Effects': 'Rare: nausea, rash',
    'Directions to Use': '1 tablet every 6 hours or as directed by physician',
    'Storage Instructions': 'Store below 30°C, away from direct sunlight',
    'SEO Title': 'Buy Paracetamol 500mg Tablets Online | DCare',
    'Meta Description': 'Order Paracetamol 500mg tablets for fever and pain relief.',
    'Meta Keywords': 'paracetamol, fever, pain relief',
    Slug: 'paracetamol-500mg-tablets',
    Status: 'Active',
    Featured: 'Yes',
    Bestseller: 'No',
    Trending: 'No',
    'New Arrival': 'Yes',
    'Vendor ID': '',
    'Vendor Name': '',
  };
  const headers = COLUMNS.map((c) => c.header);
  const ws = xlsx.utils.json_to_sheet([example], { header: headers });
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
