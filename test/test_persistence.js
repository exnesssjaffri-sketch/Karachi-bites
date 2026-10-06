const app = require('../src/server');
const { getDb } = require('../src/db');

function sleep(ms) { return new Promise((res) => setTimeout(res, ms)); }

async function testPersistence() {
  console.log('--- Persistence Test ---');
  const PORT1 = 3003;
  const PORT2 = 3004;

  process.env.PORT = PORT1;
  process.env.DATABASE_PATH = './persistence_test.db';
  const testDbPath = process.env.DATABASE_PATH;

  // Clean up
  const fs = require('fs');
  if (fs.existsSync(testDbPath)) fs.unlinkSync(testDbPath);

  // First server
  const server1 = app.listen(PORT1);
  console.log(`Server 1 listening on ${PORT1}`);
  await sleep(2000); // DB init and seed

  // Create an order via first server
  let orderId = '';
  let authToken = '';
  try {
    // Login
    let res = await fetch(`http://localhost:${PORT1}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'admin123' }),
    });
    if (res.status !== 200) throw new Error('Login failed');
    const data = await res.json();
    authToken = data.token;

    // Create order
    res = await fetch(`http://localhost:${PORT1}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer: { name: 'Test', phone: '03001234567', address: 'Test address' },
        branch: 'Clifton',
        items: [{ id: 1, qty: 1 }],
      }),
    });
    if (res.status !== 201) throw new Error('Create order failed');
    const orderData = await res.json();
    orderId = orderData.orderId;
    console.log(`Created order: ${orderId}, Total: ${orderData.total}`);
  } catch (err) {
    console.error('Setup error:', err.message);
    server1.close();
    process.exit(1);
  }

  // Stop first server
  server1.close();
  console.log('Server 1 stopped');

  // Wait a bit
  await sleep(1000);

  // Start second server on same DB
  process.env.PORT = PORT2;
  const server2 = app.listen(PORT2);
  console.log(`Server 2 listening on ${PORT2}`);
  await sleep(2000);

  // Retrieve order via second server
  try {
    let res = await fetch(`http://localhost:${PORT2}/api/orders/${orderId}`);
    if (res.status !== 200) throw new Error('Get order failed');
    const order = await res.json();
    console.log(`Retrieved order: ${order.orderId}, Status: ${order.status}, Total: ${order.total}`);
    if (order.orderId !== orderId) throw new Error('Order ID mismatch');
    if (order.total !== 1000) throw new Error('Total mismatch');
    console.log('Persistence test PASSED!');
  } catch (err) {
    console.error('Persistence test FAILED:', err.message);
  } finally {
    server2.close();
    // Clean up DB
    if (fs.existsSync(testDbPath)) fs.unlinkSync(testDbPath);
    process.exit(0);
  }
}

testPersistence().catch(err => {
  console.error('Unhandled error:', err);
  process.exit(1);
});