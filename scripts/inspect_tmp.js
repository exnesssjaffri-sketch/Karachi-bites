const fs = require('fs');
const s = fs.readFileSync('public/js/navbar.js', 'utf8');
const re = /`[^`]*`/g;
let m; let i = 0;
while ((m = re.exec(s)) !== null) { i++; if (i <= 8) console.log('TL#' + i + ' @' + m.index + ': ' + JSON.stringify(m[0].slice(0, 160))); }
console.log('total template literals:', i);

// check admin.js for duplicate top-level declarations
const as = fs.readFileSync('public/js/admin.js', 'utf8');
const re2 = /\b(?:const|let|var)\s+(\w+)/g;
const seen = {}; const dups = [];
while ((m = re2.exec(as)) !== null) { if (seen[m[1]]) dups.push(m[1] + ' @' + m.index); seen[m[1]] = 1; }
console.log('admin.js duplicate declarations:', dups.length);
console.log(dups.slice(0, 20).join('\n'));