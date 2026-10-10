# AI_LOG.md — Karachi Bites

This log records AI-assisted work that can be tied to the available project history and this conversation. Earlier Cline/ChatGPT session transcripts were not provided as a complete archive, so entries below are summaries rather than fabricated verbatim prompts. Add the exact original prompt and timestamp when exporting additional Cline history.

## 1. Investigate why Stitch pages were missing from Vercel

- **Prompt summary:** Inspect the Karachi Bites frontend because exported Stitch pages were not appearing on the deployed site.
- **Finding:** Stitch HTML files had been saved outside the public static directory.
- **Change made:** Added standalone previews under `public/stitch/` and a gallery at `/stitch/`.
- **What the AI initially got wrong:** HTTP 200 and a READY deployment were treated as sufficient proof that the Stitch designs were integrated into the main production app.
- **Correction:** Distinguish direct page availability from integration into the homepage and from functional order-flow testing.

## 2. Fix the frontend Content Security Policy for Stitch assets

- **Prompt summary:** Make the published Stitch pages render their Tailwind styles and hosted food images in the existing Express app.
- **Finding:** The default Helmet Content Security Policy did not permit the Tailwind browser CDN.
- **Change made:** Explicitly allowed the Tailwind CDN/compiler and HTTPS images in the CSP.
- **Verification boundary:** HTTP responses were checked; a full visual browser test still needs to be run.

## 3. Preserve the original API-backed ordering frontend

- **Prompt summary:** Publish the Stitch design without losing the working frontend and API routes.
- **Change made:** Preserved the earlier customer SPA at `/app.html` and changed the root page to use the Stitch home design.
- **Important limitation:** Stitch cart/checkout/confirmation/tracking screens remain visual previews, not real API-connected ordering screens.

## 4. Repair Stitch navigation

- **Prompt summary:** Make the Stitch page navigation point to valid deployed routes.
- **Change made:** Updated the navigation script so its home destination points to the root and its cart control opens the cart preview.
- **What the AI got wrong:** One intermediate remote edit inserted escaped newline text into JavaScript.
- **Correction:** Replaced the file with a clean JavaScript implementation, then verified the deployed script response.

## 5. Add a staff/admin order-management interface

- **Prompt summary:** Complete the missing admin dashboard called out in the requirements audit.
- **Change made:** Added a login page and order dashboard backed by `POST /api/auth/login`, `GET /api/admin/orders`, and `PATCH /api/admin/orders/:id/status`.
- **Security approach:** Store the JWT for the current browser session only; rely on server-side role checks; render returned customer/order data via text nodes rather than inserting it as HTML.
- **Verification still required:** Sign in as admin and staff, test filters, exercise each allowed status transition, and confirm invalid transitions are rejected.

## 6. Enable all three required branches

- **Prompt summary:** Align branch validation, seed data and checkout with the assignment's three branches.
- **Change made:** Added Clifton, Gulshan-e-Iqbal and North Nazimabad to branch validation and idempotent database seeding; added a branch selector to the API-backed checkout.
- **Verification still required:** Run automated tests for each valid branch and for an unsupported branch, including on an existing database.

## 7. Correct the deployment-status audit

- **Prompt summary:** Check whether the Stitch pages are genuinely visible on the production Vercel deployment.
- **Finding:** Vercel had a READY production deployment and the individual `/stitch/` pages returned HTTP 200, but the root route was still serving the previous SPA before the homepage change.
- **Correction:** Report separate statuses for deployment readiness, route availability, visual rendering, integration, and end-to-end functionality rather than marking all of them “working” together.

## 8. Add setup and maintenance documentation

- **Prompt summary:** Address the missing README deliverable found in the requirements traceability report.
- **Change made:** Added setup instructions, environment-variable guidance, route/API overview, tests, folder map and explicit verification limitations.
- **Verification still required:** Follow the README from a clean checkout on a machine with Node.js 24 and confirm every command and environment-variable name.

## Remaining honesty notes

- The original PDF remains the source of requirements; do not change priorities based on assumptions.
- No production order should be created just to make a test appear to pass.
- A deployment HTTP check is not a substitute for an actual browser test or persistence check.
- The walkthrough video, mobile browser session, Slow-3G performance budget, production persistence, and all API-connected Stitch transaction flows have not been proven by this log.

## 9. Remove predictable production demo credentials

- **Finding:** The code originally seeded `admin/admin123` and `staff/staff123` without regard to environment, creating a known-credential risk if the public deployment initialized a fresh database.
- **Change made:** Production user seeding now requires encrypted `ADMIN_USERNAME` / `ADMIN_PASSWORD` and optional staff variables. Existing seeded demo accounts are removed only if their stored bcrypt hashes match the known demo passwords and their usernames are not the configured production usernames.
- **Verification still required:** Confirm production env variables are available to the new deployment, then verify an authorized admin login, staff denial from admin routes, and that known demo credentials cannot authenticate in production.
