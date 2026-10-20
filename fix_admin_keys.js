const fs = require('fs');
const f = 'public/admin.html';
let s = fs.readFileSync(f, 'utf8');
s = s.replace(/data-i18l-text="([^"]+)"/g, (m, v) => v.startsWith('admin.') ? m : 'data-i18l-text="admin.' + v + '"');
fs.writeFileSync(f, s);
console.log('normalized keys');