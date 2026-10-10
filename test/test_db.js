const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'karachi-bites-db-'));
process.env.DATABASE_PATH = path.join(tempDir, 'database-test.sqlite');
process.env.JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(32).toString('hex');

const { getDb, initDatabase, seedDatabase, databaseReady } = require('../src/db');
const validate = require('../src/validate');

async function queryAll(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (error, rows) => error ? reject(error) : resolve(rows));
  });
}

async function testDatabase() {
  let db;
  try {
    console.log('--- Database, branch seed and validation tests ---');
    initDatabase();
    seedDatabase();
    await databaseReady;
    db = getDb();

    const items = await queryAll(db, 'SELECT * FROM menu_items ORDER BY id');
    assert.strictEqual(items.length, 12, 'Expected 12 menu items');
    const expectedNames = [
      'Chicken Malai Boti',
      'Beef Seekh Kebab',
      'Mutton Karahi (half)',
      'Chicken Karahi (half)',
      'Chicken Biryani',
      'Vegetable Pulao',
      'Zinger Paratha Roll',
      'Paneer Tikka Roll',
      'Mint Margarita',
      'Doodh Patti Chai',
      'Gulab Jamun (2 pcs)',
      'Kheer',
    ];
    for (const name of expectedNames) {
      assert(items.some((item) => item.name === name), 'Missing menu item: ' + name);
    }

    const expectedBranches = ['Clifton', 'Gulshan-e-Iqbal', 'North Nazimabad'];
    const branches = await queryAll(db, 'SELECT name FROM branches ORDER BY name');
    for (const branch of expectedBranches) {
      assert(branches.some((row) => row.name === branch), 'Missing branch seed: ' + branch);
      assert.strictEqual(validate.isValidBranch(branch), true, 'Branch should validate: ' + branch);
    }
    assert.strictEqual(branches.length, expectedBranches.length, 'Expected exactly three supported branches');
    assert.strictEqual(validate.isValidBranch('Unsupported Branch'), false, 'Unsupported branch should fail validation');

    console.log('Database test PASSED: 12 menu items and all three branches exist.');
  } finally {
    if (db) {
      await new Promise((resolve, reject) => db.close((error) => error ? reject(error) : resolve()));
    }
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}

testDatabase().catch((error) => {
  console.error('Database test FAILED:', error.stack || error.message);
  process.exitCode = 1;
});
