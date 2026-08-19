/**
 * /api/notes — Working feature: CRUD for notes.
 *
 * TEST-02 FIX APPLIED (2026-08-19):
 * GET /api/notes/:id/display previously used `note.body || undefined`
 * which coerced empty string to null in JSON. Fixed to `note.body ?? ''`.
 * Regression test: tests/notes.test.js — TEST-02 block.
 */
'use strict';
const express = require('express');
const db      = require('../database/connection');
const router  = express.Router();

// GET /api/notes — list all (WORKING)
router.get('/', (req, res) => {
  const notes = db.prepare(
    'SELECT * FROM notes ORDER BY created_at DESC'
  ).all();
  res.json({ notes });
});

// GET /api/notes/:id — get one (WORKING)
router.get('/:id', (req, res) => {
  const note = db.prepare('SELECT * FROM notes WHERE id = ?').get(req.params.id);
  if (!note) return res.status(404).json({ error: 'Note not found' });
  res.json({ note });
});

// POST /api/notes — create (WORKING)
router.post('/', (req, res) => {
  const { title, body = '' } = req.body;
  if (!title || !title.trim()) {
    return res.status(400).json({ error: 'title is required' });
  }
  const result = db.prepare(
    'INSERT INTO notes (title, body) VALUES (?, ?)'
  ).run(title.trim(), body);
  const note = db.prepare('SELECT * FROM notes WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ note });
});

// PUT /api/notes/:id — update (WORKING)
router.put('/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM notes WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Note not found' });

  const { title = existing.title, body = existing.body } = req.body;
  if (!title.trim()) return res.status(400).json({ error: 'title cannot be empty' });

  db.prepare(
    "UPDATE notes SET title = ?, body = ?, updated_at = datetime('now') WHERE id = ?"
  ).run(title.trim(), body, req.params.id);
  const note = db.prepare('SELECT * FROM notes WHERE id = ?').get(req.params.id);
  res.json({ note });
});

// DELETE /api/notes/:id — delete (WORKING)
router.delete('/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM notes WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Note not found' });
  db.prepare('DELETE FROM notes WHERE id = ?').run(req.params.id);
  res.json({ deleted: true, id: Number(req.params.id) });
});

// -------------------------------------------------------------------------
// GET /api/notes/:id/display  (REPAIRED — TEST-02)
// BEFORE FIX: note.body || undefined  → empty string became null in JSON
// AFTER FIX:  note.body ?? ''         → empty string preserved correctly
// -------------------------------------------------------------------------
router.get('/:id/display', (req, res) => {
  const note = db.prepare('SELECT * FROM notes WHERE id = ?').get(req.params.id);
  if (!note) return res.status(404).json({ error: 'Note not found' });

  // FIX: ?? preserves empty string; || would discard it
  const display_body = note.body ?? '';

  res.json({
    id:           note.id,
    title:        note.title,
    display_body,           // '' when body is '' — correct after fix
    created_at:   note.created_at
  });
});

module.exports = router;
