const express = require('express');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const path = require('path');
require('dotenv').config();

// Track readiness state for graceful degradation in serverless environments
let dbConnected = false;
let dbError = null;

// In production, warn but don't exit — let the health endpoint report status
if (process.env.NODE_ENV === 'production' && !process.env.DATABASE_URL) {
  console.warn('WARNING: DATABASE_URL is not set in production. Database operations will fail until configured.');
}

const { initDatabase, seedDatabase, databaseReady, getDb, isSqlite, isPg } = require('./db');
const apiRoutes = require('./routes');

const app = express();
const PORT = process.env.PORT || 3000;

// Security headers via Helmet
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      ...helmet.contentSecurityPolicy.getDefaultDirectives(),
      // The existing SPA and Stitch exports use Tailwind's browser CDN.
      // Keep app scripts same-origin; allow the CDN and its runtime compiler explicitly.
      'script-src': ["'self'", 'https://cdn.tailwindcss.com', "'unsafe-eval'"],
      'connect-src': ["'self'", 'https://rgejphvmnlwcoojkpcje.supabase.co'],
      // Stitch exports use HTTPS-hosted food photography.
      'img-src': ["'self'", 'data:', 'https:'],
    },
  },
}));

// Debug middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Body parsing
app.use(express.json({ limit: '10kb' }));

// Vercel/Express sits behind a trusted reverse proxy. This is required so rate limiting can safely read the client IP.
app.set('trust proxy', 1);

// Rate limiting (API endpoints only — static assets are exempt so page loads
// don't consume the quota and risk 429s on subsequent API calls).
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', limiter);

// Health check endpoint — registered BEFORE the databaseReady middleware so it
// responds even while the DB is still initializing or has failed to initialize.
// Executes a lightweight SELECT 1 to verify real database connectivity.
app.get('/api/health', async (req, res) => {
  // Fast-fail with a clear message when the connection string is absent in production.
  if (process.env.NODE_ENV === 'production' && !process.env.DATABASE_URL) {
    return res.status(503).json({
      status: 'error',
      database: 'postgresql',
      detail: 'DATABASE_URL is not configured. Add it in Vercel Project Settings > Environment Variables (Production).',
    });
  }

  if (dbError) {
    return res.status(503).json({
      status: 'error',
      database: isPg ? 'postgresql' : 'sqlite',
      detail: dbError.message,
    });
  }

  try {
    // Readiness means the schema is initialized and a real application table is queryable,
    // not merely that the database accepts SELECT 1 on a fresh serverless invocation.
    await databaseReady;
    if (dbError) {
      return res.status(503).json({
        status: 'error',
        database: isPg ? 'postgresql' : 'sqlite',
        detail: dbError.message,
      });
    }

    const dbHandle = getDb();
    if (isSqlite()) {
      await new Promise((resolve, reject) => {
        dbHandle.get('SELECT 1 FROM menu_items LIMIT 1', (err) => (err ? reject(err) : resolve()));
      });
    } else {
      await dbHandle.query('SELECT 1 FROM menu_items LIMIT 1');
    }
    dbConnected = true;
    res.json({
      status: 'ok',
      database: isPg ? 'postgresql' : 'sqlite',
      ready: true,
      time: new Date().toISOString(),
    });
  } catch (err) {
    res.status(503).json({
      status: 'error',
      database: isPg ? 'postgresql' : 'sqlite',
      detail: err.message,
    });
  }
});

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

// Staff dashboard page. API access inside the dashboard remains role-protected.
// Expose both paths so /admin works with or without a trailing slash.
app.get(['/admin', '/admin/'], (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'admin.html'));
});

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
(async () => {
  try {
    // Both functions kick off async work and resolve the shared `databaseReady`
    // promise when schema + seed are complete. Either may throw synchronously
    // (e.g. missing DATABASE_URL) — that is caught below.
    initDatabase();
    seedDatabase();
  } catch (err) {
    dbError = err;
    console.error('Database initialization failed:', err.message);
  }

  if (!dbError) {
    try {
      await databaseReady;
      // `databaseReady` resolves even when initialization fails, so probe the
      // real connection before marking the app as database-ready.
      const dbHandle = getDb();
      if (isSqlite()) {
        await new Promise((resolve, reject) => {
          dbHandle.get('SELECT 1', (err) => (err ? reject(err) : resolve()));
        });
      } else {
        await dbHandle.query('SELECT 1');
      }
      dbConnected = true;
      console.log('Database initialized and seeded successfully');
    } catch (err) {
      dbError = err;
      console.error('Database initialization failed:', err.message);
    }
  }

  if (require.main === module) {
    app.listen(PORT, () => {
      console.log(`Karachi Bites backend running on http://localhost:${PORT}`);
    });
  }
})();

module.exports = app;