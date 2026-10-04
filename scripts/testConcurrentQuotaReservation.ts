import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync('server.ts', 'utf8');
const reserveFn = source.indexOf('async function reserveAnalysisQuota');
const transaction = source.indexOf('adminDb.runTransaction', reserveFn);
const limitCheck = source.indexOf("new Error('PLAN_LIMIT_REACHED')", transaction);
const quotaIncrement = source.indexOf('dailyAnalysisCount: used + 1', limitCheck);
const streamRoute = source.indexOf("app.post('/api/pca/stream'");
const reserveCall = source.indexOf('await reserveAnalysisQuota(userId, userPlan.dailyAnalysisLimit)', streamRoute);
const sseHeaders = source.indexOf("res.setHeader('Content-Type', 'text/event-stream')", reserveCall);
const providerCall = source.indexOf('callUnifiedLlmContent(', reserveCall);
const finalizeFn = source.indexOf('async function recordCompletedAnalysisUsage');
const finalizeBodyEnd = source.indexOf('/** Aggregate daily telemetry', finalizeFn);

assert.ok(reserveFn >= 0 && transaction > reserveFn, 'Quota reservation must use a Firestore transaction');
assert.ok(limitCheck > transaction && quotaIncrement > limitCheck, 'Limit check and reservation increment must share one transaction');
assert.ok(reserveCall > streamRoute, 'PCA stream must reserve quota');
assert.ok(sseHeaders > reserveCall, 'Quota reservation must happen before streaming starts');
assert.ok(providerCall > reserveCall, 'Quota reservation must happen before provider work');
assert.equal(source.slice(finalizeFn, finalizeBodyEnd).includes('dailyAnalysisCount'), false, 'Completion finalizer must not increment daily quota a second time');

console.log('Concurrent quota reservation boundary passed.');
