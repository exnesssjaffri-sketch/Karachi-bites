# Karachi Bites

A lightweight Karachi restaurant ordering project built with vanilla HTML/CSS/JavaScript, Node.js, Express and SQLite.

## Live pages

- Customer-facing Stitch home: https://karachi-bites.vercel.app/
- Staff/admin dashboard: https://karachi-bites.vercel.app/admin
- API-backed ordering app: https://karachi-bites.vercel.app/app.html
- Individual Stitch design exports: https://karachi-bites.vercel.app/stitch/

**Important:** the root homepage (`/`) now loads featured dishes from `GET /api/menu` and connects its live add-to-cart controls to the shared cart used by `/app.html`. Use `/app.html` for the complete API-backed menu, checkout, confirmation and phone-verified tracking flow. Other standalone exports under `/stitch/` remain visual previews unless specifically wired. Automated frontend wiring and cart persistence tests are included; real-browser E2E, real mobile-device testing and the performance target still require separate verification.

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

For production, set `ADMIN_USERNAME` and a strong `ADMIN_PASSWORD` (at least 12 characters) in the hosting provider's encrypted environment-variable settings. Set `STAFF_USERNAME` and `STAFF_PASSWORD` only when a staff account is required. Production does not seed the predictable `admin/admin123` or `staff/staff123` demo credentials; the known demo accounts are only for local development. Never commit `.env`, access tokens, real passwords or production credentials. Vercel/serverless persistence must be verified in the target runtime before relying on it for real customer orders; a local SQLite persistence test does not by itself prove that production storage survives separate function instances or deployments.

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
| POST | `/api/admin/menu` | Admin-only create menu item |
| PUT | `/api/admin/menu/:id` | Admin-only update menu item |
| DELETE | `/api/admin/menu/:id` | Admin-only delete menu item |
| GET | `/api/admin/orders/export` | Admin-only CSV export of all orders |

Allowed transitions: `Received → Preparing → Out for Delivery → Delivered`. The server calculates totals using item prices from the database plus the configured delivery fee.

See [API.md](./API.md) for requests, responses and error cases, and [DECISIONS.md](./DECISIONS.md) for design decisions.

## Run tests

```bash
npm test
```

This invokes the repository's current test runner, which runs the database, API, failure, persistence, admin menu CRUD, and CSV export suites. Review each suite's final exit status and output. Browser-based end-to-end tests, real mobile-device tests, and the homepage performance requirement (<3 seconds on Slow 3G and <1.5 MB) still need explicit verification; they should not be treated as passed based only on the API tests.

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


## Verification and submission evidence

- [PDF requirement-by-requirement audit](REQUIREMENTS_AUDIT.md) — distinguishes automated PASS from manual/production checks still pending.
- [Supabase Auth rollout and legacy-login compatibility](docs/SUPABASE_AUTH_SETUP.md).
- [Three-minute walkthrough recording script](docs/WALKTHROUGH_SCRIPT.md). The script is not the final video; record a real browser session and add its link before submission.
- [Lighthouse mobile workflow](.github/workflows/lighthouse.yml) measures the exact code at a 360×800 viewport and enforces Performance and Accessibility scores of at least 85.
- Passing optimized PR-code Lighthouse evidence: [GitHub Actions run 29](https://github.com/exnesssjaffri-sketch/Karachi-bites/actions/runs/39323273356) — Performance 97, Accessibility 100, Best Practices 100, SEO 100 at 360×800. The report is retained as an artifact for 30 days.
- Latest eight-suite automated backend/frontend test evidence: [GitHub Actions run 107](https://github.com/exnesssjaffri-sketch/Karachi-bites/actions/runs/39319151736).
- Production evidence: [health check](https://karachi-bites.vercel.app/api/health) and [live menu API](https://karachi-bites.vercel.app/api/menu).

### Production deployment note

PR #9's optimized homepage is merged into `main`, but the live Vercel alias is still serving an older deployment. Vercel returned HTTP 402 because the deployment API daily quota was exceeded (over 100; retry after 24 hours). The live API/database remain healthy, but the optimized homepage's Lighthouse score is **not yet verified in production**. Connect the GitHub repo under Vercel Project Settings → Git (production branch `main`) or redeploy after the quota resets. Do not promote a preview deployment because it may lack production database environment variables.

### Remaining manual evidence

A real Android 360px touch/visual pass, keyboard-only and screen-reader review, live Supabase signup/email-confirmation testing, actual SMS OTP testing with a configured provider, a production-safe order-flow rehearsal, and the final screen-recorded MP4 are not replaced by automated tests. Do not use real customer details in a demo or create a production order without an agreed safe test plan.
