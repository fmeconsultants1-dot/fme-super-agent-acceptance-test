/**
 * TEST: Notes — working CRUD feature
 * Also captures the broken display bug BEFORE repair and
 * verifies the fix AFTER repair (regression test for Test 02).
 */
'use strict';
const request = require('supertest');
const app     = require('../src/server');
const db      = require('../src/database/connection');

let createdId;

describe('Notes — CRUD (working feature)', () => {
  it('POST /api/notes — creates a note', async () => {
    const res = await request(app)
      .post('/api/notes')
      .send({ title: 'Test Note', body: 'Hello world' });
    expect(res.status).toBe(201);
    expect(res.body.note.title).toBe('Test Note');
    expect(res.body.note.body).toBe('Hello world');
    createdId = res.body.note.id;
  });

  it('GET /api/notes — lists notes including new one', async () => {
    const res = await request(app).get('/api/notes');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.notes)).toBe(true);
    const found = res.body.notes.find(n => n.id === createdId);
    expect(found).toBeTruthy();
  });

  it('GET /api/notes/:id — retrieves single note', async () => {
    const res = await request(app).get(`/api/notes/${createdId}`);
    expect(res.status).toBe(200);
    expect(res.body.note.id).toBe(createdId);
  });

  it('PUT /api/notes/:id — updates note', async () => {
    const res = await request(app)
      .put(`/api/notes/${createdId}`)
      .send({ title: 'Updated Note', body: 'Updated body' });
    expect(res.status).toBe(200);
    expect(res.body.note.title).toBe('Updated Note');
  });

  it('POST /api/notes — rejects missing title', async () => {
    const res = await request(app).post('/api/notes').send({ body: 'no title' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/title/);
  });

  it('DELETE /api/notes/:id — deletes note', async () => {
    const res = await request(app).delete(`/api/notes/${createdId}`);
    expect(res.status).toBe(200);
    expect(res.body.deleted).toBe(true);
  });

  it('GET /api/notes/:id — returns 404 after delete', async () => {
    const res = await request(app).get(`/api/notes/${createdId}`);
    expect(res.status).toBe(404);
  });
});

// ============================================================
// TEST-02-REGRESSION-TEST
// Bug: GET /api/notes/:id/display returns display_body=null
//      when note body is an empty string (falsy || check).
// Fix: change `note.body || undefined` to `note.body ?? ''`
// ============================================================
describe('TEST-02 — Broken display feature — regression test', () => {
  let emptyBodyNoteId;

  beforeAll(() => {
    // Create a note with an empty body to expose the bug
    const result = db.prepare(
      "INSERT INTO notes (title, body) VALUES (?, ?)"
    ).run('Empty Body Note', '');
    emptyBodyNoteId = result.lastInsertRowid;
  });

  afterAll(() => {
    db.prepare('DELETE FROM notes WHERE id = ?').run(emptyBodyNoteId);
  });

  it('REGRESSION — display_body must be empty string (not null) for notes with empty body', async () => {
    const res = await request(app).get(`/api/notes/${emptyBodyNoteId}/display`);
    expect(res.status).toBe(200);
    // After the fix, display_body must be '' not null/undefined
    expect(res.body.display_body).toBe('');
    // This test FAILS on the broken code and PASSES after repair
  });

  it('REGRESSION — display_body must be preserved for notes with non-empty body', async () => {
    // Create note with content
    const cr = await request(app)
      .post('/api/notes')
      .send({ title: 'Has Body', body: 'actual content' });
    const id = cr.body.note.id;
    const res = await request(app).get(`/api/notes/${id}/display`);
    expect(res.body.display_body).toBe('actual content');
    await request(app).delete(`/api/notes/${id}`);
  });
});
