const express = require('express');
const { getAll } = require('./db');
const orderService = require('./orderService');
const auth = require('./auth');
const validate = require('./validate');

const router = express.Router();

// GET /api/menu
router.get('/menu', async (req, res) => {
  try {
    const rows = await getAll(
      'SELECT id, name, price, category, tags, available FROM menu_items WHERE available = 1 ORDER BY id'
    );
    res.json(rows.map((row) => ({
      id: row.id,
      name: row.name,
      price: row.price,
      category: row.category,
      tags: row.tags,
      available: !!row.available,
      description: '',
      image: '',
    })));
  } catch (err) {
    console.error('Menu error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/orders
router.post('/orders', async (req, res) => {
  const body = req.body || {};
  const customer = body.customer || {};
  const branch = body.branch;
  const items = body.items;

  if (!validate.isValidName(customer.name)) {
    return res.status(400).json({ error: 'customer.name is required and must be a valid name' });
  }
  if (!validate.isValidPhone(customer.phone)) {
    return res.status(400).json({ error: 'customer.phone is required and must be a valid Pakistani phone number' });
  }
  if (!validate.isValidAddress(customer.address)) {
    return res.status(400).json({ error: 'customer.address is required and must be a valid address' });
  }

  if (!validate.isValidBranch(branch)) {
    return res.status(400).json({ error: 'branch is required and must be one of: Clifton, Gulshan-e-Iqbal, North Nazimabad' });
  }

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'items are required and must be a non-empty array' });
  }
  for (const item of items) {
    if (!item.id || !Number.isInteger(item.id) || item.id <= 0) {
      return res.status(400).json({ error: 'Each item must have a valid id' });
    }
    if (!validate.isValidQuantity(item.qty)) {
      return res.status(400).json({ error: `Invalid quantity for item ${item.id}` });
    }
  }

  try {
    const order = await orderService.createOrder(customer, branch, items);
    res.status(201).json(order);
  } catch (err) {
    console.error('Order creation error:', err.message);
    if (err.message && err.message.includes('not found')) {
      return res.status(400).json({ error: err.message });
    }
    if (err.message && err.message.includes('unavailable')) {
      return res.status(400).json({ error: err.message });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/orders/:id
router.get('/orders/:id', async (req, res) => {
  const orderId = req.params.id;
  if (!orderId) {
    return res.status(400).json({ error: 'Order ID is required' });
  }

  try {
    const order = await orderService.getOrderById(orderId);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    res.json(order);
  } catch (err) {
    console.error('Get order error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/login
router.post('/auth/login', async (req, res) => {
  const body = req.body || {};
  const username = body.username;
  const password = body.password;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  try {
    const user = await auth.authenticateUser(username, password);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = auth.generateToken(user);
    res.json({ token });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/admin/orders
router.get('/admin/orders', auth.authMiddleware, auth.requireAdmin, async (req, res) => {
  const branch = req.query.branch || null;
  const date = req.query.date || null;

  try {
    const orders = await orderService.getAllOrders(branch, date);
    res.json(orders);
  } catch (err) {
    console.error('Admin orders error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/admin/orders/:id/status
router.patch('/admin/orders/:id/status', auth.authMiddleware, auth.requireAdmin, async (req, res) => {
  const orderId = req.params.id;
  const newStatus = req.body && req.body.status;

  if (!newStatus) {
    return res.status(400).json({ error: 'Status is required' });
  }

  try {
    const result = await orderService.updateOrderStatus(orderId, newStatus);
    if (!result) {
      return res.status(404).json({ error: 'Order not found' });
    }
    res.json(result);
  } catch (err) {
    console.error('Update status error:', err.message);
    if (err.message && err.message.includes('Invalid status transition')) {
      return res.status(400).json({ error: err.message });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;