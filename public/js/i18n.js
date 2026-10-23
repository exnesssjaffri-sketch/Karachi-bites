/**
 * Karachi Bites i18n
 * English / Urdu (اردو) translations with a simple key-based helper API:
 *   t('nav.home')                -> translated string
 *   t('common.items', {count})   -> template with {placeholder} substitution
 *   setLanguage('ur')            -> switch language (persisted + re-renders)
 *   getCurrentLanguage()         -> 'en' | 'ur'
 *
 * The page's current language is applied on load; pages that render dynamic
 * HTML should call window.applyI18n() after re-render so [data-i18l*]
 * attributes stay in sync. The language toggle listens for the
 * 'kb:language-changed' event to re-render the active page.
 */
const I18N = (() => {
  'use strict';

  const STORAGE_KEY = 'karachi_bites_language';

  const dictionaries = {
    en: {
      'nav.home': 'Home',
      'nav.menu': 'Menu',
      'nav.cart': 'Cart',
      'nav.switchToUrdu': 'اردو',
      'nav.switchToEnglish': 'English',
      'home.eyebrow': 'Authentic Burns Road Flavors • Fast Delivery 30–45 Mins',
      'home.headline': 'Charcoal, Clay & Slow Spice.',
      'home.spirit': 'The Pure Spirit',
      'home.food': 'of Karachi Food.',
      'home.description': "From dum-pukht Sindhi Biryani and 8-hour braised Nihari to melt-in-mouth Bihari boti, experience Karachi's finest culinary craft delivered hot to your doorstep.",
      'home.exploreMenu': 'Explore Menu',
      'Order Now':'Order Now',
      'common.items': '{count} item(s)',
      'common.loading': 'Loading order details...',
      'common.total': 'Total',
      'common.item': 'Item',
      'common.home': 'Home',
      'common.goHome': 'Go Home',
      'common.continueShopping': 'Continue Shopping',
      'common.orderItems': 'Order Items',
      'common.orderId': 'Order ID',
      'common.estimatedDelivery': 'Estimated Delivery',
      'common.paymentMethod': 'Payment Method',
      'common.cashOnDelivery': 'Cash on Delivery',
      'common.phone': 'Phone',
      'common.branch': 'Branch',
      'common.placed': 'Placed',
      'common.status': 'Status',
      'common.qty': 'Qty',
      'common.price': 'Price',
      'common.specialInstructions': 'Special Instructions',
      'tracking.title': 'Track Your Order',
      'tracking.breadcrumb': 'Track Order',
      'tracking.notFound': 'Order Not Found',
      'tracking.notFoundHint': 'Enter the order ID and phone number from your confirmation to check its latest status.',
      'tracking.trackOrder': 'Track Order',
      'tracking.status.delivered': 'Order Delivered',
      'tracking.status.out-for-delivery': 'On the Way',
      'tracking.status.preparing': 'Cooking in Progress',
      'tracking.status.received': 'Order Received',
      'tracking.eta': 'Estimated delivery: 30-45 minutes',
      'tracking.step.received': 'Received',
      'tracking.step.preparing': 'Preparing',
      'tracking.step.out-for-delivery': 'Out for Delivery',
      'tracking.step.delivered': 'Delivered',
      'tracking.inProgress': 'In progress',
      'tracking.completed': 'Completed',
      'tracking.pending': 'Pending',
      'tracking.summary': 'Order Summary',
      'tracking.notes': 'Order Notes',
      'cart.title': 'Your Cart',
      'cart.empty': 'Your cart is empty',
      'cart.browseMenu': 'Browse Menu',
      'cart.promoPlaceholder': 'Promo Code',
      'cart.apply': 'Apply',
      'cart.subtotal': 'Item Subtotal',
      'cart.deliveryFee': 'Delivery Fee',
      'cart.total': 'Total',
      'cart.orderSummary': 'Order Summary',
      'cart.instructions': 'Special Instructions',
      'cart.instructionsPlaceholder': 'Any cooking or delivery preferences...',
      'cart.kitchenStatus': 'Open & Sizzling',
      'cart.promoApplied': '{code} applied — the final total is always verified by the server.',
      'cart.promoInvalid': 'Invalid promo code',
      'cart.checkout': 'Proceed to Checkout',
      'checkout.title': 'Checkout',
      'checkout.contactInfo': 'Contact Information',
      'checkout.orderSummary': 'Order Summary',
      'admin.staffSignIn': 'Staff sign in',
      'admin.restrictedAccess': 'Restricted access',
      'admin.signInHint': 'Sign in with your assigned Karachi Bites staff account. Admin features require the admin role.',
      'admin.username': 'Username',
      'admin.password': 'Password',
      'admin.signIn': 'Sign in',
      'admin.signingIn': 'Signing in…',
      'admin.staffAndOrderManagement': 'Staff and order management',
      'admin.customerSite': 'Customer site',
      'admin.signOut': 'Sign out',
      'admin.operations': 'Operations',
      'admin.orderDashboard': 'Order dashboard',
      'admin.dashboardHint': "Orders are loaded from the API. Status updates follow the server's allowed transition rules.",
      'admin.refreshOrders': 'Refresh orders',
      'admin.loadingOrders': 'Loading orders…',
      'admin.loadingKitchenTicket': 'Loading kitchen ticket...',
      'admin.applyFilters': 'Apply filters',
      'admin.loadedOrders': 'Loaded orders',
      'admin.orderLedger': 'Order ledger',
      'admin.newestFirst': 'Newest orders first',
      'admin.kitchenTicket': 'Kitchen Ticket',
      'admin.kitchenTicketTitle': 'Kitchen Ticket',
      'admin.printTicket': 'Print Ticket',
      'admin.print': 'Print',
      'admin.complete': 'Complete',
      'admin.update': 'Update',
      'admin.saving': 'Saving…',
      'admin.signInToLoad': 'Sign in to load orders.',
      'admin.noOrders': 'No orders match these filters.',
      'admin.failedKitchenTicket': 'Failed to load kitchen ticket',
      'admin.status.received': 'Received',
      'admin.status.preparing': 'Preparing',
      'admin.status.out-for-delivery': 'Out for Delivery',
      'admin.status.delivered': 'Delivered'
    },
    ur: {
      'nav.home': 'ہوم',
      'nav.menu': 'مینیو',
      'nav.cart': 'کارٹ',
      'nav.switchToUrdu': 'اردو',
      'nav.switchToEnglish': 'English',
      'home.eyebrow': 'برنس روڈ کے مستند ذائقے • تیز ڈیلیوری، 30 سے 45 منٹ',
      'home.headline': 'کوئلے، مٹی اور دھیمی آنچ کے مصالحے۔',
      'home.spirit': 'کراچی کی اصل پہچان',
      'home.food': 'کا ذائقہ۔',
      'home.description': 'دم پر تیار سندھی بریانی، آٹھ گھنٹے پکی نہاری اور منہ میں گھل جانے والی بہاری بوٹی — کراچی کے بہترین ذائقے گرم گرم آپ کے دروازے تک۔',
      'home.exploreMenu': 'مینیو دیکھیں',
      'Order Now':'ابھی آرڈر کریں',
      'common.items': '{count} اشیاء',
      'common.loading': 'آرڈر کی تفصیلات لوڈ ہو رہی ہیں...',
      'common.total': 'کل رقم',
      'common.item': 'اشیاء',
      'common.home': 'ہوم',
      'common.goHome': 'ہوم پر واپس جائیں',
      'common.continueShopping': 'خریداری جاری رکھیں',
      'common.orderItems': 'آرڈر کی اشیاء',
      'common.orderId': 'آرڈر آئی ڈی',
      'common.estimatedDelivery': 'متوقع ڈیلیوری',
      'common.paymentMethod': 'ادائیگی کا طریقہ',
      'common.cashOnDelivery': 'ادائیگی ڈیلیوری پر',
      'common.phone': 'فون',
      'common.branch': 'برانچ',
      'common.placed': 'آرڈر ہوا',
      'common.status': 'حالت',
      'common.qty': 'تعداد',
      'common.price': 'قیمت',
      'common.specialInstructions': 'خاص ہدایات',
      'tracking.title': 'اپنا آرڈر ٹریک کریں',
      'tracking.breadcrumb': 'آرڈر ٹریکنگ',
      'tracking.notFound': 'آرڈر نہیں ملا',
      'tracking.notFoundHint': 'اپنی تصدیقی پیغام میں دی گئی آرڈر آئی ڈی اور فون نمبر درج کریں تاکہ تازہ ترین حیثیت دیکھ سکے۔',
      'tracking.trackOrder': 'آرڈر ٹریک کریں',
      'tracking.status.delivered': 'آرڈر پہنچ گیا',
      'tracking.status.out-for-delivery': 'راستے میں ہے',
      'tracking.status.preparing': 'بنانے کے عمل میں',
      'tracking.status.received': 'آرڈر موصول ہو گیا',
      'tracking.eta': 'متوقع ڈیلیوری: 30 تا 45 منٹ',
      'tracking.step.received': 'موصول',
      'tracking.step.preparing': 'بنایا جا رہا ہے',
      'tracking.step.out-for-delivery': 'ڈیلیوری کے لیے نکلا',
      'tracking.step.delivered': 'پہنچا دیا گیا',
      'tracking.inProgress': 'جاری ہے',
      'tracking.completed': 'مکمل',
      'tracking.pending': 'زیرِ التوا',
      'tracking.summary': 'آرڈر کا خلاصہ',
      'tracking.notes': 'آرڈر کے نوٹس',
      'placed.title': 'آرڈر کی تصدیق ہو گئی!',
      'placed.subtitle': 'آپ کے آرڈر کے لیے شکریہ۔ ہم اسے تیار کر رہے ہیں۔',
      'placed.orderAgain': 'دوبارہ آرڈر کریں',
      'placed.orderIdMissing': 'آرڈر آئی ڈی دستیاب نہیں',
      'placed.reorderFailed': 'دوبارہ آرڈر نہیں ہو سکا',
      'placed.reorderError': 'دوبارہ آرڈر نہیں ہو سکا:',
      'cart.title': 'آپ کی کارٹ',
      'cart.empty': 'آپ کی کارٹ خالی ہے',
      'cart.browseMenu': 'مینیو دیکھیں',
      'cart.promoPlaceholder': 'پرومو کوڈ',
      'cart.apply': 'لاگو کریں',
      'cart.subtotal': 'اشیاء کا کل',
      'cart.deliveryFee': 'ڈیلیوری فیس',
      'cart.total': 'کل رقم',
      'cart.orderSummary': 'آرڈر کا خلاصہ',
      'cart.instructions': 'خاص ہدایات',
      'cart.instructionsPlaceholder': 'کھانے کی تیاری یا ڈیلیوری سے متعلق کوئی خاص ہدایت لکھیں...',
      'cart.kitchenStatus': 'کھلا اور بھاپ پا کر رہا ہے',
      'cart.promoApplied': '{code} لاگو ہو گیا — حتمی کل رقم ہمیشہ سرور کی جانب سے تصدیق ہوتا ہے۔',
      'cart.promoInvalid': 'پرومو کوڈ درست نہیں ہے',
      'cart.checkout': 'چیک آؤٹ کے لیے آگے بڑھیں',
      'checkout.title': 'چیک آؤٹ',
      'checkout.contactInfo': 'رابطے کی معلومات',
      'checkout.orderSummary': 'آرڈر کا خلاصہ',
      'admin.staffSignIn': 'سٹاف سائن اِن',
      'admin.restrictedAccess': 'محدود رسائی',
      'admin.signInHint': 'اپنے مقررہ کاراچی بائیٹس سٹاف اکاؤنٹ سے سائن اِن کریں۔ اڈمن خصوصیات کے لیے اڈمن کردار درکار ہے۔',
      'admin.username': 'صارف نام',
      'admin.password': 'پاس ورڈ',
      'admin.signIn': 'سائن اِن کریں',
      'admin.signingIn': 'سائن اِن ہو رہا ہے…',
      'admin.staffAndOrderManagement': 'سٹاف اور آرڈر مینجمنٹ',
      'admin.customerSite': 'گاہکوں کی سائٹ',
      'admin.signOut': 'سائن آؤٹ',
      'admin.operations': 'آپریشنز',
      'admin.orderDashboard': 'آرڈر ڈیش بورڈ',
      'admin.dashboardHint': 'آرڈر API سے لوڈ ہوتے ہیں۔ حالت کی تبدیلیاں سرور کی اجازت دہ قواعد کے مطابق ہوتی ہیں۔',
      'admin.refreshOrders': 'آرڈر تازہ کریں',
      'admin.loadingOrders': 'آرڈر لوڈ ہو رہے ہیں…',
      'admin.loadingKitchenTicket': 'کچن ٹکٹ لوڈ ہو رہا ہے...',
      'admin.applyFilters': 'فلٹرز لاگو کریں',
      'admin.loadedOrders': 'لوڈ شدہ آرڈرز',
      'admin.orderLedger': 'آرڈر لیجر',
      'admin.newestFirst': 'نئے آرڈر سب سے اوپر',
      'admin.kitchenTicket': 'کچن ٹکٹ',
      'admin.kitchenTicketTitle': 'کچن ٹکٹ',
      'admin.printTicket': 'ٹکٹ پرنٹ کریں',
      'admin.print': 'پرنٹ',
      'admin.complete': 'مکمل',
      'admin.update': 'اپڈیٹ',
      'admin.saving': 'محفوظ ہو رہا ہے…',
      'admin.signInToLoad': 'آرڈر لوڈ کرنے کے لیے سائن اِن کریں۔',
      'admin.noOrders': 'کوئی آرڈر ان فلٹرز سے مطابقت نہیں رکھتا۔',
      'admin.failedKitchenTicket': 'کچن ٹکٹ لوڈ نہیں ہو سکا',
      'admin.status.received': 'موصول',
      'admin.status.preparing': 'بنایا جا رہا ہے',
      'admin.status.out-for-delivery': 'ڈیلیوری کے لیے نکلا',
      'admin.status.delivered': 'پہنچا دیا گیا'
    }
  };

  let current = 'en';
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && dictionaries[saved]) current = saved;
  } catch (_) { /* storage unavailable */ }

  function getCurrentLanguage() {
    return current;
  }

  function dict() {
    return dictionaries[current] || dictionaries.en;
  }

  function applyDocAttributes() {
    const html = document.documentElement;
    if (!html) return;
    html.setAttribute('lang', current);
    html.setAttribute('dir', current === 'ur' ? 'rtl' : 'ltr');
    const lang = current;
    document.documentElement.dir=lang==='ur'?'rtl':'ltr';
  }

  function t(key, params) {
    const d = dict();
    let str = Object.prototype.hasOwnProperty.call(d, key) ? d[key]
      : Object.prototype.hasOwnProperty.call(dictionaries.en, key) ? dictionaries.en[key]
      : String(key).split('.').pop().replace(/([a-z])([A-Z])/g, '$1 $2').replace(/[-_]/g, ' ').replace(/^./, (ch) => ch.toUpperCase());
    if (params) {
      for (const name of Object.keys(params)) {
        str = str.replace(new RegExp('\\{' + name + '\\}', 'g'), String(params[name]));
      }
    }
    return str;
  }

  // Translate the document: static [data-i18l*] markup plus toggle labels.
  function applyI18n(root) {
    const scope = root || document;
    scope.querySelectorAll('[data-i18l-text]').forEach((el) => {
      const translated = t(el.getAttribute('data-i18l-text'));
      if (el.textContent !== translated) el.textContent = translated;
    });
    scope.querySelectorAll('[data-i18l-placeholder]').forEach((el) => {
      el.setAttribute('placeholder', t(el.getAttribute('data-i18l-placeholder')));
    });
    scope.querySelectorAll('[data-i18l-aria]').forEach((el) => {
      el.setAttribute('aria-label', t(el.getAttribute('data-i18l-aria')));
    });
    scope.querySelectorAll('[data-i18l-title]').forEach((el) => {
      el.setAttribute('title', t(el.getAttribute('data-i18l-title')));
    });
    scope.querySelectorAll('[data-i18l-lang-toggle]').forEach((el) => {
      const translated = current === 'en' ? t('nav.switchToUrdu') : t('nav.switchToEnglish');
      if (el.textContent !== translated) el.textContent = translated;
    });
  }

  function setLanguage(lang) {
    const next = dictionaries[lang] ? lang : 'en';
    if (next === current) {
      applyI18n();
      return;
    }
    current = next;
    try { localStorage.setItem(STORAGE_KEY, current); } catch (_) { /* ignore */ }
    applyDocAttributes();
    ensureUrduFont();
    applyI18n();
    window.dispatchEvent(new CustomEvent('kb:language-changed', { detail: { language: current } }));
  }

  // Load Urdu font only after Urdu is selected so English startup stays light.
  function ensureUrduFont() {
    if (current !== 'ur' || document.getElementById('kb-urdu-font')) return;
    const link = document.createElement('link');
    link.id = 'kb-urdu-font'; link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Noto+Nastaliq+Urdu:wght@400;500;600;700&display=swap';
    document.head.appendChild(link);
  }
  // Boot: apply saved language to the static shell as soon as possible.
  applyDocAttributes();
  ensureUrduFont();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => applyI18n());
  } else {
    applyI18n();
  }

  // Observe dynamically rendered app sections so translations survive menu/cart rerenders.
  if (typeof MutationObserver !== 'undefined' && document.documentElement) {
    const observer = new MutationObserver((records) => {
      records.forEach((record) => record.addedNodes.forEach((node) => {
        if (node.nodeType !== 1) return;
        if (node.matches && node.matches('[data-i18l-text],[data-i18l-placeholder],[data-i18l-aria],[data-i18l-title],[data-i18l-lang-toggle]')) applyI18n(node.parentNode || document);
        else if (node.querySelector && node.querySelector('[data-i18l-text],[data-i18l-placeholder],[data-i18l-aria],[data-i18l-title],[data-i18l-lang-toggle]')) applyI18n(node);
      }));
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
  }
  document.addEventListener('click', (event) => {
    const toggle = event.target.closest && event.target.closest('[data-i18l-lang-toggle]');
    if (toggle) setLanguage(current === 'en' ? 'ur' : 'en');
  });
  return { t, setLanguage, getCurrentLanguage, applyI18n, dictionaries };
})();

// Global helpers (plain functions, safe to use in template literals)
function t(key, params) { return I18N.t(key, params); }
function setLanguage(lang) { return I18N.setLanguage(lang); }
function getCurrentLanguage() { return I18N.getCurrentLanguage(); }
function applyI18n(root) { return I18N.applyI18n(root); }
window.t = t;
window.setLanguage = setLanguage;
window.getCurrentLanguage = getCurrentLanguage;
window.applyI18n = applyI18n;
window.I18N = I18N;