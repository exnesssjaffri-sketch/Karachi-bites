#!/usr/bin/env node
/**
 * Karachi Bites PostgreSQL migration runner (Phase 2, F12).
 *
 * Purpose:
 *   - Apply the SQL files in supabase/migrations/ to a PostgreSQL database
 *     (Supabase) exactly once each, tracked in a schema_migrations table.
 *   - This is a standalone, manually-invoked deployment step. It is NEVER run
 *     automatically on Vercel cold starts. Runtime cold-start schema
 *     reconciliation in src/db.js (CREATE TABLE IF NOT EXISTS / ADD COLUMN IF
 *     NOT EXISTS) remains unchanged and does not execute migration files.
 *
 * Safety:
 *   - Each migration runs inside a transaction together with its tracking
 *     insert. If any statement fails, the whole migration rolls back, the
 *     filename and error are reported, and it is NOT recorded as applied.
 *   - Before applying the initial schema (which seeds menu IDs 1-12), the
 *     runner compares any existing rows for those IDs against the expected
 *     data. On a data conflict it halts with a clear report and applies
 *     nothing. Matching rows are left untouched (ON CONFLICT (id) DO NOTHING).
 *   - DATABASE_URL (which contains credentials) is never logged.
 *
 * Usage:
 *   node scripts/migrate.js            Apply pending migrations
 *   node scripts/migrate.js --check    Dry run: report status, change nothing
 *
 * Exit codes: 0 = success (or nothing to do), 1 = failure/aborted.
 */
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const MIGRATIONS_DIR = path.join(__dirname, '..', 'supabase', 'migrations');
const INITIAL_SCHEMA_FILE = '20261012112806_karachi_bites_initial_schema.sql';

// Source of truth for the seeded menu: src/db.js seedDatabase() (menu IDs 1-12).
// The migration seed inserts these exact values; conflicts with DIFFERENT data
// must block the seed so that existing production data is never overwritten.
const EXPECTED_MENU_ITEMS = [
  { id: 1, name: 'Chicken Malai Boti', price: 850, category: 'BBQ', tags: 'mild', available: true },
  { id: 2, name: 'Beef Seekh Kebab', price: 780, category: 'BBQ', tags: 'spicy', available: true },
  { id: 3, name: 'Mutton Karahi (half)', price: 1650, category: 'Karahi', tags: 'spicy', available: true },
  { id: 4, name: 'Chicken Karahi (half)', price: 1250, category: 'Karahi', tags: 'spicy', available: true },
  { id: 5, name: 'Chicken Biryani', price: 550, category: 'Rice', tags: 'spicy', available: true },
  { id: 6, name: 'Vegetable Pulao', price: 420, category: 'Rice', tags: 'veg', available: true },
  { id: 7, name: 'Zinger Paratha Roll', price: 450, category: 'Rolls', tags: 'spicy', available: true },
  { id: 8, name: 'Paneer Tikka Roll', price: 480, category: 'Rolls', tags: 'veg', available: true },
  { id: 9, name: 'Mint Margarita', price: 220, category: 'Drinks', tags: 'veg', available: true },
  { id: 10, name: 'Doodh Patti Chai', price: 150, category: 'Drinks', tags: 'veg', available: true },
  { id: 11, name: 'Gulab Jamun (2 pcs)', price: 250, category: 'Desserts', tags: 'veg', available: true },
  { id: 12, name: 'Kheer', price: 300, category: 'Desserts', tags: 'veg', available: true },
];

const dryRun = process.argv.slice(2).includes('--check');

function getConnectionString() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error(
      'ERROR: DATABASE_URL is not set. Configure it in your local .env or the shell environment\n' +
      '(never hard-code it and never commit it). This runner only talks to PostgreSQL;\n' +
      'local SQLite development does not need migrations.'
    );
    process.exit(1);
  }
  return url;
}

function listMigrationFiles() {
  if (!fs.existsSync(MIGRATIONS_DIR)) {
    console.error('ERROR: migrations directory not found: ' + MIGRATIONS_DIR);
    process.exit(1);
  }
  const files = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql'))
    .sort(); // Timestamps in filenames guarantee deterministic ordering.
  if (files.length === 0) {
    console.error('ERROR: no .sql migration files found in ' + MIGRATIONS_DIR);
    process.exit(1);
  }
  return files;
}
/**
 * Compare existing menu_items rows for IDs 1-12 with the expected seed data.
 * Returns an array of human-readable conflict descriptions (empty = safe).
 * Rows that match the expected data are fine (the seed will skip them via
 * ON CONFLICT (id) DO NOTHING); rows with DIFFERENT data block the migration.
 */
async function findMenuConflicts(client) {
  const tableExists = await client.query(
    "SELECT to_regclass('public.menu_items') AS reg"
  );
  if (!tableExists.rows[0].reg) return []; // Fresh database; nothing to conflict.

  const { rows } = await client.query(
    'SELECT id, name, price, category, tags, available FROM public.menu_items WHERE id BETWEEN 1 AND 12 ORDER BY id'
  );
  const conflicts = [];
  for (const row of rows) {
    const expected = EXPECTED_MENU_ITEMS.find((item) => item.id === Number(row.id));
    if (!expected) continue;
    const diffs = [];
    if (row.name !== expected.name) {
      diffs.push(`name: existing "${row.name}" vs expected "${expected.name}"`);
    }
    if (Number(row.price) !== expected.price) {
      diffs.push(`price: existing ${row.price} vs expected ${expected.price}`);
    }
    if ((row.category ?? null) !== expected.category) {
      diffs.push(`category: existing "${row.category}" vs expected "${expected.category}"`);
    }
    if ((row.tags ?? null) !== expected.tags) {
      diffs.push(`tags: existing "${row.tags}" vs expected "${expected.tags}"`);
    }
    if (row.available !== expected.available) {
      diffs.push(`available: existing ${row.available} vs expected ${expected.available}`);
    }
    if (diffs.length > 0) {
      conflicts.push(`menu_items id=${row.id}: ${diffs.join('; ')}`);
    }
  }
  return conflicts;
}

async function main() {
  const connectionString = getConnectionString();
  const files = listMigrationFiles();

  const client = new Client({ connectionString });
  try {
    await client.connect();
  } catch (err) {
    console.error('ERROR: could not connect to the PostgreSQL database:', err.message);
    process.exit(1);
  }

  try {
    // Tracking table: one row per successfully applied migration file.
    await client.query(
      `CREATE TABLE IF NOT EXISTS public.schema_migrations (
         filename text PRIMARY KEY,
         applied_at timestamptz NOT NULL DEFAULT now()
       )`
    );

    const { rows: appliedRows } = await client.query(
      'SELECT filename FROM public.schema_migrations'
    );
    const applied = new Set(appliedRows.map((r) => r.filename));

    console.log('Migration status:');
    for (const file of files) {
      console.log(`  ${applied.has(file) ? '[applied] ' : '[pending] '}${file}`);
    }
    const pending = files.filter((f) => !applied.has(f));

    if (pending.length === 0) {
      console.log('Nothing to do: all migrations are already applied.');
      return;
    }

    if (dryRun) {
      console.log(`DRY RUN (--check): ${pending.length} migration(s) would be applied. No changes made.`);
      return;
    }

    // Menu-seed conflict guard: must run before the initial schema migration
    // so a database with different live menu data is never silently altered.
    if (pending.includes(INITIAL_SCHEMA_FILE)) {
      const conflicts = await findMenuConflicts(client);
      if (conflicts.length > 0) {
        console.error(
          'ABORTED: existing menu_items rows for IDs 1-12 conflict with the expected seed data.\n' +
          'No migrations were applied and none were recorded. Resolve the conflicts manually\n' +
          '(update the database or the seed), then re-run this script.'
        );
        for (const conflict of conflicts) {
          console.error('  CONFLICT: ' + conflict);
        }
        process.exitCode = 1;
        return;
      }
      console.log('Menu conflict check passed: no conflicting rows for menu IDs 1-12.');
    }

    for (const file of pending) {
      const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8');
      console.log(`Applying: ${file}`);
      // Transaction-safe: the migration SQL and its tracking record commit or
      // roll back together. A failed migration is never marked applied.
      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query(
          'INSERT INTO public.schema_migrations (filename) VALUES ($1) ON CONFLICT (filename) DO NOTHING',
          [file]
        );
        await client.query('COMMIT');
        console.log(`Applied:  ${file}`);
      } catch (err) {
        await client.query('ROLLBACK');
        console.error(`FAILED:   ${file}`);
        console.error('  Error: ' + err.message);
        console.error(
          '  The migration was rolled back and NOT recorded as applied. Fix the issue and re-run.'
        );
        process.exitCode = 1;
        return;
      }
    }

    console.log('All pending migrations applied successfully.');
  } finally {
    await client.end().catch(() => {});
  }
}

main().catch((err) => {
  console.error('Unhandled migration runner error:', err.message);
  process.exit(1);
});