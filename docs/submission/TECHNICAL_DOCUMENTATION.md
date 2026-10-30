# Karachi Bites — Technical Documentation

This document describes the important source files, their responsibilities, and all API endpoints with HTTP methods, request fields, response formats, and error cases.

---

# Important Source Files

## Backend (`src/`)

| File | Responsibility |
| --- | --- |
| `src/server.js` | Express application bootstrap: Helmet headers, rate limiting, body parsing, static serving, route registration, database initialisation, SPA fallback. |
| `src/routes.js` | All REST endpoint handlers under `/api`. Contains CSV cell protector (`csvCell`) and boolean-literal helper (`boolLiteral`) for cross-DB compatibility. |
| `src/db.js` | Dual-database adapter (SQLite / PostgreSQL). Schema reconciliation (`initDatabase`), menu/branch/user seeding (`seedDatabase`), query helpers (`query`, `get`, `run`, `getOne`, `getAll`, `withTransaction`, etc.). Converts `?` placeholders to `$1, $2, ...` for PostgreSQL. |
| `src/orderService.js` | Order business logic: creation (transactional, price-captured-at-order), lookup (public vs. phone-verified), status transition enforcement, reordering with phone check, kitchen ticket generation. |
| `src/auth.js` | JWT generation and verification (`jsonwebtoken`), bcrypt password hashing (`bcrypt`), legacy role resolution, Supabase access-token verification against `/auth/v1/user`. |
| `src/validate.js` | Input validation: phone regex `^03\d{9}$`, name length, address length, branch enum, status enum, status transition map, category enum, tag enum, quantity range, price range, date format. |

## Frontend (`public/`)

| File | Responsibility |
| --- | --- |
| `public/index.html` | Stitch-designed homepage with hero, category tabs, live menu grid. Loads shared JS modules. |
| `public/app.html` | API-backed ordering SPA with hash-based routing. Mount points: `#site-nav`, `#app`, `#site-footer`. |
| `public/admin.html` | Staff/admin dashboard with login form and protected order management table. |
| `public/js/app.js` | Client-side router class. Maps hash fragments to page modules. |
| `public/js/api.js` | Fetch-based API client. Base URL is `/api`. Methods: `getMenu`, `createOrder`, `getOrder`, `trackOrder`, `reorderItems`, `reorderOrder`, `getKitchenTicket`, `adminLogin`. |
| `public/js/store.js` | Cart store. Persists to `localStorage` under key `karachi_bites_cart`. Exposes `window.cartStore`. |
| `public/js/i18n.js` | Bilingual i18n module. Dictionaries for `en` and `ur`. Sets `document.dir` to `rtl`/`ltr`. Loads Noto Nastaliq Urdu font on demand. Dispatches `kb:language-changed` event. |
| `public/js/navbar.js` | Navigation bar renderer. Renders logo, nav links, cart badge, language toggle, account icon. |
| `public/js/footer.js` | Footer renderer with copyright and links. |
| `public/js/pages-home.js` | Homepage module. Loads menu from API, renders category buttons and dish cards. |
| `public/js/pages-menu.js` | Menu page module. Rendered items with category/tag/price filters. |
| `public/js/pages-cart.js` | Cart page module. Displays cart items, quantity controls, subtotal, delivery fee, grand total. |
| `public/js/pages-checkout.js` | Checkout page module. Form validation, order submission via `api.createOrder`, navigation to confirmation. |
| `public/js/pages-order-placed.js` | Order confirmation page. Displays order ID, total, items, branch. |
| `public/js/pages-order-tracking.js` | Tracking page module. Form with order ID and phone; calls `api.trackOrder`; shows order details and reorder form. |
| `public/js/admin.js` | Admin dashboard logic. Login, order table, status update, branch/date filter, kitchen ticket modal, menu CRUD (admin), CSV export (admin). |
| `public/js/supabase-auth.js` | Supabase Auth helper. Handles PKCE flow for Google OAuth and email/password sign-in. |
| `public/js/oauth-callback.js` | OAuth callback handler. Exchanges code for token, persists `karachi_bites_customer_token`, stores avatar URL. |
| `public/js/login.js` | Legacy login page logic. Username/password form with show/hide password toggle. |
| `public/js/account-header.js` | Account avatar/header component. Shows user avatar from Supabase or Google OAuth. |
| `public/kitchen-ticket.html` | Print-friendly kitchen ticket page. Loads ticket data via protected API, applies `@media print` styles. |
| `public/js/kitchen-ticket.js` | Kitchen ticket loader. Fetches ticket JSON using the staff session token from `sessionStorage`. |
| `public/responsive.css` | Mobile/tablet layout fixes. Includes RTL overrides via `html[dir="rtl"]` selectors. |
| `public/kb-design.css` | Shared design tokens (colours, typography, spacing). |
| `public/stitch/` | Standalone Stitch design exports (visual previews). |

## Tests (`test/`)

| File | Coverage |
| --- | --- |
| `test.js` | Orchestrator: runs all individual test suites. |
| `test_db.js` | Database seeding, 12 menu items, 3 branches, validation. |
| `test_api.js` | Full API success paths. |
| `test_failures.js` | Validation failures, auth failures, staff 403. |
| `test_persistence.js` | SQLite persistence across process restarts. |
| `test_admin_menu.js` | Admin menu CRUD, soft-delete, historical order preservation. |
| `test_csv_export.js` | CSV generation, formula-injection protection, date filtering. |
| `test_frontend_wiring.js` | Router, cart, i18n, tracking, kitchen ticket, reorder wiring. |
| `test_cart_store.js` | localStorage cart persistence, add/increment, quantity change, removal. |
| `test_cart_total_property.js` | Quantity property regression, total correctness, failed-checkout cart retention. |
| `test_account_google_mobile.js` | Account header, Google OAuth contract, mobile scroll. |
| `test_live_translation_performance.js` | Translation key count, lookup speed, fallback behaviour. |
| `test_mobile_header_translation.js` | Header translation rendering at mobile viewport. |
| `test_mobile_responsive_layout.js` | No horizontal overflow at multiple viewports. |
| `test_staff_2fa_contract.js` | Supabase Edge Function OTP source markers. |
| `test_i18n_rtl.js` | Urdu labels, RTL CSS, font loading. |
| `test_password_visibility.js` | Password input type toggling. |

## Scripts

| File | Responsibility |
| --- | --- |
| `scripts/migrate.js` | Manual PostgreSQL migration runner. Applies SQL files from `supabase/migrations/` transactionally. Tracks applied migrations in `schema_migrations`. Dry-run mode available with `--check`. |

## Configuration

| File | Responsibility |
| --- | --- |
| `.env.example` | Template for environment variables (no real secrets). |
| `.github/workflows/test.yml` | GitHub Actions: syntax check + `npm test` on push to `main`. |
| `.github/workflows/lighthouse.yml` | GitHub Actions: Lighthouse audit at 360×800 mobile viewport with ≥ 85 score gate. |
| `.gitignore` | Excludes `.env`, `.env.local`, `*.env.local`, `node_modules/`, `karachi_bites.db`. |

---

# API Endpoints

## 1. GET /api/health

Health check endpoint. Returns database readiness even when the app is still initialising.

| Field | Value |
| --- | --- |
| Method | GET |
| Path | `/api/health` |
| Authentication | None |
| Success response (200) | `{ "status": "ok", "database": "postgresql" | "sqlite", "ready": true, "time": "<ISO timestamp>" }` |
| Error response (503) | `{ "status": "error", "database": "...", "detail": "<error message>" }` |

---

## 2. GET /api/menu

Retrieve available menu items with optional filters.

| Field | Value |
| --- | --- |
| Method | GET |
| Path | `/api/menu` |
| Authentication | None |
| Query parameters | `category` (BBQ, Karahi, Rice, Rolls, Drinks, Desserts), `tags` (veg, spicy, mild — may be repeated), `maxPrice` (integer), `search` (string, name contains) |
| Success response (200) | Array of objects: `{ id, name, price, category, tags, available, description, image }` |
| Error response (400) | `{ "error": "Invalid category filter" }` or similar |
| Error response (500) | `{ "error": "Internal server error" }` |

---

## 3. POST /api/orders

Create a new order. All totals are calculated server-side.

| Field | Value |
| --- | --- |
| Method | POST |
| Path | `/api/orders` |
| Authentication | None |
| Content-Type | application/json |
| Request body | `{ customer: { name: string (2-100), phone: string (Pakistani 03XXXXXXXXX), address: string (5-500), notes?: string (≤500) }, branch: "Clifton" | "Gulshan-e-Iqbal" | "North Nazimabad", items: [{ id: integer, qty: integer (1-100) }] }` |
| Success response (201) | `{ "orderId": "KB-YYYYMMDD-XXXXXXXX", "total": integer, "status": "Received" }` |
| Error response (400) | `{ "error": "<validation message>" }` for missing/invalid fields |
| Error response (500) | `{ "error": "Internal server error" }` |

---

## 4. GET /api/orders/:id

Public order lookup. Customer PII is omitted.

| Field | Value |
| --- | --- |
| Method | GET |
| Path | `/api/orders/:id` |
| Authentication | None |
| Success response (200) | `{ "orderId": string, "status": string, "items": [{ id, name, quantity, price, lineTotal }], "total": integer, "branch": string, "createdAt": ISO timestamp }` |
| Error response (404) | `{ "error": "Order not found" }` |
| Error response (500) | `{ "error": "Internal server error" }` |

---

## 5. POST /api/orders/track

Phone-verified order tracking. Returns full order details including customer PII only when the phone matches.

| Field | Value |
| --- | --- |
| Method | POST |
| Path | `/api/orders/track` |
| Authentication | None |
| Content-Type | application/json |
| Request body | `{ "orderId": string, "phone": string (Pakistani 03XXXXXXXXX) }` |
| Success response (200) | Full order object |
| Error response (400) | `{ "error": "orderId is required" }` or phone validation error |
| Error response (403) | `{ "error": "Phone number does not match this order" }` |
| Error response (404) | `{ "error": "Order not found" }` |

---

## 6. POST /api/orders/reorder

Re-create a previous order. Phone must match the original checkout phone.

| Field | Value |
| --- | --- |
| Method | POST |
| Path | `/api/orders/reorder` |
| Authentication | None |
| Content-Type | application/json |
| Request body | `{ "originalOrderId": string, "customer": { name: string, phone: string, address: string, notes?: string } }` |
| Success response (201) | `{ "orderId": string, "total": integer, "status": "Received" }` |
| Error response (400) | `{ "error": "originalOrderId is required" }` |
| Error response (403) | `{ "error": "Phone number does not match the original order" }` |
| Error response (404) | `{ "error": "Original order not found" }` |

---

## 7. POST /api/auth/login

Staff/admin login. Returns a JWT.

| Field | Value |
| --- | --- |
| Method | POST |
| Path | `/api/auth/login` |
| Authentication | None |
| Content-Type | application/json |
| Request body | `{ "username": string, "password": string }` |
| Success response (200) | `{ "token": "<JWT>" }` |
| Error response (400) | `{ "error": "Username and password are required" }` |
| Error response (401) | `{ "error": "Invalid credentials" }` |
| Error response (500) | `{ "error": "Internal server error" }` |

---

## 8. GET /api/auth/me

Return the server-verified identity of the authenticated user.

| Field | Value |
| --- | --- |
| Method | GET |
| Path | `/api/auth/me` |
| Authentication | Bearer JWT |
| Success response (200) | `{ "user": { "id": string, "username": string | null, "email": string | null, "phone": string | null, "role": "admin" | "staff" | "customer" } }` |
| Error response (401) | `{ "error": "Authentication required" }` or `{ "error": "Invalid or expired token" }` |

---

## 9. GET /api/admin/orders

List orders with optional filters. Staff and admin.

| Field | Value |
| --- | --- |
| Method | GET |
| Path | `/api/admin/orders` |
| Authentication | Bearer JWT (staff+) |
| Query parameters | `branch` (optional), `date` (YYYY-MM-DD, optional) |
| Success response (200) | Array of `{ orderId, status, total, branch, customer: { name, phone, address }, createdAt }` |
| Error response (401) | `{ "error": "Authentication required" }` |
| Error response (403) | `{ "error": "Staff or admin access required" }` |

---

## 10. PATCH /api/admin/orders/:id/status

Advance an order's status. Requires a valid transition.

| Field | Value |
| --- | --- |
| Method | PATCH |
| Path | `/api/admin/orders/:id/status` |
| Authentication | Bearer JWT (staff+) |
| Content-Type | application/json |
| Request body | `{ "status": "Received" | "Preparing" | "Out for Delivery" | "Delivered" }` |
| Success response (200) | `{ "orderId": string, "status": string }` |
| Error response (400) | `{ "error": "Status is required" }` or `{ "error": "Invalid order status transition" }` |
| Error response (401) | `{ "error": "Authentication required" }` |
| Error response (403) | `{ "error": "Staff or admin access required" }` |
| Error response (404) | `{ "error": "Order not found" }` |

---

## 11. GET /api/admin/kitchen/:id

Print-friendly kitchen ticket data (staff or admin).

| Field | Value |
| --- | --- |
| Method | GET |
| Path | `/api/admin/kitchen/:id` |
| Authentication | Bearer JWT (staff+) |
| Success response (200) | `{ "orderId": string, "branch": string, "createdAt": string, "status": string, "items": [{ id, name, quantity, price, lineTotal }], "notes": string | null, "total": integer }` |
| Error response (401) | `{ "error": "Authentication required" }` |
| Error response (403) | `{ "error": "Staff or admin access required" }` |
| Error response (404) | `{ "error": "Order not found" }` |

---

## 12. GET /api/admin/orders/export

CSV export of orders. Admin only. Date-range filters supported. Formula-injection protection enabled.

| Field | Value |
| --- | --- |
| Method | GET |
| Path | `/api/admin/orders/export` |
| Authentication | Bearer JWT (admin) |
| Query parameters | `date_from` (YYYY-MM-DD, optional), `date_to` (YYYY-MM-DD, optional) |
| Success response (200) | CSV text with headers: `Order ID,Customer,Phone,Total,Status,Date` |
| Error response (401) | `{ "error": "Authentication required" }` |
| Error response (403) | `{ "error": "Admin access required" }` |

---

## 13. POST /api/admin/menu

Create a menu item. Admin only.

| Field | Value |
| --- | --- |
| Method | POST |
| Path | `/api/admin/menu` |
| Authentication | Bearer JWT (admin) |
| Content-Type | application/json |
| Request body | `{ "name": string, "price": integer (≥0), "category": "BBQ" | "Karahi" | "Rice" | "Rolls" | "Drinks" | "Desserts", "tags": "veg" | "spicy" | "mild" | null, "available": boolean }` |
| Success response (201) | `{ "id": integer, "name": string, "price": integer, "category": string, "tags": string | null, "available": boolean }` |
| Error response (400) | `{ "error": "Invalid menu item data" }` |
| Error response (401) | `{ "error": "Authentication required" }` |
| Error response (403) | `{ "error": "Admin access required" }` |

---

## 14. PUT /api/admin/menu/:id

Update a menu item. Admin only.

| Field | Value |
| --- | --- |
| Method | PUT |
| Path | `/api/admin/menu/:id` |
| Authentication | Bearer JWT (admin) |
| Content-Type | application/json |
| Request body | `{ "name": string, "price": integer, "category": string, "tags": string | null, "available": boolean }` |
| Success response (200) | `{ "id": integer, "name": string, "price": integer, "category": string, "tags": string | null, "available": boolean }` |
| Error response (400) | `{ "error": "Invalid menu item data" }` |
| Error response (404) | `{ "error": "Item not found" }` |
| Error response (401) | `{ "error": "Authentication required" }` |
| Error response (403) | `{ "error": "Admin access required" }` |

---

## 15. DELETE /api/admin/menu/:id

Hide a menu item (soft-delete: sets `available = false`). Does not remove from database so historical orders remain intact. Admin only.

| Field | Value |
| --- | --- |
| Method | DELETE |
| Path | `/api/admin/menu/:id` |
| Authentication | Bearer JWT (admin) |
| Success response (204) | Empty body |
| Error response (401) | `{ "error": "Authentication required" }` |
| Error response (403) | `{ "error": "Admin access required" }` |
| Error response (404) | `{ "error": "Item not found" }` |

---

## 16. PATCH /api/admin/menu/:id/availability

Explicitly set availability. Admin only.

| Field | Value |
| --- | --- |
| Method | PATCH |
| Path | `/api/admin/menu/:id/availability` |
| Authentication | Bearer JWT (admin) |
| Content-Type | application/json |
| Request body | `{ "available": boolean }` |
| Success response (200) | `{ "id": integer, "available": boolean }` |
| Error response (400) | `{ "error": "available boolean is required" }` |
| Error response (404) | `{ "error": "Item not found" }` |
| Error response (401) | `{ "error": "Authentication required" }` |
| Error response (403) | `{ "error": "Admin access required" }` |

