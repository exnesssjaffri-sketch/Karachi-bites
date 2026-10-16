const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'karachi-bites-menu-'));
process.env.DATABASE_PATH = path.join(tempDir, 'menu-test.sqlite');
process.env.JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(32).toString('hex');

const app = require('../src/server');
const { getDb } = require('../src/db');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function readJson(response) {
  return response.json().catch(() => ({}));
}

async function waitForServer(baseUrl) {
  const deadline = Date.now() + 15000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(baseUrl + '/api/menu');
      if (response.ok) return;
    } catch (_) {}
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error('Server/database did not become ready within 15 seconds');
}

async function runTests() {
  let server;
  try {
    console.log('--- Admin Menu CRUD Tests ---');
    server = app.listen(0, '127.0.0.1');
    await new Promise((resolve, reject) => {
      server.once('listening', resolve);
      server.once('error', reject);
    });
    const baseUrl = 'http://127.0.0.1:' + server.address().port;
    await waitForServer(baseUrl);

    // Login as admin
    console.log('Logging in as admin...');
    let response = await fetch(baseUrl + '/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'admin123' }),
    });
    assert(response.status === 200, 'Admin login failed');
    const adminToken = (await readJson(response)).token;

    // Create menu item
    console.log('Testing POST /api/admin/menu...');
    const newItem = { name: 'Test Item', price: 500, category: 'BBQ', tags: 'spicy', available: true };
    response = await fetch(baseUrl + '/api/admin/menu', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + adminToken,
      },
      body: JSON.stringify(newItem),
    });
    assert(response.status === 201, 'Create menu item should return 201');
    const created = await readJson(response);
    assert(created.id && created.name === 'Test Item', 'Created item should have id and name');
    console.log('  PASS');

    // Update menu item (set available=false to hide)
    console.log('Testing PUT /api/admin/menu/:id...');
    response = await fetch(baseUrl + '/api/admin/menu/' + created.id, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + adminToken,
      },
      body: JSON.stringify({ name: 'Updated Item', price: 600, category: 'Karahi', tags: 'mild', available: false }),
    });
    assert(response.status === 200, 'Update menu item should return 200');
    const updated = await readJson(response);
    assert(updated.name === 'Updated Item' && updated.price === 600, 'Update should change fields');
    assert(updated.available === false, 'Update should set available=false');
    console.log('  PASS');

    // Hidden item must not appear in public menu
    console.log('Testing hidden item is excluded from GET /api/menu...');
    response = await fetch(baseUrl + '/api/menu');
    assert(response.status === 200, 'Menu endpoint should return 200');
    const menu = await readJson(response);
    assert(!menu.some((item) => item.id === created.id), 'Hidden item must not appear in public menu');
    console.log('  PASS');

    // Hidden item must be rejected at order time
    console.log('Testing order containing a hidden item is rejected...');
    response = await fetch(baseUrl + '/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer: { name: 'Order Test', phone: '03001234567', address: 'Test address 123' },
        branch: 'Clifton',
        items: [{ id: created.id, qty: 1 }],
      }),
    });
    assert(response.status === 400, 'Order with a hidden item must be rejected with 400');
    console.log('  PASS');

    // Unhide the item via PATCH availability
    console.log('Testing PATCH /api/admin/menu/:id/availability (unhide)...');
    response = await fetch(baseUrl + '/api/admin/menu/' + created.id + '/availability', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + adminToken,
      },
      body: JSON.stringify({ available: true }),
    });
    assert(response.status === 200, 'Unhide should return 200');
    const unhid = await readJson(response);
    assert(unhid.available === true, 'Item should be available again after unhide');
    response = await fetch(baseUrl + '/api/menu');
    const menu2 = await readJson(response);
    assert(menu2.some((item) => item.id === created.id), 'Unhidden item must reappear in public menu');
    console.log('  PASS');

    // DELETE hides (soft) rather than permanently deleting
    console.log('Testing DELETE /api/admin/menu/:id hides the item...');
    response = await fetch(baseUrl + '/api/admin/menu/' + created.id, {
      method: 'DELETE',
      headers: { Authorization: 'Bearer ' + adminToken },
    });
    assert(response.status === 204, 'Hide menu item should return 204');
    response = await fetch(baseUrl + '/api/menu');
    const menu3 = await readJson(response);
    assert(!menu3.some((item) => item.id === created.id), 'Hidden item must not appear in public menu after DELETE');
    // Item still exists in the database (PUT on it should succeed, not 404)
    response = await fetch(baseUrl + '/api/admin/menu/' + created.id, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + adminToken,
      },
      body: JSON.stringify({ name: 'X', price: 1, category: 'BBQ', tags: 'mild', available: true }),
    });
    assert(response.status === 200, 'Hidden (not deleted) item should still be updatable');
    console.log('  PASS');

    // Historical orders referencing the item remain intact
    console.log('Testing historical order data survives hiding...');
    response = await fetch(baseUrl + '/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer: { name: 'History Test', phone: '03001234567', address: 'Test address 123' },
        branch: 'Clifton',
        items: [{ id: created.id, qty: 1 }],
      }),
    });
    assert(response.status === 201, 'Order for available item should succeed');
    const historyOrder = await readJson(response);
    response = await fetch(baseUrl + '/api/admin/menu/' + created.id, {
      method: 'DELETE',
      headers: { Authorization: 'Bearer ' + adminToken },
    });
    assert(response.status === 204, 'Hide menu item should return 204 again');
    response = await fetch(baseUrl + '/api/orders/' + historyOrder.orderId);
    assert(response.status === 200, 'Historical order should still be retrievable');
    const fetched = await readJson(response);
    assert(fetched.items.length === 1 && fetched.items[0].id === created.id, 'Historical order items must be preserved');
    console.log('  PASS');

    // Test unauthorized access
    console.log('Testing unauthorized access...');
    response = await fetch(baseUrl + '/api/admin/menu', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newItem),
    });
    assert(response.status === 401, 'No token should return 401');
    response = await fetch(baseUrl + '/api/admin/menu', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer invalid-token',
      },
      body: JSON.stringify(newItem),
    });
    assert(response.status === 401, 'Invalid token should return 401');
    console.log('  PASS');

    // Test validation failure
    console.log('Testing validation failure...');
    response = await fetch(baseUrl + '/api/admin/menu', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + adminToken,
      },
      body: JSON.stringify({ name: 'A', price: -1, category: 'Invalid' }),
    });
    assert(response.status === 400, 'Invalid data should return 400');
    console.log('  PASS');

    console.log('Admin Menu CRUD tests PASSED.');
  } catch (error) {
    console.error('Admin Menu CRUD tests FAILED:', error.stack || error.message);
    process.exitCode = 1;
  } finally {
    if (server) {
      await new Promise((resolve) => server.close(() => resolve()));
    }
    await new Promise((resolve) => getDb().close(() => resolve()));
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}

runTests().catch((error) => {
  console.error('Unhandled error:', error.stack || error.message);
  process.exitCode = 1;
});