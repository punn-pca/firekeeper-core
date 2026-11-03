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

const server = readFileSync(new URL('../server.ts', import.meta.url), 'utf8');
assert.match(server, /mode:\s*rawMode\s*=\s*'normal'/, 'API requests that omit mode must default to Normal');
assert.match(server, /rawModeLower === 'governed'\s*\?\s*'governed'\s*:\s*'normal'/, 'Only an explicit Governed value may route to PCA');
assert.match(app, /return saved === 'governed' \? 'governed' : 'normal'/, 'New browser sessions must default to Normal while preserving explicit user preference');

console.log('Mode consent and Normal-default source-contract checks passed; browser interaction remains unverified.');
