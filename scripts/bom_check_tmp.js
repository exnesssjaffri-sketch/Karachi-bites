const fs = require('fs');
const path = require('path');
function walk(d) { let r = []; for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) r = r.concat(walk(p)); else if (e.name.endsWith('.js')) r.push(p); } return r; }
const files = [].concat(walk('public'), walk('src'), walk('test'));
let problems = 0;
for (const f of files) {
  const b = fs.readFileSync(f);
  const head = b.slice(0, 3);
  const isUTF8BOM = head[0] === 0xEF && head[1] === 0xBB && head[2] === 0xBF;
  const isUTF16LEBOM = b[0] === 0xFF && b[1] === 0xFE;
  const isUTF16BEBOM = b[0] === 0xFE && b[1] === 0xFF;
  const stripped = b.toString('utf8').replace(/\s/g, '');
  if (isUTF8BOM || isUTF16LEBOM || isUTF16BEBOM || stripped.length === 0) {
    console.log('BOM_OR_EMPTY ' + f + ' len=' + b.length + ' BOM=' + (isUTF8BOM ? 'utf8' : isUTF16LEBOM ? 'utf16le' : isUTF16BEBOM ? 'utf16be' : 'no') + ' empty=' + (stripped.length === 0));
    problems++;
  }
}
console.log('checked ' + files.length + ' files; problems=' + problems);
process.exit(problems ? 1 : 0);