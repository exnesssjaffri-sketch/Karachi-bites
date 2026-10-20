# Karachi Bites Backend Design Decisions

## Validation and Security

### Input Validation
All customer inputs are validated on the server side. Never trust the client.

**Phone Number Validation**
- Format: 03XXXXXXXXX (11 digits starting with 03)
- Reason: Standard Pakistani mobile numbers (e.g., Jazz, Warid, Zong, Telenor)
- Regex: `/^03\d{9}$/`

**Name Validation**
- Length: 2-100 characters
- Reason: Prevent excessively short or long names that could cause UI/storage issues

**Address Validation**
- Length: 5-500 characters
- Reason: Ensure minimum meaningful length while allowing detailed addresses

**Quantity Validation**
- Range: 1-100
- Reason: Prevent abuse while allowing reasonable bulk orders

**Branch Validation**
- Supported branches: "Clifton", "Gulshan-e-Iqbal", and "North Nazimabad"
- Each supported branch is validated on the server and seeded idempotently into the branches table

### Authentication and Authorization
- JWT (JSON Web Tokens) used for stateless authentication
- Secret key stored in environment variable (never hardcoded)
- Passwords hashed using bcrypt with cost factor 10
- Admin routes require role = 'admin'
- Staff can login but cannot access admin routes (403 Forbidden)
- Tokens expire in 24 hours to balance security and usability

### Password Handling
- Never store plaintext passwords
- Never return password hashes in API responses
- Use bcrypt for secure password hashing
- Environment variable for admin/default passwords in seed data (should be changed in production)

### SQL Injection Prevention
- Use parameterized queries via sqlite3 library
- Never concatenate user input into SQL strings

### Error Handling
- Consistent JSON error format: `{ "error": "message" }`
- Never leak stack traces or internal details in error responses
- Log errors server-side for debugging
- Return appropriate HTTP status codes:
  - 400: Client errors (validation)
  - 401: Authentication required
  - 403: Forbidden (insufficient permissions)
  - 404: Resource not found
  - 429: Rate limit exceeded (via express-rate-limit)
  - 500: Server errors

### Rate Limiting
- 100 requests per 15 minutes per IP
- Prevents brute-force attacks and abuse
- Implemented using express-rate-limit middleware

### Security Headers
- Helmet.js middleware to set various HTTP headers:
  - X-DNS-Prefetch-Control
  - X-Frame-Options
  - X-Powered-By
  - X-XSS-Protection
  - Strict-Transport-Security (if HTTPS)
  - Content-Security-Policy
  - And others

### Database Design
- Separate tables for menu_items, branches, users, orders, order_items
- Orders store prices at time of order (price_at_order) to preserve historical accuracy
- Order items store name_at_order for same reason
- Foreign key constraints with CASCADE DELETE for order items
- Indexes on frequently queried fields (public_order_id, branch, status, created_at)

### Status Transition Enforcement
- Hardcoded valid status transitions:
  - Received → Preparing
  - Preparing → Out for Delivery
  - Out for Delivery → Delivered
  - Delivered → (terminal state)
- Prevents invalid workflows (e.g., jumping from Received to Delivered)
- Enforced in both service layer and route handler

### Delivery Fee
- Fixed delivery fee of Rs. 150 per order
- Calculated server-side: total = subtotal + delivery fee
- Never trust delivery fee or total sent by client

### Public Order ID Generation
- Format: KB-YYYYMMDD-XXXXXX
  - KB: Karachi Bites prefix
  - YYYYMMDD: Current date
  - XXXXXX: 6-character uppercase random string
- Generated server-side, never from client
- Ensures uniqueness and readability

### Environment Configuration
- .env file for development (never commit production secrets)
- Environment variables for:
  - PORT
  - NODE_ENV
  - JWT_SECRET (must be strong and changed in production)
  - DATABASE_PATH
  - DELIVERY_FEE
- Default values provided for development only

### Database Choice: Supabase PostgreSQL (Production) vs SQLite (Development Only)
- **Production storage is Supabase PostgreSQL**, selected because SQLite on Vercel
  serverless is ephemeral: each function instance gets its own copy of the
  database file, which does not survive redeployments or separate function
  instances. This is the F12 blocker.
- **SQLite is development-only.** It is fast, zero-configuration, and sufficient
  for local `npm start` and `npm test`. It is NOT a supported production
  configuration, and there is no rollback path from PostgreSQL to SQLite.
- **`USE_SQLITE=false` requires a valid `DATABASE_URL`.** If `USE_SQLITE` is not
  `'true'` and `DATABASE_URL` is missing, `getDb()` throws loudly — there is no
  silent fallback to SQLite.
- **Supabase connection string**: `postgresql://user:password@host:5432/database`.
  The `pg` pool uses `ssl: { rejectUnauthorized: false }`, `max: 1-3` connections,
  `connectionTimeoutMillis: 10000`, `allowExitOnIdle: true`.
- **Migrations**: Six Supabase SQL files live in `supabase/migrations/` and are
  applied by `scripts/migrate.js` (manually invoked, never automatic on cold
  start). The runner is transaction-safe and tracks applied files in a
  `schema_migrations` table. Before seeding menu IDs 1-12 it checks for data
  conflicts and aborts rather than overwriting.
- **Existing data**: The local SQLite database contains 2 orders, 2 users, 12
  menu items, 3 branches, and 2 order items. These are NOT automatically
  migrated to PostgreSQL. If production SQLite data must be preserved, run a
  one-time export/import (e.g. `sqlite3 .dump` filtered to the relevant tables,
  then load into PostgreSQL with ID mapping) before flipping `USE_SQLITE`.
- **Menu IDs**: The Express backend queries menu items by explicit IDs 1-12.
  The Supabase migration now seeds with explicit IDs 1-12 and `ON CONFLICT (id)
  DO NOTHING` to match. The migration runner verifies no conflicting data exists
  before applying.
- **Credentials**: `DATABASE_URL` is set only in Vercel Project Settings →
  Environment Variables (encrypted). `.env.example` contains placeholders only.
  `.gitignore` already excludes `.env`, `.env.local`, `*.env.local`.

### Testing Approach
- Automated tests for success and failure cases
- Test database persistence across server restarts
- Test authentication and authorization
- Test validation rules
- Test status transition enforcement
- Tests run against actual server instance (not mocked)

### Migration Runner Limitations and Sequence Reconciliation
 - The migration runner (`scripts/migrate.js`) is **manual** — invoked via `npm run migrate`, never automatic on cold start. If `USE_SQLITE=false` and migrations have not been applied, the app fails loudly on the first query rather than silently serving an empty database.
 - The runner is transaction-safe and tracks applied files in a `schema_migrations` table, but it does **not** reconcile schema drift: a partially applied migration or a hand-added column is not detected or repaired.
 - The initial-schema migration (`20261012112806`) advances the `menu_items` IDENTITY sequence using `pg_get_serial_sequence` with safe `is_called` handling. The old `COALESCE(MAX(id), 0)` fallback was invalid: `setval(seq, 0)` violates the sequence's `MINVALUE 1` constraint. The corrected logic branches on table state:
   * Empty table → `setval(seq, 1, false)` so the next `nextval()` returns 1 (the sequence minimum).
   * Existing rows → `setval(seq, max, true)` so the next `nextval()` returns `max + 1` and never collides.
 - This reconciliation is performed **inside** the migration, not by the runner. The runner does not re-run it on every start; the migration is idempotent and safe to re-apply, but it is not a general-purpose sequence-sync tool for other tables.
 - Drop-and-recreate is **not** supported by the runner; migrations must be written to be additive and re-runnable.
 - SQLite data is **not** automatically migrated to PostgreSQL. A one-time export/import is required before flipping `USE_SQLITE`.

### Extensibility
- Adding new menu items: Insert into menu_items table
- Adding new branches: Insert into branches table
- Adding new user roles: Modify validation and auth logic as needed
- Adding new statuses: Update VALID_STATUS and VALID_TRANSITIONS in validate.js
- Changing delivery fee: Update DELIVERY_FEE in .env