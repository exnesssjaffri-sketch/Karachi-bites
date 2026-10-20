# Karachi Bites Backend Handover Document

## 1. Architecture
Karachi Bites is a Node.js/Express-based backend application designed for a restaurant ordering system.
- **Runtime:** Node.js v24.18.1
- **Framework:** Express
- **Database:** SQLite (default for development) or PostgreSQL (unsupported in current environment)
- **Security:** Helmet for headers, JWT for authentication, bcrypt for password hashing, rate-limiting for DDoS/brute-force protection.
- **Workflow:** Order creation, status tracking, and admin dashboard with role-based access control (RBAC).

## 2. Requirement Matrix
| Feature ID | Description | Status |
| :--- | :--- | :--- |
| F1 | Menu API fields & filters | ✅ Implemented |
| F2 | Checkout with delivery fee (Rs 150) | ✅ Implemented |
| F3 | JWT Auth | ✅ Implemented |
| F4 | Admin Orders View | ✅ Implemented |
| F5 | Status Transitions | ✅ Implemented |
| S1 | Admin Menu CRUD | ✅ Implemented |
| S2 | CSV Export (Injection Safe) | ✅ Implemented |
| S3 | Security hardening | ✅ Implemented |
| S4 | API Error Standards | ✅ Implemented |

## 3. API Documentation
See `API.md` for detailed endpoint descriptions, including request/response formats, security requirements, and error handling.

## 4. Run Instructions
1. `npm install`
2. Create `.env` from `.env.example`.
3. Set `JWT_SECRET` to a strong production secret.
4. `npm start`
5. Visit `http://localhost:3000`.

## 5. Test Report
All 6 test suites passed successfully with local verification using SQLite:
- `test_db.js` — ✅ Database, branch seed and validation tests (12 menu items, 3 branches)
- `test_api.js` — ✅ API tests (menu, orders, auth, admin filters, status transitions)
- `test_failures.js` — ✅ API failure and authorization tests (6/6 tests passed)
- `test_persistence.js` — ✅ Persistence test (separate server processes)
- `test_admin_menu.js` — ✅ Admin Menu CRUD tests (soft-hide functionality verified)
- `test_csv_export.js` — ✅ CSV Export tests (injection protection verified)

### Test Runner Status
- **Command:** `npm test` ✅ Passes locally
- **Environment:** Node.js v24.18.1, SQLite
- **Fix Applied:** Test runner updated to use full Node executable path to resolve module resolution issues

## 6. Code Verification Results
### Order Creation, Server-Side Totals, and Rs.150 Delivery Fee
- ✅ **Verified:** `src/orderService.js` line 5: `const DELIVERY_FEE = parseInt(process.env.DELIVERY_FEE || '150', 10);`
- ✅ **Verified:** Order total calculation at line 90: `const total = subtotal + DELIVERY_FEE;`

### Authentication and Admin Authorization
- ✅ **Verified:** JWT token generation and validation in `src/auth.js`
- ✅ **Verified:** Middleware `authMiddleware` and `requireAdmin` function check tokens and roles
- ✅ **Tested:** `test_failures.js` - Staff login cannot access admin endpoints (PASS)
- ✅ **Tested:** `test_api.js` - Admin can view and filter orders (PASS)

### CSV Formula-Injection Protection
- ✅ **Verified:** `csvCell()` function in `src/routes.js` (lines 14-20) strips leading whitespace/control characters and quotes values starting with `=`, `+`, `-`, or `@`
- ✅ **Tested:** `test_csv_export.js` - CSV formula-injection with `=SUM(1,2)`, `+cmd`, `-DELETE` (PASS)
- ✅ **Tested:** `test_csv_export.js` - CSV formula-injection with leading whitespace and tabs (PASS)

### boolLiteral() Function
- ✅ **Verified:** `src/routes.js` line 24-26:
  ```javascript
  function boolLiteral(value) {
    return isSqlite() ? (value ? 1 : 0) : !!value;
  }
  ```
- ✅ **Verified:** Used correctly in GET /api/menu (line 32), admin menu updates (lines 207, 242)

## 7. PostgreSQL Compatibility
**Status:** ❌ NOT VERIFIED

### Blocker
PostgreSQL is not installed or accessible on the current environment. No `pg` client or `psql` utility found. The application uses SQLite as the default database adapter.

### Reproducible Verification Commands
To verify PostgreSQL compatibility, the following must be available:
1. Install PostgreSQL: `choco install postgresql` (Windows) or `sudo apt install postgresql` (Linux)
2. Ensure PostgreSQL service is running: `pg_ctl status`
3. Create a test database: `createdb karachi_bites_test`
4. Update `.env`: `USE_SQLITE=false` and `DATABASE_URL=postgresql://user:password@localhost:5432/karachi_bites_test`
5. Run tests: `npm test`

## 8. Remaining Work
- ✅ Local test environment fixed and verified
- ⏳ Manual browser E2E testing
- ⏳ Production deployment configuration review
- ⏳ PostgreSQL compatibility verification (requires PostgreSQL installation)

## 9. Git Status
Project is at v1.0.0. Current local state matches the requirements specified in the student brief.

## 10. Security Notes
- **Development JWT Secret:** `karachi_bites_dev_secret_2026_change_in_prod` (from `.env`)
  - ❌ This is NOT safe for production use
  - ⚠️ **Action Required:** Use `openssl rand -hex 32` to generate a strong 32-byte secret and update `.env` before production deployment
- `.env` (containing secrets) is properly ignored by `.gitignore`

## 11. Migration Files
PostgreSQL migration files exist in `supabase/migrations/`:
- `20261012112806_karachi_bites_initial_schema.sql`
- `20261012112902_karachi_bites_order_transactions.sql`
- `20261012113048_karachi_bites_admin_bootstrap.sql`
- `20261012113200_karachi_bites_foreign_key_indexes.sql`

These are for Supabase deployment and were not verified in this environment.
