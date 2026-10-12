import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// Regression guard for Stage 12's advisory boundary.
// This checks source invariants, not account-policy endpoint authorization.
const server = readFileSync(new URL('../server.ts', import.meta.url), 'utf8');
const stageStart = server.indexOf('// Stage 12: Continuous Improvement & Human Agency');
assert(stageStart >= 0, 'Stage 12 human agency boundary must exist');
const stage = server.slice(stageStart, stageStart + 1300);
assert.match(stage, /PENDING_HUMAN_APPROVAL/, 'Approval-required decisions must be marked pending');
assert.match(stage, /ADVISORY_ONLY/, 'Other responses must remain advisory');
assert.match(stage, /Stage 12 does not grant or simulate approval authority/, 'Stage 12 must not claim to grant approval');
assert.match(stage, /accountPolicy\?\.approvalRequired && p0Quality\.report\.decisionRequired/, 'Pending state must depend on account policy and decision classification');
console.log('Stage 12 human agency source-contract checks passed; endpoint authorization remains unverified.');
