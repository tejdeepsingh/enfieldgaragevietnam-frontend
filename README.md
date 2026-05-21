# Enfield Garage Vietnam - Cloudflare Worker + D1 + R2

Cloudflare-first version of the Royal Enfield 500cc parts catalog.

## What this includes

- Static frontend served from Cloudflare Workers assets
- Admin login using Worker API and HttpOnly cookie
- D1 database for products, inventory and orders/inquiries
- R2 bucket for product images
- Bilingual EN/VI catalog
- Currency display VND/USD/INR
- Owner admin: add/edit/delete products, upload images, update stock/status, review inquiries
- ZaloPay placeholder: add later with a secure server-side route

## Setup

```bash
npm install
npx wrangler login
npm run d1:create
npm run r2:create
```

Copy the D1 database_id printed by Cloudflare into `wrangler.jsonc`.

Set secrets:

```bash
npx wrangler secret put ADMIN_PASSWORD
npx wrangler secret put SESSION_SECRET
```

Apply schema and seed:

```bash
npm run d1:migrate:remote
npm run d1:seed:remote
```

Deploy:

```bash
npm run deploy
```

Local development:

```bash
npm run d1:migrate:local
npm run d1:seed:local
npm run dev
```

## Important

Do not put ZaloPay secret keys in frontend JavaScript. ZaloPay order creation and callback validation must be added in `src/worker.js` as server-side API routes.
