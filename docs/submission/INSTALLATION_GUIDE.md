# Karachi Bites — Installation Guide

This guide describes the software and tools required to run the project locally.

---

# Required Software and Versions

| Software | Minimum Version | Notes |
| --- | --- | --- |
| Node.js | ≥ 24, < 25 | Declared in `package.json` `engines`. Download from https://nodejs.org/ |
| npm | Bundled with Node.js | Used for dependency installation and running scripts |
| Git | Any recent version | Required to clone the repository |
| SQLite | Included with sqlite3 npm package | No separate install needed for local development |
| PostgreSQL | Any recent version (12+) | Required only for production/local PostgreSQL testing. Supabase is used in production. |

No frontend framework (React, Angular, Vue, etc.) or bundler (Webpack, Vite, etc.) is required.

---

# Step-by-Step Installation

## 1. Clone the Repository

```bash
git clone https://github.com/exnesssjaffri-sketch/Karachi-bites.git
cd Karachi-bites
```

## 2. Install Dependencies

```bash
npm install
```

This installs Express, bcrypt, jsonwebtoken, sqlite3, pg, helmet, express-rate-limit, dotenv, and puppeteer-core (for visual QA).

## 3. Configure Environment Variables

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` and set the following required values:

```env
PORT=3000
NODE_ENV=development
JWT_SECRET=<generate-with-node-crypto-randomBytes-32>
DATABASE_PATH=./karachi_bites.db
USE_SQLITE=true
DELIVERY_FEE=150
ADMIN_USERNAME=admin
ADMIN_PASSWORD=<a-strong-password-min-12-chars>
STAFF_USERNAME=staff
STAFF_PASSWORD=<a-strong-password-min-12-chars>
```

To generate a random JWT secret:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Never commit `.env` to the repository.** The `.gitignore` file already excludes it.

## 4. Start the Application

```bash
npm start
```

The server will print: `Karachi Bites backend running on http://localhost:3000`

## 5. Open the Application

Open the following URLs in your browser:

- **Homepage:** http://localhost:3000/
- **Ordering app:** http://localhost:3000/app.html
- **Staff/Admin dashboard:** http://localhost:3000/admin
- **API health:** http://localhost:3000/api/health
- **Menu API:** http://localhost:3000/api/menu

---

# Running Tests

```bash
npm test
```

This runs all 17 test suites sequentially. Each suite starts its own isolated server process with a temporary SQLite database in `/tmp`.

---

# Production Database Setup (PostgreSQL)

To use PostgreSQL instead of SQLite:

1. Set `USE_SQLITE=false` in `.env`.
2. Set `DATABASE_URL` to your PostgreSQL connection string:

   ```env
   DATABASE_URL=postgresql://user:password@localhost:5432/karachi_bites
   ```

3. Apply migrations manually:

   ```bash
   node scripts/migrate.js
   ```

   Or dry-run first:

   ```bash
   node scripts/migrate.js --check
   ```

**Note:** SQLite data is **not** automatically migrated to PostgreSQL. If you need to preserve existing SQLite data, export it manually before switching.

---

# Troubleshooting

| Issue | Solution |
| --- | --- |
| `FATAL: JWT_SECRET is required but not set` | Set `JWT_SECRET` in `.env` |
| `Cannot find module 'sqlite3'` | Run `npm install` again; ensure you have a C++ build toolchain on Windows |
| `DATABASE_URL is not configured` | Either set `USE_SQLITE=true` or provide a valid `DATABASE_URL` |
| Server fails to start on port 3000 | Change `PORT` in `.env` or stop another process using port 3000 |
| `npm test` fails with module resolution error | Ensure you are running tests from the project root directory |

---

# Development Workflow

1. Make code changes.
2. Run `npm test` to verify all tests pass.
3. Run `npm start` to test the application manually.
4. Commit changes with a descriptive message.
5. Push to GitHub; GitHub Actions will run tests and Lighthouse automatically.
