# PostgreSQL setup (Prisma)

The backend now runs on **PostgreSQL** via **Prisma** (migrated from MongoDB/Mongoose).
The API responses are unchanged (still expose `_id`, populated `brand`/`category`/
`categories`), so the storefront and admin need no changes.

## 1. Get a PostgreSQL database

Pick one (all have free tiers):

| Provider | URL | Notes |
| --- | --- | --- |
| **Neon** | https://neon.tech | Serverless Postgres, generous free tier (recommended) |
| **Supabase** | https://supabase.com | Postgres + dashboard |
| **Railway / Render** | railway.app / render.com | One-click Postgres |
| **Local** | install Postgres | `createdb dcare` |

Copy the connection string. It looks like:
```
postgresql://USER:PASSWORD@HOST/dbname?sslmode=require
```

## 2. Configure the backend

```bash
cd backend
cp .env.example .env
```
Edit `.env` and set `DATABASE_URL` to your connection string. Also set a real `JWT_SECRET`.

## 3. Install & create the tables

```bash
npm install              # installs Prisma and runs `prisma generate`
npm run db:push          # creates all tables from prisma/schema.prisma
# (or: npm run db:migrate   to create a versioned migration)
```

## 4. Seed demo data

```bash
npm run seed             # admin user, categories, brands, banners, posts, products, orders
```
Admin login printed at the end (default `admin@dcare.com` / `admin123`).

## 5. Run

```bash
npm run dev              # http://localhost:5000
```

## Handy commands

- `npm run db:studio` — open Prisma Studio (visual DB browser)
- `npm run db:push` — sync schema changes to the DB (no migration files)
- `npm run db:migrate` — create a versioned migration
- `npm run seed:destroy` — wipe all data

## What changed

- `prisma/schema.prisma` — the data model (User, Category, Brand, Product, Order, Banner, Post)
- `prisma/client.js` — shared Prisma client
- `prisma/serialize.js` — maps records to the old Mongo response shape (`_id`, relations)
- All controllers + `seed/seed.js` rewritten for Prisma
- `config/db.js` now connects with Prisma; the old `models/*.js` were removed
- Product↔Category is a real many-to-many; embedded data (reviews, order items,
  variants, address) is stored as JSON columns; image/tag lists as Postgres arrays
