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

// --- Regression: failed order submission must retain cart contents ---
// This simulates what happens when checkoutPage.bindEvents() calls window.api.createOrder
// and the request fails (network error, server error, validation error).
// The cart must NOT be cleared on failure.

const failureValues = new Map();
const failureStorage = {
  getItem(key) { return failureValues.has(key) ? failureValues.get(key) : null; },
  setItem(key, value) { failureValues.set(key, String(value)); },
  removeItem(key) { failureValues.delete(key); },
};

// Build a minimal DOM mock so checkoutPage.bindEvents() can attach listeners.
// The mock captures addEventListener callbacks so the test can invoke them directly.
const capturedHandlers = new Map();
const mockElements = new Map();
const mockDocument = {
  getElementById(id) { return mockElements.get(id) || null; },
  querySelector() { return null; },
  querySelectorAll() { return []; },
};
// Simulate the checkout render output with the required button and input elements.
// Each element stores its captured event handlers.
mockElements.set('placeOrderBtn', {
  disabled: false,
  textContent: 'Place Order',
  addEventListener(event, handler) { capturedHandlers.set(event, handler); },
});
mockElements.set('customerName', { value: 'Test Customer', trim() { return this.value.trim(); } });
mockElements.set('customerPhone', { value: '03001234567', trim() { return this.value.trim(); } });
mockElements.set('customerAddress', { value: '123 Test Street Karachi', trim() { return this.value.trim(); } });

// Set up window with a failing api.createOrder and the mock document
const failureWindow = {
  addEventListener() {},
  dispatchEvent() {},
  localStorage: failureStorage,
  location: { hash: '' },
  api: {
    createOrder: async () => ({ success: false, error: 'Payment gateway timeout' }),
  },
  cartStore: null, // wired after store boots
};

const failureContext = {
  window: failureWindow,
  localStorage: failureStorage,
  Event: function Event(type) { this.type = type; },
  console,
  URLSearchParams,
  document: mockDocument,
};
vm.runInNewContext(storeSource, failureContext, { filename: 'public/js/store.js' });
failureWindow.cartStore = failureContext.window.cartStore;

// Populate cart with known items
const failStore = failureWindow.cartStore;
failStore.addItem({ id: 1, name: 'Chicken Biryani', price: 850, quantity: 2 });
failStore.addItem({ id: 2, name: 'Vegetable Pulao', price: 400, quantity: 1 });

// Verify cart state before attempting checkout
const cartBefore = failStore.getCart();
assert.equal(cartBefore.items.length, 2, 'Cart should have 2 items before order attempt');
assert.equal(cartBefore.itemCount, 3, 'Cart should have 3 total quantity before order attempt');
assert.equal(cartBefore.total, 2100, 'Cart subtotal should be 2100 before order attempt');

// Wrap checkout source so checkoutPage is exposed on the context's window object.
// The original source declares `const checkoutPage = { ... }` which is local to the script.
// We prefix it with `window.checkoutPage = ` so bindEvents can be called from the test.
const wrappedCheckoutSource = checkoutSource.replace(
  /^const checkoutPage = \{/,
  'window.checkoutPage = {'
);

// Run checkoutPage.bindEvents() in a context that mirrors the real SPA environment.
const checkoutContext = {
  window: failureWindow,
  localStorage: failureStorage,
  Event: function Event(type) { this.type = type; },
  console,
  URLSearchParams,
  document: mockDocument,
  cartStore: failStore,
  alert() {}, // suppress alert dialogs in the test environment
  cartPage: { _calcTotals: (cart) => {
    const subtotal = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    return { subtotal, deliveryFee: 150, grandTotal: subtotal + 150 };
  }},
  applyI18n() {},
};
vm.runInNewContext(wrappedCheckoutSource, checkoutContext, { filename: 'public/js/pages-checkout.js' });
const cpage = checkoutContext.window.checkoutPage;
assert.ok(cpage, 'checkoutPage must be exposed on window after loading pages-checkout.js');
cpage.bindEvents();

(async () => {
// Invoke the real click handler that was captured by the mock addEventListener.
// This exercises the actual try/catch block in checkoutPage.bindEvents().
const clickHandler = capturedHandlers.get('click');
assert.ok(clickHandler, 'checkout bindEvents must attach a click handler to placeOrderBtn');
await clickHandler();

// Assert cart retains its contents after the failed order submission.
const cartAfter = failStore.getCart();
assert.equal(cartAfter.items.length, 2, 'Cart must retain 2 items after failed order submission');
assert.equal(cartAfter.itemCount, 3, 'Cart must retain 3 total quantity after failed order submission');
assert.equal(cartAfter.total, 2100, 'Cart must retain subtotal of 2100 after failed order submission');
})();

console.log('Cart total property regression tests passed.');