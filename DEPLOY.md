# DCare — Deployment & Go-Live Guide

Three apps + one database:

| Part | Folder | Suggested host |
|------|--------|----------------|
| Backend API (Express/Prisma) | `backend/` | Render / Railway |
| Storefront (Vite/React) | `frontend/` | Vercel / Netlify |
| Admin panel (Vite/React) | `admin/` | Vercel / Netlify |
| PostgreSQL database | — | Neon / Render Postgres / Railway |

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

## 3. Storefront & Admin (Vercel example)
For **each** of `frontend/` and `admin/`:
1. New Project → set the **root directory** to `frontend` (then repeat for `admin`).
2. Framework preset: **Vite**. Build: `npm run build`. Output: `dist`.
3. Environment variable: `VITE_API_URL` = your backend URL (e.g. `https://dcare-api.onrender.com`).
4. Add an SPA rewrite so routes work: create `vercel.json` in that folder with
   a catch-all rewrite to `/index.html` (Netlify: a `_redirects` file with `/* /index.html 200`).

## 4. Wire them together
- Set the backend `CLIENT_URLS` to your deployed storefront + admin domains (CORS).
- Set `VITE_API_URL` on both frontends to the backend URL, then redeploy them.

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
