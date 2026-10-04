import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync('server.ts', 'utf8');
const usageFn = source.indexOf('async function recordCompletedAnalysisUsage');
const usageThrow = source.indexOf("throw new Error('USAGE_PERSISTENCE_FAILED')", usageFn);
const usageAwait = source.indexOf('await recordCompletedAnalysisUsage(userId', usageFn);
const complete = source.indexOf("sendSSE('complete'", usageAwait);
const telemetry = source.indexOf('void recordDailyAnalysisTelemetry()', complete);

assert.ok(usageFn >= 0, 'Quota-bearing usage writer must exist');
assert.ok(usageThrow > usageFn, 'Quota-bearing usage persistence must fail closed');
assert.ok(usageAwait > usageFn, 'Completion path must await quota-bearing usage persistence');
assert.ok(complete > usageAwait, 'Quota-bearing usage must commit before terminal complete event');
assert.ok(telemetry > complete, 'Aggregate daily telemetry must remain secondary to governed completion');
assert.match(source, /USAGE_STORAGE_UNAVAILABLE/, 'Usage reads must expose storage-unavailable state instead of returning zero');

console.log('Usage completion boundary passed.');
