const sqlite3 = require('sqlite3').verbose();
const path = require('path');
require('dotenv').config();

const DB_PATH = process.env.DATABASE_PATH || path.join(__dirname, '..', 'karachi_bites.db');

let db = null;

function getDb() {
  if (db) return db;
  db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
      console.error('Failed to open database:', err.message);
      process.exit(1);
    }
  });
  return db;
}

function initDatabase() {
  const database = getDb();
  database.serialize(() => {
    database.run(`
      CREATE TABLE IF NOT EXISTS menu_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        price INTEGER NOT NULL,
        category TEXT,
        tags TEXT
      )
    `);

    database.run(`
      CREATE TABLE IF NOT EXISTS branches (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE
      )
    `);

    database.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'staff'
      )
    `);

    database.run(`
      CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        public_order_id TEXT NOT NULL UNIQUE,
        customer_name TEXT NOT NULL,
        customer_phone TEXT NOT NULL,
        customer_address TEXT NOT NULL,
        branch TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'Received',
        total INTEGER NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `);

    database.run(`
      CREATE TABLE IF NOT EXISTS order_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id INTEGER NOT NULL,
        menu_item_id INTEGER NOT NULL,
        quantity INTEGER NOT NULL,
        price_at_order INTEGER NOT NULL,
        name_at_order TEXT NOT NULL,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
      )
    `);

    database.run('CREATE INDEX IF NOT EXISTS idx_orders_public_id ON orders(public_order_id)');
    database.run('CREATE INDEX IF NOT EXISTS idx_orders_branch ON orders(branch)');
    database.run('CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status)');
    database.run('CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at)');
    database.run('CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id)');
  });
}

function seedDatabase() {
  const database = getDb();
  const bcrypt = require('bcrypt');

  database.get('SELECT count(*) as count FROM menu_items', (err, row) => {
    if (err || row.count > 0) return;

    const menuItems = [
      { name: 'Chicken Malai Boti', price: 850, category: 'Main Course', tags: 'mild' },
      { name: 'Beef Seekh Kebab', price: 780, category: 'Main Course', tags: '' },
      { name: 'Mutton Karahi (half)', price: 1650, category: 'Main Course', tags: '' },
      { name: 'Chicken Karahi (half)', price: 1250, category: 'Main Course', tags: '' },
      { name: 'Chicken Biryani', price: 550, category: 'Main Course', tags: '' },
      { name: 'Vegetable Pulao', price: 420, category: 'Main Course', tags: 'veg' },
      { name: 'Zinger Paratha Roll', price: 450, category: 'Rolls', tags: '' },
      { name: 'Paneer Tikka Roll', price: 480, category: 'Rolls', tags: 'veg' },
      { name: 'Mint Margarita', price: 220, category: 'Beverages', tags: 'veg' },
      { name: 'Doodh Patti Chai', price: 150, category: 'Beverages', tags: 'veg' },
      { name: 'Gulab Jamun (2 pcs)', price: 250, category: 'Desserts', tags: 'veg' },
      { name: 'Kheer', price: 300, category: 'Desserts', tags: 'veg' },
    ];

    const branches = ['Clifton'];

    const users = [
      { username: 'admin', password: 'admin123', role: 'admin' },
      { username: 'staff', password: 'staff123', role: 'staff' },
    ];

    database.serialize(() => {
      const menuStmt = database.prepare('INSERT INTO menu_items (name, price, category, tags) VALUES (?, ?, ?, ?)');
      menuItems.forEach((item) => {
        menuStmt.run(item.name, item.price, item.category || null, item.tags || null);
      });
      menuStmt.finalize();

      const branchStmt = database.prepare('INSERT INTO branches (name) VALUES (?)');
      branches.forEach((b) => branchStmt.run(b));
      branchStmt.finalize();

      users.forEach((user) => {
        const hash = bcrypt.hashSync(user.password, 10);
        database.run(
          'INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)',
          [user.username, hash, user.role]
        );
      });
    });
  });
}

module.exports = { getDb, initDatabase, seedDatabase };