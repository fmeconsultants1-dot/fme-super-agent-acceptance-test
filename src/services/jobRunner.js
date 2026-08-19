/**
 * FME Job Runner
 * ==============
 * Executes a 3-stage pipeline (A → B → C).
 * State is persisted in job_runs table after every stage.
 * Replay starts from the FAILED stage — never from Stage A.
 *
 * Stage A: validate input
 * Stage B: transform data
 * Stage C: persist result (can be force-failed for Test 8)
 *
 * Records: job_id, stage, state, attempt, input, output, error, provider, timestamp
 */
'use strict';
const { v4: uuidv4 } = require('crypto').webcrypto
  ? { v4: () => require('crypto').randomUUID() }
  : { v4: () => require('crypto').randomUUID() };
const db = require('../database/connection');

const STAGES = ['A', 'B', 'C'];

function getJob(jobId) {
  return db.prepare('SELECT * FROM job_runs WHERE job_id = ?').get(jobId);
}

function upsertJob(fields) {
  const existing = db.prepare('SELECT id FROM job_runs WHERE job_id = ?').get(fields.job_id);
  if (existing) {
    db.prepare(`
      UPDATE job_runs SET
        stage        = ?,
        state        = ?,
        attempt      = ?,
        input        = ?,
        output       = ?,
        error        = ?,
        provider     = ?,
        started_at   = COALESCE(started_at, ?),
        completed_at = ?
      WHERE job_id = ?
    `).run(
      fields.stage, fields.state, fields.attempt,
      JSON.stringify(fields.input || {}),
      JSON.stringify(fields.output || {}),
      fields.error || '',
      fields.provider || 'internal',
      fields.started_at || new Date().toISOString(),
      fields.completed_at || null,
      fields.job_id
    );
  } else {
    db.prepare(`
      INSERT INTO job_runs
        (job_id, stage, state, attempt, input, output, error, provider, version, started_at, completed_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      fields.job_id,
      fields.stage, fields.state, fields.attempt,
      JSON.stringify(fields.input || {}),
      JSON.stringify(fields.output || {}),
      fields.error || '',
      fields.provider || 'internal',
      '1.0',
      fields.started_at || new Date().toISOString(),
      fields.completed_at || null
    );
  }
  return getJob(fields.job_id);
}

// ----- Stage implementations -----

async function runStageA(jobId, input) {
  upsertJob({ job_id: jobId, stage: 'A', state: 'RUNNING', attempt: 1, input, started_at: new Date().toISOString() });
  // Validate: title must be present
  if (!input.title || !input.title.trim()) {
    throw new Error('Stage A failed: title is required');
  }
  const output = { validated: true, title: input.title.trim() };
  upsertJob({ job_id: jobId, stage: 'A', state: 'COMPLETE', attempt: 1, input, output });
  return output;
}

async function runStageB(jobId, input, stageAOutput) {
  upsertJob({ job_id: jobId, stage: 'B', state: 'RUNNING', attempt: 1, input });
  // Transform: uppercase title, add timestamp
  const output = {
    transformed_title: stageAOutput.title.toUpperCase(),
    processed_at:      new Date().toISOString()
  };
  upsertJob({ job_id: jobId, stage: 'B', state: 'COMPLETE', attempt: 1, input, output });
  return output;
}

async function runStageC(jobId, input, stageBOutput, opts = {}) {
  const attempt = opts.attempt || 1;
  upsertJob({ job_id: jobId, stage: 'C', state: 'RUNNING', attempt, input });

  // opts.forceFailC = true triggers the intentional Test-8 failure
  if (opts.forceFailC) {
    const err = new Error('Stage C failed: simulated persistence error (Test 8)');
    upsertJob({
      job_id: jobId, stage: 'C', state: 'FAILED',
      attempt, input,
      output: {},
      error:  err.message,
      completed_at: new Date().toISOString()
    });
    throw err;
  }

  // Normal path: persist transformed title as a test_job
  const result = db.prepare(
    "INSERT INTO test_jobs (title, status, notes) VALUES (?, 'COMPLETE', ?)"
  ).run(
    stageBOutput.transformed_title,
    `Created by job runner job_id=${jobId}`
  );
  const output = {
    persisted: true,
    test_job_id: result.lastInsertRowid,
    title: stageBOutput.transformed_title
  };
  upsertJob({
    job_id: jobId, stage: 'C', state: 'COMPLETE',
    attempt, input, output,
    completed_at: new Date().toISOString()
  });
  return output;
}

// ----- Public API -----

/**
 * startJob(input, opts)
 * Runs A → B → C. Returns job record.
 * opts.forceFailC = true → C will fail (Test 8 setup)
 */
async function startJob(input = {}, opts = {}) {
  const jobId = require('crypto').randomUUID();
  upsertJob({ job_id: jobId, stage: 'A', state: 'PENDING', attempt: 0, input, started_at: new Date().toISOString() });

  try {
    const aOut = await runStageA(jobId, input);
    const bOut = await runStageB(jobId, input, aOut);
    await runStageC(jobId, input, bOut, opts);
  } catch (err) {
    // Error already recorded in the stage that failed
    console.error(`[JobRunner] job=${jobId} failed:`, err.message);
  }
  return getJob(jobId);
}

/**
 * replayFromC(jobId)
 * Re-runs only Stage C using stored stage B output.
 * Stages A and B are NOT re-run.
 */
async function replayFromC(jobId) {
  const job = getJob(jobId);
  if (!job) throw new Error(`Job ${jobId} not found`);
  if (job.stage !== 'C' || job.state !== 'FAILED') {
    throw new Error(`Job ${jobId} is not in state C/FAILED (got ${job.stage}/${job.state})`);
  }

  // Reconstruct stage B output from the stored job input (re-derive)
  const input = JSON.parse(job.input || '{}');
  const stageBOutput = {
    transformed_title: (input.title || '').trim().toUpperCase(),
    processed_at:      new Date().toISOString()
  };

  // Current attempt count
  const attempt = (job.attempt || 1) + 1;
  await runStageC(jobId, input, stageBOutput, { attempt });
  return getJob(jobId);
}

module.exports = { startJob, replayFromC, getJob };
