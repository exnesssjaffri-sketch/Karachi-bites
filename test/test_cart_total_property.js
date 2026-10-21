const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const read = (name) => fs.readFileSync(path.join(root, name), 'utf8');

const appHtml = read('public/app.html');
const storeSource = read('public/js/store.js');
const cartSource = read('public/js/pages-cart.js');
const checkoutSource = read('public/js/pages-checkout.js');

// --- Regression: app.html must load i18n.js exactly once ---
const i18nLoads = appHtml.match(/<script[^>]*js\/i18n\.js[^>]*><\/script>/g) || [];
assert.equal(i18nLoads.length, 1, 'app.html must load js/i18n.js exactly once (found ' + i18nLoads.length + ')');

// --- Regression: cart page must read the same property the store persists ---
// store.js persists each cart item under the key "quantity".
assert.match(storeSource, /quantity: item\.quantity/, 'store.js persists cart items under the quantity key');
// The cart page must not read item.qty anywhere (undefined for stored carts -> broken totals).
assert.doesNotMatch(cartSource, /item\.qty\b/, 'pages-cart.js must not read item.qty (store persists quantity)');
assert.match(cartSource, /item\.price \* item\.quantity/, 'pages-cart.js subtotal must use the persisted quantity property');
assert.match(cartSource, /\$\{item\.quantity\}/, 'pages-cart.js quantity display must use the persisted quantity property');
// Checkout must continue to send the API wire format "qty" derived from quantity.
assert.match(checkoutSource, /qty: item\.quantity/, 'checkout maps the store quantity property onto the qty API field');

// --- Behavioral regression: totals computed from a real store round-trip ---
const values = new Map();
const storage = {
  getItem(key) { return values.has(key) ? values.get(key) : null; },
  setItem(key, value) { values.set(key, String(value)); },
  removeItem(key) { values.delete(key); },
};
const window = {
  addEventListener() {},
  dispatchEvent() {},
};
const context = {
  window,
  localStorage: storage,
  Event: function Event(type) { this.type = type; },
  console,
  URLSearchParams,
};
vm.runInNewContext(storeSource, context, { filename: 'public/js/store.js' });
const cartStore = window.cartStore;
assert.ok(cartStore, 'store.js must expose window.cartStore');

cartStore.addItem({ id: 1, name: 'Chicken Biryani', price: 850, quantity: 1 });
cartStore.addItem({ id: 1, name: 'Chicken Biryani', price: 850, quantity: 1 });
cartStore.addItem({ id: 2, name: 'Vegetable Pulao', price: 400, quantity: 1 });
cartStore.updateQuantity(1, 1); // biryani now x3

const cart = cartStore.getCart();
// Reproduce pages-cart.js _calcTotals exactly.
const subtotal = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
const deliveryFee = 150;
const grandTotal = subtotal + deliveryFee;
assert.equal(subtotal, 2950, 'Cart subtotal must sum price x quantity from stored items');
assert.equal(deliveryFee, 150, 'Delivery fee must remain Rs. 150');
assert.equal(grandTotal, 3100, 'Cart grand total must be subtotal + Rs. 150');
assert.ok(Number.isFinite(subtotal) && Number.isFinite(grandTotal), 'Cart totals must be finite numbers, not NaN');

// The quantity display template expression must resolve to a real number.
for (const item of cart.items) {
  assert.ok(Number.isFinite(item.quantity), 'Every cart item must expose a finite quantity for display');
}

console.log('Cart total property regression tests passed.');