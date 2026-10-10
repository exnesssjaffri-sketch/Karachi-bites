const express = require('express');
const { getDb } = require('./db');
const orderService = require('./orderService');
const auth = require('./auth');
const validate = require('./validate');

const router = express.Router();

// GET /api/menu
router.get('/menu', (req, res) => {
  const db = getDb();
  db.all('SELECT id, name, price, category, tags FROM menu_items ORDER BY id', (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Internal server error' });
    }
    res.json(rows.map((row) => ({
      id: row.id,
      name: row.name,
      price: row.price,
      category: row.category,
      tags: row.tags,
description: '',
      image: '',
    })));
  });
});

// POST /api/orders
router.post('/orders', (req, res) => {
  const body = req.body || {};
  const customer = body.customer || {};
  const branch = body.branch;
  const items = body.items;

  // Validate customer
  if (!validate.isValidName(customer.name)) {
    return res.status(400).json({ error: 'customer.name is required and must be a valid name' });
  }
  if (!validate.isValidPhone(customer.phone)) {
    return res.status(400).json({ error: 'customer.phone is required and must be a valid Pakistani phone number' });
  }
  if (!validate.isValidAddress(customer.address)) {
    return res.status(400).json({ error: 'customer.address is required and must be a valid address' });
  }

  // Validate branch
  if (!validate.isValidBranch(branch)) {
    return res.status(400).json({ error: 'branch is required and must be Clifton' });
  }

  // Validate items
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

  orderService.createOrder(customer, branch, items)
    .then((order) => res.status(201).json(order))
    .catch((err) => {
      console.error('Order creation error:', err.message);
      if (err.message && err.message.includes('not found')) {
        return res.status(400).json({ error: err.message });
      }
      return res.status(500).json({ error: 'Internal server error' });
    });
});

// GET /api/orders/:id
router.get('/orders/:id', (req, res) => {
  const orderId = req.params.id;
  if (!orderId) {
    return res.status(400).json({ error: 'Order ID is required' });
  }

  orderService.getOrderById(orderId)
    .then((order) => {
      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }
      res.json(order);
    })
    .catch((err) => {
      console.error('Get order error:', err.message);
      res.status(500).json({ error: 'Internal server error' });
    });
});

// POST /api/auth/login
router.post('/auth/login', (req, res) => {
  const body = req.body || {};
  const username = body.username;
  const password = body.password;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  auth.authenticateUser(username, password)
    .then((user) => {
      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      const token = auth.generateToken(user);
      res.json({ token });
    })
    .catch((err) => {
      console.error('Login error:', err.message);
      res.status(500).json({ error: 'Internal server error' });
    });
});

// GET /api/admin/orders
router.get('/admin/orders', auth.authMiddleware, auth.requireAdmin, (req, res) => {
  const branch = req.query.branch || null;
  const date = req.query.date || null;

  orderService.getAllOrders(branch, date)
    .then((orders) => res.json(orders))
    .catch((err) => {
      console.error('Admin orders error:', err.message);
      res.status(500).json({ error: 'Internal server error' });
    });
});

// PATCH /api/admin/orders/:id/status
router.patch('/admin/orders/:id/status', auth.authMiddleware, auth.requireAdmin, (req, res) => {
  const orderId = req.params.id;
  const newStatus = req.body && req.body.status;

  if (!newStatus) {
    return res.status(400).json({ error: 'Status is required' });
  }

  orderService.updateOrderStatus(orderId, newStatus)
    .then((result) => {
      if (!result) {
        return res.status(404).json({ error: 'Order not found' });
      }
      res.json(result);
    })
    .catch((err) => {
      console.error('Update status error:', err.message);
      if (err.message && err.message.includes('Invalid status transition')) {
        return res.status(400).json({ error: err.message });
      }
      res.status(500).json({ error: 'Internal server error' });
    });
});

module.exports = router;