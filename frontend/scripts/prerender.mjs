// Build-time prerendering for SEO.
//
// Serves the freshly-built dist and, using a headless browser, renders each
// route to real HTML (with the correct <title>/meta from react-helmet and the
// JSON-LD product data) so crawlers and social scrapers get server-quality
// markup even though the app is a client-side SPA on static hosting.
//
// Static routes are always prerendered. Dynamic routes (individual products,
// blog posts, doctor profiles) are prerendered too when a live API is
// reachable — their slugs are pulled from it at build time.
//
// Usage:
//   npx playwright install chromium            # one-time
//   VITE_API_URL=https://api.example.com npm run build:seo
//
// The app was built with that VITE_API_URL, so the headless browser fetches
// real data from it. Extra knobs:
//   PRERENDER_API=<url>   override the API base used to list slugs
//   PRERENDER_MAX=<n>     cap dynamic pages per type (default 2000)
//   PRERENDER_CHROMIUM=<path>  explicit Chromium binary

import { preview, loadEnv } from 'vite';
import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.resolve(__dirname, '../dist');

// Resolve the API base from the shell first, then fall back to the .env files
// Vite itself reads — so `npm run build:seo` just works after you set
// VITE_API_URL in frontend/.env (no cross-platform inline-env juggling).
const fileEnv = loadEnv('production', process.cwd(), '');
const API = (process.env.PRERENDER_API || process.env.VITE_API_URL || fileEnv.VITE_API_URL || '').replace(/\/$/, '');
const MAX = Number(process.env.PRERENDER_MAX || 2000);

// Static, always-indexable routes. '/' is rendered LAST so that while other
// routes prerender, the SPA fallback keeps serving the clean original shell.
const STATIC_ROUTES = [
  '/shop', '/about', '/contact', '/sell', '/health-club', '/brands',
  '/doctors', '/lab-tests', '/blog',
  '/privacy-policy', '/terms', '/refund-policy', '/shipping-policy', '/disclaimer',
  '/',
];

const outFileFor = (route) =>
  route === '/' ? path.join(DIST, 'index.html') : path.join(DIST, route, 'index.html');

// Fetch every slug for a paginated list endpoint (products) or a plain array
// endpoint (posts/doctors), tolerating both response shapes.
async function fetchSlugs(endpoint, pick) {
  if (!API) return [];
  const slugs = [];
  try {
    // Try paginated first (products: { products, pages }).
    let page = 1;
    let pages = 1;
    do {
      const res = await fetch(`${API}/api${endpoint}?page=${page}&limit=100`);
      if (!res.ok) break;
      const data = await res.json();
      const list = Array.isArray(data) ? data : data.products || data.posts || data.doctors || [];
      for (const item of list) {
        const s = pick(item);
        if (s) slugs.push(s);
        if (slugs.length >= MAX) return slugs;
      }
      pages = Array.isArray(data) ? 1 : data.pages || 1;
      page += 1;
    } while (page <= pages);
  } catch (e) {
    console.warn(`  (could not list ${endpoint}: ${e.message})`);
  }
  return slugs;
}

async function renderRoute(browser, base, route) {
  const page = await browser.newPage();
  try {
    await page.goto(base + route, { waitUntil: 'domcontentloaded', timeout: 20000 });
    await page.waitForFunction(() => document.title && document.title.length > 0, { timeout: 6000 }).catch(() => {});
    await page.waitForTimeout(1200);
    const html = '<!doctype html>\n' + (await page.evaluate(() => document.documentElement.outerHTML));
    const out = outFileFor(route);
    fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.writeFileSync(out, html);
    return true;
  } catch (e) {
    console.warn(`  ✗ ${route}: ${e.message}`);
    return false;
  } finally {
    await page.close();
  }
}

async function run() {
  if (!fs.existsSync(path.join(DIST, 'index.html'))) {
    console.error('dist/ not found — run `vite build` first.');
    process.exit(1);
  }

  // Build the dynamic route list from the live API (if reachable).
  let dynamic = [];
  if (API) {
    console.log(`Listing dynamic routes from ${API} …`);
    const [products, posts, doctors] = await Promise.all([
      fetchSlugs('/products', (p) => p.slug),
      fetchSlugs('/posts', (p) => p.slug),
      fetchSlugs('/doctors', (d) => d.slug || d._id || d.id),
    ]);
    dynamic = [
      ...products.map((s) => `/product/${s}`),
      ...posts.map((s) => `/blog/${s}`),
      ...doctors.map((s) => `/doctors/${s}`),
    ];
    console.log(`  ${products.length} products · ${posts.length} posts · ${doctors.length} doctors`);
  } else {
    console.log('No API base (VITE_API_URL / PRERENDER_API) — prerendering static routes only.');
  }

  // Dynamic routes first, '/' (end of STATIC_ROUTES) last.
  const routes = [...dynamic, ...STATIC_ROUTES];

  const server = await preview({ preview: { port: 4188 }, logLevel: 'warn' });
  const base = 'http://localhost:4188';
  const browser = await chromium.launch({ executablePath: process.env.PRERENDER_CHROMIUM || undefined });

  let ok = 0;
  for (const route of routes) {
    // One retry to ride out transient timeouts on slow pages.
    let done = await renderRoute(browser, base, route);
    if (!done) done = await renderRoute(browser, base, route);
    if (done) ok++;
  }
  console.log(`  ✓ ${ok}/${routes.length} routes (${dynamic.length} dynamic + ${STATIC_ROUTES.length} static)`);

  await browser.close();
  await server.httpServer.close();
  console.log(`Prerendered ${ok}/${routes.length} routes.`);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
