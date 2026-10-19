const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = (name) => fs.readFileSync(path.join(root, name), 'utf8');

const appHtml = read('public/app.html');
const router = read('public/js/app.js');
const menu = read('public/js/pages-menu.js');
const store = read('public/js/store.js');
const navbar = read('public/js/navbar.js');
const rootHtml = read('public/index.html');
const stitchHome = read('public/stitch/js/home.js');
const stitchNavigation = read('public/stitch/js/navigation.js');
const apiClient = read('public/js/api.js');
const serverRoutes = read('src/routes.js');
const i18n = read('public/js/i18n.js');
const kitchenHtml = read('public/kitchen-ticket.html');
const kitchenJs = read('public/js/kitchen-ticket.js');
const adminUi = read('public/js/admin.js');
const trackingUi = read('public/js/pages-order-tracking.js');

assert.match(appHtml, /id="site-nav"/, 'SPA has a dedicated navigation mount');
assert.match(appHtml, /<main id="app"/, 'SPA has a dedicated main content mount');
assert.match(appHtml, /id="site-footer"/, 'SPA has a dedicated footer mount');
assert.match(router, /renderNavbar\("site-nav"\)/, 'router renders navbar outside page content');
assert.match(router, /renderFooter\("site-footer"\)/, 'router renders footer outside page content');
assert.match(router, /window\.location\.replace\("\/"\)/, 'legacy app home goes to the Stitch homepage');

for (const page of [
  'public/js/pages-home.js',
  'public/js/pages-menu.js',
  'public/js/pages-cart.js',
  'public/js/pages-checkout.js',
  'public/js/pages-order-placed.js',
  'public/js/pages-order-tracking.js',
]) {
  const content = read(page);
  assert.doesNotMatch(
    content,
    /window\.addEventListener\(['"]DOMContentLoaded['"]\s*,\s*\(\)\s*=>\s*[A-Za-z_$][\w$]*\.init\(\)\)/,
    page + ' should be initialized by the router, not independently'
  );
}

assert.match(menu, /id="filterVeg"/, 'menu exposes vegetarian filter');
assert.match(menu, /id="filterSpicy"/, 'menu exposes spicy filter');
assert.match(menu, /id="filterMaxPrice"/, 'menu exposes maximum-price filter');
assert.match(menu, /this\.getFilteredItems\(\)/, 'menu combines active filters');
assert.match(menu, /data-menu-id/, 'menu add-to-cart buttons reference real menu item IDs');
assert.match(store, /this\.calculateTotal\(cart\)/, 'cart total is recalculated from the new cart state');
assert.match(store, /this\.calculateItemCount\(cart\)/, 'cart item count is recalculated from the new cart state');
assert.match(navbar, /href="\/"/, 'navbar home links return to Stitch homepage');
assert.match(rootHtml, /id="kb-live-menu"/, 'Stitch homepage has a live menu mount');
assert.match(rootHtml, /<script src="\/js\/api\.js"><\/script>/, 'Stitch homepage loads the existing API client');
assert.match(rootHtml, /<script src="\/js\/store\.js"><\/script>/, 'Stitch homepage loads the shared cart store');
assert.match(stitchHome, /window\.api\.getMenu\(\)/, 'Stitch homepage reads menu items from the API client');
assert.match(stitchHome, /window\.cartStore\.addItem/, 'Stitch homepage adds real items to the shared cart');
assert.match(stitchNavigation, /data-kb-live-cart/, 'Stitch navigation lets live add-to-cart events reach their handler');
assert.match(read('public/js/pages-order-tracking.js'), /window\.api\.trackOrder\(this\.orderId, String\(phone \|\| ""\)\.trim\(\)\)/, 'tracking verifies order ID with checkout phone');
assert.doesNotMatch(read('public/js/pages-order-tracking.js'), /api\.getOrder\(/, 'tracking must not reveal an order by ID alone');

assert.match(serverRoutes, /router\.post\(['\"]\/orders\/track['\"]/, 'server exposes the phone-verified POST /api/orders/track route');
assert.match(apiClient, /API_BASE_URL\}\/orders\/track/, 'tracking client calls the route implemented by the server');
assert.match(apiClient, /body:\s*JSON\.stringify\(\{\s*orderId,\s*phone\s*\}\)/, 'tracking client sends both order ID and phone in the request body');
assert.match(rootHtml, /\/js\/i18n\.js/, 'homepage loads bilingual support');
assert.match(appHtml, /js\/i18n\.js/, 'ordering app loads bilingual support');
assert.match(i18n, /document\.documentElement\.dir=lang==='ur'\?'rtl':'ltr'/, 'Urdu mode enables RTL');
assert.match(i18n, /'Order Now':'ابھی آرڈر کریں'/, 'Urdu labels are provided');
assert.match(stitchHome, /categoryName\(button\)/, 'translated tabs preserve category filter keys');
assert.match(adminUi, /kitchen-ticket\.html\?order=/, 'staff can open the kitchen ticket');
assert.match(kitchenHtml, /@media print/, 'kitchen ticket includes print styles');
assert.match(kitchenJs, /\/api\/admin\/kitchen\//, 'ticket loads the protected kitchen endpoint');
assert.match(kitchenJs, /Authorization:'Bearer '\+token/, 'ticket request includes staff authorization');
assert.match(trackingUi, /reorderForm/, 'tracking UI exposes an order-again form');
assert.match(apiClient, /\/orders\/reorder/, 'API client calls reorder endpoint');
assert.match(serverRoutes, /router\.post\(['\"]\/orders\/reorder['\"]/, 'server exposes reorder endpoint');

console.log('Frontend wiring checks passed.');
