const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'karachi-bites-csv-'));
process.env.DATABASE_PATH = path.join(tempDir, 'csv-test.sqlite');
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
    console.log('--- CSV Export Tests ---');
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

    // Create an order
    console.log('Creating test order...');
    response = await fetch(baseUrl + '/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer: { name: 'CSV Test', phone: '03001234567', address: 'Test address' },
        branch: 'Clifton',
        items: [{ id: 1, qty: 2 }],
      }),
    });
    assert(response.status === 201, 'Order creation failed');
    const order = await readJson(response);

    // Export CSV
    console.log('Testing GET /api/admin/orders/export...');
    response = await fetch(baseUrl + '/api/admin/orders/export', {
      headers: { Authorization: 'Bearer ' + adminToken },
    });
    assert(response.status === 200, 'CSV export should return 200');
    assert(response.headers.get('content-type') && response.headers.get('content-type').includes('text/csv'),
      'Content-Type should be text/csv');
    assert(response.headers.get('content-disposition') && response.headers.get('content-disposition').includes('orders.csv'),
      'Content-Disposition should include orders.csv');
    const csv = await response.text();
    assert(csv.includes('Order ID,Customer,Phone,Total,Status,Date'), 'CSV should have headers');
    assert(csv.includes(order.orderId), 'CSV should include order ID');
    assert(csv.includes('CSV Test'), 'CSV should include customer name');
    assert(!csv.includes('admin123'), 'CSV should not expose passwords');
    console.log('  PASS');

    // date_to in the far past must exclude all orders
    console.log('Testing date_to filter excludes out-of-range orders...');
    response = await fetch(baseUrl + '/api/admin/orders/export?date_to=1999-01-01', {
      headers: { Authorization: 'Bearer ' + adminToken },
    });
    assert(response.status === 200, 'CSV export with date_to should return 200');
    const csvPast = await response.text();
    assert(csvPast.trim() === 'Order ID,Customer,Phone,Total,Status,Date', 'date_to in the past must return header-only CSV');
    console.log('  PASS');

    // date_from in the far past must include the created order
    console.log('Testing date_from filter includes in-range orders...');
    response = await fetch(baseUrl + '/api/admin/orders/export?date_from=1999-01-01', {
      headers: { Authorization: 'Bearer ' + adminToken },
    });
    assert(response.status === 200, 'CSV export with date_from should return 200');
    const csvFrom = await response.text();
    assert(csvFrom.includes(order.orderId), 'date_from in the past must include the order');
    console.log('  PASS');

    // date_from in the far future must exclude the created order
    console.log('Testing date_from filter excludes out-of-range orders...');
    response = await fetch(baseUrl + '/api/admin/orders/export?date_from=2999-01-01', {
      headers: { Authorization: 'Bearer ' + adminToken },
    });
    assert(response.status === 200, 'CSV export with date_from should return 200');
    const csvFuture = await response.text();
    assert(!csvFuture.includes(order.orderId), 'date_from in the future must exclude the order');
    assert(csvFuture.trim() === 'Order ID,Customer,Phone,Total,Status,Date', 'Future date_from must return header-only CSV');
    console.log('  PASS');

    // Formula-injection protection: values starting with = + - @ must be quoted/prefixed
    console.log('Testing CSV formula-injection protection...');
    const hostileName = "\"; =cmd|'!A1' & =HYPERLINK(\"http://evil\")";
    response = await fetch(baseUrl + '/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer: { name: hostileName, phone: '03001234567', address: 'Test address' },
        branch: 'Clifton',
        items: [{ id: 1, qty: 1 }],
      }),
    });
    assert(response.status === 201, 'Order with hostile name should be created (server stores raw name)');
    const injectionOrder = await readJson(response);
    response = await fetch(baseUrl + '/api/admin/orders/export?date_from=1999-01-01', {
      headers: { Authorization: 'Bearer ' + adminToken },
    });
    assert(response.status === 200, 'CSV export should return 200');
    const csvInject = await response.text();
    const injectLine = csvInject.split('\n').find((line) => line.includes(injectionOrder.orderId));
    assert(injectLine, 'CSV should contain the injection test order');
    // The hostile name must appear quoted with doubled quotes (never bare)
    assert(!csvInject.includes(hostileName), 'Raw hostile value must never appear unescaped');
    // Formula characters at the start of a cell value must be neutralised (prefixed with ')
    assert(!csvInject.includes('", =cmd') && !csvInject.includes('"=HYPERLINK'), 'Formula values must not start a cell with =');
    console.log('  PASS');

    // Leading whitespace before formula-like content must also be neutralised
    console.log('Testing CSV formula-injection with leading whitespace...');
    response = await fetch(baseUrl + '/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer: { name: '  =SUM(1,2)', phone: '03001234567', address: 'Test address' },
        branch: 'Clifton',
        items: [{ id: 1, qty: 1 }],
      }),
    });
    assert(response.status === 201, 'Order with leading-whitespace formula name should be created');
    const wsOrder = await readJson(response);
    response = await fetch(baseUrl + '/api/orders/' + wsOrder.orderId);
    assert(response.status === 200, 'Should be able to fetch the whitespace order');
    const wsFetched = await readJson(response);
    const wsName = wsFetched.customer.name;
    response = await fetch(baseUrl + '/api/admin/orders/export?date_from=1999-01-01', {
      headers: { Authorization: 'Bearer ' + adminToken },
    });
    assert(response.status === 200, 'CSV export should return 200');
    const csvWs = await response.text();
    // The cell must be quoted and must not begin with a formula character
    // after the opening quote (leading whitespace inside quotes is harmless).
    const wsLine = csvWs.split('\n').find((line) => line.includes(wsOrder.orderId));
    assert(wsLine, 'CSV should contain the whitespace test order');
    const wsField = wsLine.split(',')[1]; // customer name is the second field
    assert(wsField && wsField.startsWith('"') && !wsField.startsWith('"=') && !wsField.startsWith('"-') && !wsField.startsWith('"+') && !wsField.startsWith('"@'),
      'CSV cell must be quoted and must not start with a formula character');
    console.log('  PASS');

    // Staff role must not be able to export
    console.log('Testing staff cannot export CSV...');
    response = await fetch(baseUrl + '/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'staff', password: 'staff123' }),
    });
    assert(response.status === 200, 'Staff login failed');
    const staffLogin = await readJson(response);
    response = await fetch(baseUrl + '/api/admin/orders/export', {
      headers: { Authorization: 'Bearer ' + staffLogin.token },
    });
    assert(response.status === 403, 'Staff token must receive 403 on export');
    console.log('  PASS');

    // Test unauthorized export
    console.log('Testing unauthorized export...');
    response = await fetch(baseUrl + '/api/admin/orders/export');
    assert(response.status === 401, 'No token should return 401');
    console.log('  PASS');

    console.log('CSV Export tests PASSED.');
  } catch (error) {
    console.error('CSV Export tests FAILED:', error.stack || error.message);
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