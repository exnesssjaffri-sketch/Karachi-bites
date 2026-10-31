const fs = require('fs');
const path = require('path');
function walk(d) { let r = []; for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) r = r.concat(walk(p)); else if (e.name.endsWith('.js')) r.push(p); } return r; }
const files = [].concat(walk('public'), walk('src'), walk('test'));
let changed = 0;
for (const f of files) {
  const b = fs.readFileSync(f);
  if (b[0] === 0xEF && b[1] === 0xBB && b[2] === 0xBF) {
    const stripped = b.slice(3);
    fs.writeFileSync(f, stripped);
    console.log('Stripped BOM: ' + f + ' (was ' + b.length + ' bytes, now ' + stripped.length + ')');
    changed++;
  }
}
console.log('total BOM files stripped: ' + changed);