const app = require('../src/server');
const fs = require('fs');

function sleep(ms) { return new Promise((res) => setTimeout(res, ms)); }

async function testFailures() {
    console.log('--- Failure Tests ---');
    const PORT = 3005;
    process.env.PORT = PORT;

    if (fs.existsSync('./failure_test.db')) fs.unlinkSync('./failure_test.db');

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

    // 1. Missing customer.name
    await test('Missing customer.name', async () => {
        const res = await fetch(`http://localhost:${PORT}/api/orders`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                customer: { phone: '03001234567', address: 'Test 123' },
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
                customer: { name: 'Test User', phone: '1234567890', address: 'Valid Address 123' },
                branch: 'Clifton',
                items: [{ id: 1, qty: 1 }],
            }),
        });
        if (res.status < 400) throw new Error('Expected failure');
        const data = await res.json();
        if (!data.error || !data.error.includes('customer.phone')) throw new Error('Wrong error');
    });

    // 3. Create order for auth tests
    let authToken = '';
    let orderId = '';
    {
        console.log('   - Login');
        const loginRes = await fetch(`http://localhost:${PORT}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: 'admin', password: 'admin123' }),
        });
        if (loginRes.status !== 200) throw new Error('Login failed');
        const data = await loginRes.json();
        authToken = data.token;
        console.log('   - Token received');

        console.log('   - Create order with auth');
        const orderRes = await fetch(`http://localhost:${PORT}/api/orders`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`,
            },
            body: JSON.stringify({
                customer: { name: 'Valid User', phone: '03001234567', address: 'Valid Address 123' },
                branch: 'Clifton',
                items: [{ id: 1, qty: 1 }],
            }),
        });
        console.log('   Order created:', orderRes.status);
        if (orderRes.status !== 201) throw new Error(`Order failed`);
        const orderData = await orderRes.json();
        orderId = orderData.orderId;
        console.log('   Order created:', orderId);
    }

    // 4. Missing auth token
    await test('Missing auth token', async () => {
        const res = await fetch(`http://localhost:${PORT}/api/admin/orders`);
        if (res.status !== 401) throw new Error('Expected 401');
    });

    // 5. Invalid status transition
    await test('Invalid status transition', async () => {
        const res = await fetch(`http://localhost:${PORT}/api/admin/orders/${orderId}/status`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`,
            },
            body: JSON.stringify({ status: 'Delivered' }),
        });
        if (res.status < 400) throw new Error('Expected failure');
        const data = await res.json();
        if (!data.error || !data.error.includes('Invalid status transition')) throw new Error('Wrong error');
    });

    // Close the server
    await new Promise((resolve) => server.close(resolve));

    console.log(`\nFailure tests: ${passed}/${total} passed`);
    if (passed === total) {
        console.log('All failure tests PASSED!');
    } else {
        throw new Error('Some failure tests failed');
    }
}

testFailures().catch(err => {
    console.error('Unhandled error:', err);
    process.exit(1);
});