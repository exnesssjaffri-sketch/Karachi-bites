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
| S1 | Admin Menu CRUD | Planned/In-Progress |
| S2 | CSV Export (Injection Safe) | Pending |
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
All 4 test suites (`test_db.js`, `test_api.js`, `test_failures.js`, `test_persistence.js`) passed successfully as of 10/15/2026.

## 6. Remaining Work
- Implement CSV export endpoint with proper sanitization to prevent injection.
- Complete Admin Menu CRUD features (S1).
- Perform manual browser E2E testing.

## 7. Git Status
Project is at v1.0.0. Current local state matches the requirements specified in the student brief.
