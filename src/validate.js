const VALID_BRANCHES = ['Clifton', 'Gulshan-e-Iqbal', 'North Nazimabad'];

const VALID_STATUS = ['Received', 'Preparing', 'Out for Delivery', 'Delivered'];
const VALID_TRANSITIONS = {
  'Received': ['Preparing'],
  'Preparing': ['Out for Delivery'],
  'Out for Delivery': ['Delivered'],
  'Delivered': [],
};

const VALID_TAGS = ['veg', 'spicy', 'mild'];

function isValidStatus(status) {
  return typeof status === 'string' && VALID_STATUS.includes(status);
}

function isValidTransition(from, to) {
  return VALID_TRANSITIONS[from] && VALID_TRANSITIONS[from].includes(to);
}

function isValidBranch(branch) {
  return typeof branch === 'string' && VALID_BRANCHES.includes(branch);
}

function isValidPhone(phone) {
  if (typeof phone !== 'string') return false;
  const cleaned = phone.replace(/[\s-]/g, '');
  return /^03\d{9}$/.test(cleaned);
}

function isValidName(name) {
  return typeof name === 'string' && name.trim().length >= 2 && name.trim().length <= 100;
}

function isValidAddress(address) {
  return typeof address === 'string' && address.trim().length >= 5 && address.trim().length <= 500;
}

function isValidNotes(notes) {
  if (notes === undefined || notes === null) return true;
  if (typeof notes !== 'string') return false;
  return notes.trim().length <= 500;
}

function isValidEmail(email) {
  if (email === undefined || email === null || email === '') return true;
  if (typeof email !== 'string') return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) && email.trim().length <= 200;
}

function isValidQuantity(qty) {
  return Number.isInteger(qty) && qty > 0 && qty <= 100;
}

function isValidPrice(price) {
  return Number.isInteger(price) && price >= 0 && price <= 100000;
}

function isValidCategory(category) {
  if (typeof category !== 'string') return false;
  const allowed = ['BBQ', 'Karahi', 'Rice', 'Rolls', 'Drinks', 'Desserts'];
  return allowed.includes(category);
}

function isValidTag(tag) {
  return typeof tag === 'string' && VALID_TAGS.includes(tag);
}

function sanitizeString(value, maxLen) {
  if (typeof value !== 'string') return '';
  return value.trim().substring(0, maxLen);
}

function isValidMenuSearchQuery(query) {
  if (query === undefined || query === null) return true;
  if (typeof query !== 'string') return false;
  return query.trim().length <= 100;
}

function isValidMenuFilter(filter) {
  if (filter === undefined || filter === null) return true;
  if (typeof filter !== 'string') return false;
  return filter.trim().length <= 50;
}

function isValidMaxPrice(maxPrice) {
  if (maxPrice === undefined || maxPrice === null) return true;
  const n = Number(maxPrice);
  return Number.isFinite(n) && n >= 0 && n <= 100000;
}

function isValidDateParam(date) {
  if (date === undefined || date === null) return true;
  if (typeof date !== 'string') return false;
  return /^\d{4}-\d{2}-\d{2}$/.test(date.trim());
}

module.exports = {
  VALID_BRANCHES,
  VALID_STATUS,
  VALID_TRANSITIONS,
  VALID_TAGS,
  isValidStatus,
  isValidTransition,
  isValidBranch,
  isValidPhone,
  isValidName,
  isValidAddress,
  isValidNotes,
  isValidEmail,
  isValidQuantity,
  isValidPrice,
  isValidCategory,
  isValidTag,
  sanitizeString,
  isValidMenuSearchQuery,
  isValidMenuFilter,
  isValidMaxPrice,
  isValidDateParam,
};