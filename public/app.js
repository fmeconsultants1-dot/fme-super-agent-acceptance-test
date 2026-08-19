/* FME Acceptance Test — Frontend App */
'use strict';

// ---- Panel routing ----
function showPanel(id) {
  document.querySelectorAll('.panel').forEach(p => p.classList.add('hidden'));
  document.getElementById('panel-' + id).classList.remove('hidden');
  if (id === 'notes')   loadNotes();
  if (id === 'jobs')    loadTestJobs();
  if (id === 'runner')  loadRunnerJobs();
  if (id === 'weather') loadProviderInfo();
}

// ---- Health ----
async function checkHealth() {
  try {
    const r = await fetch('/api/health');
    const d = await r.json();
    const bar = document.getElementById('health-bar');
    const dbOk = d.database?.status === 'OK';
    bar.textContent = `✓ ${d.status} | DB: ${d.database?.status} | notes:${d.database?.detail?.noteCount ?? '?'} jobs:${d.database?.detail?.jobCount ?? '?'}`;
    bar.style.background = dbOk ? '#155724' : '#721c24';
  } catch(e) {
    document.getElementById('health-bar').textContent = '⚠ Unreachable';
  }
}
setInterval(checkHealth, 15000);
checkHealth();

// ---- Notes ----
async function loadNotes() {
  const r = await fetch('/api/notes');
  const { notes } = await r.json();
  const el = document.getElementById('notes-list');
  el.innerHTML = notes.length === 0 ? '<p>No notes yet.</p>' : notes.map(n => `
    <div class="card" id="note-${n.id}">
      <h3>${esc(n.title)}</h3>
      <p>${esc(n.body || '')}</p>
      <small>${n.created_at}</small>
      <div class="card-actions">
        <button onclick="deleteNote(${n.id})">Delete</button>
      </div>
    </div>
  `).join('');
}
document.getElementById('note-form').addEventListener('submit', async e => {
  e.preventDefault();
  await fetch('/api/notes', { method: 'POST', headers: {'Content-Type':'application/json'},
    body: JSON.stringify({ title: document.getElementById('note-title').value, body: document.getElementById('note-body').value })
  });
  e.target.reset(); loadNotes();
});
async function deleteNote(id) {
  await fetch('/api/notes/' + id, { method: 'DELETE' });
  loadNotes();
}

// ---- Broken display test ----
async function testBrokenDisplay() {
  const el = document.getElementById('broken-output');
  try {
    const r = await fetch('/api/notes/2/display');
    const d = await r.json();
    el.textContent = JSON.stringify(d, null, 2);
  } catch(e) { el.textContent = 'Error: ' + e.message; }
}

// ---- Test Jobs ----
async function loadTestJobs() {
  const r = await fetch('/api/test-jobs');
  const { jobs } = await r.json();
  const el = document.getElementById('jobs-list');
  el.innerHTML = jobs.length === 0 ? '<p>No test jobs yet.</p>' : jobs.map(j => `
    <div class="card" id="job-${j.id}">
      <h3>${esc(j.title)}</h3>
      <span class="badge badge-${j.status}">${j.status}</span>
      <p>${esc(j.notes || '')}</p>
      <small>${j.created_at}</small>
      <div class="card-actions">
        <button onclick="cycleStatus(${j.id},'${j.status}')">Change Status</button>
        <button class="danger" onclick="deleteJob(${j.id})">Delete</button>
      </div>
    </div>
  `).join('');
}
document.getElementById('job-form').addEventListener('submit', async e => {
  e.preventDefault();
  const body = {
    title:  document.getElementById('job-title').value,
    status: document.getElementById('job-status').value,
    notes:  document.getElementById('job-notes').value
  };
  const r = await fetch('/api/test-jobs', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(body) });
  const d = await r.json();
  if (!r.ok) { alert(d.error); return; }
  e.target.reset(); loadTestJobs();
});
const STATUS_CYCLE = ['OPEN','RUNNING','COMPLETE','FAILED'];
async function cycleStatus(id, current) {
  const next = STATUS_CYCLE[(STATUS_CYCLE.indexOf(current) + 1) % STATUS_CYCLE.length];
  await fetch('/api/test-jobs/' + id, { method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ status: next }) });
  loadTestJobs();
}
async function deleteJob(id) {
  await fetch('/api/test-jobs/' + id, { method: 'DELETE' });
  loadTestJobs();
}

// ---- Weather ----
async function loadProviderInfo() {
  const r = await fetch('/api/weather/provider');
  const d = await r.json();
  document.getElementById('provider-info').innerHTML =
    `<p class="provider-tag">Active provider: <strong>${esc(d.provider?.name)}</strong> | Authenticated: ${d.provider?.authenticated} | ${esc(d.provider?.note)}</p>`;
}
async function loadWeather() {
  const el = document.getElementById('weather-output');
  el.innerHTML = '<p>Fetching…</p>';
  try {
    const r = await fetch('/api/weather/current');
    const d = await r.json();
    if (d.status === 'INTEGRATION_PENDING') {
      el.innerHTML = `<div class="alert alert-error">INTEGRATION_PENDING: ${esc(d.message)}</div>`;
      return;
    }
    if (!r.ok) { el.innerHTML = `<div class="alert alert-error">${esc(d.error)}: ${esc(d.detail)}</div>`; return; }
    el.innerHTML = `
      <div class="weather-card">
        <div class="desc">${esc(d.location)} — ${esc(d.description)}</div>
        <div class="temp">${d.temperature_c}&deg;C / ${d.temperature_f}&deg;F</div>
        <p>Wind: ${d.wind_speed_kmh} km/h | Humidity: ${d.humidity_pct ?? 'N/A'}%</p>
        <p>Fetched: ${d.fetched_at}</p>
        <p class="provider-tag">via ${esc(d.provider)}</p>
      </div>
    `;
  } catch(e) { el.innerHTML = `<div class="alert alert-error">Fetch failed: ${e.message}</div>`; }
}

// ---- Job Runner ----
async function loadRunnerJobs() {
  const r = await fetch('/api/jobs');
  const { jobs } = await r.json();
  const el = document.getElementById('runner-jobs-list');
  el.innerHTML = jobs.length === 0 ? '<p>No job runs yet.</p>' : jobs.map(j => `
    <div class="card">
      <h3>${esc(j.job_id?.substring(0,8))} …</h3>
      <span class="badge badge-${j.state}">${j.stage}/${j.state}</span>
      <p>Attempt: ${j.attempt} | Input: ${esc(j.input)} | Error: ${esc(j.error || 'none')}</p>
      ${ j.state === 'FAILED' ? `<div class="card-actions"><button onclick="replayJob('${j.job_id}')">Replay from Stage C</button></div>` : '' }
    </div>
  `).join('');
}
document.getElementById('runner-form').addEventListener('submit', async e => {
  e.preventDefault();
  const body = {
    title:      document.getElementById('runner-title').value,
    forceFailC: document.getElementById('force-fail').checked
  };
  const el = document.getElementById('runner-output');
  el.innerHTML = '<p>Running…</p>';
  const r = await fetch('/api/jobs', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(body) });
  const d = await r.json();
  const j = d.job;
  el.innerHTML = `
    <div class="alert ${ j.state === 'FAILED' ? 'alert-error' : 'alert-success'}">
      Job <code>${j.job_id?.substring(0,8)}…</code> Stage: ${j.stage} | State: ${j.state}
      ${ j.error ? '<br/>Error: ' + esc(j.error) : '' }
    </div>`;
  loadRunnerJobs();
});
async function replayJob(jobId) {
  const el = document.getElementById('runner-output');
  el.innerHTML = '<p>Replaying Stage C only…</p>';
  const r = await fetch('/api/jobs/' + jobId + '/replay', { method: 'POST' });
  const d = await r.json();
  const j = d.job;
  el.innerHTML = `
    <div class="alert ${ j.state === 'FAILED' ? 'alert-error' : 'alert-success'}">
      Replay: <code>${j.job_id?.substring(0,8)}…</code> Stage: ${j.stage} | State: ${j.state}
      ${ j.error ? '<br/>Error: ' + esc(j.error) : '' }
    </div>`;
  loadRunnerJobs();
}

// ---- Helpers ----
function esc(str) {
  if (str == null) return '';
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// Init
showPanel('notes');
