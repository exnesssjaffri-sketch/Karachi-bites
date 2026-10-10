const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'karachi-bites-api-'));
process.env.DATABASE_PATH = path.join(tempDir, 'api-test.sqlite');
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
    } catch (_) {
      // Server startup is asynchronous; retry.
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error('Server/database did not become ready within 15 seconds');
}

function checkHelmetHeaders(response) {
  const expected = {
    'x-content-type-options': 'nosniff',
    'x-frame-options': 'SAMEORIGIN',
    'x-dns-prefetch-control': 'off',
  };
  for (const [name, value] of Object.entries(expected)) {
    assert(response.headers.get(name) === value, 'Unexpected or missing security header: ' + name);
  }
  assert(Boolean(response.headers.get('content-security-policy')), 'Content-Security-Policy should be present');
}

function makeOrderPayload(branch, quantity = 1) {
  return {
    customer: {
      name: 'Test Customer',
      phone: '03001234567',
      address: 'Test address, Karachi',
    },
    branch,
    items: [{ id: 1, qty: quantity }],
  };
}

async function runTests() {
  let server;
  try {
    console.log('--- API Tests ---');
    server = app.listen(0, '127.0.0.1');
    await new Promise((resolve, reject) => {
      server.once('listening', resolve);
      server.once('error', reject);
    });
    const baseUrl = 'http://127.0.0.1:' + server.address().port;
    await waitForServer(baseUrl);

    console.log('Testing customer homepage, preserved app and admin page routes...');
    let pageResponse = await fetch(baseUrl + '/');
    assert(pageResponse.status === 200, 'Homepage should return 200');
    const homeHtml = await pageResponse.text();
    assert(homeHtml.includes('Charcoal, Clay &amp; Slow Spice'), 'Homepage should serve the Stitch home design');
    pageResponse = await fetch(baseUrl + '/app.html');
    assert(pageResponse.status === 200, 'Preserved ordering app should return 200');
    const appHtml = await pageResponse.text();
    assert(appHtml.includes('id="app"'), 'Preserved ordering app should contain its app mount');
    pageResponse = await fetch(baseUrl + '/admin');
    assert(pageResponse.status === 200, 'Admin dashboard route should return 200');
    const adminHtml = await pageResponse.text();
    assert(adminHtml.includes('Staff sign in'), 'Admin route should serve the staff login page');
    console.log('  PASS');

    console.log('Testing GET /api/menu...');
    let response = await fetch(baseUrl + '/api/menu');
    assert(response.status === 200, 'Menu endpoint should return 200');
    checkHelmetHeaders(response);
    const menu = await readJson(response);
    assert(Array.isArray(menu) && menu.length === 12, 'Expected 12 menu items');
    console.log('  PASS');

    console.log('Testing POST /api/auth/login for admin...');
    response = await fetch(baseUrl + '/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'admin123' }),
    });
    if (response.status !== 200) throw new Error('Admin login failed: ' + JSON.stringify(await readJson(response)));
    const adminLogin = await readJson(response);
    assert(adminLogin.token, 'Admin login should return a JWT');
    checkHelmetHeaders(response);
    console.log('  PASS');

    console.log('Testing POST /api/orders and server-calculated totals...');
    response = await fetch(baseUrl + '/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(makeOrderPayload('Clifton', 2)),
    });
    if (response.status !== 201) throw new Error('Create order failed: ' + JSON.stringify(await readJson(response)));
    const created = await readJson(response);
    assert(created.orderId, 'Order response should include orderId');
    assert(created.total === 1850, 'Expected server total 1850, received ' + created.total);
    checkHelmetHeaders(response);
    console.log('  PASS');

    console.log('Testing order retrieval...');
    response = await fetch(baseUrl + '/api/orders/' + encodeURIComponent(created.orderId));
    assert(response.status === 200, 'Order retrieval should return 200');
    const fetched = await readJson(response);
    assert(fetched.orderId === created.orderId, 'Public order ID mismatch');
    assert(fetched.branch === 'Clifton', 'Order branch should persist');
    assert(fetched.items?.[0]?.quantity === 2, 'Order quantity should persist');
    console.log('  PASS');

    for (const branch of ['Gulshan-e-Iqbal', 'North Nazimabad']) {
      console.log('Testing order creation for branch ' + branch + '...');
      response = await fetch(baseUrl + '/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(makeOrderPayload(branch)),
      });
      if (response.status !== 201) throw new Error('Expected branch to be accepted: ' + branch + '; response=' + JSON.stringify(await readJson(response)));
      const branchOrder = await readJson(response);
      assert(branchOrder.total === 1000, 'Unexpected single-item total for ' + branch);
      const branchFetchedResponse = await fetch(baseUrl + '/api/orders/' + encodeURIComponent(branchOrder.orderId));
      const branchFetched = await readJson(branchFetchedResponse);
      assert(branchFetchedResponse.status === 200 && branchFetched.branch === branch, 'Branch should persist for ' + branch);
      console.log('  PASS');
    }

    console.log('Testing rejection of an unsupported branch...');
    response = await fetch(baseUrl + '/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(makeOrderPayload('Unsupported Branch')),
    });
    assert(response.status === 400, 'Unsupported branch must be rejected');
    console.log('  PASS');

    console.log('Testing admin order filters...');
    for (const branch of ['Clifton', 'Gulshan-e-Iqbal', 'North Nazimabad']) {
      response = await fetch(baseUrl + '/api/admin/orders?branch=' + encodeURIComponent(branch), {
        headers: { Authorization: 'Bearer ' + adminLogin.token },
      });
      assert(response.status === 200, 'Admin branch filter failed: ' + branch);
      const orders = await readJson(response);
      assert(Array.isArray(orders) && orders.length > 0, 'Expected at least one order for ' + branch);
      assert(orders.every((order) => order.branch === branch), 'Branch filter returned another branch');
    }
    console.log('  PASS');

    console.log('Testing valid and invalid status transitions...');
    response = await fetch(baseUrl + '/api/admin/orders/' + encodeURIComponent(created.orderId) + '/status', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + adminLogin.token,
      },
      body: JSON.stringify({ status: 'Preparing' }),
    });
    assert(response.status === 200, 'Valid Received -> Preparing transition should pass');
    response = await fetch(baseUrl + '/api/admin/orders/' + encodeURIComponent(created.orderId) + '/status', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + adminLogin.token,
      },
      body: JSON.stringify({ status: 'Delivered' }),
    });
    const invalidTransition = await readJson(response);
    assert(response.status === 400 && /Invalid status transition/.test(invalidTransition.error || ''), 'Invalid status jump must be rejected');
    console.log('  PASS');

    console.log('Testing staff cannot access admin endpoints...');
    response = await fetch(baseUrl + '/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'staff', password: 'staff123' }),
    });
    assert(response.status === 200, 'Staff login failed');
    const staffLogin = await readJson(response);
    response = await fetch(baseUrl + '/api/admin/orders', {
      headers: { Authorization: 'Bearer ' + staffLogin.token },
    });
    assert(response.status === 403, 'Staff account must receive 403 on admin endpoints');
    console.log('  PASS');

    console.log('Testing unknown orders return 404...');
    response = await fetch(baseUrl + '/api/orders/KB-NOT-FOUND');
    assert(response.status === 404, 'Unknown order should return 404');
    console.log('  PASS');

    console.log('All API tests PASSED.');
  } catch (error) {
    console.error('API tests FAILED:', error.stack || error.message);
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
  console.error('Unhandled API test error:', error.stack || error.message);
  process.exitCode = 1;
});
