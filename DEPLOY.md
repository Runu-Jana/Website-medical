# DCare — Deployment & Go-Live Guide

Three apps + one database:

| Part | Folder | Suggested host |
|------|--------|----------------|
| Backend API (Express/Prisma) | `backend/` | Render (free) |
| Storefront (Vite/React) | `frontend/` | Hostinger (static upload) |
| Admin panel (Vite/React) | `admin/` | Hostinger subdomain (static upload) |
| PostgreSQL database | — | Neon (free) |

---

## 1 + 2. Backend + Database on Railway (one project)
1. **railway.app** → sign in with GitHub → **New Project → Deploy from GitHub repo** → pick this repo.
2. Open the service → **Settings**:
   - **Root Directory:** `backend`
   - **Start Command:** `npx prisma db push --accept-data-loss && node server.js`
     (build/`prisma generate` runs automatically via postinstall)
3. In the project, **New → Database → Add PostgreSQL**.
4. Back in the **backend service → Variables**, add:
   - `DATABASE_URL` = `${{Postgres.DATABASE_URL}}` (reference the Postgres you just added)
   - `JWT_SECRET` = a long random string
   - `CLIENT_URLS` = your Hostinger storefront + admin origins, comma-separated
   - `OTP_DEV_MODE` = `true` (phone login works with code 123456 until Firebase is set)
   - Later: `IMAGEKIT_*`, `SMTP_*` + `NOTIFY_EMAIL`, `RAZORPAY_*`, `FIREBASE_*`
5. Deploy. The app **auto-seeds** the admin + demo catalog on the first (empty) boot —
   no manual seed step. Grab the public URL from **Settings → Networking → Generate Domain**.
6. Health check: open `https://<your-app>.up.railway.app/api/health`.

## 3. Storefront & Admin — on Hostinger (shared) as static files
Shared Hostinger can't run Node, but it serves these React apps perfectly as
static files. You build them **locally** (pointing at the Render API) and upload
the `dist` output. A `.htaccess` for SPA routing is already included in each
`public/` folder, so it lands in `dist` automatically.

**Build the storefront (main domain):**
1. Create `frontend/.env` with your backend URL:
   `VITE_API_URL=https://<your-backend>.onrender.com`
2. `cd frontend && npm install && npm run build`
3. In hPanel → File Manager, upload the **contents of `frontend/dist/`** (including
   `.htaccess`) into `public_html`.

**Build the admin (recommended: a subdomain like `admin.yourdomain.com`):**
1. In hPanel → Subdomains, create `admin` → it makes a folder like `public_html/admin`.
2. Create `admin/.env` with `VITE_API_URL=https://<your-backend>.onrender.com`
3. `cd admin && npm install && npm run build`
4. Upload the **contents of `admin/dist/`** into the subdomain's folder.
   (If instead you use a sub-path `yourdomain.com/admin`, set `base:'/admin/'` in
   `admin/vite.config.js` and adjust `admin/public/.htaccess` paths first.)

Repeat the build + upload whenever you change the front-end (there's no
auto-deploy on shared hosting).

## 4. Wire them together
- Backend `CLIENT_URLS` must list your real front-end origins for CORS, e.g.
  `https://yourdomain.com,https://admin.yourdomain.com` — set this on Render.
- The front-ends were built with `VITE_API_URL` pointing at the Render backend.
  If the backend URL changes, rebuild and re-upload.

## 5. Payments — go live
1. Complete Razorpay **KYC** (business details, bank, the legal/policy pages —
   already on the site at `/privacy-policy`, `/terms`, `/refund-policy`,
   `/shipping-policy`).
2. Switch to **Live** keys in the backend env.
3. Add a **webhook**: Razorpay Dashboard → Webhooks → URL
   `https://<your-backend>/api/payments/webhook`, secret = `RAZORPAY_WEBHOOK_SECRET`,
   events: `payment.captured`, `order.paid`, `refund.processed`.

## 6. Images
Set `IMAGEKIT_*` on the backend so uploaded product images persist (local
`/uploads` is wiped on every redeploy).

---

## Go-live checklist
- [ ] Real business details filled in `frontend/src/config/business.js` and `config/site.js`
- [ ] Policy pages reviewed
- [ ] Backend + Postgres on Railway; app auto-seeds on first boot
- [ ] `IMAGEKIT_*` set (images persist)
- [ ] `SMTP_*` set (order + signup emails work)
- [ ] Razorpay **live** keys + webhook configured; KYC approved
- [ ] `CLIENT_URLS` (backend) and `VITE_API_URL` (frontends) point at real domains
- [ ] Test: register → add to cart → checkout (COD + online) → invoice → admin sees order
- [ ] Change the default admin password (`admin@dcare.com`)

## Production hardening checklist

- **Database migrations.** Local/dev uses `prisma db push` for speed. For
  production, switch to versioned migrations so schema changes are reviewable
  and reversible: run `npx prisma migrate dev --name <change>` when editing the
  schema, commit the generated `prisma/migrations/`, and deploy with
  `npx prisma migrate deploy` (script: `npm run db:deploy`). This replaces the
  `db push` used on first-time setup.
- **Backups.** Enable automated daily backups + point-in-time recovery on your
  Postgres provider (Railway/Neon/RDS all offer this) and test a restore.
- **Error monitoring.** Set `SENTRY_DSN` and `npm i @sentry/node` (see
  `.env.example`). Unhandled rejections/exceptions are already logged.
- **CI.** `.github/workflows/ci.yml` runs backend tests + builds on every push.
- **Secrets.** Keep `RAZORPAY_KEY_SECRET`, `SMTP_PASS`, `ANTHROPIC_API_KEY`,
  `JWT_SECRET` only in the backend environment — never in the front-ends.
- **Prescription compliance.** Rx-only products require an uploaded prescription
  at checkout and a pharmacist approval before dispatch. Assign the `pharmacist`
  role to whoever verifies prescriptions; approvals are recorded in the audit log
  (`GET /api/audit`).

## SEO prerendering (optional)

The storefront sets per-page `<title>`, meta and Open Graph tags (react-helmet)
and JSON-LD product data, which modern crawlers execute. For crawlers/scrapers
that don't run JS, you can also ship prerendered static HTML:

```
cd frontend
npx playwright install chromium   # one-time
npm run build:seo                 # vite build + prerender static routes
```

This writes real HTML for the static routes (home, shop, about, contact,
doctors, lab-tests, blog, brands, health-club, sell, legal pages) into `dist/`,
then upload `dist/` as usual. Dynamic pages (individual products, blog posts,
doctor profiles) remain client-rendered. The plain `npm run build` is unchanged
if you don't want prerendering.
