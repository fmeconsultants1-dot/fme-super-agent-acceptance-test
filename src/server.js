/**
 * FME Acceptance Test — Main Server
 * Starts Express, mounts all routes, runs migrations on boot.
 */
'use strict';
require('dotenv').config();
const express   = require('express');
const cors      = require('cors');
const path      = require('path');
const { runMigrations } = require('./database/migrate');

const app  = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Routes
app.use('/api/health',    require('./routes/health'));
app.use('/api/notes',     require('./routes/notes'));
app.use('/api/test-jobs', require('./routes/testJobs'));
app.use('/api/weather',   require('./routes/weather'));
app.use('/api/jobs',      require('./routes/jobRunner'));

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found', path: req.path });
});

// Global error handler
app.use((err, req, res, _next) => {
  console.error('[SERVER ERROR]', err.message);
  res.status(500).json({ error: 'Internal server error', detail: err.message });
});

function start() {
  runMigrations();
  app.listen(PORT, () => {
    console.log(`[FME-TEST] Server running on port ${PORT} — ${new Date().toISOString()}`);
    console.log(`[FME-TEST] Environment: ${process.env.NODE_ENV || 'development'}`);
  });
}

if (require.main === module) {
  start();
}

module.exports = app; // exported for supertest
