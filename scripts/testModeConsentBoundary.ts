import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const app = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8');
const start = app.indexOf('const confirmModeConsent =');
const end = app.indexOf('// ความจำ Handlers', start);
assert.ok(start >= 0 && end > start, 'Mode consent flow must exist');
const flow = app.slice(start, end);
assert.match(flow, /if \(!pendingModeConsent\) return;/, 'Consent cannot proceed without a pending request');
assert.match(flow, /if \(useGoverned\) \{\s*handleModeChange\('governed'\)/, 'Governed mode requires explicit confirmation');
assert.match(flow, /setApprovedGovernedPrompt\(pending\)/, 'Confirmed prompt must wait for mode transition');
assert.match(flow, /if \(!approvedGovernedPrompt \|\| chatMode !== 'governed'\) return;/, 'Governed prompt must not run in Normal mode');
assert.match(flow, /else \{\s*void handleส่งPrompt\(pending\.prompt/, 'Declining escalation must preserve Normal mode submission');
assert.match(app, /onClick=\{\(\) => confirmModeConsent\(false\)\}/, 'Normal continuation must remain available');
assert.match(app, /onClick=\{\(\) => confirmModeConsent\(true\)\}/, 'Governed consent must be a deliberate action');
console.log('Mode consent source-contract checks passed; browser interaction remains unverified.');
