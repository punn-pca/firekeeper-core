import assert from 'node:assert/strict';
import fs from 'node:fs';

const server = fs.readFileSync('server.ts', 'utf8');

assert.match(server, /async function failAnalysisRequest\(/);
assert.match(server, /status: 'FAILED_CONSUMED'/);
assert.match(server, /failureCode,/);
assert.match(server, /failedAt: new Date\(\)\.toISOString\(\)/);
assert.match(server, /status !== 'RESERVED'/);
assert.match(server, /await failAnalysisRequest\([\s\S]*?normalizedAnalysisRequestId/);
assert.match(server, /ANALYSIS_PREVIOUSLY_FAILED/);
assert.match(server, /requestStatus: error\?\.status \|\| 'RESERVED'/);

const failCall = server.indexOf('await failAnalysisRequest(');
const errorEvent = server.indexOf("sendSSE('error'", failCall);
assert.ok(failCall >= 0 && errorEvent > failCall, 'failure state must close before the terminal error event');

console.log('Analysis request failure-state boundary checks passed.');
