# Karachi Bites

A lightweight Karachi restaurant ordering project built with vanilla HTML/CSS/JavaScript, Node.js, Express and SQLite.

## Live pages

- Customer-facing Stitch home: https://karachi-bites.vercel.app/
- Staff/admin dashboard: https://karachi-bites.vercel.app/admin
- API-backed ordering app: https://karachi-bites.vercel.app/app.html
- Individual Stitch design exports: https://karachi-bites.vercel.app/stitch/

**Important:** the Stitch exports under `/stitch/` are visual design previews. Their sample cart, checkout, confirmation and tracking screens are not yet wired to the real order API. Use `/app.html` for the current API-backed order flow. Browser end-to-end verification of the Stitch-to-API flow is still required.

## Requirements

- Node.js 24.x (the package currently declares `>=24 <25`)
- npm
- A writable local directory for the SQLite database

## Run locally

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env`, then set a unique random `JWT_SECRET`. One way to generate one with Node.js is:

   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

3. Start the app:

   ```bash
   npm start
   ```

4. Open:
   - `http://localhost:3000/` — Stitch home design
   - `http://localhost:3000/app.html` — API-backed customer ordering app
   - `http://localhost:3000/admin` — staff/admin sign-in and order management

The server creates the SQLite schema and seeds the sample menu, supported branches and local demo users when needed. The demo credentials seeded by the current source are `admin / admin123` and `staff / staff123`. They are for local development only; do not use predictable demo credentials on a public deployment.

## Environment variables

| Variable | Purpose | Example |
| --- | --- | --- |
| `PORT` | Local HTTP port | `3000` |
| `NODE_ENV` | Runtime mode | `development` |
| `JWT_SECRET` | Secret used to sign JWT tokens; required | Generated random value |
| `DATABASE_PATH` | SQLite file path | `./karachi_bites.db` |
| `DELIVERY_FEE` | Flat delivery charge in rupees | `150` |

Never commit `.env`, access tokens, real passwords or production credentials. Vercel/serverless persistence must be verified in the target runtime before relying on it for real customer orders; a local SQLite persistence test does not by itself prove that production storage survives separate function instances or deployments.

## Branches

The order API supports these branch names:

- Clifton
- Gulshan-e-Iqbal
- North Nazimabad

The checkout form lets a customer choose a branch. The server validates the branch independently of the browser.

## API overview

Base URL: `/api`

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/api/menu` | List the 12 seeded sample items |
| POST | `/api/orders` | Validate and create an order |
| GET | `/api/orders/:id` | Retrieve an order by public order ID |
| POST | `/api/auth/login` | Issue a JWT for a valid staff/admin account |
| GET | `/api/admin/orders` | Admin-only order list; optional `branch` and `date` filters |
| PATCH | `/api/admin/orders/:id/status` | Admin-only status update with transition validation |

Allowed transitions: `Received → Preparing → Out for Delivery → Delivered`. The server calculates totals using item prices from the database plus the configured delivery fee.

See [API.md](./API.md) for requests, responses and error cases, and [DECISIONS.md](./DECISIONS.md) for design decisions.

## Run tests

```bash
npm test
```

This invokes the repository's current test runner, which runs the database, API, failure and persistence suites. Review each suite's final exit status and output. Browser-based end-to-end tests, real mobile-device tests, and the homepage performance requirement (<3 seconds on Slow 3G and <1.5 MB) still need explicit verification; they should not be treated as passed based only on the API tests.

## Project structure

- `src/server.js` — Express setup, static serving and route mapping
- `src/routes.js` — API endpoints and request validation
- `src/db.js` — SQLite schema and seed data
- `src/orderService.js` — order creation, lookup, totals and status transitions
- `src/auth.js` — JWT authentication and admin authorization
- `src/validate.js` — input, branch, quantity and workflow validation
- `public/index.html` — Stitch home page
- `public/app.html` — preserved API-backed customer application
- `public/admin.html`, `public/js/admin.js` — staff/admin dashboard
- `public/stitch/` — standalone Stitch design previews
- `test/` — database, API, failure and persistence test scripts

## Current verification limitations

The deployment and URLs are checked independently from functional behavior. HTTP 200 confirms that a page or API route responds, not that all buttons work or an order successfully persists. Before accepting real orders, verify the production database's write access and persistence, browser test the full customer order flow, test all three branches, and run the performance check against the actual production site.
