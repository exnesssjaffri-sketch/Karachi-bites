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
| F11 | 360px mobile usability | PASS (automated viewport) / manual device check pending | Latest optimized PR code scored Performance 97/100 and Accessibility 100/100 at 360×800. A physical Android-device visual/touch pass is still outstanding. |
| F12 | Deployment and persistent production DB | PARTIAL / health PASS | After PR #6 and PR #7 production deploys, live `/api/health` returned HTTP 200 with `database: postgresql` and `ready: true`; live `/api/menu` returned HTTP 200 with 12 items. PR #7 limits the PostgreSQL pool per Vercel function to reduce connection bursts. A non-destructive production order create/read/status/persistence test is still pending; no real customer order was changed. |

## Security and quality requirements

| ID | Requirement | Status | Evidence / remaining work |
|---|---|---|---|
| S1 | Admin menu CRUD | PASS (automated) | Test suite verifies create/update, hide/unhide, unavailable item rejection and historical order preservation. |
| S2 | CSV export | PASS (automated) | CSV suite passes date filters and formula-injection checks. |
| S3 | Validation, sanitization, rate limiting | PARTIAL | Server-side validation, Helmet, rate limiting and CSV-injection tests are present; this is not a complete penetration test. |
| S4 | Loading, empty and error states | PARTIAL | Loading/retry/error states exist in UI code; complete manual browser E2E has not been run. |
| S5 | Accessibility | PASS automated / PARTIAL overall | Lighthouse Accessibility scored 100/100 at 360×800. Manual keyboard-only, focus-order and screen-reader testing has not been performed. |

## Bonus requirements

| ID | Requirement | Status | Evidence / remaining work |
|---|---|---|---|
| C1 | Urdu/English toggle with RTL | NOT VERIFIED / not evidenced | No completed end-to-end language-toggle test in the current CI evidence. |
| C2 | Lighthouse mobile score 85+ | PASS (optimized code in CI; live production pending) | PR #9 head scored Performance 97/100, Accessibility 100/100, Best Practices 100/100, SEO 100/100 at 360×800 against the exact code with isolated SQLite. Artifact: https://github.com/exnesssjaffri-sketch/Karachi-bites/actions/runs/39323273356/artifacts/12220986614. Production still serves an older deployment, so these are not live-production scores. |
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
- Lighthouse run 29 passed the 85-point gates at 360×800 (Performance 97, Accessibility 100, Best Practices 100, SEO 100) on the optimized code in CI. The production site has not yet received PR #9's code; live Lighthouse is therefore pending.

## Delivery items still outstanding

- Restore and verify production Vercel-to-Supabase connectivity, then test a real non-destructive order flow with explicit approval.
- Provide a safe Preview database URL if live API testing is required on the preview deployment.
- Perform the physical 360px device/touch review and manual keyboard/screen-reader review; automated Lighthouse is now passing on the exact PR code.
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
- Remaining: test an end-to-end production order without disrupting operations, review the Lighthouse artifact, manually check 360px layout/keyboard navigation, configure and test actual Supabase signup and phone SMS, and record the real 3-minute walkthrough.


## Lighthouse evidence — PR #8 head (2026-10-20 UTC)

GitHub Actions run **7** (run ID `39320576856`) completed successfully using the exact pull-request code, a clean SQLite database and a simulated **360×800** mobile viewport. The workflow passed its Performance/Accessibility gates.

- Performance: **96/100**
- Accessibility: **100/100**
- Best Practices: **96/100**
- SEO: **100/100**
- Report artifact (available for 30 days): https://github.com/exnesssjaffri-sketch/Karachi-bites/actions/runs/39320576856/artifacts/12218594103

The earlier baseline run against the old production version was 69 Performance / 89 Accessibility. This baseline is not the score of the optimized PR code. The passing run audits the PR code locally; production will receive the homepage optimizations only after this PR is merged and deployed.


## Production deployment blocker — 2026-10-20 UTC

- PR #9 is merged into `main` at `0e2a6e8a888fa420d05566d15fe1109290db631f`. The optimized homepage, inline SVG mobile navigation, static menu styling, deferred API rendering, and image/font optimizations are now in GitHub `main`.
- The current production deployment remains on older commit `fd35f1fccb0395abc5d4b7ae31c754212d7595c2`; live HTML still contains the Tailwind CDN and does not include `kb-static-menu-styles`.
- Attempting to create the production deployment through Vercel returned **HTTP 402**: deployment API free-per-day limit exceeded (over 100; retry after 24 hours). The connected Vercel tooling has no local authenticated CLI fallback. No preview deployment was promoted because preview deployments may not have the production database environment variables.
- Current live API is healthy despite the stale homepage: `GET /api/health` returned HTTP 200 with PostgreSQL `ready: true`; `GET /api/menu` returned HTTP 200 with 12 items.
- Required user action: in Vercel Project Settings → Git, connect `exnesssjaffri-sketch/Karachi-bites` with production branch `main`, or wait for the Vercel API deployment limit to reset and deploy the merged main commit. Then verify that the production homepage contains `kb-static-menu-styles` and no `cdn.tailwindcss`; the production Lighthouse workflow will run only after that marker is live.


## Follow-up production-first audit — 2026-10-20 UTC

- **Live production health check:** `GET /api/health` returned HTTP 200 with `database: postgresql` and `ready: true`. `GET /api/menu` returned HTTP 200 with the 12 required sample menu items. These read-only checks do not prove that creating and persisting a production order works.
- **Production deployment is stale:** Vercel's latest production target is still commit `fd35f1f`; the optimized homepage changes are merged to GitHub `main` at `0e2a6e8` and later audit commit `9c1e011`, but production has not received them. Vercel reported the free deployment API limit (>100/day); do not claim the new homepage is live.
- **Tracking defect:** source comparison confirmed that `public/js/api.js` calls `POST /api/orders/:id/track` with only `phone`, while `src/routes.js` exposes `POST /api/orders/track` and requires `orderId` plus `phone`. A production-first fix branch based on current `main` corrects this and adds a regression test.
- **Previous PR #10 should not be merged as-is:** its branch was based before the merged homepage performance work. Its Lighthouse run showed Performance 56/100 and Accessibility 95/100; the tests passed, but the 85-point performance gate failed. The replacement branch is based on current `main` so it preserves the optimized homepage.
- **CI hardening:** the test workflow now checks JavaScript syntax under `public/`, `src/`, and `test/`, not only frontend files. The complete test suite is still required to pass on the replacement branch.
- **Supabase advisory review:** seven service-side tables have RLS enabled and no direct Data API policies. This is deny-by-default and should remain so unless a specific browser access policy is required; the server-side function uses the service-role key. Supabase also reports leaked-password protection disabled; enable and verify it in Auth settings before launch.
- **Not yet verified:** production order creation + persistence across requests/redeploys, staff status update then customer tracking, actual Supabase signup/confirmation, email/SMS OTP delivery, physical Android review, manual keyboard/screen-reader review, C1 Urdu/English + RTL, C3 print interaction, C4 reorder interaction, and the three-minute walkthrough video.
- No live orders or customer records were created or modified during this audit.


## Bonus requirement implementation follow-up — 2026-10-20 UTC

- **C1:** branch `feat/brief-bonus-features` adds a remembered Urdu/English toggle, LTR/RTL document direction and translations for common customer labels/category tabs. Automated and visual checks are pending; complete translation coverage is not yet certified.
- **C3:** adds a staff-only print-ticket link and `/kitchen-ticket.html`, which fetches ticket data through the protected API using the current staff session and applies print styles. Automated/browser print verification is pending.
- **C4:** adds a customer-facing order-again form after successful phone-verified tracking. Server-side validation checks customer fields and the original checkout phone; tests cover mismatch rejection and successful item/branch/total preservation. CI is pending.
- No production orders or customer records were created or changed. These changes are not live until reviewed, merged, deployed and verified on production.
