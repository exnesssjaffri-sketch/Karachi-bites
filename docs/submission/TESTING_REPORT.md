# Karachi Bites — Testing Report

This report documents the automated test suite, current GitHub Actions status, and remaining manual testing gaps.

---

# 1. Automated Test Suite

The project includes 17 test suites under `test/`, run via `npm test`.

## Test Summary

| # | Test File | What It Tests | Result |
|---|-----------|--------------|--------|
| 1 | `test_db.js` | Database seeding, 12 menu items, 3 branches, validation | PASS |
| 2 | `test_api.js` | Menu retrieval, order creation, auth, admin orders, status transitions, kitchen ticket | PASS |
| 3 | `test_failures.js` | Missing/invalid fields, invalid phone, unsupported branch, invalid status jumps, auth failures, staff 403 | PASS |
| 4 | `test_persistence.js` | SQLite order persistence across separate server process restarts | PASS |
| 5 | `test_admin_menu.js` | Admin menu CRUD: create, update, hide, unhide, soft-delete, historical order preservation | PASS |
| 6 | `test_csv_export.js` | CSV generation, formula-injection protection, date filters, staff 403 on export | PASS |
| 7 | `test_frontend_wiring.js` | Router, cart store, i18n, tracking, kitchen ticket, reorder wiring | PASS |
| 8 | `test_cart_store.js` | localStorage cart persistence, add/increment, quantity change, removal | PASS |
| 9 | `test_cart_total_property.js` | Quantity property regression, total correctness, cart retained after failed checkout | PASS |
| 10 | `test_account_google_mobile.js` | Account header, Google OAuth contract, mobile scroll | PASS |
| 11 | `test_live_translation_performance.js` | Translation key count, lookup speed, fallback behaviour | PASS |
| 12 | `test_mobile_header_translation.js` | Header translation rendering at mobile viewport | PASS |
| 13 | `test_mobile_responsive_layout.js` | No horizontal overflow at mobile/tablet/desktop viewports | PASS |
| 14 | `test_staff_2fa_contract.js` | Supabase Edge Function OTP source markers present | PASS |
| 15 | `test_i18n_rtl.js` | Urdu labels, RTL CSS, font loading | PASS |
| 16 | `test_password_visibility.js` | Password input type toggling | PASS |

All 16 suites pass when run locally against a temporary SQLite database.

---

# 2. GitHub Actions Status

## Workflows

### `test.yml`
- Runs on every push and pull request to `main`.
- Installs Node.js 24, runs `npm install`, checks syntax of all `.js` files, then executes `npm test`.

### `lighthouse.yml`
- Runs on push to `main` and on PRs touching frontend files.
- Starts the app with an isolated SQLite database, runs Lighthouse at 360\u00d7800 mobile viewport, enforces Performance \u2265 85 and Accessibility \u2265 85.

## Latest Run Evidence (as of 2026-10-30)

| Run ID | Workflow | Conclusion | Commit | URL |
|--------|----------|-----------|--------|-----|
| 41035876169 | Tests | **failure** | 90dd0bce3c | https://github.com/exnesssjaffri-sketch/Karachi-bites/actions/runs/41035876169 |
| 41035876147 | Lighthouse and Accessibility Audit | **success** | 90dd0bce3c | https://github.com/exnesssjaffri-sketch/Karachi-bites/actions/runs/41035876147 |

**Important:** The most recent Tests run (41035876169) failed. Earlier passing runs (e.g., run 107) must not be cited as current evidence. The cause of the failure should be investigated before submission.

The latest Lighthouse run succeeded, confirming that the optimized homepage code scores well on performance and accessibility at the target 360\u00d7800 mobile viewport.

---

# 3. Visual QA Results

The `visual-qa.js` script uses Puppeteer (connected to Microsoft Edge DevTools) to render the application at five viewports and check for layout issues.

| Viewport | Width | Checks | Result |
|----------|-------|--------|--------|
| mobile-360 | 360 px | 11 / 11 | All PASS |
| mobile-390 | 390 px | 11 / 11 | All PASS |
| tablet-768 | 768 px | 11 / 11 | All PASS |
| desktop-1024 | 1024 px | 11 / 11 | All PASS |
| desktop-1280 | 1280 px | 11 / 11 | All PASS |

**Total: 55 / 55 checks passed.**

Checks include:
- Homepage renders without console errors
- Menu page renders without console errors
- Cart page renders without console errors
- Checkout page renders without console errors
- No horizontal overflow at the viewport width
- Delivery fee displays Rs. 150
- Total = Subtotal + 150
- All checkout form fields are present
- Urdu RTL direction is applied correctly

Screenshots are saved in `visual-qa-output/` and have been copied to `docs/submission/screenshots/`.

---

# 4. Remaining Manual Testing Gaps

The following tests have **not** been performed and are outstanding:

1. **Real browser E2E** \u2014 full customer order flow (browse \u2192 cart \u2192 checkout \u2192 track) tested in a real browser against the production site.
2. **Physical mobile device testing** \u2014 touch interaction, font rendering, and visual appearance on a real Android or iOS device.
3. **Keyboard-only navigation** \u2014 tab-through review of all customer and staff pages.
4. **Screen-reader review** \u2014 NVDA or VoiceOver traversal of the application.
5. **Supabase customer signup / email confirmation** \u2014 end-to-end test of the Supabase Auth flow.
6. **Real SMS OTP delivery** \u2014 Twilio credentials are not configured; SMS OTP is unreachable.
7. **Production order write test** \u2014 a non-destructive order create \u2192 read \u2192 status update \u2192 verify persistence test against the live PostgreSQL database.
8. **GitHub Actions Tests failure investigation** \u2014 the cause of run 41035876169 must be identified and fixed.

These gaps are documented honestly and should not be presented as completed work.
