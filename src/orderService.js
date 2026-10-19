const crypto = require('crypto');
const { getOne, getAll, run, withTransaction, isSqlite, get, query } = require('./db');
const { isValidTransition, isValidNotes, sanitizeString } = require('./validate');

const DELIVERY_FEE = parseInt(process.env.DELIVERY_FEE || '150', 10);

function generatePublicOrderId() {
  const date = new Date();
  const dateStr = date.getFullYear().toString() +
    String(date.getMonth() + 1).padStart(2, '0') +
    String(date.getDate()).padStart(2, '0');
  const random = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `KB-${dateStr}-${random}`;
}

async function generateUniquePublicOrderId() {
  for (let attempt = 0; attempt < 10; attempt++) {
    const candidate = generatePublicOrderId();
    const existing = await getOne('SELECT 1 FROM orders WHERE public_order_id = ?', [candidate]);
    if (!existing) return candidate;
  }
  const fallback = `KB-${Date.now()}-${crypto.randomBytes(6).toString('hex').toUpperCase()}`;
  return fallback;
}

let orderCreationLock = false;
const orderCreationQueue = [];

function acquireOrderLock() {
  return new Promise((resolve) => {
    if (!orderCreationLock) {
      orderCreationLock = true;
      resolve();
    } else {
      orderCreationQueue.push(resolve);
    }
  });
}

function releaseOrderLock() {
  if (orderCreationQueue.length > 0) {
    const next = orderCreationQueue.shift();
    next();
  } else {
    orderCreationLock = false;
  }
}

async function createOrder(customer, branch, items, notes, idempotencyKey) {
  await acquireOrderLock();
  try {
    const { name, phone, address } = customer;
    if (!items || items.length === 0) {
      throw new Error('No items in order');
    }
    const safeNotes = notes === undefined || notes === null ? null : sanitizeString(String(notes), 500);
    if (safeNotes && !isValidNotes(safeNotes)) {
      throw new Error('customer.notes must be 500 characters or fewer');
    }

    if (idempotencyKey) {
      const existing = await getOne('SELECT public_order_id FROM orders WHERE idempotency_key = ?', [idempotencyKey]);
      if (existing) {
        return { orderId: existing.public_order_id, deduplicated: true };
      }
    }

    return await withTransaction(async (client) => {
      let subtotal = 0;
      const orderItems = [];

      for (const item of items) {
        const row = await getOne('SELECT id, name, price, available FROM menu_items WHERE id = ?', [item.id], client);
        if (!row) {
          throw new Error(`Menu item with id ${item.id} not found`);
        }
        if (!row.available) {
          throw new Error(`Menu item with id ${item.id} is currently unavailable`);
        }
        const lineTotal = row.price * item.qty;
        subtotal += lineTotal;
        orderItems.push({
          menu_item_id: row.id,
          quantity: item.qty,
          price_at_order: row.price,
          name_at_order: row.name,
        });
      }

      const total = subtotal + DELIVERY_FEE;
      const publicId = await generateUniquePublicOrderId();

      const orderResult = await run(
        'INSERT INTO orders (public_order_id, customer_name, customer_phone, customer_address, branch, status, total, customer_notes, idempotency_key) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [publicId, name, phone, address, branch, 'Received', total, safeNotes, idempotencyKey || null],
        client
      );
      const orderId = orderResult.lastID;

      for (const oi of orderItems) {
        await run(
          'INSERT INTO order_items (order_id, menu_item_id, quantity, price_at_order, name_at_order) VALUES (?, ?, ?, ?, ?)',
          [orderId, oi.menu_item_id, oi.quantity, oi.price_at_order, oi.name_at_order],
          client
        );
      }

      return {
        orderId: publicId,
        total,
        status: 'Received',
        items: orderItems.map((item) => ({
          id: item.menu_item_id,
          name: item.name_at_order,
          quantity: item.quantity,
          price: item.price_at_order,
          lineTotal: item.price_at_order * item.quantity,
        })),
      };
    });
  } finally {
    releaseOrderLock();
  }
}

async function trackOrder(orderId, phone) {
  const cleanedPhone = typeof phone === 'string' ? phone.replace(/[\s-]/g, '') : '';
  const order = await getOne('SELECT * FROM orders WHERE public_order_id = ?', [orderId]);
  if (!order) {
    const err = new Error('Order not found');
    err.statusCode = 404;
    throw err;
  }
  if (order.customer_phone !== cleanedPhone) {
    const err = new Error('Phone number does not match this order');
    err.statusCode = 403;
    throw err;
  }
  const items = await getAll(
    'SELECT oi.id, oi.menu_item_id, oi.quantity, oi.price_at_order, oi.name_at_order FROM order_items oi WHERE oi.order_id = ?',
    [order.id]
  );
  return {
    orderId: order.public_order_id,
    status: order.status,
    items: items.map((i) => ({
      id: i.menu_item_id,
      name: i.name_at_order,
      quantity: i.quantity,
      price: i.price_at_order,
      lineTotal: i.price_at_order * i.quantity,
    })),
    total: order.total,
    branch: order.branch,
    createdAt: order.created_at,
  };
}

async function getKitchenTicket(orderId) {
  const order = await getOne('SELECT * FROM orders WHERE public_order_id = ?', [orderId]);
  if (!order) {
    const err = new Error('Order not found');
    err.statusCode = 404;
    throw err;
  }
  const items = await getAll(
    'SELECT oi.id, oi.menu_item_id, oi.quantity, oi.price_at_order, oi.name_at_order FROM order_items oi WHERE oi.order_id = ?',
    [order.id]
  );
  return {
    orderId: order.public_order_id,
    branch: order.branch,
    createdAt: order.created_at,
    status: order.status,
    items: items.map((i) => ({
      id: i.menu_item_id,
      name: i.name_at_order,
      quantity: i.quantity,
      price: i.price_at_order,
      lineTotal: i.price_at_order * i.quantity,
    })),
    notes: order.customer_notes || '',
    total: order.total,
  };
}

function getOrderById(orderId) {
  return getOne('SELECT * FROM orders WHERE public_order_id = ?', [orderId])
    .then((order) => {
      if (!order) return null;
      return getAll(
        'SELECT oi.id, oi.menu_item_id, oi.quantity, oi.price_at_order, oi.name_at_order FROM order_items oi WHERE oi.order_id = ?',
        [order.id]
      ).then((items) => ({
        orderId: order.public_order_id,
        status: order.status,
        items: items.map((i) => ({
          id: i.menu_item_id,
          name: i.name_at_order,
          quantity: i.quantity,
          price: i.price_at_order,
          lineTotal: i.price_at_order * i.quantity,
        })),
        total: order.total,
        branch: order.branch,
        createdAt: order.created_at,
      }));
    });
}

function updateOrderStatus(orderId, newStatus) {
  return getOne('SELECT * FROM orders WHERE public_order_id = ?', [orderId])
    .then((order) => {
      if (!order) return null;
      if (!isValidTransition(order.status, newStatus)) {
        throw new Error(`Invalid status transition from ${order.status} to ${newStatus}`);
      }
      return run('UPDATE orders SET status = ? WHERE public_order_id = ?', [newStatus, orderId])
        .then(() => ({ orderId, status: newStatus }));
    });
}

function getAllOrders(branch, date, dateFrom, dateTo) {
  let query = 'SELECT * FROM orders WHERE 1=1';
  const params = [];

  if (branch) {
    query += ' AND branch = ?';
    params.push(branch);
  }
  if (date) {
    query += ' AND DATE(created_at) = ?';
    params.push(date);
  }
  if (dateFrom) {
    query += ' AND DATE(created_at) >= ?';
    params.push(dateFrom);
  }
  if (dateTo) {
    query += ' AND DATE(created_at) <= ?';
    params.push(dateTo);
  }

  query += ' ORDER BY created_at DESC';

  return getAll(query, params).then((rows) =>
    rows.map((row) => ({
      orderId: row.public_order_id,
      status: row.status,
      total: row.total,
      branch: row.branch,
      customer: {
        name: row.customer_name,
        phone: row.customer_phone,
        address: row.customer_address,
      },
      createdAt: row.created_at,
    }))
  );
}

async function reorderFromOrder(originalOrderId, customer) {
  const original = await getOne('SELECT * FROM orders WHERE public_order_id = ?', [originalOrderId]);
  if (!original) {
    const err = new Error('Original order not found');
    err.statusCode = 404;
    throw err;
  }
  const { name, phone, address } = customer || {};
  const normalizePhone = (value) => String(value || '').replace(/[\s-]/g, '');
  if (!phone || normalizePhone(phone) !== normalizePhone(original.customer_phone)) {
    const err = new Error('Phone number does not match the original order');
    err.statusCode = 403;
    throw err;
  }
  const items = await getAll(
    'SELECT oi.menu_item_id, oi.quantity FROM order_items oi WHERE oi.order_id = ?',
    [original.id]
  );
  if (items.length === 0) {
    const err = new Error('Original order has no items');
    err.statusCode = 400;
    throw err;
  }
  const notes = customer && customer.notes;
  const idempotencyKey = 'reorder:' + originalOrderId + ':' + normalizePhone(phone) + ':' + Date.now();
  return createOrder(
    { name, phone: normalizePhone(phone), address },
    original.branch,
    items.map((i) => ({ id: i.menu_item_id, qty: i.quantity })),
    notes,
    idempotencyKey
  );
}

module.exports = {
  createOrder,
  getOrderById,
  updateOrderStatus,
  getAllOrders,
  generatePublicOrderId,
  generateUniquePublicOrderId,
  trackOrder,
  getKitchenTicket,
  reorderFromOrder,
};