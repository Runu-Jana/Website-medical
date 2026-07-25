# 🚀 DBL Life Care — Go-Live Checklist

One document to take the project from code-complete to live on **dblpharmacy.com**.
Work top to bottom. The **code is done** — everything below is configuration, build, and upload.

- **Storefront** (customers): `dblpharmacy.com` → Hostinger `public_html/`
- **Admin panel**: `admin.dblpharmacy.com` → Hostinger admin subdomain folder
- **Backend API**: Railway (auto-deploys from `main`)

---

## 1. Backend environment variables (Railway → your service → Variables)

> After editing, Railway redeploys automatically. Secrets: paste your real values.

### Required
- [ ] `DATABASE_URL` — provided by the Railway Postgres plugin (already set)
- [ ] `JWT_SECRET` — long random string (already set). Backend refuses to start without it in prod.
- [ ] `NODE_ENV` = `production`
- [ ] `OTP_DEV_MODE` = `false`  ← **turn OFF the test-OTP bypass for launch**
- [ ] `CLIENT_URLS` = `https://dblpharmacy.com,https://www.dblpharmacy.com,https://admin.dblpharmacy.com`

### Payments (Razorpay)
- [ ] `RAZORPAY_KEY_ID`
- [ ] `RAZORPAY_KEY_SECRET`
- [ ] `RAZORPAY_WEBHOOK_SECRET`

### Image storage (ImageKit) — without this, uploaded images vanish on redeploy
- [ ] `IMAGEKIT_URL_ENDPOINT` = `https://ik.imagekit.io/your_id`
- [ ] `IMAGEKIT_PUBLIC_KEY`
- [ ] `IMAGEKIT_PRIVATE_KEY`

### Phone OTP verification (Firebase Admin — from the service-account JSON)
- [ ] `FIREBASE_PROJECT_ID`
- [ ] `FIREBASE_CLIENT_EMAIL`
- [ ] `FIREBASE_PRIVATE_KEY` — paste exactly, keeping the `\n`s

### Email (Hostinger SMTP) — powers welcome, order & enquiry emails
- [ ] `SMTP_HOST` = `smtp.hostinger.com`
- [ ] `SMTP_PORT` = `465`
- [ ] `SMTP_USER` = `dr.bhoumik@dblpharmacy.com`  ← mailbox must exist in Hostinger first
- [ ] `SMTP_PASS` = the **mailbox** password (not your Hostinger login)
- [ ] `SMTP_FROM` = `DBL Life Care <dr.bhoumik@dblpharmacy.com>`
- [ ] `NOTIFY_EMAIL` = `dr.bhoumik@dblpharmacy.com`  (where contact/enquiry alerts go)

### Optional
- [ ] `ANTHROPIC_API_KEY` — enables AI product descriptions, bulk generate & AI support chat. Without it, the AI Assistant tile shows a disabled chat.
- [ ] Leave `AUTO_SEED` **unset** in production (avoid re-seeding demo data).

---

## 2. Firebase console (one-time)
- [ ] Authentication → Sign-in method → **Phone** enabled
- [ ] Authentication → Settings → **Authorized domains** → add `dblpharmacy.com` and `admin.dblpharmacy.com`
- [ ] Billing: **Blaze plan** enabled (Phone Auth needs it for real SMS to customers)
- [ ] (Only if shipping the Android app) Add Android app `com.dbllifecare.app` with SHA-1/SHA-256, download `google-services.json`

---

## 3. Build & upload the STOREFRONT
```bash
git checkout main && git pull origin main
cd frontend
```
- [ ] `frontend/.env` → `VITE_API_URL=https://YOUR-BACKEND.up.railway.app` (no trailing slash)
- [ ] `frontend/.env` → Firebase web keys: `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_APP_ID`
- [ ] `frontend/public/logo.png` present
- [ ] `frontend/public/onboarding-pharmacist.png` present (and **delete** the old `—Pngtree—…png`)
```bash
npm install      # picks up any new deps
npm run build
```
- [ ] Upload **everything inside `frontend/dist/`** into `public_html/` (include the `assets/` folder, `.htaccess`, and the images)
- [ ] `public_html/index.html` exists (NOT `public_html/dist/index.html`)

---

## 4. Build & upload the ADMIN panel
```bash
cd ../admin
```
- [ ] `admin/.env` → `VITE_API_URL=https://YOUR-BACKEND.up.railway.app`
- [ ] `admin/.env` → same Firebase web keys as the storefront
```bash
npm install
npm run build
```
- [ ] Create subdomain `admin.dblpharmacy.com` in Hostinger (Domains → Subdomains)
- [ ] Upload **everything inside `admin/dist/`** into the admin subdomain folder
- [ ] Add a `.htaccess` (SPA fallback) in the admin folder if not already present

**SPA `.htaccess`** (needed in BOTH folders so deep links don't 404):
```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
```

---

## 5. Domain & SSL (Hostinger)
- [ ] Domain attached to hosting (Websites → Add Website → the domain) — creates DNS + `public_html`
- [ ] Nameservers on Hostinger's (`*.dns-parking.com`)
- [ ] SSL certificate installed for **dblpharmacy.com** AND **admin.dblpharmacy.com**
- [ ] "Force HTTPS" enabled
- [ ] Email mailbox `dr.bhoumik@dblpharmacy.com` created (Hostinger → Emails)

---

## 6. Post-launch verification
- [ ] `https://dblpharmacy.com` loads and **products appear** (confirms API URL + CORS)
- [ ] Deep link like `https://dblpharmacy.com/shop` refreshes without a 404 (confirms `.htaccess`)
- [ ] Phone **OTP login** works — you receive a real SMS (confirms Firebase front + back + authorized domain)
- [ ] Place a test order end-to-end (confirms Razorpay)
- [ ] Newsletter signup → you get the **welcome email** (confirms SMTP)
- [ ] Submit a **Vaccination** request → appears in admin **Messages** (filter by "Vaccination") + email alert
- [ ] Upload a product image in admin → its URL is `https://ik.imagekit.io/...` (confirms ImageKit)
- [ ] `https://admin.dblpharmacy.com` → log in, verify Orders/Products/Messages load
- [ ] Onboarding shows on a phone (fresh install / incognito), not on desktop

---

## Notes
- **Backend changes need no upload** — Railway auto-deploys from `main` and runs `prisma db push` on start (creates any new tables, e.g. Subscribers).
- **Frontend/admin changes DO need a rebuild + upload** each time.
- The **Android app** bundles its own frontend and talks to Railway directly — rebuild it (`npx cap sync android`) only when you want app users to get new changes.
