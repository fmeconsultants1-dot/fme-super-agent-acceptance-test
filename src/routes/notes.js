/**
 * /api/notes — Working feature: CRUD for notes.
 *
 * KNOWN BUG (intentional, Test 02 target):
 * GET /api/notes/:id/display returns body as undefined when body is empty string
 * because the route uses  `note.body || undefined`  instead of  `note.body ?? ''`
 * This is the deliberately broken feature. All other note routes work correctly.
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
// INTENTIONALLY BROKEN FEATURE — Test 02
// GET /api/notes/:id/display
// Bug: uses  `note.body || undefined`  — falsy check discards empty string.
// Effect: notes with empty body return { display_body: undefined } in JSON
//         which serialises to null, confusing the frontend.
// Fix (applied in Test 02): change to  `note.body ?? ''`
// -------------------------------------------------------------------------
router.get('/:id/display', (req, res) => {
  const note = db.prepare('SELECT * FROM notes WHERE id = ?').get(req.params.id);
  if (!note) return res.status(404).json({ error: 'Note not found' });

  // BUG: || coerces empty string to falsy → display_body becomes undefined → null in JSON
  const display_body = note.body || undefined; // <-- intentional bug

  res.json({
    id:           note.id,
    title:        note.title,
    display_body,           // null when body is '' — wrong
    created_at:   note.created_at
  });
});

module.exports = router;
