const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'karachi-bites-failures-'));
process.env.DATABASE_PATH = path.join(tempDir, 'failures.sqlite');
process.env.JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(32).toString('hex');

const app = require('../src/server');
const { getDb } = require('../src/db');

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
  throw new Error('Server/database did not become ready');
}

async function testFailures() {
  let server;
  let passed = 0;
  let total = 0;
  const failures = [];
  try {
    console.log('--- API failure and authorization tests ---');
    server = app.listen(0, '127.0.0.1');
    await new Promise((resolve, reject) => {
      server.once('listening', resolve);
      server.once('error', reject);
    });
    const baseUrl = 'http://127.0.0.1:' + server.address().port;
    await waitForServer(baseUrl);

    async function test(name, fn) {
      total++;
      try {
        await fn();
        passed++;
        console.log('  PASS: ' + name);
      } catch (error) {
        failures.push(name + ': ' + error.message);
        console.error('  FAIL: ' + name + ' — ' + error.message);
      }
    }

    await test('Missing customer.name is rejected', async () => {
      const response = await fetch(baseUrl + '/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer: { phone: '03001234567', address: 'Test address 123' },
          branch: 'Clifton',
          items: [{ id: 1, qty: 1 }],
        }),
      });
      const body = await readJson(response);
      if (response.status !== 400 || !String(body.error).includes('customer.name')) {
        throw new Error('Expected 400 and a customer.name validation error');
      }
    });

    await test('Invalid phone is rejected', async () => {
      const response = await fetch(baseUrl + '/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer: { name: 'Test User', phone: '1234567890', address: 'Valid Address 123' },
          branch: 'Clifton',
          items: [{ id: 1, qty: 1 }],
        }),
      });
      const body = await readJson(response);
      if (response.status !== 400 || !String(body.error).includes('customer.phone')) {
        throw new Error('Expected 400 and a customer.phone validation error');
      }
    });

    await test('Unsupported branch is rejected', async () => {
      const response = await fetch(baseUrl + '/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer: { name: 'Test User', phone: '03001234567', address: 'Valid Address 123' },
          branch: 'Unsupported Branch',
          items: [{ id: 1, qty: 1 }],
        }),
      });
      if (response.status !== 400) throw new Error('Expected HTTP 400');
    });

    await test('Missing admin token returns 401', async () => {
      const response = await fetch(baseUrl + '/api/admin/orders');
      if (response.status !== 401) throw new Error('Expected HTTP 401, got ' + response.status);
    });

    const adminResponse = await fetch(baseUrl + '/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'admin123' }),
    });
    if (adminResponse.status !== 200) throw new Error('Admin login setup failed: ' + JSON.stringify(await readJson(adminResponse)));
    const adminLogin = await readJson(adminResponse);

    const orderResponse = await fetch(baseUrl + '/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer: { name: 'Valid User', phone: '03001234567', address: 'Valid Address 123' },
        branch: 'Clifton',
        items: [{ id: 1, qty: 1 }],
      }),
    });
    if (orderResponse.status !== 201) throw new Error('Order setup failed: ' + JSON.stringify(await readJson(orderResponse)));
    const createdOrder = await readJson(orderResponse);

    await test('Invalid status jump is rejected', async () => {
      const response = await fetch(baseUrl + '/api/admin/orders/' + encodeURIComponent(createdOrder.orderId) + '/status', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + adminLogin.token,
        },
        body: JSON.stringify({ status: 'Delivered' }),
      });
      const body = await readJson(response);
      if (response.status !== 400 || !String(body.error).includes('Invalid status transition')) {
        throw new Error('Expected invalid status transition to return 400');
      }
    });

    await test('Staff login cannot access admin endpoints', async () => {
      const response = await fetch(baseUrl + '/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'staff', password: 'staff123' }),
      });
      if (response.status !== 200) throw new Error('Staff login failed');
      const staffLogin = await readJson(response);
      const adminResponse = await fetch(baseUrl + '/api/admin/orders', {
        headers: { Authorization: 'Bearer ' + staffLogin.token },
      });
      if (adminResponse.status !== 403) throw new Error('Expected HTTP 403, got ' + adminResponse.status);
    });

    console.log('\nFailure tests: ' + passed + '/' + total + ' passed');
    if (failures.length) throw new Error(failures.join('\n'));
  } finally {
    if (server) await new Promise((resolve) => server.close(() => resolve()));
    await new Promise((resolve) => getDb().close(() => resolve()));
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}

testFailures().catch((error) => {
  console.error('Failure tests FAILED:', error.stack || error.message);
  process.exitCode = 1;
});
