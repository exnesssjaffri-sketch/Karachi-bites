const fs = require('fs');
const s = fs.readFileSync('public/js/navbar.js', 'utf8');
console.log('cart.checkout:', s.includes('data-i18l-text="cart.checkout"'));
console.log('nav.home:', s.includes('data-i18l-text="nav.home"'));
console.log('nav.menu:', s.includes('data-i18l-text="nav.menu"'));
console.log('nav.cart:', s.includes('data-i18l-text="nav.cart"'));