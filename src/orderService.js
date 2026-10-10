const { getDb } = require('./db');
const { isValidTransition } = require('./validate');

const DELIVERY_FEE = parseInt(process.env.DELIVERY_FEE || '150', 10);

function generatePublicOrderId() {
  const date = new Date();
  const dateStr = date.getFullYear().toString() +
    String(date.getMonth() + 1).padStart(2, '0') +
    String(date.getDate()).padStart(2, '0');
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `KB-${dateStr}-${random}`;
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

function createOrder(customer, branch, items) {
  return acquireOrderLock().then(() => {
    const db = getDb();
    return new Promise((resolve, reject) => {
      const { name, phone, address } = customer;

      db.run('BEGIN TRANSACTION', (beginErr) => {
        if (beginErr) {
          releaseOrderLock();
          return reject(beginErr);
        }

        const totalItems = items.length;
        if (totalItems === 0) {
          return db.run('ROLLBACK', () => {
            releaseOrderLock();
            reject(new Error('No items in order'));
          });
        }

        let processed = 0;
        let subtotal = 0;
        const orderItems = [];
        let failed = false;

        items.forEach((item) => {
          if (failed) return;
          db.get('SELECT id, name, price, available FROM menu_items WHERE id = ?', [item.id], (err, row) => {
            if (failed) return;
            if (err) {
              failed = true;
              return db.run('ROLLBACK', () => {
                releaseOrderLock();
                reject(err);
              });
            }
            if (!row) {
              failed = true;
              return db.run('ROLLBACK', () => {
                releaseOrderLock();
                reject(new Error(`Menu item with id ${item.id} not found`));
              });
            }
            if (!row.available) {
              failed = true;
              return db.run('ROLLBACK', () => {
                releaseOrderLock();
                reject(new Error(`Menu item with id ${item.id} is currently unavailable`));
              });
            }
            const lineTotal = row.price * item.qty;
            subtotal += lineTotal;
            orderItems.push({
              menu_item_id: row.id,
              quantity: item.qty,
              price_at_order: row.price,
              name_at_order: row.name,
            });

            processed++;
            if (processed === totalItems) {
              const total = subtotal + DELIVERY_FEE;
              const publicId = generatePublicOrderId();

              db.run(
                'INSERT INTO orders (public_order_id, customer_name, customer_phone, customer_address, branch, status, total) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [publicId, name, phone, address, branch, 'Received', total],
                function (insertErr) {
                  if (failed) return;
                  if (insertErr) {
                    failed = true;
                    return db.run('ROLLBACK', () => {
                      releaseOrderLock();
                      reject(insertErr);
                    });
                  }
                  const orderId = this.lastID;
                  const stmt = db.prepare('INSERT INTO order_items (order_id, menu_item_id, quantity, price_at_order, name_at_order) VALUES (?, ?, ?, ?, ?)');
                  orderItems.forEach((oi) => {
                    stmt.run(orderId, oi.menu_item_id, oi.quantity, oi.price_at_order, oi.name_at_order);
                  });
                  stmt.finalize(() => {
                    db.run('COMMIT', (commitErr) => {
                      if (commitErr) {
                        failed = true;
                        return db.run('ROLLBACK', () => {
                          releaseOrderLock();
                          reject(commitErr);
                        });
                      }
                      releaseOrderLock();
                      resolve({
                        orderId: publicId,
                        total,
                        status: 'Received',
                      });
                    });
                  });
                }
              );
            }
          });
        });
      });
    });
  });
}

function rollbackAndReject(reject, err) {
  const db = getDb();
  db.run('ROLLBACK');
  reject(err);
}

function getOrderById(orderId) {
  const db = getDb();
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM orders WHERE public_order_id = ?', [orderId], (err, order) => {
      if (err) return reject(err);
      if (!order) return resolve(null);

      db.all(
        'SELECT oi.id, oi.menu_item_id, oi.quantity, oi.price_at_order, oi.name_at_order FROM order_items oi WHERE oi.order_id = ?',
        [order.id],
        (err2, items) => {
          if (err2) return reject(err2);
          resolve({
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
            customer: {
              name: order.customer_name,
              phone: order.customer_phone,
              address: order.customer_address,
            },
            branch: order.branch,
            createdAt: order.created_at,
          });
        }
      );
    });
  });
}

function updateOrderStatus(orderId, newStatus) {
  const db = getDb();
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM orders WHERE public_order_id = ?', [orderId], (err, order) => {
      if (err) return reject(err);
      if (!order) return resolve(null);

      if (!isValidTransition(order.status, newStatus)) {
        return reject(new Error(`Invalid status transition from ${order.status} to ${newStatus}`));
      }

      db.run('UPDATE orders SET status = ? WHERE public_order_id = ?', [newStatus, orderId], (err2) => {
        if (err2) return reject(err2);
        resolve({ orderId, status: newStatus });
      });
    });
  });
}

function getAllOrders(branch, date) {
  const db = getDb();
  return new Promise((resolve, reject) => {
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

    query += ' ORDER BY created_at DESC';

    db.all(query, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows.map((row) => ({
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
      })));
    });
  });
}

module.exports = {
  createOrder,
  getOrderById,
  updateOrderStatus,
  getAllOrders,
  generatePublicOrderId,
};