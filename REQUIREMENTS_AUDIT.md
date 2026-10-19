# Karachi Bites — Student Brief Compliance Audit

**Audit date:** 2026-10-19 UTC  
**Code under review:** `fix/brief-compliance-order-privacy`  
**Pull request:** https://github.com/exnesssjaffri-sketch/Karachi-bites/pull/6  
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
| F6 | Persist order and unique order ID | PASS locally / production NOT VERIFIED | SQLite API and separate-process persistence tests pass. Production health is currently failing; do not treat local persistence as proof of production persistence. |
| F7 | Track by order ID + phone | PASS (automated) | API tests check correct phone succeeds, incorrect phone gets HTTP 403, and public GET-by-ID omits customer PII/private notes. |
| F8 | Order status progression | PASS (automated) | API suite verifies valid transition and rejects invalid status jumps. |
| F9 | Staff/admin login and protected routes | PARTIAL | Legacy username/password login and role protection pass automated tests. Supabase Auth PR #5 is still separate/unmerged; real SMS OTP requires provider configuration and has not been verified. |
| F10 | Dashboard filters/status updates | PASS (automated) | API suite exercises branch filtering and status transitions; auth failure tests confirm protected endpoints. |
| F11 | 360px mobile usability | PARTIAL | Responsive layout changes exist, but a real 360px device/browser visual pass has not been performed in this audit. |
| F12 | Deployment and persistent production DB | BLOCKED | Production `/api/health` returned HTTP 503 with a PostgreSQL connection timeout. Preview health returns HTTP 503 because preview has no `DATABASE_URL`. Live order create/read/persistence is not verified. |

## Security and quality requirements

| ID | Requirement | Status | Evidence / remaining work |
|---|---|---|---|
| S1 | Admin menu CRUD | PASS (automated) | Test suite verifies create/update, hide/unhide, unavailable item rejection and historical order preservation. |
| S2 | CSV export | PASS (automated) | CSV suite passes date filters and formula-injection checks. |
| S3 | Validation, sanitization, rate limiting | PARTIAL | Server-side validation, Helmet, rate limiting and CSV-injection tests are present; this is not a complete penetration test. |
| S4 | Loading, empty and error states | PARTIAL | Loading/retry/error states exist in UI code; complete manual browser E2E has not been run. |
| S5 | Accessibility | NOT VERIFIED | No current automated accessibility scan or full keyboard/screen-reader audit was run. |

## Bonus requirements

| ID | Requirement | Status | Evidence / remaining work |
|---|---|---|---|
| C1 | Urdu/English toggle with RTL | NOT VERIFIED / not evidenced | No completed end-to-end language-toggle test in the current CI evidence. |
| C2 | Lighthouse mobile score 85+ | NOT VERIFIED | No Lighthouse run or report is available. |
| C3 | Print kitchen ticket | PARTIAL | Admin-only kitchen-ticket API is covered by the API test; real browser print flow has not been verified. |
| C4 | Order again | PARTIAL | Reorder endpoint/button exist in code; no complete browser E2E test has verified the whole reorder flow. |

## Automated test evidence

GitHub Actions run **96** (run ID `39315646451`) completed successfully on the PR head. All eight suites passed:

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

- Production `GET /api/menu`: HTTP 200, 12 menu items returned in the sampled request.
- Production `GET /api/health`: HTTP 503, detail was `Connection terminated due to connection timeout`.
- Supabase project status reported `ACTIVE_HEALTHY`; a read-only SQL health query succeeded at the time of audit. This suggests the database service itself was reachable through the Supabase control-plane connection, but does **not** prove Vercel's configured `DATABASE_URL` can connect.
- Current PR preview homepage `/`: HTTP 200 and includes the live menu mount/API client.
- Current PR preview `/app.html`: HTTP 200.
- Current PR preview tracking script: HTTP 200 and uses the phone-verified tracking method.
- Current PR preview `/api/health`: HTTP 503 because no Preview `DATABASE_URL` is configured. Production credentials were not copied to Preview.

## Delivery items still outstanding

- Restore and verify production Vercel-to-Supabase connectivity, then test a real non-destructive order flow with explicit approval.
- Provide a safe Preview database URL if live API testing is required on the preview deployment.
- Perform real browser E2E, 360px mobile review, accessibility review and Lighthouse measurement.
- Verify Supabase Auth signup/confirmation/redirect, staff OTP provider and role mapping separately; PR #5 is not merged.
- Confirm the brief's required meaningful commit count and produce the three-minute walkthrough video.
- Do not mark F12 or the full assignment complete until production health and persistence are proven.
