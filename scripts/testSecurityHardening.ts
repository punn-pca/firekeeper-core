import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const server = readFileSync('server.ts', 'utf8');
assert.match(server, /requestedEndpointBaseUrl = resolvedProvider === 'ollama' \? ollamaBaseUrl : customBaseUrl/, 'Ollama custom endpoints must pass through the custom endpoint opt-in gate');
assert.match(server, /const autoWebSearch = Boolean\(effectiveWebSearch\)/, 'automatic news search must respect the explicit web-search setting');
assert.match(server, /crypto\.createHmac\('sha256'/, 'guest quota identity must not be a freely regenerated guest user ID');
assert.match(server, /reserveAnalysisRequest\(guestQuotaUserId, dailyQuotaLimit, quotaAnalysisRequestId, mode\)/, 'guest quota reservations must use the stable guest quota identity');
assert.match(server, /idempotencyKey: checkoutIdempotencyKey/, 'Stripe checkout creation must use an idempotency key');
assert.match(server, /SELF_APPROVAL_NOT_ALLOWED/, 'approval requesters must not approve their own requests');
assert.match(server, /memberAccount\.exists/, 'workspace members must reference an existing account');
assert.match(server, /if \(!workspace\.exists \|\| !getWorkspaceRole\(data, userId\)\) return res\.status\(404\)/, 'workspace membership must be checked before plan entitlements on protected routes');

console.log('Security hardening source-contract checks passed.');
