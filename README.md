# 🏥 DCare — Medical & Pharmacy eCommerce (MERN)

A full-stack medical & pharmacy online store inspired by the **dcare** theme
(<https://demo.theme-sky.com/dcare/>), built from scratch with the **MERN** stack
(MongoDB, Express, React, Node) and **Tailwind CSS**.

It ships with three apps:

| App | Folder | Stack | Default URL |
| --- | --- | --- | --- |
| **REST API / backend** | `backend/` | Node + Express + Mongoose + JWT | <http://localhost:5000> |
| **Customer storefront** | `frontend/` | React (Vite) + Tailwind | <http://localhost:5173> |
| **Admin panel** | `admin/` | React (Vite) + Tailwind + Recharts | <http://localhost:5174> |

---

## ✨ Features

### Storefront (customer)
- Medical/pharmacy themed home page: hero slider, category showcase, **deal of the day with live countdown**, featured products, best sellers, new arrivals, brands strip, newsletter.
- Shop page with sidebar filters (category, brand, price range), sorting & pagination.
- Product detail page: image gallery, ratings & reviews, quantity selector, related products, prescription-required badge.
- Cart, guest **checkout** (Cash on Delivery / Card / bKash), order success page.
- User register / login / account with order history.
- Fully responsive.

### Admin panel
- **Rich, descriptive dashboard** with:
  - KPI cards (revenue, orders, products, customers) with month-over-month growth.
  - **Weekly insights** — last 7 days revenue & orders chart.
  - **Yearly insights** — 12-month revenue overview with a year selector.
  - Order-status donut, category distribution, top-selling products, recent orders.
- **Product management** — full CRUD with a multi-image uploader that accepts **high-resolution images up to 1 GB** for maximum clarity.
- Category & brand management (CRUD).
- Order management with status updates.
- JWT-protected admin authentication.

### Backend API
- JWT auth (customer + admin roles).
- Products, categories, brands, orders, reviews, dashboard analytics.
- Multer image uploads (configurable limit, **default 1 GB**) served from `/uploads`.
- Aggregation pipelines for weekly/yearly/summary analytics.
- Seed script with demo catalog + 14 months of orders for instant dashboards.

---

## 🚀 Getting started

### Prerequisites
- Node.js 18+ (tested on Node 22)
- A MongoDB database — local `mongod` or a free **MongoDB Atlas** cluster.

### 1. Install dependencies
```bash
# from the repo root
npm run install:all
# (or run `npm install` inside backend/, frontend/ and admin/ separately)
```

### 2. Configure the backend
```bash
cd backend
cp .env.example .env
```
Edit `.env` and set at least:
```
MONGO_URI=mongodb://127.0.0.1:27017/dcare   # or your Atlas URI
JWT_SECRET=some_long_random_string
```
> `MAX_UPLOAD_BYTES` defaults to `1073741824` (1 GB) for high-resolution product imagery.

### 3. Seed the database (demo data + admin user)
```bash
cd backend
npm run seed
```
This creates the catalog, sample customers and ~200 historical orders, plus the admin account:
```
Email:    admin@dcare.com
Password: admin123
```

### 4. Run everything (3 terminals)
```bash
npm run dev:backend     # http://localhost:5000  (API)
npm run dev:frontend    # http://localhost:5173  (storefront)
npm run dev:admin       # http://localhost:5174  (admin panel)
```

Open the storefront at <http://localhost:5173> and the admin panel at
<http://localhost:5174> (log in with the seeded admin credentials).

---

## ⚙️ Environment variables

### `backend/.env`
| Key | Default | Description |
| --- | --- | --- |
| `PORT` | `5000` | API port |
| `MONGO_URI` | `mongodb://127.0.0.1:27017/dcare` | MongoDB connection string |
| `JWT_SECRET` | — | Secret for signing JWTs |
| `JWT_EXPIRES_IN` | `30d` | Token lifetime |
| `CLIENT_URLS` | `localhost:5173,5174` | Allowed CORS origins |
| `MAX_UPLOAD_BYTES` | `1073741824` | Max upload size in bytes (**1 GB**) |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | `admin@dcare.com` / `admin123` | Seeded admin account |

### `frontend/.env` and `admin/.env`
```
VITE_API_URL=http://localhost:5000
```

---

## 📡 API overview

Base URL: `http://localhost:5000/api`

| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| POST | `/auth/register` | — | Register customer |
| POST | `/auth/login` | — | Customer login |
| POST | `/auth/admin/login` | — | Admin login |
| GET | `/products` | — | List/filter products |
| GET | `/products/:idOrSlug` | — | Product detail + related |
| POST/PUT/DELETE | `/products/:id` | admin | Manage products |
| GET | `/categories` / `/brands` | — | Lists |
| POST/PUT/DELETE | `/categories`,`/brands` | admin | Manage |
| POST | `/orders` | optional | Create order (guest ok) |
| GET | `/orders` | admin | All orders |
| PUT | `/orders/:id/status` | admin | Update status |
| GET | `/dashboard/summary` | admin | KPI cards |
| GET | `/dashboard/weekly` | admin | Last 7 days insights |
| GET | `/dashboard/yearly?year=` | admin | 12-month insights |
| GET | `/dashboard/top-products`,`/category-distribution`,`/recent-orders`,`/order-status` | admin | Charts data |
| POST | `/upload` | admin | Upload images (≤1 GB each) |

---

## 🗂️ Project structure
```
Website-medical/
├── backend/      # Express REST API + Mongoose models + seed
├── frontend/     # Customer storefront (React + Vite + Tailwind)
├── admin/        # Admin panel (React + Vite + Tailwind + Recharts)
└── README.md
```

---

## 📝 Notes
- The CORS config is permissive in development; tighten `CLIENT_URLS` for production.
- Uploaded files are stored on disk under `backend/uploads/` and served statically.
- For production, build the React apps (`npm run build:frontend` / `build:admin`) and serve the `dist/` output behind your web server, pointing `VITE_API_URL` at your deployed API.

Built as a freelance-style, production-shaped reference implementation. 🩺
