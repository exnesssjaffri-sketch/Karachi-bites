const sqlite3 = require('sqlite3').verbose();
const { Pool } = require('pg');
const path = require('path');
require('dotenv').config();

const DB_PATH = process.env.DATABASE_PATH || path.join(__dirname, '..', 'karachi_bites.db');
const USE_SQLITE = process.env.USE_SQLITE === 'true';
const DATABASE_URL = process.env.DATABASE_URL;

let db = null;
let pool = null;
let resolveDatabaseReady;

const databaseReady = new Promise((resolve) => {
  resolveDatabaseReady = resolve;
});

function getDb() {
  if (USE_SQLITE) {
    if (db) return db;
    db = new sqlite3.Database(DB_PATH, (err) => {
      if (err) {
        console.error('Failed to open database:', err.message);
        process.exit(1);
      }
    });
    return db;
  }
  if (pool) return pool;
  if (!DATABASE_URL) {
    const msg = 'DATABASE_URL is not configured. Set it in Vercel Project Settings > Environment Variables.';
    console.error(msg);
    throw new Error(msg);
  }
  pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    // Vercel can create many short-lived function instances. Keep the pool
    // small per instance to avoid exhausting Supabase's shared connection budget.
    max: Math.max(1, Math.min(3, Number.parseInt(process.env.PG_POOL_MAX || '2', 10) || 2)),
    idleTimeoutMillis: 10000,
    connectionTimeoutMillis: 10000,
    allowExitOnIdle: true,
  });
  // Handle pool-level errors to prevent unhandled rejections in serverless
  pool.on('error', (err) => {
    console.error('Unexpected PostgreSQL pool error:', err.message);
  });
  return pool;
}

function isSqlite() {
  return USE_SQLITE;
}

/**
 * Convert SQL `?` placeholders to PostgreSQL `$1, $2, ...` style.
 * The pg module only supports numbered placeholders.
 * Handles edge cases: string literals containing `?`, comments, escaped quotes.
 */
function parameterizeSql(sql) {
  let idx = 0;
  let inString = false;
  let inLineComment = false;
  let inBlockComment = false;
  let result = '';
  let prevChar = '';

  for (let i = 0; i < sql.length; i++) {
    const ch = sql[i];
    const nextCh = sql[i + 1];

    // Track comment state
    if (!inString) {
      if (inLineComment) {
        if (ch === '\n') inLineComment = false;
        result += ch;
        continue;
      }
      if (inBlockComment) {
        if (ch === '*' && nextCh === '/') {
          result += '*/';
          i++;
          inBlockComment = false;
          continue;
        }
        result += ch;
        continue;
      }
      if (ch === '-' && nextCh === '-') {
        inLineComment = true;
        result += '--';
        i++;
        continue;
      }
      if (ch === '/' && nextCh === '*') {
        inBlockComment = true;
        result += '/*';
        i++;
        continue;
      }
    }

    // Track string literal state
    if (!inLineComment && !inBlockComment) {
      if (ch === "'" && !inString) {
        inString = true;
        result += ch;
        continue;
      }
      if (ch === "'" && inString) {
        // Check for escaped quote ''
        if (nextCh === "'") {
          result += "''";
          i++;
          continue;
        }
        inString = false;
        result += ch;
        continue;
      }
      if (inString) {
        result += ch;
        continue;
      }
    }

    // Replace placeholder only outside strings and comments
    if (ch === '?') {
      result += `$${++idx}`;
    } else {
      result += ch;
    }
    prevChar = ch;
  }
  return result;
}

/**
 * Return the SQL expression for "current timestamp" that is valid for the
 * active driver.  SQLite uses `datetime('now')`; PostgreSQL uses `CURRENT_TIMESTAMP`.
 */
function nowExpression() {
  return USE_SQLITE ? "datetime('now')" : 'CURRENT_TIMESTAMP';
}

/**
 * For PostgreSQL INSERT statements that do not already include a RETURNING
 * clause, append `RETURNING id` so callers can read back the generated
 * primary key through `result.rows[0].id`.
 */
function ensureReturning(sql) {
  if (/^\s*INSERT\s+/i.test(sql) && !/RETURNING/i.test(sql)) {
    return sql + ' RETURNING id';
  }
  return sql;
}

async function query(sql, params = [], client = null) {
  const database = getDb();
  if (USE_SQLITE) {
    return new Promise((resolve, reject) => {
      database.all(sql, params, (err, rows) => {
        if (err) return reject(err);
        resolve(rows || []);
      });
    });
  }
  const pgClient = client || database;
  const result = await pgClient.query(parameterizeSql(sql), params);
  return result.rows || [];
}

async function get(sql, params = [], client = null) {
  const database = getDb();
  if (USE_SQLITE) {
    return new Promise((resolve, reject) => {
      database.get(sql, params, (err, row) => {
        if (err) return reject(err);
        resolve(row);
      });
    });
  }
  const pgClient = client || database;
  const result = await pgClient.query(parameterizeSql(sql), params);
  return result.rows[0];
}

async function run(sql, params = [], client = null) {
  const database = getDb();
  if (USE_SQLITE) {
    return new Promise((resolve, reject) => {
      database.run(sql, params, function (err) {
        if (err) return reject(err);
        resolve({ changes: this.changes, lastID: this.lastID });
      });
    });
  }
  const pgClient = client || database;
  const result = await pgClient.query(ensureReturning(parameterizeSql(sql)), params);
  return { changes: result.rowCount, lastID: result.rows[0] ? result.rows[0].id : null };
}

async function runWithinTransaction(client, sql, params = []) {
  if (USE_SQLITE) {
    return new Promise((resolve, reject) => {
      client.run(sql, params, function (err) {
        if (err) return reject(err);
        resolve({ changes: this.changes, lastID: this.lastID });
      });
    });
  }
  const result = await client.query(ensureReturning(parameterizeSql(sql)), params);
  return { changes: result.rowCount, lastID: result.rows[0] ? result.rows[0].id : null };
}

async function beginTransaction(client) {
  if (USE_SQLITE) {
    return new Promise((resolve, reject) => {
      client.run('BEGIN TRANSACTION', (err) => err ? reject(err) : resolve());
    });
  }
  await client.query('BEGIN');
}

async function commitTransaction(client) {
  if (USE_SQLITE) {
    return new Promise((resolve, reject) => {
      client.run('COMMIT', (err) => err ? reject(err) : resolve());
    });
  }
  await client.query('COMMIT');
}

async function rollbackTransaction(client) {
  if (USE_SQLITE) {
    return new Promise((resolve, reject) => {
      client.run('ROLLBACK', (err) => err ? reject(err) : resolve());
    });
  }
  await client.query('ROLLBACK');
}

async function getOne(sql, params = [], client = null) {
  return get(sql, params, client);
}

async function getAll(sql, params = [], client = null) {
  return query(sql, params, client);
}

function prepare(sql) {
  if (USE_SQLITE) {
    const database = getDb();
    const stmt = database.prepare(sql);
    return {
      run: (...params) => new Promise((resolve, reject) => {
        stmt.run(...params, function (err) {
          if (err) return reject(err);
          resolve({ changes: this.changes, lastID: this.lastID });
        });
      }),
      finalize: () => stmt.finalize(),
    };
  }
  return null;
}

async function withTransaction(callback) {
  const database = getDb();
  if (USE_SQLITE) {
    await run('BEGIN TRANSACTION');
    try {
      const fakeClient = {
        run: (sql, params) => run(sql, params),
        get: (sql, params) => get(sql, params),
        all: (sql, params) => getAll(sql, params),
      };
      const result = await callback(fakeClient);
      await run('COMMIT');
      return result;
    } catch (err) {
      await run('ROLLBACK');
      throw err;
    }
  }
  const client = await database.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

function ensureColumn(database, table, column, definition) {
  return new Promise((resolve, reject) => {
    if (!USE_SQLITE) {
      // PostgreSQL: use information_schema to check column existence
      database.query(
        `SELECT column_name FROM information_schema.columns WHERE table_name = $1 AND column_name = $2`,
        [table, column],
        (err, result) => {
          if (err) return reject(err);
          const rows = result ? result.rows : [];
          if (rows.length === 0) {
            database.query(`ALTER TABLE ${table} ADD COLUMN IF NOT EXISTS ${column} ${definition}`, (alterErr) => {
              if (alterErr) return reject(alterErr);
              resolve();
            });
          } else {
            resolve();
          }
        }
      );
    } else {
      // SQLite: use PRAGMA table_info
      database.all(`PRAGMA table_info(${table})`, (err, rows) => {
        if (err) return reject(err);
        const existing = new Set((rows || []).map((r) => r.name));
        if (!existing.has(column)) {
          database.run(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`, (alterErr) => {
            if (alterErr) return reject(alterErr);
            resolve();
          });
        } else {
          resolve();
        }
      });
    }
  });
}

function ensureSQLiteMigrations(database) {
  const migrations = [
    { table: 'menu_items', column: 'description', definition: "TEXT NOT NULL DEFAULT ''" },
    { table: 'menu_items', column: 'image', definition: "TEXT NOT NULL DEFAULT ''" },
    { table: 'menu_items', column: 'created_at', definition: "TEXT NOT NULL DEFAULT (datetime('now'))" },
    { table: 'menu_items', column: 'updated_at', definition: "TEXT NOT NULL DEFAULT (datetime('now'))" },
    { table: 'orders', column: 'customer_email', definition: 'TEXT' },
    { table: 'orders', column: 'customer_notes', definition: 'TEXT' },
    { table: 'orders', column: 'idempotency_key', definition: 'TEXT' },
    { table: 'orders', column: 'updated_at', definition: "TEXT NOT NULL DEFAULT (datetime('now'))" },
    { table: 'users', column: 'created_at', definition: "TEXT NOT NULL DEFAULT (datetime('now'))" },
    { table: 'users', column: 'updated_at', definition: "TEXT NOT NULL DEFAULT (datetime('now'))" },
  ];
  return migrations.reduce((promise, m) => promise.then(() => ensureColumn(database, m.table, m.column, m.definition)), Promise.resolve());
}

// PostgreSQL reconciliation: add columns the app expects but that may be missing
// from the Supabase migration history (e.g. customer_notes, idempotency_key).
// Uses ADD COLUMN IF NOT EXISTS so it is safe to run on every cold start.
function ensurePgMigrations(database) {
  const migrations = [
    { table: 'orders', column: 'customer_notes', definition: 'TEXT' },
    { table: 'orders', column: 'idempotency_key', definition: 'TEXT' },
  ];
  return migrations.reduce((promise, m) => promise.then(() => ensureColumn(database, m.table, m.column, m.definition)), Promise.resolve());
}

function initDatabase() {
  if (USE_SQLITE) {
    const database = getDb();
    database.serialize(() => {
      database.run(`
        CREATE TABLE IF NOT EXISTS menu_items (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          price INTEGER NOT NULL CHECK (price >= 0),
          category TEXT,
          tags TEXT,
          available INTEGER NOT NULL DEFAULT 1 CHECK (available IN (0, 1)),
          description TEXT NOT NULL DEFAULT '',
          image TEXT NOT NULL DEFAULT '',
          created_at TEXT NOT NULL DEFAULT (datetime('now')),
          updated_at TEXT NOT NULL DEFAULT (datetime('now'))
        )
      `);
      database.run(`
        CREATE TABLE IF NOT EXISTS branches (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL UNIQUE,
          created_at TEXT NOT NULL DEFAULT (datetime('now'))
        )
      `);
      ['Clifton', 'Gulshan-e-Iqbal', 'North Nazimabad'].forEach((branch) => {
        database.run('INSERT OR IGNORE INTO branches (name) VALUES (?)', [branch]);
      });
      database.run(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT NOT NULL UNIQUE,
          password_hash TEXT NOT NULL,
          role TEXT NOT NULL DEFAULT 'staff' CHECK (role IN ('admin', 'staff')),
          created_at TEXT NOT NULL DEFAULT (datetime('now')),
          updated_at TEXT NOT NULL DEFAULT (datetime('now'))
        )
      `);
      database.run(`
        CREATE TABLE IF NOT EXISTS orders (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          public_order_id TEXT NOT NULL UNIQUE,
          customer_name TEXT NOT NULL CHECK (length(trim(customer_name)) BETWEEN 2 AND 100),
          customer_phone TEXT NOT NULL CHECK (length(trim(customer_phone)) = 11),
          customer_address TEXT NOT NULL CHECK (length(trim(customer_address)) BETWEEN 5 AND 500),
          customer_email TEXT,
          customer_notes TEXT,
          subtotal INTEGER NOT NULL DEFAULT 0 CHECK (subtotal >= 0),
          discount INTEGER NOT NULL DEFAULT 0 CHECK (discount >= 0),
          tax_gst INTEGER NOT NULL DEFAULT 0 CHECK (tax_gst >= 0),
          packaging_fee INTEGER NOT NULL DEFAULT 0 CHECK (packaging_fee >= 0),
          promo_code TEXT,
          branch TEXT NOT NULL CHECK (branch IN ('Clifton', 'Gulshan-e-Iqbal', 'North Nazimabad')),
          status TEXT NOT NULL DEFAULT 'Received' CHECK (status IN ('Received', 'Preparing', 'Out for Delivery', 'Delivered')),
          total INTEGER NOT NULL CHECK (total >= 0),
          created_at TEXT NOT NULL DEFAULT (datetime('now')),
          updated_at TEXT NOT NULL DEFAULT (datetime('now'))
        )
      `);
      database.run(`
        CREATE TABLE IF NOT EXISTS order_items (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          order_id INTEGER NOT NULL,
          menu_item_id INTEGER NOT NULL,
          quantity INTEGER NOT NULL CHECK (quantity BETWEEN 1 AND 100),
          price_at_order INTEGER NOT NULL CHECK (price_at_order >= 0),
          name_at_order TEXT NOT NULL,
          created_at TEXT NOT NULL DEFAULT (datetime('now')),
          FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
        )
      `);
      database.run('CREATE INDEX IF NOT EXISTS idx_orders_public_id ON orders(public_order_id)');
      database.run('CREATE INDEX IF NOT EXISTS idx_orders_branch ON orders(branch)');
      database.run('CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status)');
      database.run('CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at)');
      database.run('CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id)');
      database.run('CREATE INDEX IF NOT EXISTS idx_menu_available ON menu_items(available)');
    });
    const migrationPromise = ensureSQLiteMigrations(database);
    migrationPromise.then(() => {
      resolveDatabaseReady();
    }).catch((err) => {
      console.error('Migration warning:', err.message);
      resolveDatabaseReady();
    });
    return;
  }

  const initSql = `
    CREATE TABLE IF NOT EXISTS menu_items (
      id BIGSERIAL PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      price INTEGER NOT NULL CHECK (price >= 0),
      category TEXT,
      tags TEXT,
      available BOOLEAN NOT NULL DEFAULT true,
      description TEXT NOT NULL DEFAULT '',
      image TEXT NOT NULL DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    CREATE TABLE IF NOT EXISTS branches (
      id BIGSERIAL PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    CREATE TABLE IF NOT EXISTS users (
      id BIGSERIAL PRIMARY KEY,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'staff' CHECK (role IN ('admin', 'staff')),
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    CREATE TABLE IF NOT EXISTS orders (
      id BIGSERIAL PRIMARY KEY,
      public_order_id TEXT NOT NULL UNIQUE,
      customer_name TEXT NOT NULL CHECK (char_length(trim(customer_name)) BETWEEN 2 AND 100),
      customer_phone TEXT NOT NULL CHECK (customer_phone ~ '^03[0-9]{9}$'),
      customer_address TEXT NOT NULL CHECK (char_length(trim(customer_address)) BETWEEN 5 AND 500),
      customer_email TEXT,
      customer_notes TEXT,
      idempotency_key TEXT,
      subtotal INTEGER NOT NULL DEFAULT 0 CHECK (subtotal >= 0),
      discount INTEGER NOT NULL DEFAULT 0 CHECK (discount >= 0),
      tax_gst INTEGER NOT NULL DEFAULT 0 CHECK (tax_gst >= 0),
      packaging_fee INTEGER NOT NULL DEFAULT 0 CHECK (packaging_fee >= 0),
      promo_code TEXT,
      branch TEXT NOT NULL CHECK (branch IN ('Clifton', 'Gulshan-e-Iqbal', 'North Nazimabad')),
      status TEXT NOT NULL DEFAULT 'Received' CHECK (status IN ('Received', 'Preparing', 'Out for Delivery', 'Delivered')),
      total INTEGER NOT NULL CHECK (total >= 0),
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    CREATE TABLE IF NOT EXISTS order_items (
      id BIGSERIAL PRIMARY KEY,
      order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      menu_item_id BIGINT NOT NULL REFERENCES menu_items(id) ON DELETE RESTRICT,
      quantity INTEGER NOT NULL CHECK (quantity BETWEEN 1 AND 100),
      price_at_order INTEGER NOT NULL CHECK (price_at_order >= 0),
      name_at_order TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    CREATE INDEX IF NOT EXISTS idx_orders_public_id ON orders(public_order_id);
    CREATE INDEX IF NOT EXISTS idx_orders_branch ON orders(branch);
    CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
    CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
    CREATE INDEX IF NOT EXISTS idx_menu_available ON menu_items(available);
  `;

  try {
    getDb().query(initSql).then(() => {
      const branchQueries = ['Clifton', 'Gulshan-e-Iqbal', 'North Nazimabad']
        .map((b) => `INSERT INTO branches (name) VALUES ('${b}') ON CONFLICT (name) DO NOTHING;`)
        .join('\n');
      return getDb().query(branchQueries);
    }).then(() => {
      // Reconcile columns that app code expects but Supabase migrations may not include.
      // Uses ADD COLUMN IF NOT EXISTS pattern to stay idempotent across cold starts.
      return ensurePgMigrations(getDb());
    }).then(() => {
      resolveDatabaseReady();
    }).catch((err) => {
      console.error('Failed to initialize PostgreSQL database:', err.message);
      resolveDatabaseReady();
    });
  } catch (err) {
    // Synchronous failure (e.g. DATABASE_URL missing): resolve the readiness
    // promise so the health endpoint can respond instead of hanging, then rethrow.
    console.error('Failed to initialize PostgreSQL database:', err.message);
    resolveDatabaseReady();
    throw err;
  }
}

function seedUsers(database) {
  const bcrypt = require('bcrypt');
  const isProduction = process.env.NODE_ENV === 'production';
  const candidates = isProduction
    ? [
        { username: process.env.ADMIN_USERNAME, password: process.env.ADMIN_PASSWORD, role: 'admin' },
        { username: process.env.STAFF_USERNAME, password: process.env.STAFF_PASSWORD, role: 'staff' },
      ]
    : [
        { username: 'admin', password: 'admin123', role: 'admin' },
        { username: 'staff', password: 'staff123', role: 'staff' },
      ];
  const users = candidates.filter((u) => u.username && u.password);
  return Promise.all(users.map((user) => new Promise((resolve, reject) => {
    const passwordHash = bcrypt.hashSync(user.password, 10);
    if (USE_SQLITE) {
      database.get('SELECT id FROM users WHERE username = ?', [user.username], (err, row) => {
        if (err) return reject(err);
        if (row) {
          database.run(
            'UPDATE users SET password_hash = ?, role = ?, updated_at = datetime(\'now\') WHERE id = ?',
            [passwordHash, user.role, row.id],
            (updateErr) => updateErr ? reject(updateErr) : resolve()
          );
        } else {
          database.run(
            'INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)',
            [user.username, passwordHash, user.role],
            (insertErr) => insertErr ? reject(insertErr) : resolve()
          );
        }
      });
    } else {
      database.query('SELECT id FROM users WHERE username = $1', [user.username]).then((result) => {
        const row = result.rows[0];
        if (row) {
          return database.query(
            'UPDATE users SET password_hash = $1, role = $2, updated_at = now() WHERE id = $3',
            [passwordHash, user.role, row.id]
          ).then(() => resolve());
        }
        return database.query(
          'INSERT INTO users (username, password_hash, role) VALUES ($1, $2, $3)',
          [user.username, passwordHash, user.role]
        ).then(() => resolve());
      }).catch(reject);
    }
  })));
}

function seedDatabase() {
  const database = getDb();

  const checkMenuCount = USE_SQLITE
    ? new Promise((resolve, reject) => {
        database.get('SELECT count(*) as count FROM menu_items', (err, row) => {
          if (err) return reject(err);
          resolve(row.count);
        });
      })
    : database.query('SELECT count(*) as count FROM menu_items').then((result) => parseInt(result.rows[0].count, 10));

  checkMenuCount.then((count) => {
    if (count > 0) {
      seedUsers(database).then(resolveDatabaseReady).catch((seedErr) => {
        console.error('Failed to seed configured users:', seedErr.message);
        resolveDatabaseReady();
      });
      return;
    }

    const menuItems = [
      { id: 1, name: 'Chicken Malai Boti', price: 850, category: 'BBQ', tags: 'mild', available: 1, description: '', image: '' },
      { id: 2, name: 'Beef Seekh Kebab', price: 780, category: 'BBQ', tags: 'spicy', available: 1, description: '', image: '' },
      { id: 3, name: 'Mutton Karahi (half)', price: 1650, category: 'Karahi', tags: 'spicy', available: 1, description: '', image: '' },
      { id: 4, name: 'Chicken Karahi (half)', price: 1250, category: 'Karahi', tags: 'spicy', available: 1, description: '', image: '' },
      { id: 5, name: 'Chicken Biryani', price: 550, category: 'Rice', tags: 'spicy', available: 1, description: '', image: '' },
      { id: 6, name: 'Vegetable Pulao', price: 420, category: 'Rice', tags: 'veg', available: 1, description: '', image: '' },
      { id: 7, name: 'Zinger Paratha Roll', price: 450, category: 'Rolls', tags: 'spicy', available: 1, description: '', image: '' },
      { id: 8, name: 'Paneer Tikka Roll', price: 480, category: 'Rolls', tags: 'veg', available: 1, description: '', image: '' },
      { id: 9, name: 'Mint Margarita', price: 220, category: 'Drinks', tags: 'veg', available: 1, description: '', image: '' },
      { id: 10, name: 'Doodh Patti Chai', price: 150, category: 'Drinks', tags: 'veg', available: 1, description: '', image: '' },
      { id: 11, name: 'Gulab Jamun (2 pcs)', price: 250, category: 'Desserts', tags: 'veg', available: 1, description: '', image: '' },
      { id: 12, name: 'Kheer', price: 300, category: 'Desserts', tags: 'veg', available: 1, description: '', image: '' },
    ];

    if (USE_SQLITE) {
      database.serialize(() => {
        const menuStmt = database.prepare('INSERT INTO menu_items (id, name, price, category, tags, available, description, image) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
        menuItems.forEach((item) => {
          menuStmt.run(item.id, item.name, item.price, item.category || null, item.tags || null, item.available ? 1 : 0, item.description, item.image);
        });
        menuStmt.finalize();

        const branchStmt = database.prepare('INSERT OR IGNORE INTO branches (name) VALUES (?)');
        ['Clifton', 'Gulshan-e-Iqbal', 'North Nazimabad'].forEach((b) => branchStmt.run(b));
        branchStmt.finalize();

        database.run('SELECT 1', () => {
          seedUsers(database).then(resolveDatabaseReady).catch((seedErr) => {
            console.error('Failed to seed configured users:', seedErr.message);
            resolveDatabaseReady();
          });
        });
      });
      return;
    }

    const insertPromises = menuItems.map((item) =>
      database.query(
        'INSERT INTO menu_items (id, name, price, category, tags, available, description, image) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) ON CONFLICT (id) DO NOTHING',
        [item.id, item.name, item.price, item.category || null, item.tags || null, item.available ? true : false, item.description, item.image]
      )
    );

    Promise.all(insertPromises).then(() => {
      return seedUsers(database).then(resolveDatabaseReady);
    }).catch((seedErr) => {
      console.error('Failed to seed menu items:', seedErr.message);
      resolveDatabaseReady();
    });
  }).catch((err) => {
    console.error('Failed to inspect menu seed state:', err.message);
    resolveDatabaseReady();
  });
}

const isPg = !USE_SQLITE;

module.exports = {
  getDb,
  initDatabase,
  seedDatabase,
  databaseReady,
  query,
  get,
  run,
  getOne,
  getAll,
  withTransaction,
  beginTransaction,
  commitTransaction,
  rollbackTransaction,
  isSqlite,
  isPg,
  nowExpression,
  parameterizeSql,
  ensureReturning,
};




