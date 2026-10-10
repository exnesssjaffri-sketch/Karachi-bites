const assert = require('assert');
const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const net = require('net');
const crypto = require('crypto');

const SERVER_PATH = path.join(__dirname, '..', 'src', 'server.js');
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'karachi-bites-persistence-'));
const databasePath = path.join(tempDir, 'persistence.sqlite');
const jwtSecret = process.env.JWT_SECRET || crypto.randomBytes(32).toString('hex');

function getFreePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      const port = address.port;
      server.close((err) => err ? reject(err) : resolve(port));
    });
  });
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function startServer(port) {
  const child = spawn(process.execPath, [SERVER_PATH], {
    env: {
      ...process.env,
      PORT: String(port),
      DATABASE_PATH: databasePath,
      JWT_SECRET: jwtSecret,
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  let output = '';
  child.stdout.on('data', (chunk) => { output += chunk.toString(); });
  child.stderr.on('data', (chunk) => { output += chunk.toString(); });

  const deadline = Date.now() + 15000;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) {
      throw new Error('Server process exited before becoming ready. Output: ' + output);
    }
    try {
      const response = await fetch('http://127.0.0.1:' + port + '/api/menu');
      if (response.ok) return { child, output: () => output };
    } catch (_) {
      // The listener may not be ready yet; retry until the deadline.
    }
    await delay(150);
  }

  child.kill();
  throw new Error('Server did not become ready within 15 seconds. Output: ' + output);
}

async function stopServer(server) {
  if (!server || server.child.exitCode !== null) return;
  await new Promise((resolve) => {
    const timeout = setTimeout(() => {
      server.child.kill('SIGKILL');
      resolve();
    }, 4000);
    server.child.once('exit', () => {
      clearTimeout(timeout);
      resolve();
    });
    server.child.kill('SIGTERM');
  });
}

async function testPersistence() {
  let server1;
  let server2;
  try {
    console.log('--- Persistence Test (separate server processes) ---');

    const port1 = await getFreePort();
    server1 = await startServer(port1);

    const createdResponse = await fetch('http://127.0.0.1:' + port1 + '/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer: {
          name: 'Persistence Test',
          phone: '03001234567',
          address: 'Persistence test address, Karachi',
        },
        branch: 'Clifton',
        items: [{ id: 1, qty: 1 }],
      }),
    });
    assert.strictEqual(createdResponse.status, 201, 'Order should be created in the first process');
    const createdOrder = await createdResponse.json();
    assert.ok(createdOrder.orderId, 'Created order must include a public order ID');
    assert.strictEqual(createdOrder.total, 1000, 'Total should be item price plus Rs. 150 delivery');

    await stopServer(server1);
    server1 = null;

    const port2 = await getFreePort();
    server2 = await startServer(port2);

    const fetchedResponse = await fetch(
      'http://127.0.0.1:' + port2 + '/api/orders/' + encodeURIComponent(createdOrder.orderId)
    );
    assert.strictEqual(fetchedResponse.status, 200, 'Order should still exist in a new process');
    const fetchedOrder = await fetchedResponse.json();
    assert.strictEqual(fetchedOrder.orderId, createdOrder.orderId);
    assert.strictEqual(fetchedOrder.total, 1000);
    assert.strictEqual(fetchedOrder.items.length, 1);
    assert.strictEqual(fetchedOrder.items[0].name, 'Chicken Malai Boti');
    assert.strictEqual(fetchedOrder.branch, 'Clifton');

    console.log('Persistence test PASSED: the order was retrieved after the first server process stopped.');
  } catch (error) {
    console.error('Persistence test FAILED:', error.message);
    process.exitCode = 1;
  } finally {
    await stopServer(server1);
    await stopServer(server2);
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}

testPersistence().catch((error) => {
  console.error('Unhandled persistence test error:', error);
  process.exitCode = 1;
});
