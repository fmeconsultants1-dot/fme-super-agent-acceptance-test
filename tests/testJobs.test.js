/**
 * TEST: Software Test Jobs — Test 3
 * Full CRUD: create, list, get, update (status cycle), delete.
 * Status validation: invalid statuses rejected.
 */
'use strict';
const request = require('supertest');
const app     = require('../src/server');

let jobId;

describe('Test Jobs — CRUD + status validation', () => {
  it('POST /api/test-jobs — creates a job with OPEN status', async () => {
    const res = await request(app)
      .post('/api/test-jobs')
      .send({ title: 'Integration smoke test', status: 'OPEN' });
    expect(res.status).toBe(201);
    expect(res.body.job.title).toBe('Integration smoke test');
    expect(res.body.job.status).toBe('OPEN');
    jobId = res.body.job.id;
  });

  it('GET /api/test-jobs — lists all jobs', async () => {
    const res = await request(app).get('/api/test-jobs');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.jobs)).toBe(true);
    expect(res.body.jobs.find(j => j.id === jobId)).toBeTruthy();
  });

  it('GET /api/test-jobs/:id — retrieves single job', async () => {
    const res = await request(app).get(`/api/test-jobs/${jobId}`);
    expect(res.status).toBe(200);
    expect(res.body.job.id).toBe(jobId);
  });

  it('PUT /api/test-jobs/:id — updates status to RUNNING', async () => {
    const res = await request(app)
      .put(`/api/test-jobs/${jobId}`)
      .send({ status: 'RUNNING' });
    expect(res.status).toBe(200);
    expect(res.body.job.status).toBe('RUNNING');
  });

  it('PUT /api/test-jobs/:id — updates status to COMPLETE', async () => {
    const res = await request(app)
      .put(`/api/test-jobs/${jobId}`)
      .send({ status: 'COMPLETE' });
    expect(res.status).toBe(200);
    expect(res.body.job.status).toBe('COMPLETE');
  });

  it('PUT /api/test-jobs/:id — updates status to FAILED', async () => {
    const res = await request(app)
      .put(`/api/test-jobs/${jobId}`)
      .send({ status: 'FAILED' });
    expect(res.status).toBe(200);
    expect(res.body.job.status).toBe('FAILED');
  });

  it('POST /api/test-jobs — rejects invalid status', async () => {
    const res = await request(app)
      .post('/api/test-jobs')
      .send({ title: 'Bad job', status: 'INVALID_STATUS' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/status/);
  });

  it('POST /api/test-jobs — rejects missing title', async () => {
    const res = await request(app)
      .post('/api/test-jobs')
      .send({ status: 'OPEN' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/title/);
  });

  it('GET /api/test-jobs?status=FAILED — filters by status', async () => {
    const res = await request(app).get('/api/test-jobs?status=FAILED');
    expect(res.status).toBe(200);
    res.body.jobs.forEach(j => expect(j.status).toBe('FAILED'));
  });

  it('DELETE /api/test-jobs/:id — deletes job', async () => {
    const res = await request(app).delete(`/api/test-jobs/${jobId}`);
    expect(res.status).toBe(200);
    expect(res.body.deleted).toBe(true);
  });

  it('GET /api/test-jobs/:id — returns 404 after delete', async () => {
    const res = await request(app).get(`/api/test-jobs/${jobId}`);
    expect(res.status).toBe(404);
  });
});
