/**
 * FME Secret Scanner
 * ==================
 * Scans tracked source files for patterns that suggest hardcoded secrets.
 * Does NOT read .env (it's gitignored). Reads only committed source.
 *
 * Patterns checked:
 *   - Bare API key assignments  (apiKey = "sk-...")
 *   - Bearer tokens in source
 *   - AWS-style keys
 *   - Passwords in source
 *   - Private key blocks
 *
 * Run: node scripts/secret-scan.js
 * Returns exit code 1 if secrets found.
 */
'use strict';
const fs   = require('fs');
const path = require('path');

const SCAN_DIRS  = ['src', 'tests', 'scripts', 'public'];
const EXTENSIONS = ['.js', '.ts', '.json', '.yaml', '.yml', '.sh', '.env.example'];

const PATTERNS = [
  { name: 'Hardcoded password',      re: /password\s*[:=]\s*['"][^'"]{6,}['"]/i },
  { name: 'Bare API key string',      re: /api[_-]?key\s*[:=]\s*['"][A-Za-z0-9]{16,}['"]/i },
  { name: 'Bearer token in source',   re: /Bearer\s+[A-Za-z0-9\-._~+/]{20,}/i },
  { name: 'AWS access key',           re: /AKIA[0-9A-Z]{16}/ },
  { name: 'Private key block',        re: /-----BEGIN (RSA |EC )?PRIVATE KEY-----/ },
  { name: 'Generic secret assignment',re: /secret\s*[:=]\s*['"][^'"]{8,}['"]/i },
];

// Files that are allowed to reference secret NAMES (not values)
const ALLOWLIST_FILES = [
  '.env.example',
  'secret-scan.js',
];

function* walkDir(dir) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory() && entry.name !== 'node_modules') {
      yield* walkDir(fullPath);
    } else if (entry.isFile() && EXTENSIONS.some(ext => fullPath.endsWith(ext))) {
      yield fullPath;
    }
  }
}

let issueCount = 0;
const report  = [];

for (const dir of SCAN_DIRS) {
  for (const filePath of walkDir(path.resolve(__dirname, '..', dir))) {
    const isAllowlisted = ALLOWLIST_FILES.some(a => filePath.endsWith(a));
    if (isAllowlisted) continue;

    const lines = fs.readFileSync(filePath, 'utf8').split('\n');
    lines.forEach((line, idx) => {
      for (const { name, re } of PATTERNS) {
        if (re.test(line)) {
          issueCount++;
          report.push({ file: filePath, line: idx + 1, pattern: name, snippet: line.trim().substring(0, 80) });
        }
      }
    });
  }
}

console.log('\n=== FME SECRET SCAN REPORT ===');
console.log(`Scanned directories: ${SCAN_DIRS.join(', ')}`);
console.log(`Issues found: ${issueCount}`);

if (report.length > 0) {
  console.error('\n[FAIL] Potential secrets detected:');
  report.forEach(r => {
    console.error(`  ${r.file}:${r.line} [${r.pattern}]`);
    console.error(`    ${r.snippet}`);
  });
  process.exit(1);
} else {
  console.log('[PASS] No hardcoded secrets detected in source files.');
  console.log('Reminder: .env is gitignored — secrets are stored in protected environment config only.');
  process.exit(0);
}
