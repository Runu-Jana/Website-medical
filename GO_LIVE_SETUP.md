# Go-Live Setup — all keys in one pass

Everything in the app is **built and gated on credentials** — each feature turns
on the moment you add its key, and works without it (degraded) until then. This
is the single checklist to fill them all in.

There are **three `.env` files** (one per app). Copy each block below into the
matching `.env` file and fill the blanks.

| Service | Enables | Where to get it | Priority |
|---|---|---|---|
| Database (Postgres) | The whole app | Railway (auto) | 🔴 required |
| JWT secret | Login security | Make one up (random) | 🔴 required |
| ImageKit | Product images that survive redeploys | imagekit.io | 🔴 required for prod |
| Razorpay | Online payments | dashboard.razorpay.com | 🟠 for paid orders |
| SMTP (Brevo) | All emails (order confirmations, reset codes) | brevo.com | 🟠 recommended |
| Firebase + Blaze | SMS OTP login | firebase.google.com | 🟠 for phone login |
| Anthropic | AI assistant / product AI | console.anthropic.com | 🟡 optional |
| Sentry | Error monitoring | sentry.io | 🟡 optional |

---

## 1. Backend — `backend/.env`

```dotenv
# ── Core (required) ───────────────────────────────────────────────
PORT=5000
NODE_ENV=production
# Railway sets DATABASE_URL automatically when you add a Postgres plugin.
# If pasting manually: postgresql://USER:PASSWORD@HOST:PORT/db?sslmode=require
DATABASE_URL=
# Make this a long random string (e.g. run: openssl rand -hex 32)
JWT_SECRET=
JWT_EXPIRES_IN=30d
# Your live storefront + admin URLs (comma separated), for CORS.
CLIENT_URLS=https://yourstore.com,https://admin.yourstore.com

# ── Admin login (change these!) ──────────────────────────────────
ADMIN_NAME=Admin
ADMIN_EMAIL=you@yourstore.com
ADMIN_PASSWORD=use-a-strong-password

# ── Image storage — ImageKit (required in production) ────────────
# imagekit.io → Developer Options → API Keys
IMAGEKIT_PUBLIC_KEY=
IMAGEKIT_PRIVATE_KEY=
IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/your_id

# ── Payments — Razorpay ──────────────────────────────────────────
# dashboard.razorpay.com → Settings → API Keys (rzp_test_ works with no KYC)
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
# Settings → Webhooks → add https://<your-backend>/api/payments/webhook
RAZORPAY_WEBHOOK_SECRET=

# ── Email — SMTP (Brevo recommended, free 300/day) ───────────────
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
# MUST be a verified sender in Brevo
SMTP_FROM=DBL Life Care <no-reply@yourstore.com>
NOTIFY_EMAIL=you@yourstore.com

# ── SMS OTP — Firebase Admin (see Firebase steps below) ──────────
# Turn dev mode OFF in production so real OTPs are enforced.
OTP_DEV_MODE=false
OTP_DEV_CODE=123456
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=

# ── AI — Anthropic (optional) ────────────────────────────────────
# console.anthropic.com → API Keys (add prepaid credits)
ANTHROPIC_API_KEY=
SUPPORT_EMAIL=you@yourstore.com

# ── Monitoring (optional) ────────────────────────────────────────
# Also run: npm i @sentry/node
SENTRY_DSN=
```

## 2. Storefront — `frontend/.env`

```dotenv
# Your LIVE backend URL (bake this in before building for Hostinger)
VITE_API_URL=https://your-backend.up.railway.app

# Firebase web config (Project settings → General → Your apps → SDK config)
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project
VITE_FIREBASE_APP_ID=
```

## 3. Admin — `admin/.env`

```dotenv
# Same backend URL as the storefront
VITE_API_URL=https://your-backend.up.railway.app
```

---

## Where to get each key (step by step)

### 🔴 ImageKit (product images) — do this, or images vanish on redeploy
1. Sign up at **imagekit.io** (free tier).
2. **Developer Options → API Keys** → copy **Public key** and **Private key**.
3. **URL-endpoint** is shown there too (looks like `https://ik.imagekit.io/xxxx`).
4. Put all three in `backend/.env`.

### 🟠 Razorpay (online payments)
1. **dashboard.razorpay.com** → **Settings → API Keys → Generate**.
2. Use **`rzp_test_...`** keys first (no KYC needed) to test end-to-end.
3. For live money, complete KYC and switch to **`rzp_live_...`** keys.
4. **Settings → Webhooks → Add** → URL `https://<backend>/api/payments/webhook`,
   event `payment.captured`; copy the **secret** into `RAZORPAY_WEBHOOK_SECRET`.
5. Test card: `4111 1111 1111 1111`, any future expiry / CVV.

### 🟠 SMTP / Email (why your codes weren't arriving)
Emails don't send until SMTP is set. Easiest: **Brevo** (brevo.com, free 300/day):
1. Sign up → **Senders, Domains & IPs → Senders → Add & verify** a from-address.
2. **SMTP & API → SMTP tab** → copy the **login** and **generate an SMTP key**.
3. Fill `SMTP_USER` (login), `SMTP_PASS` (SMTP key), `SMTP_FROM` (verified sender).
   (Gmail also works: `smtp.gmail.com`, port 587, an **App Password** with 2FA on.)

### 🟠 Firebase + Blaze (why SMS wasn't reaching customers)
SMS OTP needs Firebase **and** a billing upgrade:
1. **firebase.google.com** → create a project.
2. **Build → Authentication → Sign-in method → enable Phone**.
3. **Authentication → Settings → Authorized domains** → add your live domain +
   `localhost`.
4. **Upgrade to the Blaze (pay-as-you-go) plan** — the free Spark plan only
   sends SMS to whitelisted *test* numbers; real customers need Blaze.
5. **Project settings → General → Your apps (Web)** → copy the SDK config into
   `frontend/.env` (`VITE_FIREBASE_*`).
6. **Project settings → Service accounts → Generate new private key** → use its
   `project_id`, `client_email`, `private_key` for the backend `FIREBASE_*`
   (keep the `\n` line breaks in the private key, wrapped in quotes).
7. Set **`OTP_DEV_MODE=false`** in the backend so real OTPs are enforced.

### 🟡 Anthropic (AI assistant + product AI)
1. **console.anthropic.com → API Keys → Create Key**.
2. Add prepaid credits (Billing). Paste into `ANTHROPIC_API_KEY`.

---

## Go-live order
1. **Railway (backend):** add the Postgres plugin, set all `backend/.env` vars in
   the service **Variables** tab, deploy. It auto-runs the DB migration on start.
2. **Storefront:** set `frontend/.env` → `VITE_API_URL` to the Railway URL,
   `npm run build` (or `npm run build:seo` for prerendered SEO), upload `dist/`.
3. **Admin:** set `admin/.env` → same `VITE_API_URL`, `npm run build`, upload.
4. **First login:** sign in with your `ADMIN_EMAIL`/`ADMIN_PASSWORD`, then change
   the password from the admin panel.
5. **Smoke test:** register → add to cart → checkout (COD + Razorpay test) →
   order shows in admin → confirmation email arrives → phone OTP login works.
```
