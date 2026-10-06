const { getDb, initDatabase, seedDatabase } = require('../src/db');
const validate = require('../src/validate');

async function testDatabase() {
  console.log('--- Testing Database Initialization and Seeding ---');
  initDatabase();
  seedDatabase();

  const db = getDb();
  await new Promise((res) => setTimeout(res, 2000)); // wait for async ops

  // Check menu items
  const items = await new Promise((res, rej) => {
    db.all('SELECT * FROM menu_items', (err, rows) => err ? rej(err) : res(rows));
  });

  console.log(`Menu Items Count: ${items.length}`);
  if (items.length !== 12) {
    throw new Error(`Expected 12 menu items, got ${items.length}`);
  }

  // Check required items
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
    const found = items.find((i) => i.name === name);
    if (!found) {
      throw new Error(`Missing expected menu item: ${name}`);
    }
  }

  console.log('Database test PASSED!');
}

testDatabase().catch((err) => {
  console.error('Database test FAILED:', err.message);
  process.exit(1);
});