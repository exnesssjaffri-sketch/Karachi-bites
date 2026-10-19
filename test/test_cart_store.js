const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

const source = fs.readFileSync(path.join(__dirname, '..', 'public/js/store.js'), 'utf8');
const values = new Map();
const listeners = new Map();
const storage = {
  getItem(key) { return values.has(key) ? values.get(key) : null; },
  setItem(key, value) { values.set(key, String(value)); },
  removeItem(key) { values.delete(key); },
};
function createPageContext() {
  const dispatched = [];
  const window = {
    addEventListener(type, callback) { listeners.set(type, callback); },
    dispatchEvent(event) { dispatched.push(event.type); },
  };
  const context = {
    window,
    localStorage: storage,
    Event: function Event(type) { this.type = type; },
    console,
  };
  vm.runInNewContext(source, context, { filename: 'public/js/store.js' });
  return { cartStore: window.cartStore, window, dispatched };
}

function run() {
  // First page load: add an item and persist the cart.
  const firstPage = createPageContext();
  listeners.get('DOMContentLoaded')();
  firstPage.cartStore.addItem({ id: 1, name: 'Chicken Biryani', price: 850, quantity: 1 });
  firstPage.cartStore.addItem({ id: 1, name: 'Chicken Biryani', price: 850, quantity: 1 });
  firstPage.cartStore.addItem({ id: 2, name: 'Vegetable Pulao', price: 400, quantity: 1 });

  const saved = JSON.parse(storage.getItem('karachi_bites_cart'));
  assert.equal(saved.items.length, 2, 'Repeated item adds should not create duplicate cart rows');
  assert.equal(saved.items.find((item) => item.id === 1).quantity, 2, 'Repeated item adds should increment quantity');
  assert.equal(saved.itemCount, 3, 'Cart item count should total quantities, not rows');
  assert.equal(saved.total, 2100, 'Cart subtotal should be calculated from its current items');

  // Simulate a full page refresh: create a new JS context over the same localStorage.
  const refreshedPage = createPageContext();
  listeners.get('DOMContentLoaded')();
  const restored = refreshedPage.cartStore.getCart();
  assert.equal(restored.items.length, 2, 'Cart items should survive a page refresh');
  assert.equal(restored.itemCount, 3, 'Cart item count should survive a page refresh');
  assert.equal(restored.total, 2100, 'Cart subtotal should survive a page refresh');

  refreshedPage.cartStore.updateQuantity(1, 1);
  const changed = JSON.parse(storage.getItem('karachi_bites_cart'));
  assert.equal(changed.items.find((item) => item.id === 1).quantity, 3, 'Quantity changes should persist');
  assert.equal(changed.total, 2950, 'Subtotal should recalculate after quantity changes');
  refreshedPage.cartStore.removeItem(2);
  const removed = JSON.parse(storage.getItem('karachi_bites_cart'));
  assert.equal(removed.items.length, 1, 'Removing a cart item should persist');
  assert.equal(removed.itemCount, 3, 'Item count should recalculate after removing another row');
  assert.equal(removed.total, 2550, 'Subtotal should recalculate after removing an item');

  console.log('Cart store tests passed: localStorage refresh persistence, add/increment, quantity changes and removal.');
}

try {
  run();
} catch (error) {
  console.error('Cart store tests FAILED:', error.stack || error.message);
  process.exitCode = 1;
}
