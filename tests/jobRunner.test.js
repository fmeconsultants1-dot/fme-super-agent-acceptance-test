/**
 * TEST: Job Runner — Test 8 (Failure + Replay)
 * Proves Stage A ✅, Stage B ✅, Stage C ❌ → fix → Replay C → ✅
 * Regression test included.
 */
'use strict';
const { startJob, replayFromC, getJob } = require('../src/services/jobRunner');
const db = require('../src/database/connection');

describe('JobRunner — happy path (A → B → C all pass)', () => {
  it('starts and completes all 3 stages', async () => {
    const job = await startJob({ title: 'Full pipeline test' });
    expect(job.stage).toBe('C');
    expect(job.state).toBe('COMPLETE');
    expect(job.attempt).toBeGreaterThanOrEqual(1);
  });
});

describe('JobRunner — TEST 8: Stage C forced failure → replay', () => {
  let failedJobId;
  let replayedJob;

  it('STAGE A ✅ STAGE B ✅ STAGE C ❌ — job ends in FAILED state', async () => {
    const job = await startJob({ title: 'Failure replay test' }, { forceFailC: true });
    expect(job.stage).toBe('C');
    expect(job.state).toBe('FAILED');
    expect(job.error).toMatch(/Stage C failed/);
    expect(job.attempt).toBeGreaterThanOrEqual(1);
    failedJobId = job.job_id;
  });

  it('getJob() returns persisted failure record with all required fields', () => {
    const job = getJob(failedJobId);
    expect(job.job_id).toBe(failedJobId);
    expect(job.state).toBe('FAILED');
    expect(job.stage).toBe('C');
    expect(job.error).toBeTruthy();
    expect(job.attempt).toBeGreaterThanOrEqual(1);
    expect(job.input).toBeTruthy();
    expect(job.started_at).toBeTruthy();
    // Proves failure record has all required fields (Test 8)
  });

  it('REPLAY C ✅ — replayFromC resumes from Stage C only, completes job', async () => {
    replayedJob = await replayFromC(failedJobId);
    expect(replayedJob.stage).toBe('C');
    expect(replayedJob.state).toBe('COMPLETE');
    expect(replayedJob.attempt).toBeGreaterThanOrEqual(2); // attempt incremented
    expect(replayedJob.completed_at).toBeTruthy();
  });

  it('REGRESSION — replayed job cannot be replayed again (no longer FAILED)', async () => {
    await expect(replayFromC(failedJobId)).rejects.toThrow('not in state C/FAILED');
  });

  it('REGRESSION — startJob validates title (Stage A guard)', async () => {
    const job = await startJob({ title: '' });
    // Stage A should fail: empty title
    expect(job.state).toBe('FAILED');
    expect(job.stage).toBe('A');
  });
});

describe('JobRunner — HTTP endpoints', () => {
  const request = require('supertest');
  const app     = require('../src/server');

  it('POST /api/jobs — creates and runs a job', async () => {
    const res = await request(app)
      .post('/api/jobs')
      .send({ title: 'HTTP job test' });
    expect(res.status).toBe(201);
    expect(res.body.job.state).toBe('COMPLETE');
  });

  it('POST /api/jobs — creates a failed job with forceFailC', async () => {
    const res = await request(app)
      .post('/api/jobs')
      .send({ title: 'HTTP fail test', forceFailC: true });
    expect(res.status).toBe(201);
    expect(res.body.job.state).toBe('FAILED');
  });

  it('GET /api/jobs — lists all runs', async () => {
    const res = await request(app).get('/api/jobs');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.jobs)).toBe(true);
  });
});
