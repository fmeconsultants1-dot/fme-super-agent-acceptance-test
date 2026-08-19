/**
 * /api/jobs — Job runner HTTP endpoints (Test 8)
 */
'use strict';
const express = require('express');
const { startJob, replayFromC, getJob } = require('../services/jobRunner');
const db      = require('../database/connection');
const router  = express.Router();

// POST /api/jobs — start a job
// body: { title, forceFailC: true } — forceFailC triggers Test-8 failure
router.post('/', async (req, res) => {
  const { title, forceFailC = false } = req.body;
  if (!title) return res.status(400).json({ error: 'title required' });
  const job = await startJob({ title }, { forceFailC });
  res.status(201).json({ job });
});

// GET /api/jobs — list all job runs
router.get('/', (req, res) => {
  const rows = db.prepare(
    'SELECT * FROM job_runs ORDER BY started_at DESC'
  ).all();
  res.json({ jobs: rows });
});

// GET /api/jobs/:jobId — get one
router.get('/:jobId', (req, res) => {
  const job = getJob(req.params.jobId);
  if (!job) return res.status(404).json({ error: 'Job not found' });
  res.json({ job });
});

// POST /api/jobs/:jobId/replay — replay from failed stage C
router.post('/:jobId/replay', async (req, res) => {
  try {
    const job = await replayFromC(req.params.jobId);
    res.json({ replayed: true, job });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
