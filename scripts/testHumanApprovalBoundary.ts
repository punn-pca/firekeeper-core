import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// Regression guard for Stage 12's advisory boundary.
// This checks source invariants, not account-policy endpoint authorization.
const server = readFileSync(new URL('../server.ts', import.meta.url), 'utf8');
const stageStart = server.indexOf('// Stage 12: Continuous Improvement & Human Agency');
assert(stageStart >= 0, 'Stage 12 human agency boundary must exist');
const stage = server.slice(stageStart, stageStart + 1300);
const approvalBoundary = server.slice(Math.max(0, stageStart - 650), stageStart + 1300);
assert.match(stage, /PENDING_HUMAN_APPROVAL/, 'Approval-required decisions must be marked pending');
assert.match(stage, /ADVISORY_ONLY/, 'Other responses must remain advisory');
assert.match(stage, /Stage 12 does not grant or simulate approval authority/, 'Stage 12 must not claim to grant approval');
assert.match(approvalBoundary, /const turnApprovalRequired = Boolean\(accountPolicy\?\.approvalRequired && p0Quality\.report\.decisionRequired\)/, 'Pending state must depend on account policy and decision classification');
assert.match(stage, /turnApprovalRequired \? 'PENDING_HUMAN_APPROVAL' : 'ADVISORY_ONLY'/, 'Stage 12 must use the policy-bound decision classification');
const auditRoute = server.slice(server.indexOf("app.post('/api/audit/decision'"), server.indexOf("app.get('/api/memory'"));
assert.match(auditRoute, /req\.body \|\| \{\}/, 'Missing audit body must not throw');
assert.match(auditRoute, /if \(policy\?\.approvalRequired\)/, 'Decision audit must enforce account approval policy');
assert.match(auditRoute, /hasMatchingDecisionApproval\(adminDb, userId, workspaceId, approvalId, decision\)/, 'Decision audit must check server-side matching approval');
assert.match(auditRoute, /APPROVAL_REQUIRED/, 'Missing approval must fail closed');
const reviewRoute = server.slice(server.indexOf("app.patch('/api/workspaces/:workspaceId/approvals/:approvalId'"), server.indexOf("app.post('/api/billing/create-checkout-session'"));
assert.match(reviewRoute, /canReviewApproval\(getWorkspaceRole\(currentWorkspace\.data\(\), userId\)\)/, 'Reviewer role must be checked inside transaction');
assert.match(reviewRoute, /approval\.data\(\)\?\.status !== 'PENDING'/, 'Final approvals must not be reviewed again');
console.log('Human approval source-contract checks passed; live authorization integration remains unverified.');
