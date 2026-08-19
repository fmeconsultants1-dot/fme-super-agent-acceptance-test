# TEST-08-STAGE-RECORD
## Job Runner: Failure + Replay Evidence

**job_id:** (generated at runtime — unique UUID per run)  
**provider:** internal  
**version:** 1.0  

---

## Pipeline Design

```
Stage A: Validate input
  → Writes RUNNING to job_runs
  → Validates title present
  → Writes COMPLETE/FAILED to job_runs

Stage B: Transform data
  → Writes RUNNING to job_runs
  → Uppercases title, adds timestamp
  → Writes COMPLETE/FAILED to job_runs

Stage C: Persist result
  → Writes RUNNING to job_runs
  → Creates test_jobs record
  → Writes COMPLETE/FAILED to job_runs
  → When forceFailC=true: throws, writes FAILED
```

## Failure Sequence (Test 8 trigger)

```
STAGE A ✅ COMPLETE
STAGE B ✅ COMPLETE
STAGE C ❌ FAILED
  error: "Stage C failed: simulated persistence error (Test 8)"
  attempt: 1
  state: FAILED
  stage: C
```

Job record in `job_runs` table:
```json
{
  "job_id": "<uuid>",
  "stage": "C",
  "state": "FAILED",
  "attempt": 1,
  "input": "{\"title\":\"Failure replay test\"}",
  "output": "{}",
  "error": "Stage C failed: simulated persistence error (Test 8)",
  "provider": "internal",
  "version": "1.0",
  "started_at": "<iso-timestamp>",
  "completed_at": "<iso-timestamp>"
}
```

## Replay (Stage C Only)

**API call:** `POST /api/jobs/<job_id>/replay`

**Service call:** `replayFromC(jobId)`

Replay logic:
1. Fetches existing job record
2. Verifies state=FAILED, stage=C (rejects otherwise)
3. Re-derives Stage B output from stored input (does NOT re-run A or B)
4. Increments attempt counter
5. Runs Stage C without forceFailC
6. Writes COMPLETE to job_runs

```
STAGE A ✅ (not re-run — preserved from original)
STAGE B ✅ (not re-run — output re-derived from stored input)
STAGE C ✅ REPLAYED → COMPLETE
  attempt: 2
  state: COMPLETE
```

## Regression Tests

1. `replayed job cannot be replayed again` — replayFromC throws 'not in state C/FAILED'
2. `startJob validates title` — empty title causes Stage A to fail (not Stage C)
3. `HTTP POST /api/jobs forceFailC` — returns 201 with FAILED state
4. `GET /api/jobs` — lists all runs

## Replay-Only Proof

The `replayFromC` function explicitly re-derives Stage B output from stored data:
```javascript
const stageBOutput = {
  transformed_title: (input.title || '').trim().toUpperCase(),
  processed_at:      new Date().toISOString()
};
```
Stages A and B functions are never called during replay.
