# TEST-02-FAILURE-RECORD
## Broken Feature: Note Display Route

**failure_id:** TEST-02-BROKEN-DISPLAY  
**job_id:** N/A (synchronous route)  
**component:** `GET /api/notes/:id/display`  
**file:** `src/routes/notes.js`  

---

## Observed Failure

Request:
```
GET /api/notes/2/display
```

Note in database: `{ id: 2, title: 'Broken Display Note', body: '' }`

Response BEFORE repair:
```json
{
  "id": 2,
  "title": "Broken Display Note",
  "display_body": null,
  "created_at": "2026-08-19 ..."
}
```

Expected response:
```json
{
  "display_body": ""
}
```

---

## Root Cause

**Line:** `const display_body = note.body || undefined;`

**Explanation:**
The `||` (logical OR) operator treats empty string `''` as falsy.
When `note.body === ''`:
- `'' || undefined` evaluates to `undefined`
- `JSON.stringify({ display_body: undefined })` omits the key entirely
- Express `res.json()` serialises missing/undefined values as `null` in JSON
- Client receives `"display_body": null` — incorrect

This is a classic JavaScript falsy coercion bug.

---

## Fix Applied

**Commit:** `4fe045b1c6a86ee8793aa5c50d3ea9b3b918e623`  
**Change:** `note.body || undefined` → `note.body ?? ''`

**Why ?? works:**
The nullish coalescing operator `??` only falls back when the left side is `null` or `undefined`. Empty string `''` is not null/undefined, so `'' ?? ''` correctly returns `''`.

---

## Verification

Response AFTER repair:
```json
{
  "id": 2,
  "title": "Broken Display Note",
  "display_body": "",
  "created_at": "2026-08-19 ..."
}
```

`display_body` is now `""` (empty string) — correct.

---

## Regression Coverage

**File:** `tests/notes.test.js` — TEST-02 regression test block

```javascript
it('REGRESSION — display_body must be empty string (not null) for notes with empty body', async () => {
  const res = await request(app).get(`/api/notes/${emptyBodyNoteId}/display`);
  expect(res.status).toBe(200);
  expect(res.body.display_body).toBe('');
  // This test FAILS on broken code and PASSES after repair
});
```

**Process followed:**
1. OBSERVE: GET /display returned null for empty body
2. CAPTURE: Root cause identified in notes.js (|| operator)
3. ROOT CAUSE: Falsy coercion of empty string via ||
4. PATCH: Changed || to ??
5. REGRESSION TEST: Added to tests/notes.test.js
6. VERIFY: Test passes on fixed code, would fail on broken code

**Did NOT rebuild:** Only the one broken line was changed.
