const fs = require('fs');
const f = 'public/js/pages-checkout.js';
let s = fs.readFileSync(f, 'utf8');

s = s.replace(
  '<a href="#home" class="hover:text-[#B42318]" data-link>Home</a>',
  '<a href="#home" class="hover:text-[#B42318]" data-link data-i18l-text="common.home">Home</a>'
);
s = s.replace(
  '<a href="#cart" class="hover:text-[#B42318]" data-link>Cart</a>',
  '<a href="#cart" class="hover:text-[#B42318]" data-link data-i18l-text="cart.title">Cart</a>'
);
s = s.replace(
  '<span class="text-[#F7F3EC] font-medium">Checkout</span>',
  '<span class="text-[#F7F3EC] font-medium" data-i18l-text="checkout.title">Checkout</span>'
);
s = s.replace(
  '<h1 class="font-headline text-2xl font-semibold mb-8">Checkout</h1>',
  '<h1 class="font-headline text-2xl font-semibold mb-8" data-i18l-text="checkout.title">Checkout</h1>'
);
s = s.replace(
  '<h2 class="font-title text-[#F7F3EC] font-semibold text-lg mb-4">Contact Information</h2>',
  '<h2 class="font-title text-[#F7F3EC] font-semibold text-lg mb-4" data-i18l-text="checkout.contactInfo">Contact Information</h2>'
);
s = s.replace(
  '<h2 class="font-title text-[#F7F3EC] font-semibold text-lg mb-4">Order Summary</h2>',
  '<h2 class="font-title text-[#F7F3EC] font-semibold text-lg mb-4" data-i18l-text="checkout.orderSummary">Order Summary</h2>'
);
s = s.replace(
  '<label class="block text-[#B8B0A6] text-sm mb-2">Full Name</label>',
  '<label class="block text-[#B8B0A6] text-sm mb-2">Full Name</label>'
);
s = s.replace(
  '<label class="block text-[#B8B0A6] text-sm mb-2">Phone Number</label>',
  '<label class="block text-[#B8B0A6] text-sm mb-2">Phone Number</label>'
);
s = s.replace(
  '<label for="customerBranch" class="block text-[#B8B0A6] text-sm mb-2">Preferred Branch</label>',
  '<label for="customerBranch" class="block text-[#B8B0A6] text-sm mb-2">Preferred Branch</label>'
);
s = s.replace(
  '<label class="block text-[#B8B0A6] text-sm mb-2">Delivery Address</label>',
  '<label class="block text-[#B8B0A6] text-sm mb-2">Delivery Address</label>'
);
s = s.replace(
  '<label class="block text-[#B8B0A6] text-sm mb-2">Email (Optional)</label>',
  '<label class="block text-[#B8B0A6] text-sm mb-2">Email (Optional)</label>'
);
s = s.replace(
  '<label class="block text-[#B8B0A6] text-sm mb-2">Order Notes</label>',
  '<label class="block text-[#B8B0A6] text-sm mb-2">Order Notes</label>'
);
s = s.replace(
  '<span>Subtotal</span>',
  '<span data-i18l-text="cart.subtotal">Subtotal</span>'
);
s = s.replace(
  '<span>Delivery Fee</span>',
  '<span data-i18l-text="cart.deliveryFee">Delivery Fee</span>'
);
s = s.replace(
  '<span>Discount</span>',
  '<span data-i18l-text="cart.discount">Discount</span>'
);
s = s.replace(
  '<span>Total</span>',
  '<span data-i18l-text="common.total">Total</span>'
);
s = s.replace(
  '<button id="placeOrderBtn" class="w-full bg-[#B42318] hover:bg-[#9E1C13] text-white py-3 rounded-lg font-title shadow-lg transition-all">Place Order</button>',
  '<button id="placeOrderBtn" class="w-full bg-[#B42318] hover:bg-[#9E1C13] text-white py-3 rounded-lg font-title shadow-lg transition-all" data-i18l-text="checkout.placeOrder">Place Order</button>'
);

// Append applyI18n after the render method's closing
s = s.replace(
  '    `;\n  },\n\n  bindEvents() {',
  '    `;\n    applyI18n(container);\n  },\n\n  bindEvents() {'
);

fs.writeFileSync(f, s);
console.log('checkout i18n applied');