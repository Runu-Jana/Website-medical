// Build-time prerendering for SEO.
//
// Serves the freshly-built dist and, using a headless browser, renders each
// static route to real HTML (with the correct <title>/meta from react-helmet)
// so crawlers and social scrapers get server-quality markup even though the app
// is a client-side SPA on static hosting. Data-driven sections still hydrate on
// load; the SEO-critical head + static copy are captured.
//
// Usage:  npm run build:seo
// Requires Playwright's Chromium:  npx playwright install chromium
// Optional: PRERENDER_API=<backend URL> to populate data-driven pages.

import { preview } from 'vite';
import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.resolve(__dirname, '../dist');

// Static, indexable routes. Dynamic routes (products, blog posts, doctor
// profiles) stay client-rendered — they can't be enumerated at build time.
// '/' is rendered LAST: while other routes are prerendered, the SPA fallback
// keeps serving the clean original shell, so each page sets its own head.
const ROUTES = [
  '/shop', '/about', '/contact', '/sell', '/health-club', '/brands',
  '/doctors', '/lab-tests', '/blog',
  '/privacy-policy', '/terms', '/refund-policy', '/shipping-policy', '/disclaimer',
  '/',
];

const outFileFor = (route) =>
  route === '/' ? path.join(DIST, 'index.html') : path.join(DIST, route, 'index.html');

async function run() {
  if (!fs.existsSync(path.join(DIST, 'index.html'))) {
    console.error('dist/ not found — run `vite build` first.');
    process.exit(1);
  }

  const server = await preview({ preview: { port: 4188 }, logLevel: 'warn' });
  const base = `http://localhost:4188`;

  const executablePath = process.env.PRERENDER_CHROMIUM || undefined;
  const browser = await chromium.launch({ executablePath });

  let ok = 0;
  for (const route of ROUTES) {
    const page = await browser.newPage();
    try {
      // 'domcontentloaded' (not networkidle) so background API polling on
      // data pages can't stall the crawl; then wait for React + helmet to paint.
      await page.goto(base + route, { waitUntil: 'domcontentloaded', timeout: 20000 });
      await page.waitForFunction(() => document.title && document.title.length > 0, { timeout: 6000 }).catch(() => {});
      await page.waitForTimeout(1200);
      const html = '<!doctype html>\n' + (await page.evaluate(() => document.documentElement.outerHTML));
      const out = outFileFor(route);
      fs.mkdirSync(path.dirname(out), { recursive: true });
      fs.writeFileSync(out, html);
      console.log(`  ✓ ${route} → ${path.relative(DIST, out)}`);
      ok++;
    } catch (e) {
      console.warn(`  ✗ ${route}: ${e.message}`);
    } finally {
      await page.close();
    }
  }

  await browser.close();
  await server.httpServer.close();
  console.log(`Prerendered ${ok}/${ROUTES.length} routes.`);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
