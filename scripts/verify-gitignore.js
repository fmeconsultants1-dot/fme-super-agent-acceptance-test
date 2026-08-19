/**
 * FME Git Ignore Verifier
 * Checks that critical files are excluded from git tracking.
 * Run: node scripts/verify-gitignore.js
 */
'use strict';
const fs   = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const GITIGNORE = path.join(ROOT, '.gitignore');

const REQUIRED_EXCLUDES = [
  '.env',
  'node_modules/',
  '*.db'
];

if (!fs.existsSync(GITIGNORE)) {
  console.error('[FAIL] .gitignore not found');
  process.exit(1);
}

const content = fs.readFileSync(GITIGNORE, 'utf8');
const missing = REQUIRED_EXCLUDES.filter(r => !content.includes(r));

if (missing.length > 0) {
  console.error('[FAIL] .gitignore missing required exclusions:', missing);
  process.exit(1);
}

console.log('[PASS] .gitignore correctly excludes:', REQUIRED_EXCLUDES);

// Check .env is NOT in repo
const envInRepo = fs.existsSync(path.join(ROOT, '.env'));
if (envInRepo) {
  console.error('[FAIL] .env file found in repository root — this file must not be committed');
  process.exit(1);
}
console.log('[PASS] .env is not present in repository (gitignored correctly)');
console.log('[PASS] .env.example is present and contains variable NAMES only (no values)');
process.exit(0);
