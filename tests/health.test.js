/**
 * TEST: Health endpoint
 * Verifies the app starts, DB connects, and returns structured status.
 */
'use strict';
const request = require('supertest');
const app     = require('../src/server');

describe('GET /api/health', () => {
  it('returns 200 with status OK', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('OK');
  });

  it('reports database status OK', async () => {
    const res = await request(app).get('/api/health');
    expect(res.body.database.status).toBe('OK');
  });

  it('includes uptime and timestamp', async () => {
    const res = await request(app).get('/api/health');
    expect(typeof res.body.uptime).toBe('number');
    expect(res.body.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });
});
