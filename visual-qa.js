const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const VIEWPORTS = {
  'mobile-360': { width: 360, height: 740 },
  'mobile-390': { width: 390, height: 844 },
  'tablet-768': { width: 768, height: 1024 },
  'desktop-1024': { width: 1024, height: 768 },
  'desktop-1280': { width: 1280, height: 800 }
};

const BASE_URL = 'http://localhost:3000';
const OUTPUT_DIR = path.join(__dirname, 'visual-qa-output');
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

const EDGE_PATH = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';

function logCheck(r, pass, label) {
  console.log(`   ${pass ? 'PASS' : 'FAIL'}: ${label}`);
  r.checks.push(pass);
}

async function getOverflow(page) {
  return await page.evaluate(() => {
    const doc = document.documentElement;
    const all = document.querySelectorAll('body *');
    const vw = doc.clientWidth;
    let worst = 0;
    const offenders = [];
    for (const el of all) {
      const rect = el.getBoundingClientRect();
      if (rect.width > 0 && rect.right > vw + 2) {
        worst = Math.max(worst, rect.right);
        if (offenders.length < 8) {
          const cls = (el.className && typeof el.className === 'string') ? el.className.slice(0, 60) : el.tagName;
          offenders.push(`${el.tagName}.${cls} right=${Math.round(rect.right)}`);
        }
      }
    }
    return { docScrollW: doc.scrollWidth, vw, worst: Math.round(worst), offenders };
  });
}

async function getFontInfo(page) {
  return await page.evaluate(async () => {
    await document.fonts.ready;
    const families = {};
    for (const f of document.fonts) {
      if (!families[f.family]) families[f.family] = [];
      families[f.family].push(`${f.weight} ${f.status}`);
    }
    const h1 = document.querySelector('h1');
    const body = document.body;
    return {
      families,
      h1: h1 ? getComputedStyle(h1).fontFamily : null,
      h1Size: h1 ? getComputedStyle(h1).fontSize : null
    };
  });
}

async function main() {
  console.log('Karachi Bites Visual QA\n');
  const browser = await puppeteer.connect({
    browserURL: 'http://localhost:9222',
    defaultViewport: null,
    timeout: 30000
  });

  const results = [];

  for (const [key, vp] of Object.entries(VIEWPORTS)) {
    const page = await browser.newPage();
    await page.setViewport({ width: vp.width, height: vp.height, isMobile: key.startsWith('mobile') });
    const r = { viewport: key, width: vp.width, checks: [], screenshots: [] };
    const consoleErrors = [];
    page.on('pageerror', (err) => consoleErrors.push(err.message.slice(0, 200)));

    // ---------- Homepage ----------
    await page.goto(BASE_URL + '/', { waitUntil: 'domcontentloaded', timeout: 45000 });
    await page.waitForSelector('h1', { timeout: 15000 }).catch(() => {});
    await new Promise(res => setTimeout(res, 3000));

    const homeShot = path.join(OUTPUT_DIR, `home-${key}.png`);
    await page.screenshot({ path: homeShot, fullPage: true });
    r.screenshots.push(homeShot);

    const ov = await getOverflow(page);
    logCheck(r, ov.docScrollW <= ov.vw + 2, `home: no overflow (scrollW=${ov.docScrollW} vs vw=${ov.vw})`);
    if (ov.offenders.length) console.log('     offenders:', ov.offenders.join(' | '));

    const hCount = await page.$$eval('header', els => els.length);
    logCheck(r, hCount > 0, 'home: header rendered');

    const fonts = await getFontInfo(page);
    const fontsLoaded = Object.keys(fonts.families).length > 0;
    logCheck(r, fontsLoaded, `home: fonts loaded (${Object.keys(fonts.families).length} families)`);
    console.log(`     H1: ${fonts.h1} @ ${fonts.h1Size}`);

    // ---------- Menu (SPA) ----------
    await page.goto(BASE_URL + '/app.html#menu', { waitUntil: 'domcontentloaded', timeout: 45000 });
    await page.waitForSelector('#menuGrid article', { timeout: 20000 }).catch(() => {});
    await new Promise(res => setTimeout(res, 3000));

    const menuShot = path.join(OUTPUT_DIR, `menu-${key}.png`);
    await page.screenshot({ path: menuShot, fullPage: true });
    r.screenshots.push(menuShot);

    const menuOv = await getOverflow(page);
    logCheck(r, menuOv.docScrollW <= menuOv.vw + 2, `menu: no overflow (scrollW=${menuOv.docScrollW})`);

    const itemCount = await page.$$eval('#menuGrid article', els => els.length);
    logCheck(r, itemCount > 0, `menu: ${itemCount} items rendered`);

    // Add items to cart (re-query after each re-render)
    let added = 0;
    for (let i = 0; i < 2; i++) {
      const btns = await page.$$('.kb-add-to-cart');
      if (btns.length >= 1) {
        await btns[0].click();
        await new Promise(res => setTimeout(res, 800));
        added++;
      }
    }
    console.log(`     added ${added} items to cart`);

    // ---------- Cart ----------
    await page.evaluate(() => { location.hash = '#cart'; });
    await new Promise(res => setTimeout(res, 1200));
    const cartShot = path.join(OUTPUT_DIR, `cart-${key}.png`);
    await page.screenshot({ path: cartShot, fullPage: true });
    r.screenshots.push(cartShot);

    const cartOv = await getOverflow(page);
    logCheck(r, cartOv.docScrollW <= cartOv.vw + 2, `cart: no overflow (scrollW=${cartOv.docScrollW})`);

    const cartData = await page.evaluate(() => {
      const app = document.getElementById('app');
      const text = app ? app.innerText : '';
      const m = (re) => { const x = text.match(re); return x ? x[1] : null; };
      return {
        subtotal: m(/Subtotal[\s\S]*?Rs\.?\s?([\d,]+)/),
        delivery: m(/Delivery Fee[\s\S]*?Rs\.?\s?([\d,]+)/),
        total: m(/Total[\s\S]*?Rs\.?\s?([\d,]+)/)
      };
    });
    console.log(`     cart: ${JSON.stringify(cartData)}`);
    logCheck(r, cartData.delivery === '150', `cart: delivery=150 (got ${cartData.delivery})`);
    if (cartData.subtotal && cartData.total) {
      const s = parseInt(cartData.subtotal.replace(/,/g, ''));
      const t = parseInt(cartData.total.replace(/,/g, ''));
      logCheck(r, t === s + 150, `cart: total=subtotal+150 (${t}=${s}+150)`);
    }

    // ---------- Checkout ----------
    await page.evaluate(() => { location.hash = '#checkout'; });
    await new Promise(res => setTimeout(res, 1200));
    const coShot = path.join(OUTPUT_DIR, `checkout-${key}.png`);
    await page.screenshot({ path: coShot, fullPage: true });
    r.screenshots.push(coShot);

    const coOv = await getOverflow(page);
    logCheck(r, coOv.docScrollW <= coOv.vw + 2, `checkout: no overflow (scrollW=${coOv.docScrollW})`);

    const formOk = await page.evaluate(() => {
      return !!(document.getElementById('customerName') && document.getElementById('customerPhone') &&
        document.getElementById('customerBranch') && document.getElementById('customerAddress') &&
        document.getElementById('placeOrderBtn'));
    });
    logCheck(r, formOk, 'checkout: all form fields present');
    if (consoleErrors.length) console.log(`     JS errors: ${consoleErrors.join(' | ')}`);

    // Check Urdu / RTL
    const urduStatus = await page.evaluate(async () => {
      try {
        if (window.setLanguage) window.setLanguage('ur');
        else if (window.I18N && window.I18N.setLanguage) window.I18N.setLanguage('ur');
        await new Promise(r => setTimeout(r, 400));
        const dir = document.documentElement.getAttribute('dir') || document.body.getAttribute('dir');
        const lang = document.documentElement.getAttribute('lang');
        return { dir, lang };
      } catch (e) {
        return { error: e.message };
      }
    });
    console.log(`     Urdu RTL check: ${JSON.stringify(urduStatus)}`);
    logCheck(r, urduStatus.dir === 'rtl', `urdu: dir=rtl applied (${urduStatus.dir})`);

    // Reset back to English
    await page.evaluate(() => {
      try {
        if (window.setLanguage) window.setLanguage('en');
        else if (window.I18N && window.I18N.setLanguage) window.I18N.setLanguage('en');
      } catch (e) {}
    });

    results.push(r);
    await page.close();
  }

  await browser.close();

  console.log('\n===== SUMMARY =====');
  let totalPass = 0, totalFail = 0;
  for (const r of results) {
    const p = r.checks.filter(Boolean).length;
    const f = r.checks.length - p;
    totalPass += p; totalFail += f;
    console.log(`${r.viewport} (${r.width}px): ${p} passed, ${f} failed`);
  }
  fs.writeFileSync(path.join(OUTPUT_DIR, 'results.json'), JSON.stringify(results, null, 2));
  console.log(`\nTOTAL: ${totalPass} passed, ${totalFail} failed`);
  process.exit(totalFail > 0 ? 1 : 0);
}

main().catch(e => { console.error('QA FATAL:', e); process.exit(2); });
