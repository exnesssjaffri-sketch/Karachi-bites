# Karachi Bites — Student Brief Compliance Audit

**Audit date:** 2026-10-20 UTC  
**Code under review:** `main` after merged PR #6 (`19a2129`) and PR #7 (`29a4d36`)  
**Merged changes:** https://github.com/exnesssjaffri-sketch/Karachi-bites/pull/6 and https://github.com/exnesssjaffri-sketch/Karachi-bites/pull/7  
**Preview:** https://karachi-bites-ow66hh0mc-haider18.vercel.app/  
**Production:** https://karachi-bites.vercel.app/

This is an evidence-based implementation status, not a claim that the entire assignment is complete. “PASS” means the current GitHub Actions run exercised the relevant automated behavior; it does not mean a human tested every browser or that production database operations work.

## Functional requirements

| ID | Requirement | Status | Evidence / remaining work |
|---|---|---|---|
| F1 | Menu categories, prices and tags | PASS (automated) | Database suite checks 12 seeded menu items; live root homepage requests `GET /api/menu`. |
| F2 | Search and filters | PASS (automated) | Frontend wiring suite checks category, vegetarian, spicy and max-price filters and combined filtering logic. |
| F3 | Cart and Rs.150 delivery fee | PASS (automated) | API suite checks server-calculated totals; cart store suite checks total/count updates. |
| F4 | Cart persistence | PASS (automated) | `test_cart_store.js` verifies localStorage refresh persistence, add/increment, quantity changes and removal. |
| F5 | Checkout validation | PASS (automated) | API failure suite checks required customer fields, Pakistani phone and supported branch; order notes are validated and passed to the service. |
| F6 | Persist order and unique order ID | PASS locally / production NOT VERIFIED | SQLite API and separate-process persistence tests pass. Production health is inconsistent; do not treat local persistence as proof of production persistence. |
| F7 | Track by order ID + phone | PASS (automated) | API tests check correct phone succeeds, incorrect phone gets HTTP 403, and public GET-by-ID omits customer PII/private notes. |
| F8 | Order status progression | PASS (automated) | API suite verifies valid transition and rejects invalid status jumps. |
| F9 | Staff/admin login and protected routes | PASS (automated; real Supabase account E2E pending) | PR #7 merged. Legacy login and server-verified `/api/auth/me` pass CI; staff can access order operations, while menu mutation remains admin-only. `auth_profiles` migration is applied with RLS and a customer-only signup trigger. Existing legacy accounts are preserved and are not auto-linked to Supabase identities. Phone SMS still needs a configured provider. |
| F10 | Dashboard filters/status updates | PASS (automated) | API suite exercises branch filtering and status transitions; auth failure tests confirm protected endpoints. |
| F11 | 360px mobile usability | PARTIAL | Responsive layout changes exist, but a real 360px device/browser visual pass has not been performed in this audit. |
| F12 | Deployment and persistent production DB | PARTIAL / health PASS | After PR #6 and PR #7 production deploys, live `/api/health` returned HTTP 200 with `database: postgresql` and `ready: true`; live `/api/menu` returned HTTP 200 with 12 items. PR #7 limits the PostgreSQL pool per Vercel function to reduce connection bursts. A non-destructive production order create/read/status/persistence test is still pending; no real customer order was changed. |

## Security and quality requirements

| ID | Requirement | Status | Evidence / remaining work |
|---|---|---|---|
| S1 | Admin menu CRUD | PASS (automated) | Test suite verifies create/update, hide/unhide, unavailable item rejection and historical order preservation. |
| S2 | CSV export | PASS (automated) | CSV suite passes date filters and formula-injection checks. |
| S3 | Validation, sanitization, rate limiting | PARTIAL | Server-side validation, Helmet, rate limiting and CSV-injection tests are present; this is not a complete penetration test. |
| S4 | Loading, empty and error states | PARTIAL | Loading/retry/error states exist in UI code; complete manual browser E2E has not been run. |
| S5 | Accessibility | PARTIAL / audit workflow added | A mobile Lighthouse + accessibility CI workflow is being added in a separate PR. No passing Lighthouse score or manual keyboard/screen-reader audit is claimed until the workflow and manual review finish. |

## Bonus requirements

| ID | Requirement | Status | Evidence / remaining work |
|---|---|---|---|
| C1 | Urdu/English toggle with RTL | NOT VERIFIED / not evidenced | No completed end-to-end language-toggle test in the current CI evidence. |
| C2 | Lighthouse mobile score 85+ | PENDING WORKFLOW RESULT | `.github/workflows/lighthouse.yml` runs Lighthouse mobile against production and enforces performance/accessibility scores >=85; report artifact and score are pending the workflow run. |
| C3 | Print kitchen ticket | PARTIAL | Admin-only kitchen-ticket API is covered by the API test; real browser print flow has not been verified. |
| C4 | Order again | PARTIAL | Reorder endpoint/button exist in code; no complete browser E2E test has verified the whole reorder flow. |

## Automated test evidence

GitHub Actions run **107** (run ID `39319151736`) completed successfully on the Supabase Auth integration branch before merge. All eight suites passed, including legacy auth, `/api/auth/me`, staff order access, admin-only menu changes, order tracking privacy, frontend wiring and cart persistence.

Run evidence: https://github.com/exnesssjaffri-sketch/Karachi-bites/actions/runs/39319151736

Earlier baseline evidence from run **96** (run ID `39315646451`) remains available:

- `test_db.js`
- `test_api.js`
- `test_failures.js`
- `test_persistence.js`
- `test_admin_menu.js`
- `test_csv_export.js`
- `test_frontend_wiring.js`
- `test_cart_store.js`

Run evidence: https://github.com/exnesssjaffri-sketch/Karachi-bites/actions/runs/39315646451

## Live evidence captured

- Production `GET /api/menu`: HTTP 200, 12 menu items returned.
- Production `GET /api/health`: HTTP 200 with PostgreSQL `ready: true` after PR #6 and PR #7 deployments.
- Production `/login.html`, `/admin`, `/js/login.js`, and `/js/account-header.js`: HTTP 200.
- Supabase SQL control-plane check succeeded; the production schema has 12 menu items, 2 orders and 2 legacy users.
- Migration `supabase_auth_profiles` applied and verified: profile table exists, RLS is enabled, signup trigger exists, and direct execution by API roles is revoked.
- GitHub Actions run **107** passed all eight suites on the final pre-merge PR #7 commit.
- Production order creation/status mutation was intentionally not performed because it would create/change live operational records. Full order → admin status → tracking is covered in automated isolated-database tests, but a safe production-specific order flow is still pending.
- Mobile visual inspection, Lighthouse scores and manual keyboard/screen-reader checks remain pending; a workflow has been added to collect Lighthouse scores and enforce 85-point performance/accessibility thresholds.

## Delivery items still outstanding

- Restore and verify production Vercel-to-Supabase connectivity, then test a real non-destructive order flow with explicit approval.
- Provide a safe Preview database URL if live API testing is required on the preview deployment.
- Perform real browser E2E, 360px mobile review, accessibility review and Lighthouse measurement.
- Verify Supabase Auth signup/confirmation/redirect, staff OTP provider and role mapping separately; PR #5 is not merged.
- Confirm the brief's required meaningful commit count and produce the three-minute walkthrough video.
- Do not mark F12 or the full assignment complete until production health and persistence are proven.


## Latest live and database evidence (2026-10-20 UTC)

- Production deployment for commit `29a4d3662942c9a6d3e28fc93bff2a428f0f923a` is READY in Vercel.
- Production `GET /api/health`: HTTP 200, `database: postgresql`, `ready: true`.
- Production `GET /api/menu`: HTTP 200; 12 menu items.
- Production `/login.html`, `/admin`, `/js/login.js`, and `/js/account-header.js`: HTTP 200.
- Supabase migration `supabase_auth_profiles` was applied and verified. `public.auth_profiles` exists with RLS enabled; signup trigger exists; one profile row was backfilled. An SQL check confirmed neither `anon` nor `authenticated` can directly execute the trigger function.
- Supabase read-only inventory at audit time: 12 menu items, 2 orders, 2 legacy users. No existing order was modified.
- PostgreSQL pool is capped at 2 by default (configurable only up to 3) per serverless function instance to reduce connection bursts.
- Remaining: test an end-to-end production order without disrupting operations, run Lighthouse and review its artifact, manually check 360px layout/keyboard navigation, configure and test actual Supabase signup and phone SMS, and record the real 3-minute walkthrough.
