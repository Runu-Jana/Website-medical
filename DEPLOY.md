# DCare — Deployment & Go-Live Guide

Three apps + one database:

| Part | Folder | Suggested host |
|------|--------|----------------|
| Backend API (Express/Prisma) | `backend/` | Render (free) |
| Storefront (Vite/React) | `frontend/` | Hostinger (static upload) |
| Admin panel (Vite/React) | `admin/` | Hostinger subdomain (static upload) |
| PostgreSQL database | — | Neon (free) |

---

## 1. Database
Create a managed Postgres (Neon is easiest). Copy its connection string — you'll
set it as `DATABASE_URL` on the backend host.

## 2. Backend (Render example)
1. New **Web Service** → connect this repo → root directory `backend`.
2. Build command: `npm install && npx prisma generate`
3. Start command: `npx prisma migrate deploy || npx prisma db push; node server.js`
4. Add environment variables (from `backend/.env.example`):
   - `DATABASE_URL` (your managed Postgres URL)
   - `JWT_SECRET` (long random string)
   - `CLIENT_URLS` = your storefront + admin URLs, comma-separated
   - `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`
   - `SMTP_*`, `NOTIFY_EMAIL` (email)
   - `IMAGEKIT_*` (image storage — **required in production**)
   - `FIREBASE_*` (phone OTP, if using)
5. After first deploy, seed once (Render Shell): `npm run seed`.

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
- [ ] `DATABASE_URL` on managed Postgres; `npm run seed` run once
- [ ] `IMAGEKIT_*` set (images persist)
- [ ] `SMTP_*` set (order + signup emails work)
- [ ] Razorpay **live** keys + webhook configured; KYC approved
- [ ] `CLIENT_URLS` (backend) and `VITE_API_URL` (frontends) point at real domains
- [ ] Test: register → add to cart → checkout (COD + online) → invoice → admin sees order
- [ ] Change the default admin password (`admin@dcare.com`)
