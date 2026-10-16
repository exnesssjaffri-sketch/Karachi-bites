# Karachi Bites Backend Handover Document

## 1. Architecture
Karachi Bites is a Node.js/Express-based backend application designed for a restaurant ordering system.
- **Runtime:** Node.js (v24.x)
- **Framework:** Express
- **Database:** SQLite (default for development) or PostgreSQL
- **Security:** Helmet for headers, JWT for authentication, bcrypt for password hashing, rate-limiting for DDoS/brute-force protection.
- **Workflow:** Order creation, status tracking, and admin dashboard with role-based access control (RBAC).

## 2. Requirement Matrix
| Feature ID | Description | Status |
| :--- | :--- | :--- |
| F1 | Menu API fields & filters | Implemented |
| F2 | Checkout with delivery fee (Rs 150) | Implemented |
| F3 | JWT Auth | Implemented |
| F4 | Admin Orders View | Implemented |
| F5 | Status Transitions | Implemented |
| S1 | Admin Menu CRUD | Implemented |
| S2 | CSV Export (Injection Safe) | Implemented |
| S3 | Security hardening | Implemented |
| S4 | API Error Standards | Implemented |

## 3. API Documentation
See `API.md` for detailed endpoint descriptions, including request/response formats, security requirements, and error handling.

## 4. Run Instructions
1. `npm install`
2. Create `.env` from `.env.example`.
3. Set `JWT_SECRET`.
4. `npm start`
5. Visit `http://localhost:3000`.

## 5. Test Report
All 6 test suites passed successfully as of 10/15/2026:
- `test_db.js` — Database, branch seed and validation tests
- `test_api.js` — API tests (menu, orders, auth, admin filters, status transitions)
- `test_failures.js` — API failure and authorization tests
- `test_persistence.js` — Persistence test (separate server processes)
- `test_admin_menu.js` — Admin Menu CRUD tests (S1)
- `test_csv_export.js` — CSV Export tests (S2)

## 6. Remaining Work
- Perform manual browser E2E testing.
- Verify production database persistence and deployment configuration.

## 7. Git Status
Project is at v1.0.0. Current local state matches the requirements specified in the student brief.
