const fs = require('fs');
const f = 'public/js/pages-cart.js';
let s = fs.readFileSync(f, 'utf8');

function addDataI18l(str, key, label) {
  // add data-i18l-text="key" after the tag's opening, replacing the literal label
  const re = new RegExp('(<a[^>]*>)([\\s\\S]*?' + label + '[\\s\\S]*?)(</a>)', 'g');
  return str;
}

// 1. Home link in cart nav
s = s.replace(
  '<a href="#home" class="hover:text-[#B42318]" data-link>Home</a>',
  '<a href="#home" class="hover:text-[#B42318]" data-link data-i18l-text="common.home">Home</a>'
);

// 2. Cart title (h1)
s = s.replace(
  '<h1 class="font-headline text-2xl font-semibold">Your Cart</h1>',
  '<h1 class="font-headline text-2xl font-semibold" data-i18l-text="cart.title">Your Cart</h1>'
);

// 3. Cart breadcrumb label
s = s.replace(
  '<span class="text-[#F7F3EC] font-medium">Your Cart</span>',
  '<span class="text-[#F7F3EC] font-medium" data-i18l-text="cart.title">Your Cart</span>'
);

// 4. Empty cart message
s = s.replace(
  '<p class="text-[#B8B0A6] mb-4">Your cart is empty</p>',
  '<p class="text-[#B8B0A6] mb-4" data-i18l-text="cart.empty">Your cart is empty</p>'
);

// 5. Browse Menu button label
s = s.replace(
  '<span class="material-symbols-outlined text-sm">add</span> Browse Menu',
  '<span class="material-symbols-outlined text-sm">add</span> <span data-i18l-text="cart.browseMenu">Browse Menu</span>'
);

// 6. Apply promo button
s = s.replace(
  '<button id="applyPromoBtn" class="px-4 py-2 bg-[#2A2622] hover:bg-[#3A342E] border border-[#3A342E] text-white rounded-lg text-sm font-medium transition-all">Apply</button>',
  '<button id="applyPromoBtn" class="px-4 py-2 bg-[#2A2622] hover:bg-[#3A342E] border border-[#3A342E] text-white rounded-lg text-sm font-medium transition-all" data-i18l-text="cart.apply">Apply</button>'
);

// 7. Item Subtotal
s = s.replace(
  '<span>Item Subtotal</span>',
  '<span data-i18l-text="cart.subtotal">Item Subtotal</span>'
);

// 8. Delivery Fee
s = s.replace(
  '<span>Delivery Fee</span>',
  '<span data-i18l-text="cart.deliveryFee">Delivery Fee</span>'
);

// 9. Discount
s = s.replace(
  '<span>Discount</span>',
  '<span data-i18l-text="cart.discount">Discount</span>'
);

// 10. Total
s = s.replace(
  '<span>Total</span>',
  '<span data-i18l-text="common.total">Total</span>'
);

// 11. Checkout button
s = s.replace(
  '<button id="checkoutBtn" class="w-full mt-6 bg-[#B42318] hover:bg-[#9E1C13] text-white py-3 rounded-lg font-title">Proceed to Checkout</button>',
  '<button id="checkoutBtn" class="w-full mt-6 bg-[#B42318] hover:bg-[#9E1C13] text-white py-3 rounded-lg font-title" data-i18l-text="cart.checkout">Proceed to Checkout</button>'
);

// 12. Append applyI18n after the render method's closing
s = s.replace(
  '    `;\n  },\n\n  bindEvents() {',
  '    `;\n    applyI18n(container);\n  },\n\n  bindEvents() {'
);

fs.writeFileSync(f, s);
console.log('cart page i18n applied');