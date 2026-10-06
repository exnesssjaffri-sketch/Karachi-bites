const app = require('../src/server');
const fs = require('fs');

function sleep(ms) { return new Promise((res) => setTimeout(res, ms)); }

async function testFailures() {
  console.log('--- Failure Tests ---');
  const PORT = 3005;
  process.env.PORT = PORT;
  process.env.DATABASE_PATH = './failure_test.db';

  if (fs.existsSync(process.env.DATABASE_PATH)) fs.unlinkSync(process.env.DATABASE_PATH);

  const server = app.listen(PORT);
  console.log(`Test server listening on ${PORT}`);
  await sleep(2000);

  let passed = 0;
  let total = 0;

  function test(name, fn) {
    total++;
    return fn()
      .then(() => {
        console.log(`  PASS: ${name}`);
        passed++;
      })
      .catch(err => {
        console.log(`  FAIL: ${name} - ${err.message}`);
      });
  }

  try {
    // 1. Missing customer.name
    await test('Missing customer.name', async () => {
      const res = await fetch(`http://localhost:${PORT}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer: { phone: '03001234567', address: 'Test' },
          branch: 'Clifton',
          items: [{ id: 1, qty: 1 }],
        }),
      });
      if (res.status < 400) throw new Error('Expected failure');
      const data = await res.json();
      if (!data.error || !data.error.includes('customer.name')) throw new Error('Wrong error');
    });

    // 2. Invalid phone
    await test('Invalid phone', async () => {
      const res = await fetch(`http://localhost:${PORT}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer: { name: 'Test', phone: '12345', address: 'Test' },
          branch: 'Clifton',
          items: [{ id: 1, qty: 1 }],
        }),
      });
      if (res.status < 400) throw new Error('Expected failure');
      const data = await res.json();
      if (!data.error || !data.error.includes('customer.phone')) throw new Error('Wrong error');
    });

    // Get token and create order for auth-dependent tests
    const loginRes = await fetch(`http://localhost:${PORT}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'admin123' }),
    });
    if (loginRes.status !== 200) throw new Error('Login failed');
    const { token } = await loginRes.json();

    const orderRes = await fetch(`http://localhost:${PORT}/api/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        customer: { name: 'Test', phone: '03001234567', address: 'Test' },
        branch: 'Clifton',
        items: [{ id: 1, qty: 1 }],
      }),
    });
    if (orderRes.status !== 201) throw new Error('Failed to create order');
    const { orderId } = await orderRes.json();

    // 3. Missing auth token
    await test('Missing auth token', async () => {
      const res = await fetch(`http://localhost:${PORT}/api/admin/orders`);
      if (res.status !== 401) throw new Error('Expected 401');
    });

    // 4. Invalid status transition
    await test('Invalid status transition', async () => {
      const res = await fetch(`http://localhost:${PORT}/api/admin/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ status: 'Delivered' }),
      });
      if (res.status < 400) throw new Error('Expected failure');
      const data = await res.json();
      if (!data.error || !data.error.includes('Invalid status transition')) throw new Error('Wrong error');
    });

    console.log(`\nFailure tests: ${passed}/${total} passed`);
    if (passed === total) {
      console.log('All failure tests PASSED!');
    } else {
      throw new Error('Some failure tests failed');
    }
  } finally {
    server.close();
    if (fs.existsSync(process.env.DATABASE_PATH)) fs.unlinkSync(process.env.DATABASE_PATH);
    process.exit(0);
  }
}

testFailures().catch(err => {
  console.error('Unhandled error:', err);
  process.exit(1);
});