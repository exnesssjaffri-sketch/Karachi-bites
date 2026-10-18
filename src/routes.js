const express = require('express');
const { getAll, run, getOne, isSqlite, nowExpression } = require('./db');
const orderService = require('./orderService');
const auth = require('./auth');
const validate = require('./validate');

const router = express.Router();

// CSV injection protection: quote every field and prefix dangerous formula
// characters (= + - @) with a single quote so spreadsheets treat them as text.
// Leading whitespace and control characters are stripped first so that
// values like "  =SUM(1,2)" or "\t+cmd" are also neutralised.
function csvCell(value) {
  let str = value === undefined || value === null ? '' : String(value);
  // Strip leading whitespace and control characters before checking for formula chars
  const stripped = str.replace(/^[\s\x00-\x1F\x7F]+/, '');
  if (/^[=+\-@]/.test(stripped)) str = `'${str}`;
  return `"${str.replace(/"/g, '""')}"`;
}

// SQLite stores booleans as 0/1 integers; PostgreSQL uses true/false.
// Always pass the correct literal for the active driver to stay cross-DB compatible.
function boolLiteral(value) {
  return isSqlite() ? (value ? 1 : 0) : !!value;
}

// GET /api/menu
router.get('/menu', async (req, res) => {
  try {
    const { category, tags, maxPrice, search } = req.query;
    let sql = 'SELECT id, name, price, category, tags, available FROM menu_items WHERE available = ' + boolLiteral(true);
    const params = [];

    if (category) {
      if (!validate.isValidCategory(category)) {
        return res.status(400).json({ error: 'Invalid category filter' });
      }
      sql += ' AND category = ?';
      params.push(category);
    }

    if (tags) {
      const tagList = Array.isArray(tags) ? tags : [tags];
      for (const t of tagList) {
        if (!validate.isValidTag(t)) {
          return res.status(400).json({ error: `Invalid tag: ${t}` });
        }
      }
      // Filter by tags using LIKE for SQLite / PostgreSQL compatibility
      const tagConditions = tagList.map(() => 'tags = ?').join(' OR ');
      sql += ' AND (' + tagConditions + ')';
      tagList.forEach((t) => params.push(t));
    }

    if (maxPrice !== undefined) {
      const maxPriceNum = Number(maxPrice);
      if (!validate.isValidMaxPrice(maxPriceNum)) {
        return res.status(400).json({ error: 'Invalid maxPrice filter' });
      }
      sql += ' AND price <= ?';
      params.push(maxPriceNum);
    }

    if (search) {
      if (!validate.isValidMenuSearchQuery(search)) {
        return res.status(400).json({ error: 'Invalid search query' });
      }
      sql += ' AND name LIKE ?';
      params.push(`%${search.trim()}%`);
    }

    sql += ' ORDER BY id';
    const rows = await getAll(sql, params);
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

// POST /api/orders/track
router.post('/orders/track', async (req, res) => {
  const body = req.body || {};
  const orderId = body.orderId;
  const phone = body.phone;

  if (!orderId || typeof orderId !== 'string') {
    return res.status(400).json({ error: 'orderId is required' });
  }
  if (!validate.isValidPhone(phone)) {
    return res.status(400).json({ error: 'phone is required and must be a valid Pakistani phone number' });
  }

  try {
    const order = await orderService.trackOrder(orderId, phone);
    res.json(order);
  } catch (err) {
    console.error('Track order error:', err.message);
    if (err.statusCode === 404) {
      return res.status(404).json({ error: 'Order not found' });
    }
    if (err.statusCode === 403) {
      return res.status(403).json({ error: 'Phone number does not match this order' });
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


// POST /api/admin/menu
router.post('/admin/menu', auth.authMiddleware, auth.requireAdmin, async (req, res) => {
  const { name, price, category, tags, available } = req.body;
  if (!validate.isValidName(name) || !validate.isValidPrice(price) || !validate.isValidCategory(category)) {
    return res.status(400).json({ error: 'Invalid menu item data' });
  }
  try {
    const result = await run(
      'INSERT INTO menu_items (name, price, category, tags, available) VALUES (?, ?, ?, ?, ?)',
      [name, price, category, tags || null, boolLiteral(available)]
    );
    res.status(201).json({ id: result.lastID, name, price, category, tags, available });
  } catch (err) {
    console.error('Add menu item error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/admin/menu/:id
router.put('/admin/menu/:id', auth.authMiddleware, auth.requireAdmin, async (req, res) => {
  const id = req.params.id;
  const { name, price, category, tags, available } = req.body;
  try {
    const exists = await getOne('SELECT 1 FROM menu_items WHERE id = ?', [id]);
    if (!exists) return res.status(404).json({ error: 'Item not found' });
    
    await run(
      'UPDATE menu_items SET name = ?, price = ?, category = ?, tags = ?, available = ? WHERE id = ?',
      [name, price, category, tags, boolLiteral(available), id]
    );
    res.json({ id, name, price, category, tags, available });
  } catch (err) {
    console.error('Update menu item error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/admin/menu/:id
// S1 requirement: hide, not permanently delete. Soft-delete by setting available=0
// so historical order_items references remain intact. Unhide via PUT available=true.
router.delete('/admin/menu/:id', auth.authMiddleware, auth.requireAdmin, async (req, res) => {
  const id = req.params.id;
  try {
    const exists = await getOne('SELECT 1 FROM menu_items WHERE id = ?', [id]);
    if (!exists) return res.status(404).json({ error: 'Item not found' });
    await run('UPDATE menu_items SET available = ' + boolLiteral(false) + ', updated_at = ' + nowExpression() + ' WHERE id = ?', [id]);
    res.status(204).send();
  } catch (err) {
    console.error('Delete menu item error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/admin/menu/:id/availability — explicit hide/unhide (admin only)
router.patch('/admin/menu/:id/availability', auth.authMiddleware, auth.requireAdmin, async (req, res) => {
  const id = req.params.id;
  const { available } = req.body || {};
  if (available === undefined || typeof available !== 'boolean') {
    return res.status(400).json({ error: 'available boolean is required' });
  }
  try {
    const row = await getOne('SELECT id, available FROM menu_items WHERE id = ?', [id]);
    if (!row) return res.status(404).json({ error: 'Item not found' });
    await run('UPDATE menu_items SET available = ' + boolLiteral(available) + ', updated_at = ' + nowExpression() + ' WHERE id = ?',
      [id]);
    res.json({ id, available: !!available });
  } catch (err) {
    console.error('Update availability error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/admin/orders/export
router.get('/admin/orders/export', auth.authMiddleware, auth.requireAdmin, async (req, res) => {
  try {
    const dateFrom = req.query.date_from || null;
    const dateTo = req.query.date_to || null;
    const orders = await orderService.getAllOrders(null, null, dateFrom, dateTo);
    const headers = ['Order ID', 'Customer', 'Phone', 'Total', 'Status', 'Date'];
    const rows = orders.map(o => [
      csvCell(o.orderId),
      csvCell(o.customer.name),
      csvCell(o.customer.phone),
      csvCell(o.total),
      csvCell(o.status),
      csvCell(o.createdAt),
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    res.header('Content-Type', 'text/csv');
    res.attachment('orders.csv');
    res.send(csv);
  } catch (err) {
    console.error('Export error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;