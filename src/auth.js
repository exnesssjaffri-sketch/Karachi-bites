const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { getOne } = require('./db');

const JWT_SECRET = process.env.JWT_SECRET;

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
  if (!row) return null;
  const match = await bcrypt.compare(password, row.password_hash);
  if (!match) return null;
  return { id: row.id, username: row.username, role: row.role };
}

function authMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  const token = authHeader.substring(7);
  try {
    const decoded = verifyToken(token);
    req.user = decoded;
    next();
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

module.exports = { generateToken, verifyToken, authenticateUser, authMiddleware, requireAdmin };