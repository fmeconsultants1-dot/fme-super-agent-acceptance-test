/**
 * /api/test-jobs — Software Test Jobs (Test 3 feature)
 * Supports: create, list, get, update, delete.
 * Valid statuses: OPEN | RUNNING | COMPLETE | FAILED
 */
'use strict';
const express = require('express');
const db      = require('../database/connection');
const router  = express.Router();

const VALID_STATUSES = ['OPEN', 'RUNNING', 'COMPLETE', 'FAILED'];

function validateStatus(status) {
  if (!VALID_STATUSES.includes(status)) {
    return `status must be one of: ${VALID_STATUSES.join(', ')}`;
  }
  return null;
}

// GET /api/test-jobs — list all
router.get('/', (req, res) => {
  const { status } = req.query;
  let rows;
  if (status) {
    const err = validateStatus(status);
    if (err) return res.status(400).json({ error: err });
    rows = db.prepare(
      'SELECT * FROM test_jobs WHERE status = ? ORDER BY created_at DESC'
    ).all(status);
  } else {
    rows = db.prepare(
      'SELECT * FROM test_jobs ORDER BY created_at DESC'
    ).all();
  }
  res.json({ jobs: rows, total: rows.length });
});

// GET /api/test-jobs/:id — get one
router.get('/:id', (req, res) => {
  const job = db.prepare('SELECT * FROM test_jobs WHERE id = ?').get(req.params.id);
  if (!job) return res.status(404).json({ error: 'Test job not found' });
  res.json({ job });
});

// POST /api/test-jobs — create
router.post('/', (req, res) => {
  const { title, status = 'OPEN', notes = '' } = req.body;

  if (!title || !title.trim()) {
    return res.status(400).json({ error: 'title is required' });
  }
  const statusErr = validateStatus(status);
  if (statusErr) return res.status(400).json({ error: statusErr });

  const result = db.prepare(
    'INSERT INTO test_jobs (title, status, notes) VALUES (?, ?, ?)'
  ).run(title.trim(), status, notes);

  const job = db.prepare('SELECT * FROM test_jobs WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ job });
});

// PUT /api/test-jobs/:id — update
router.put('/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM test_jobs WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Test job not found' });

  const { title = existing.title, status = existing.status, notes = existing.notes } = req.body;

  if (!title.trim()) return res.status(400).json({ error: 'title cannot be empty' });
  const statusErr = validateStatus(status);
  if (statusErr) return res.status(400).json({ error: statusErr });

  db.prepare(
    "UPDATE test_jobs SET title = ?, status = ?, notes = ?, updated_at = datetime('now') WHERE id = ?"
  ).run(title.trim(), status, notes, req.params.id);

  const job = db.prepare('SELECT * FROM test_jobs WHERE id = ?').get(req.params.id);
  res.json({ job });
});

// DELETE /api/test-jobs/:id — delete
router.delete('/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM test_jobs WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Test job not found' });
  db.prepare('DELETE FROM test_jobs WHERE id = ?').run(req.params.id);
  res.json({ deleted: true, id: Number(req.params.id) });
});

module.exports = router;
