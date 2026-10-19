const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { getOne } = require('./db');

const JWT_SECRET = process.env.JWT_SECRET;
const SUPABASE_URL = (process.env.SUPABASE_URL || 'https://rgejphvmnlwcoojkpcje.supabase.co').replace(/\/$/, '');
const SUPABASE_PUBLISHABLE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_rdUChKjIijuU2b4Oc1UleQ_dQa_Kioh';

if (!JWT_SECRET || JWT_SECRET.trim() === '') {
  console.error('FATAL: JWT_SECRET is required but not set in environment');
  process.exit(1);
}

function generateToken(user) {
  return jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
}

function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

async function authenticateUser(username, password) {
  const row = await getOne('SELECT * FROM users WHERE username = ?', [username]);
  if (!row || row.is_active === false) return null;
  const match = await bcrypt.compare(password, row.password_hash);
  if (!match) return null;
  return { id: row.id, username: row.username, role: row.role };
}

async function verifySupabaseAccessToken(token) {
  const response = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    method: 'GET',
    headers: {
      apikey: SUPABASE_PUBLISHABLE_KEY,
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
    signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) return null;

  const user = await response.json();
  if (!user || typeof user.id !== 'string') return null;

  let profile;
  try {
    profile = await getOne(
      'SELECT role, is_active FROM auth_profiles WHERE auth_user_id = ?',
      [user.id]
    );
  } catch (err) {
    // A missing profile/migration must never grant elevated permissions.
    profile = null;
  }

  if (profile && profile.is_active === false) return null;
  const role = profile && ['customer', 'staff', 'admin'].includes(profile.role)
    ? profile.role
    : 'customer';

  return {
    id: user.id,
    username: user.email || user.phone || user.id,
    email: user.email || null,
    phone: user.phone || null,
    role,
    authProvider: 'supabase',
  };
}

async function authMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const token = authHeader.substring(7);
  try {
    const decoded = verifyToken(token);
    // Resolve the current legacy role from the database so a stale JWT cannot
    // retain admin permissions after the underlying account has been changed.
    const row = await getOne('SELECT id, username, role, is_active FROM users WHERE id = ?', [decoded.id]);
    if (!row || row.is_active === false || row.is_active === 0) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
    req.user = { id: row.id, username: row.username, role: row.role, authProvider: 'legacy' };
    return next();
  } catch (legacyError) {
    // Supabase access tokens are validated against Supabase Auth's user endpoint.
  }

  try {
    const user = await verifySupabaseAccessToken(token);
    if (!user) return res.status(401).json({ error: 'Invalid or expired token' });
    req.user = user;
    return next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

function requireStaffOrAdmin(req, res, next) {
  if (!req.user || !['staff', 'admin'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Staff or admin access required' });
  }
  next();
}

module.exports = {
  generateToken,
  verifyToken,
  authenticateUser,
  verifySupabaseAccessToken,
  authMiddleware,
  requireAdmin,
  requireStaffOrAdmin,
};
