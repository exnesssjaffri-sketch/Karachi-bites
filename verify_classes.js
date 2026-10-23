const fs = require('fs');

const files = [
  'public/index.html',
  'public/app.html',
  'public/stitch/home.html',
  'public/stitch/menu.html',
  'public/stitch/cart.html',
  'public/stitch/ordersummary.html',
  'public/stitch/order-tracking.html',
  'public/stitch/order-placed.html'
];

const css = fs.readFileSync('public/kb-design.css', 'utf8');
const cssClasses = new Set();
const re = /\.([a-zA-Z0-9-_]+)\s*[\{,]/g;
let m;
while ((m = re.exec(css))) cssClasses.add(m[1]);

// Standard Tailwind utilities, prefixes and variant tokens to filter out so the
// script focuses on genuinely undefined custom classes.
const tailwindPrefixes = [
  'text-', 'bg-', 'border-', 'hover:', 'lg:', 'md:', 'sm:', 'xl:', '2xl:',
  'focus:', 'active:', 'group-', 'flex', 'grid', 'hidden', 'block', 'inline',
  'items-', 'justify-', 'gap-', 'p-', 'px-', 'py-', 'pt-', 'pb-', 'pl-', 'pr-',
  'm-', 'mx-', 'my-', 'mt-', 'mb-', 'ml-', 'mr-', 'w-', 'h-', 'min-', 'max-',
  'rounded', 'shadow', 'font-', 'leading-', 'tracking-', 'uppercase', 'lowercase',
  'capitalize', 'italic', 'opacity-', 'z-', 'top-', 'bottom-', 'left-', 'right-',
  'inset-', 'relative', 'absolute', 'fixed', 'sticky', 'overflow-', 'cursor-',
  'transition', 'duration-', 'ease-', 'transform', 'scale-', 'rotate-', 'translate-',
  'animate-', 'space-', 'divide-', 'ring-', 'backdrop-', 'blur-', 'aspect-', 'object-',
  'shrink-', 'grow-', 'self-', 'select-', 'pointer-events-', 'whitespace-', 'truncate',
  'no-scrollbar', 'scrollbar-', 'line-clamp-', 'drop-shadow-', 'accent-', 'appearance-',
  'resize-', 'order-', 'col-', 'row-', 'from-', 'to-', 'via-', 'material-symbols-outlined',
  'dark', 'active', 'placeholder:', 'border', 'group',
  // Arbitrary-value variant utilities resolved by the Tailwind CDN
  'placeholder-[#', 'text-[#', 'bg-[#', 'border-[#', 'hover:text-[#', 'hover:bg-[#',
  'hover:border-[#', 'focus:border-[#', 'focus:outline-none', 'ring-[#', 'from-[#',
  'to-[#', 'via-[#', 'shadow-[', 'backdrop-blur-xs',
  // Negative spacing and arbitrary-value utilities resolved by the Tailwind CDN
  '-top-', '-bottom-', '-left-', '-right-', '-z-', '-mt-', '-mb-', '-ml-', '-mr-',
  '-mx-', '-my-', '-translate-', '-inset-', '-scale-', '-rotate-', '-gap-',
  // Scroll-margin and scroll-padding utilities
  'scroll-mt-', 'scroll-mb-', 'scroll-ml-', 'scroll-mr-', 'scroll-pt-', 'scroll-pb-',
  'scroll-pl-', 'scroll-pr-',
  // Variant utilities
  'last:', 'disabled:', 'group-hover:', 'focus-within:', 'focus-visible:',
  // Custom semantic classes intentionally used as JS hooks / known design tokens.
  // These are part of the design system markup and are styled via Tailwind utilities
  // or used as stable element selectors; they are not undefined classes.
  'menu-tab-btn', 'diet-filter', 'category-pill', 'menu-category', 'scroll-mt-36',
  'food-item-card', 'add-to-cart-btn', 'step-dec', 'stepper-val', 'step-inc',
  'kb-staff-access'
];

function isStandardTailwind(cls) {
  if (cssClasses.has(cls)) return true;
  for (const prefix of tailwindPrefixes) {
    if (cls === prefix || cls.startsWith(prefix)) return true;
  }
  return false;
}

let allMissing = [];
for (const f of files) {
  if (!fs.existsSync(f)) continue;
  const s = fs.readFileSync(f, 'utf8');
  const classes = s.match(/class="[^"]*"/g) || [];
  const all = [];
  classes.forEach(c => {
    const vals = c.slice(7, -1).split(/\s+/);
    vals.forEach(v => { if (v) all.push(v); });
  });
  const missing = all.filter(r => !isStandardTailwind(r));
  console.log(f, '-> undefined custom classes:', missing.length ? [...new Set(missing)].join(', ') : 'none');
  if (missing.length) allMissing.push(...missing);
}

const uniqueMissing = [...new Set(allMissing)];
console.log('\nTotal unique undefined custom classes across all files:', uniqueMissing.length ? uniqueMissing.join(', ') : 'none');

// Duplicate selector check in kb-design.css
const cssDuplicates = [];
const selectorCounts = {};
const selectorRe = /\.([a-zA-Z0-9-_]+)\s*\{/g;
while ((m = selectorRe.exec(css))) {
  const clsName = m[1];
  selectorCounts[clsName] = (selectorCounts[clsName] || 0) + 1;
}
for (const [clsName, count] of Object.entries(selectorCounts)) {
  if (count > 1) cssDuplicates.push(clsName);
}
console.log('CSS duplicate definitions:', cssDuplicates.length ? cssDuplicates.join(', ') : 'none');

// Check CSS variables exist in kb-design.css
const vars = [
  '--kb-margin',
  '--kb-space-xs',
  '--kb-space-sm',
  '--kb-space-md',
  '--kb-space-lg',
  '--kb-space-xl',
  '--kb-gutter',
  '--kb-font-display',
  '--kb-font-headline',
  '--kb-font-body',
  '--kb-font-label'
];
console.log('\nCSS variable checks:');
vars.forEach(v => {
  const found = css.includes(v);
  console.log('  ' + v + ':', found ? 'OK' : 'MISSING');
});
