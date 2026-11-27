import fs from 'node:fs';
import assert from 'node:assert/strict';

const server = fs.readFileSync('server.ts', 'utf8');
const app = fs.readFileSync('src/App.tsx', 'utf8');
const home = fs.readFileSync('src/components/Home.tsx', 'utf8');

assert.match(app, /const analysisRequestId = crypto\.randomUUID\(\);/);
assert.match(app, /const requestPayload = \{\s*analysisRequestId,/);
assert.equal((app.match(/JSON\.stringify\(requestPayload\)/g) || []).length >= 2, true, 'initial request and 401 retry must reuse requestPayload');

const reserveFn = server.indexOf('async function reserveAnalysisRequest');
const streamRoute = server.indexOf("app.post('/api/pca/stream'");
const reserveCall = server.indexOf('await reserveAnalysisRequest(', streamRoute);
const providerWork = server.indexOf('callUnifiedLlm(', streamRoute);
assert.ok(reserveFn >= 0 && reserveCall > streamRoute, 'stream route must reserve analysis request');
assert.ok(providerWork < 0 || reserveCall < providerWork, 'dedupe/quota reservation must precede provider work');
assert.match(server.slice(streamRoute, reserveCall + 1500), /ANALYSIS_REQUEST_DUPLICATE/);
assert.match(server.slice(streamRoute, reserveCall + 1500), /status\(409\)/);

const auditCommit = server.indexOf('await auditRef.set', streamRoute);
const usageCommit = server.indexOf('await recordCompletedAnalysisUsage', streamRoute);
const idempotencyComplete = server.indexOf('await completeAnalysisRequest', streamRoute);
const terminalComplete = server.indexOf("sendSSE('complete'", idempotencyComplete);
const clarificationGate = server.indexOf('if (ambiguousContextualSearch)', streamRoute);
const clarificationRelease = server.indexOf('await releaseClarificationReservation(', clarificationGate);
const clarificationComplete = server.indexOf("sendSSE('complete'", clarificationGate);
assert.ok(auditCommit > 0 && usageCommit > auditCommit, 'usage finalization must follow durable audit');
assert.ok(idempotencyComplete > usageCommit, 'idempotency state must finalize after usage');
assert.ok(terminalComplete > idempotencyComplete, 'successful terminal complete must follow durable audit, usage, and idempotency finalization');
assert.ok(clarificationGate > reserveCall && clarificationGate < auditCommit, 'clarification must branch after quota reservation and before success audit');
assert.ok(clarificationRelease > clarificationGate && clarificationRelease < clarificationComplete, 'clarification must release its quota reservation before emitting complete');
assert.match(server.slice(clarificationGate, clarificationComplete), /releaseClarificationReservation\(userId, analysisReservationId/, 'clarification must release the matching reservation');

assert.match(home, /if \(effectiveIsAnalyzing \|\| \(!prompt\.trim\(\) && attachments\.length === 0\)\) return;/);
assert.match(home, /if \(!isAuthenticated\) \{ onOpenAuth\(\); return; \}/);
assert.match(home, /onExecute\(prompt, attachments, tone, effectiveDeepReasoning, reasoningProfile\)/);
assert.match(home, /disabled=\{effectiveIsAnalyzing \|\| \(!prompt\.trim\(\) && attachments\.length === 0\)\}/);

console.log('PASS analysis request idempotency boundary');
