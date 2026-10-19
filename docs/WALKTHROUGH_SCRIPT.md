# Karachi Bites — 3-minute walkthrough recording script

**Purpose:** Record the actual deployed site and demonstrate the student brief. This is a script/checklist, not a substitute for the final screen-recorded video.

## Before recording
- Open `https://karachi-bites.vercel.app/` in Chrome at desktop width.
- Keep DevTools closed for the customer-facing walkthrough; use a second browser tab for the API evidence.
- Do not display passwords, tokens, environment variables, private customer addresses, or real phone numbers.
- Use a test customer and an isolated/test database for order creation. Do not place a test order in production unless the restaurant owner explicitly authorizes it.

## Timeline and narration

### 0:00–0:20 — Live homepage
Show the Karachi Bites homepage and explain the vanilla HTML/CSS/JS frontend with the Node/Express API. Briefly show the menu and categories.

### 0:20–0:45 — Menu, search and filters
Search for a menu item, change category/filter controls, and show the results updating. Point out item prices and availability.

### 0:45–1:10 — Cart and checkout
Add an item, change its quantity, refresh the page to demonstrate cart persistence, then open checkout. Show the Rs.150 delivery fee and required customer/branch validation. Use test data only.

### 1:10–1:35 — Order confirmation and tracking
Submit an order in the isolated test environment. Show the generated order ID. Open tracking and demonstrate that both the order ID and checkout phone are required. Never reveal another customer's details.

### 1:35–2:05 — Staff/admin portal
Open `/admin`, sign in using a designated test staff account, show order filters, and progress a test order through valid status transitions. Show that staff cannot mutate menu items; demonstrate menu CRUD only with a designated admin test account.

### 2:05–2:25 — Security and persistence evidence
Show the GitHub Actions test run and briefly explain server-side totals, validated order status transitions, phone-verified tracking, and the public order response's omission of customer PII.

### 2:25–2:45 — Database and deployment evidence
Show the production health endpoint returning HTTP 200 with PostgreSQL `ready: true`, the menu endpoint returning 12 items, and the Vercel production deployment marked READY.

### 2:45–3:00 — Limitations and close
Mention any remaining manual checks honestly: Lighthouse artifact/score, real 360px device review, actual Supabase account signup, and SMS OTP delivery if the provider is not configured. Do not claim a feature is verified unless it was demonstrated.

## Final recording checklist
- [ ] Capture the actual browser and real interaction; no fabricated UI or fake PASS logs.
- [ ] Use only designated test accounts and non-production test orders.
- [ ] Keep private data and secrets out of the recording.
- [ ] Export MP4 and verify audio, legibility, and duration under 3:00.
- [ ] Add the final video link to the README/submission package.
