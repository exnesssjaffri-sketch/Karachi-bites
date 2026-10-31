const fs = require('fs');
const path = require('path');
const cp = require('child_process');
function walk(d) { let r = []; for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) r = r.concat(walk(p)); else if (e.name.endsWith('.js')) r.push(p); } return r; }
const files = [].concat(walk('public'), walk('src'), walk('test'));
let fail = 0;
for (const f of files) {
  try { cp.execSync(`node --check "${f}"`, { stdio: 'ignore' }); console.log('OK   ' + f); }
  catch (e) { fail++; console.log('FAIL ' + f); }
}
console.log('checked ' + files.length + ' files, failures: ' + fail);
process.exit(fail ? 1 : 0);