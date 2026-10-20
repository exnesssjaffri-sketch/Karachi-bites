# Baseline Audit Findings — Karachi Bites

## Executive Summary

The project has **two competing backend implementations** serving the same API contract:
1. **Local Express API** (this repository's `src/server.js` with SQLite) — used locally and in CI
2. **Supabase Edge Function** (`https://rgejphvmnlwcoojkpcje.supabase.co/functions/v1/karachi-bites-api`) — deployed to production on Vercel

These two backends share the same fixed API contract but have **different database schemas, different authentication logic, and different data**. The frontend's `public/js/api.js` currently points to `/api` (relative), meaning it uses the Express API when served from the same origin (Vercel serves the Express app as a serverless function), but the **origin/main branch's `api.js` points to the Supabase URL directly**.

## Key Findings

### 1. Dual Backend Architecture (Critical)
- **origin/main**: `public/js/api.js` uses `https://rgejphvmnlwcoojkpcje.supabase.co/functions/v1/karachi-bites-api/api` as base URL
- **Working tree**: `public/js/api.js` uses `/api` (relative, hits Express on same origin)
- Production (karachi-bites.vercel.app) serves the Express API at `/api` (verified: GET /api/menu returns 200 with 12 items)
- The Supabase Edge Function is also live and returns 200 for menu and creates orders
- **Two different databases**: Local SQLite (`karachi_bites.db`) vs Supabase PostgreSQL
- **Two different user tables**: Local seeds `admin/admin123` and `staff/staff123`; Supabase requires secure bootstrap via `ADMIN_SETUP_SECRET`

### 2. API Contract Deviations

| Endpoint | PDF Contract | Express (local) | Supabase (prod) | Status |
|----------|--------------|-----------------|------------------|--------|
| GET /api/menu | `id, name, category, price, tags, available` | ✅ + `description`, `image` | ✅ + `description`, `image` | Extra fields OK |
| POST /api/orders | `{orderId, total, status:"Received"}` | ✅ | Returns `{total, status, orderId}` (different order) | Order differs |
| GET /api/orders/:id | `{orderId, status, items, total}` | ✅ + customer, branch, createdAt | Unknown | Extra fields |
| POST /api/auth/login | `{token}` | ✅ | Returns 401 for demo creds | Supabase has no demo users |
| GET /api/admin/orders?branch=&date= | List orders | ✅ | Unknown | Need test |
| PATCH /api/admin/orders/:id/status | Updated order | `{orderId, status}` | Unknown | Minimal response |

### 3. Missing PDF Requirements (Backend)

**Must-have (F1-F12):**
- **F2**: Backend filter support for `GET /api/menu?search=&veg=&spicy=&maxPrice=&category=` — partially implemented in frontend only
- **F3**: Server-calculated totals — ✅ implemented in Express, need verify Supabase
- **F5**: Order notes field — **missing** in order creation (PDF requires notes)
- **F7**: Phone verification for tracking — **missing** (frontend only sends orderId)
- **F8**: Status transitions — ✅ enforced in Express
- **F12**: Production persistence — **unverified** (Vercel SQLite not durable; Supabase is)

**Should-have (S1-S5):**
- **S1**: Admin menu CRUD — **missing** (no `/api/admin/menu` endpoints)
- **S2**: CSV export — **missing**
- **S3**: Rate limiting — ✅ Express has 100/15min; login needs stricter limit
- **S4**: Error states — ✅ consistent JSON errors
- **S5**: Accessibility — frontend concern

**Could-have (C1-C4):**
- **C1**: Urdu/English API — **missing** (need locale-ready contract)
- **C2**: Performance — need backend timing measurements
- **C3**: Kitchen ticket endpoint — **missing**
- **C4**: Order again endpoint — **missing**

### 4. Database Schema Issues

**Express (SQLite):**
- `menu_items.available` is INTEGER CHECK (0,1) — OK
- `orders.created_at` is TEXT DEFAULT (datetime('now')) — not TIMESTAMP
- Missing `updated_at` on orders, menu_items
- Missing `customer_email` on orders (frontend sends it)
- Missing `notes` column on orders (PDF F5 requirement)
- `branches` table seeded but not referenced by FK in orders (orders.branch is TEXT)
- No unique constraint enforcement on `public_order_id` generation (race condition possible)

**Supabase (PostgreSQL):**
- Has `customer_email`, `description`, `image` on menu_items
- Has `admin_sessions` table for token storage
- Has RLS policies — more secure
- Has `updated_at` triggers
- Uses proper TIMESTAMPTZ

### 5. Security Issues

- **Express**: JWT secret defaults to dev value if not set (exits with error — good)
- **Express**: Demo credentials `admin/admin123` and `staff/staff123` seeded in non-production — OK for dev, but `.env.example` shows them
- **Supabase**: Requires `ADMIN_SETUP_SECRET` for first admin — secure
- **Rate limiting**: Single limit for all endpoints; login should have stricter limit
- **Order ID generation**: Uses `Math.random()` without collision check/retry
- **Frontend**: Sends `email` in checkout but backend ignores it (no column)

### 6. Testing Gaps

Current tests cover:
- ✅ Database seeding (12 items, 3 branches)
- ✅ API success paths
- ✅ Validation failures (name, phone, branch)
- ✅ Auth failures (missing token, invalid token, staff 403)
- ✅ Status transition validation
- ✅ Persistence across process restarts (SQLite)

Missing tests:
- ❌ Menu filtering (search, veg, spicy, maxPrice, category)
- ❌ Order notes persistence
- ❌ Phone verification for tracking
- ❌ Admin menu CRUD (S1)
- ❌ CSV export (S2)
- ❌ Stricter login rate limiting
- ❌ Order ID collision handling
- ❌ Concurrent order creation
- ❌ Kitchen ticket endpoint (C3)
- ❌ Order again endpoint (C4)
- ❌ Supabase production parity tests

### 7. Deployment & Persistence

- **Vercel**: Deploys Express app as serverless function. SQLite file written to `/tmp` or ephemeral filesystem — **not durable** across invocations.
- **Supabase**: PostgreSQL is durable and production-ready.
- **Current state**: Production appears to use Express on Vercel (since `/api/menu` returns Express-format response with `description` and `image` fields), but Supabase function is also live.
- **Frontend on Vercel**: Uses relative `/api` which hits the Vercel-deployed Express function.

### 8. Git State

- Local `main` is **38 commits behind** `origin/main`
- Working tree has uncommitted changes to 7 files (`.env.example`, `.gitignore`, `package.json`, `src/auth.js`, `src/db.js`, `src/orderService.js`, `src/routes.js`)
- Origin has Supabase migrations, Edge Function code, and updated frontend
- Need to reconcile: either adopt Supabase as production backend, or fix Express for serverless persistence

## Recommended Path Forward

Given the constraints (backend only, don't change frontend, preserve API contract):

1. **Choose Express as the single backend** for this repository (simpler, already on Vercel)
2. **Migrate Express to use PostgreSQL** (Supabase) for production persistence — reuse Supabase connection
3. **Align Express schema with Supabase schema** (add missing columns: `notes`, `customer_email`, `updated_at`, proper types)
4. **Implement all missing PDF endpoints** in Express routes
5. **Add missing tests** for all requirements
6. **Document the dual-backend situation** and decision in DECISIONS.md
7. **Do not modify** `public/js/api.js` (frontend) — it already uses `/api` which works with Express on Vercel

## Files Requiring Changes

### Core backend files:
- `src/db.js` — Add PostgreSQL support, missing columns, proper migrations
- `src/routes.js` — Add menu filters, order notes, phone tracking, admin menu CRUD, CSV export, kitchen ticket, order again
- `src/orderService.js` — Add notes, collision-safe order ID, phone tracking
- `src/auth.js` — Add stricter login rate limiting
- `src/validate.js` — Add notes, email validation, filter validation
- `src/server.js` — Add stricter rate limit for login, new routes

### Test files:
- Extend `test/test_api.js` with filter, notes, tracking, admin menu, CSV, kitchen ticket, order again tests
- Add `test/test_admin_menu.js`, `test/test_csv_export.js`, etc.

### Documentation:
- Update `README.md`, `API.md`, `DECISIONS.md`, `AI_LOG.md`
- Create `BACKEND_REQUIREMENTS_TRACEABILITY.md`
- Create `BACKEND_HANDOVER.md`

### Configuration:
- `.env.example` — Document all required variables
- Ensure no secrets committed