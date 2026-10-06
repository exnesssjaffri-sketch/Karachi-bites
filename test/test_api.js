const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3002;
process.env.PORT = PORT;
process.env.DATABASE_PATH = './test_karachi_bites.db';

if (fs.existsSync(process.env.DATABASE_PATH)) fs.unlinkSync(process.env.DATABASE_PATH);

const app = require('../src/server');

function sleep(ms) { return new Promise((res) => setTimeout(res, ms)); }

async function runTests() {
  const server = app.listen(PORT);
  console.log(`Test server running on port ${PORT}`);
  await sleep(2000); // wait for DB init and seed

  let authToken = '';
  let orderId = '';

  try {
    // 1. GET /api/menu
    console.log('Testing GET /api/menu...');
    let res = await fetch(`http://localhost:${PORT}/api/menu`);
    if (res.status !== 200) throw new Error('Menu failed: ' + await res.text());
    console.log('  PASS');

    // 2. POST /api/auth/login
    console.log('Testing POST /api/auth/login...');
    res = await fetch(`http://localhost:${PORT}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'admin123' }),
    });
    if (res.status !== 200) throw new Error('Login failed: ' + await res.text());
    const loginData = await res.json();
    authToken = loginData.token;
    console.log('  PASS');

    // 3. POST /api/orders
    console.log('Testing POST /api/orders...');
    res = await fetch(`http://localhost:${PORT}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer: { name: 'Ali', phone: '03001234567', address: 'Karachi address' },
        branch: 'Clifton',
        items: [{ id: 1, qty: 2 }],
      }),
    });
    if (res.status !== 201) throw new Error('Create order failed: ' + await res.text());
    const orderData = await res.json();
    orderId = orderData.orderId;
    console.log(`  Order created: ${orderId}, Total: ${orderData.total}`);
    if (orderData.total !== 1850) throw new Error(`Total wrong: ${orderData.total}`);
    console.log('  PASS');

    // 4. GET /api/orders/:id
    console.log('Testing GET /api/orders/:id...');
    res = await fetch(`http://localhost:${PORT}/api/orders/${orderId}`);
    if (res.status !== 200) throw new Error('Get order failed: ' + await res.text());
    console.log('  PASS');

    // 5. GET /api/admin/orders
    console.log('Testing GET /api/admin/orders...');
    res = await fetch(`http://localhost:${PORT}/api/admin/orders?branch=Clifton`, {
      headers: { 'Authorization': `Bearer ${authToken}` },
    });
    if (res.status !== 200) throw new Error('Admin orders failed: ' + await res.text());
    console.log('  PASS');

    // 6. PATCH /api/admin/orders/:id/status
    console.log('Testing PATCH /api/admin/orders/:id/status...');
    res = await fetch(`http://localhost:${PORT}/api/admin/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify({ status: 'Preparing' }),
    });
    if (res.status !== 200) throw new Error('Update status failed: ' + await res.text());
    console.log('  PASS');

    console.log('All API tests PASSED!');
  } catch (err) {
    console.error('Test FAILED:', err.message);
  } finally {
    server.close();
    process.exit(0);
  }
}

runTests();