#!/usr/bin/env node
/**
 * Karachi Bites — PostgreSQL persistence test (Phase 2, F12).
 *
 * Verifies that data written by one serverless function instance survives
 * across process restarts when the backend is backed by PostgreSQL.
 *
 * This test is deliberately separate from test/test_persistence.js (the
 * SQLite variant). It uses PG_TEST_DATABASE_URL (NOT DATABASE_URL) so that a
 * production DATABASE_URL is never consumed, and it never deletes unrelated
 * records — it only cleans up the exact order it created.
 *
 * Behavior when no test database is configured:
 *   Prints "NOT RUN: ..." and exits 0. The suite reports NOT RUN, not PASS.
 *
 * Usage:
 *   PG_TEST_DATABASE_URL=postgresql://user:password@host:5432/karachi_bites \
 *     node test/test_persistence_pg.js
 */
const assert = require('assert');
const { spawn } = require('child_process');
const path = require('path');
const net = require('net');
const crypto = require('crypto');
const { Client } = require('pg');

const SERVER_PATH = path.join(__dirname, '..', 'src', 'server.js');
const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(32).toString('hex');

function getFreePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      server.close((err) => err ? reject(err) : resolve(port));
    });
  });
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function startServer(port, databaseUrl) {
  const child = spawn(process.execPath, [SERVER_PATH], {
    env: {
      ...process.env,
      PORT: String(port),
      USE_SQLITE: 'false',
      DATABASE_URL: databaseUrl,
      JWT_SECRET: JWT_SECRET,
      // No fallback: if the URL is bad the server must fail loudly.
      PG_POOL_MAX: '1',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  let output = '';
  child.stdout.on('data', (chunk) => { output += chunk.toString(); });
  child.stderr.on('data', (chunk) => { output += chunk.toString(); });

  const deadline = Date.now() + 20000;
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
  throw new Error('Server did not become ready within 20 seconds. Output: ' + output);
}

async function stopServer(server) {
  if (!server || server.child.exitCode !== null) return;
  await new Promise((resolve) => {
    const timeout = setTimeout(() => {
      server.child.kill('SIGKILL');
async function testPersistence(databaseUrl) {
  let server1;
  let server2;
  let createdOrderId = null;
  let createdOrderPublicId = null;
  let cleanupClient = null;

  try {
    console.log('--- Persistence Test (PostgreSQL, separate server processes) ---');

    const port1 = await getFreePort();
    server1 = await startServer(port1, databaseUrl);

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
    assert.strictEqual(createdOrder.total, 1193, 'Total should be item price (850) + GST (43) + delivery (250) + packaging (50)');
    createdOrderPublicId = createdOrder.orderId;

    // Capture the internal id for surgical cleanup.
    cleanupClient = new Client({ connectionString: databaseUrl });
    await cleanupClient.connect();
    const { rows: idRows } = await cleanupClient.query(
      'SELECT id FROM public.orders WHERE public_order_id = $1',
      [createdOrderPublicId]
    );
    if (idRows.length === 0) throw new Error('Could not find created order for cleanup');
    createdOrderId = idRows[0].id;

    await stopServer(server1);
    server1 = null;

    const port2 = await getFreePort();
    server2 = await startServer(port2, databaseUrl);

    const fetchedResponse = await fetch(
      'http://127.0.0.1:' + port2 + '/api/orders/' + encodeURIComponent(createdOrderPublicId)
    );
    assert.strictEqual(fetchedResponse.status, 200, 'Order should still exist in a new process');
    const fetchedOrder = await fetchedResponse.json();
    assert.strictEqual(fetchedOrder.orderId, createdOrderPublicId);
    assert.strictEqual(fetchedOrder.total, 1193);
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
    // Surgical cleanup: remove ONLY the order this test created (and its
    // order_items via CASCADE). No other records are touched.
    if (cleanupClient && createdOrderId !== null) {
      try {
        await cleanupClient.query('DELETE FROM public.order_items WHERE order_id = $1', [createdOrderId]);
        await cleanupClient.query('DELETE FROM public.orders WHERE id = $1', [createdOrderId]);
      } catch (cleanupErr) {
        console.error('WARNING: cleanup failed (manual removal may be needed):', cleanupErr.message);
      } finally {
        await cleanupClient.end().catch(() => {});
      }
    }
  }
}

async function main() {
  const databaseUrl = process.env.PG_TEST_DATABASE_URL;
  if (!databaseUrl) {
    console.log(
      'NOT RUN: PG_TEST_DATABASE_URL is not set. Skipping PostgreSQL persistence test.\n' +
      'Set PG_TEST_DATABASE_URL to a dedicated test database (never a production one) to run this test.'
    );
    return;
  }
  await testPersistence(databaseUrl);
}

main().catch((error) => {
  console.error('Unhandled PostgreSQL persistence test error:', error);
  process.exit(1);
});
      resolve();
    }, 4000);
    server.child.once('exit', () => {
      clearTimeout(timeout);
      resolve();
    });
    server.child.kill('SIGTERM');
  });
}