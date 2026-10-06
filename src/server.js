const express = require('express');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

const { initDatabase, seedDatabase, databaseReady } = require('./db');
const apiRoutes = require('./routes');

const app = express();
const PORT = process.env.PORT || 3000;

// Debug middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Body parsing
app.use(express.json({ limit: '10kb' }));

// Vercel/Express sits behind a trusted reverse proxy. This is required so rate limiting can safely read the client IP.
app.set('trust proxy', 1);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Wait for database schema + initial seed before handling API or page requests.
app.use(async (req, res, next) => {
  try {
    await databaseReady;
    next();
  } catch (err) {
    next(err);
  }
});

// Serve static files
app.use(express.static(path.join(__dirname, '..', 'public')));

// API routes
app.use('/api', apiRoutes);

// 404 handler for API routes
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// SPA fallback - serve index.html for all other routes
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'Not found' });
  }
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Initialize database and start server
initDatabase();
seedDatabase();

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Karachi Bites backend running on http://localhost:${PORT}`);
  });
}

module.exports = app;