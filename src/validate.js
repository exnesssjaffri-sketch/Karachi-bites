const VALID_STATUS = ['Received', 'Preparing', 'Out for Delivery', 'Delivered'];
const VALID_TRANSITIONS = {
  'Received': ['Preparing'],
  'Preparing': ['Out for Delivery'],
  'Out for Delivery': ['Delivered'],
  'Delivered': [],
};

function isValidStatus(status) {
  return VALID_STATUS.includes(status);
}

function isValidTransition(from, to) {
  return VALID_TRANSITIONS[from] && VALID_TRANSITIONS[from].includes(to);
}

function isValidBranch(branch) {
  return branch === 'Clifton';
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

function isValidQuantity(qty) {
  return Number.isInteger(qty) && qty > 0 && qty <= 100;
}

module.exports = {
  VALID_STATUS,
  VALID_TRANSITIONS,
  isValidStatus,
  isValidTransition,
  isValidBranch,
  isValidPhone,
  isValidName,
  isValidAddress,
  isValidQuantity,
};