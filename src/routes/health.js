/**
 * GET /api/health
 * Returns application health status, DB connectivity, uptime.
 */
'use strict';
const express = require('express');
const db      = require('../database/connection');
const router  = express.Router();

router.get('/', (req, res) => {
  let dbStatus = 'OK';
  let dbDetail = null;
  try {
    db.prepare('SELECT 1').get();
    const noteCount    = db.prepare('SELECT COUNT(*) as c FROM notes').get().c;
    const jobCount     = db.prepare('SELECT COUNT(*) as c FROM test_jobs').get().c;
    const jobRunCount  = db.prepare('SELECT COUNT(*) as c FROM job_runs').get().c;
    dbDetail = { noteCount, jobCount, jobRunCount };
  } catch (err) {
    dbStatus = 'ERROR';
    dbDetail = err.message;
  }

  res.json({
    status:      'OK',
    timestamp:   new Date().toISOString(),
    uptime:      process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    database:    { status: dbStatus, detail: dbDetail },
    version:     '1.0.0'
  });
});

module.exports = router;
