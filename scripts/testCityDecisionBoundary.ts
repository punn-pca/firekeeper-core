import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const server = readFileSync(new URL('../server.ts', import.meta.url), 'utf8');
const component = readFileSync(new URL('../src/components/FirekeeperCityDecisionLab.tsx', import.meta.url), 'utf8');

// The City Decision workflow must use the existing server-owned Workspace approval APIs.
const createApproval = server.slice(server.indexOf("app.post('/api/workspaces/:workspaceId/approvals'"), server.indexOf("app.patch('/api/workspaces/:workspaceId/approvals/:approvalId'"));
assert.match(createApproval, /canRequestApproval\(getWorkspaceRole\(data, userId\)\)/);
assert.match(createApproval, /decisionHash: decisionApprovalHash\(decision\)/);

const reviewApproval = server.slice(server.indexOf("app.patch('/api/workspaces/:workspaceId/approvals/:approvalId'"), server.indexOf("app.post('/api/billing/create-checkout-session'"));
assert.match(reviewApproval, /canReviewApproval\(getWorkspaceRole\(currentWorkspace\.data\(\), userId\)\)/);
assert.match(reviewApproval, /approval\.data\(\)\?\.status !== 'PENDING'/);

const cityAudit = server.slice(server.indexOf("app.post('/api/city-decision/audit'"), server.indexOf("app.get('/api/memory'"));
assert.match(cityAudit, /validateDecisionObject\(decision\)/);
assert.match(cityAudit, /hasMatchingDecisionApproval\(adminDb, userId, workspaceId, approvalId, decision\)/);
assert.match(cityAudit, /APPROVAL_REQUIRED/);
assert.match(cityAudit, /decision\.human_decision\?\.status !== 'ACCEPTED'/);
assert.match(cityAudit, /decision\.human_decision\.actor !== approvalRecord\?\.reviewedBy/);
assert.match(cityAudit, /decision\.human_decision\.actor !== userId/);
assert.match(cityAudit, /createHash\('sha256'\)\.update\(`\$\{workspaceId\}:\$\{approvalId\}`\)/);

assert.match(component, /fetchWithAuthorization\('\/api\/workspaces'/);
assert.match(component, /\/api\/workspaces\/.*\/approvals/);
assert.match(component, /\/api\/city-decision\/audit/);
assert.match(component, /SUBMIT DECISION OBJECT FOR APPROVAL/);
assert.match(component, /reviewApproval\(a\.id,'APPROVED'\)/);
assert.match(component, /reviewApproval\(a\.id,'REJECTED'\)/);
assert.match(component, /retryDecisionAudit\(a\.id/);
assert.match(component, /approvals\.slice\(0, 10\)/);
assert.match(component, /status: 'ACCEPTED'/);

// Demo data is not empirical evidence and must never be presented as VERIFIED.
const evidenceBlock = component.slice(component.indexOf('const evidence:'), component.indexOf('const options ='));
assert.doesNotMatch(evidenceBlock, /status: 'VERIFIED'/);
assert.match(evidenceBlock, /status: 'UNVERIFIED'/);
assert.match(component, /score:null, label:'UNKNOWN'/);
assert.match(component, /onAuthStateChanged\(auth/);
assert.match(component, /DEMO SCENARIO · NOT VERIFIED/);
assert.match(component, /let completeReceived = false/);
assert.match(component, /สตรีมสิ้นสุดก่อน Backend ส่ง complete event/);

console.log('City Decision approval, audit, and evidence-boundary source checks passed.');
