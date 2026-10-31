# Karachi Bites Complete Project Audit Report

**Document version:** 1.1  
**Evidence cut-off:** 31 October 2026  
**Repository:** https://github.com/exnesssjaffri-sketch/Karachi-bites  
**Production URL:** https://karachi-bites.vercel.app/  
**Verified main commit:** 2496846bfa2fe6aad8a216382b0ea52977118a36

## Student Information
- Student name: [To be completed]
- Student ID: [To be completed]
- Program / course: [To be completed]
- Department / institution: [To be completed]
- Supervisor: [To be completed]
- Academic year: [To be completed]

## Executive Summary
Karachi Bites is a full-stack restaurant ordering and management application. Its frontend uses vanilla HTML, CSS and JavaScript. Its backend uses Node.js and Express. The application includes a customer menu/cart/checkout and tracking experience, staff order management, admin-only menu management, Urdu/English language support and right-to-left layout. Local and CI tests use an isolated SQLite database; Supabase PostgreSQL is the production persistence target.

The current repository main branch is commit 2496846bfa2fe6aad8a216382b0ea52977118a36, pushed on 31 October 2026. On that commit, the latest GitHub Actions Tests run (41189800713) succeeded. The workflow checked JavaScript syntax, passed the BOM/empty scan for 55 files, ran 16 named test suites and ended with “All test suites passed”. The latest Lighthouse workflow (41189800852) also succeeded. Live production scores at 360x800 were Performance 94, Accessibility 100, Best Practices 100 and SEO 100.

**Important:** Passing CI and a successful production Lighthouse run do not prove that production order writes/persistence, real Supabase signup, provider-backed OTP delivery or physical-device accessibility have been fully verified.

## 30-Section Report Map

### 1. Project Background
Karachi Bites was built as a student project to demonstrate an online restaurant ordering and management workflow for a Karachi restaurant.

### 2. Problem Statement
The project addresses manual ordering, inconsistent price calculations, limited order visibility and the absence of a central staff order-management interface.

### 3. Objectives
Provide menu browsing, persistent cart behavior, server-calculated checkout totals, order tracking, staff/admin tools, localization and automated quality checks.

### 4. Project Scope
Customer ordering, staff operations, admin menu controls, REST API, database storage, authentication and bilingual web UX are in scope. Online payments, native mobile apps and live SMS delivery without provider configuration are not verified deliverables.

### 5. Stakeholders and Roles
Customers place and track orders; staff manage orders and print kitchen tickets; administrators additionally manage menu data and export orders.

### 6. Functional Requirements
The historical requirements audit covers F1-F12. Local/automated evidence exists for menu, search, cart, checkout validation, tracking, status transitions and staff/admin restrictions. Production persistence and some live account flows remain partial or pending.

### 7. Technology Stack
Vanilla HTML/CSS/JavaScript, Node.js 24.x, Express 5, SQLite for local/CI, Supabase PostgreSQL for production, Vercel hosting, JWT, bcrypt and Supabase Auth.

### 8. System Architecture
Browser frontend calls backend API routes. The historical audit identified both Express and Supabase Edge Function implementations; current production routing must be assessed separately from isolated CI tests.

### 9. Frontend Modules
The repository includes a Stitch-inspired homepage, a preserved API-backed customer application, staff/admin pages, kitchen ticket printing, shared cart logic and localization scripts.

### 10. Backend Responsibilities
Express handles middleware, route registration, input validation, authentication, database access and order-management services.

### 11. Database Design
The documented model separates menu items, branches, users, orders and order items. Order items preserve historical name/price snapshots. SQLite data is not automatically migrated to PostgreSQL.

### 12. API Documentation
The technical documentation describes 16 endpoints across health, menu, orders, tracking, reorder, authentication, staff/admin order management, menu administration and CSV export. Consult API.md for exact contracts.

### 13. Customer Ordering Workflow
Browse menu, add items to cart, select branch, enter customer details, submit validated checkout, receive generated order ID and track the order.

### 14. Cart and Checkout
The canonical delivery fee is Rs.150 per order. The backend calculates totals from trusted menu prices; client-supplied totals must not be trusted.

### 15. Order Tracking and Privacy
Public lookup omits customer PII. Detailed tracking and reorder require matching phone-number verification.

### 16. Staff and Admin Portal
Staff can view/filter orders, update valid statuses and print kitchen tickets. Menu CRUD and CSV export are restricted to administrators.

### 17. Authentication
The project retains JWT/bcrypt staff/admin authentication and adds Supabase Auth for customer identities. Application roles are enforced server-side.

### 18. Staff Two-Factor Authentication
A challenge-based email OTP flow is documented. Real email delivery, required secrets, migration state and production rollout still require controlled verification. SMS requires a configured phone provider/Twilio credentials.

### 19. Urdu/English and RTL
The interface supports bilingual labels and RTL direction. Automated localization contracts pass; native-reader review remains advisable.

### 20. Responsive Design and Accessibility
The testing report records 55/55 visual QA checks over 360, 390, 768, 1024 and 1280 pixel widths. Physical device, keyboard-only and screen-reader checks remain outstanding.

### 21. Security
Documented controls include server-side validation, JWT roles, bcrypt, parameterized SQL, rate limiting, Helmet/CSP, safe public order lookup and CSV formula-injection protection.

### 22. Deployment and Production Readiness
The application is hosted at the production URL above. Latest production Lighthouse is green; this does not prove that an order-write transaction persists correctly in the live database.

### 23. AI-Assisted Development History
AI_LOG.md contains summaries of work on Stitch assets/CSP/navigation, API-backed UI preservation, admin tools, branch validation, deployment evidence, credentials, auth/privacy and Lighthouse optimization. It explicitly states that full historical prompt transcripts are unavailable; no verbatim prompts are invented here.

### 24. Technical Decisions
DECISIONS.md records server-authoritative validation/totals, Rs.150 delivery, JWT/bcrypt, role separation, three branches, local SQLite versus production PostgreSQL, manual migrations and test strategy.

### 25. Bug Discovery and Repair
The history includes Stitch static-path/CSP/navigation defects, admin/branch gaps, totals/privacy risks, backend parity concerns, mobile/RTL issues, password visibility/contrast and PDF-generation problems.

### 26. Current BOM Repair
GitHub run 41042621005 failed because public/js/navbar.js had a UTF-8 BOM. Commit 2496846 removes it. Latest CI reports the BOM/empty check passed for 55 JavaScript files.

### 27. Automated Testing
Latest run 41189800713 executed 16 named suites: database, API, failure cases, persistence, admin menu, CSV export, frontend wiring, cart store, cart totals, account/Google/mobile, translation performance, mobile header translation, mobile responsive layout, staff 2FA source contract and i18n/RTL. All passed.

### 28. Lighthouse and Visual QA
Latest workflow 41189800852 reported exact-code CI scores of 98/100 Performance and 100/100 in Accessibility, Best Practices and SEO. Live production scores were 94/100 Performance and 100/100 in the other three categories.

### 29. Outstanding Limitations
Production order write/persistence round-trip, human Supabase signup, provider-backed email/SMS OTP, physical-device review, keyboard navigation and screen-reader checks remain separate validation tasks.

### 30. Conclusion and Next Steps
The main branch has green automated tests after the documentation corrections. The source-code baseline Lighthouse workflow and live production Lighthouse job passed on 31 October 2026. The project is best described as automated-test passing with documented production verification gaps, not as fully production-complete.

## Current GitHub Evidence

| Evidence | Current result |
|---|---|
| Current main branch head | 60a659e251549c56ba58ee127d7039c1d2804828 (documentation correction) |
| Application/source evidence baseline | 2496846bfa2fe6aad8a216382b0ea52977118a36 |
| Pull requests | 18 merged, 4 closed without merge, 0 open |
| Latest Tests run | 41191211956 - success (main docs head 60a659e2) |
| Earlier application-code Tests run | 41189800713 - success |
| Lighthouse run | 41189800852 - success |
| BOM scan | 55 files passed |
| Test suites | 16 named suites passed |
| Production Lighthouse | 94 / 100 / 100 / 100 |

- Current main: https://github.com/exnesssjaffri-sketch/Karachi-bites/commit/60a659e251549c56ba58ee127d7039c1d2804828
- Application/source evidence commit: https://github.com/exnesssjaffri-sketch/Karachi-bites/commit/2496846bfa2fe6aad8a216382b0ea52977118a36
- Latest Tests: https://github.com/exnesssjaffri-sketch/Karachi-bites/actions/runs/41191211956
- Lighthouse: https://github.com/exnesssjaffri-sketch/Karachi-bites/actions/runs/41189800852

## Historical Source Reports and Appendices
The full source records remain in the repository and should be consulted for original wording, dates and detailed evidence:
- AI_LOG.md
- DECISIONS.md
- docs/AUDIT_FINDINGS.md
- docs/REQUIREMENTS_AUDIT.md
- docs/BACKEND_HANDOVER.md
- docs/STAFF_PORTAL_2FA.md
- docs/SUPABASE_AUTH_SETUP.md
- docs/WALKTHROUGH_SCRIPT.md
- docs/submission/KARACHI_BITES_PROJECT_REPORT.md
- docs/submission/TECHNICAL_DOCUMENTATION.md
- docs/submission/INSTALLATION_GUIDE.md
- docs/submission/USER_MANUAL.md
- docs/submission/TESTING_REPORT.md
- docs/submission/DIAGRAMS.md

**AI transcript limitation:** AI_LOG.md states that complete historical Cline/ChatGPT transcripts were not provided. The decision and AI sections are evidence-based summaries, not fabricated verbatim chat logs.

**PDF status:** The PDF binary was not present in the GitHub docs/submission directory when checked on 31 October 2026. The Puppeteer-core generator in scripts/generate-pdf-fixed.js had not been verified as working. A separate corrected 18-page PDF was generated for the user from the verified source and CI evidence; it is delivered separately and is not claimed to be committed to this repository.
