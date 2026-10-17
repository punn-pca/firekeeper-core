import assert from 'node:assert/strict';
import fs from 'node:fs';

const server = fs.readFileSync('server.ts', 'utf8');
const ownership = server.indexOf('verifyConversationOwnership(');
const accountPolicy = server.indexOf('readAccountPolicy(', ownership);
const attachmentParse = server.indexOf('parseAttachmentSingle(', accountPolicy);
const reserve = server.indexOf('await reserveAnalysisRequest(', attachmentParse);
const streamHeaders = server.indexOf("res.setHeader('Content-Type', 'text/event-stream')", reserve);
const memory = server.indexOf('hydrateUserMemories(', streamHeaders);
const publication = server.indexOf('resolvePublicationEvidence(', streamHeaders);
const retrieval = server.indexOf('retrieveExternalEvidenceAsync(', streamHeaders);
const provider = server.indexOf('callUnifiedLlmContent(', streamHeaders);

for (const [name, index] of Object.entries({ ownership, accountPolicy, attachmentParse, reserve, streamHeaders, memory, publication, retrieval, provider })) {
  assert.ok(index >= 0, `${name} boundary must exist`);
}
assert.ok(ownership < accountPolicy, 'ownership must precede account policy completion');
assert.ok(accountPolicy < attachmentParse, 'policy must precede attachment validation');
assert.ok(attachmentParse < reserve, 'attachment validation must precede quota reservation');
assert.ok(reserve < streamHeaders, 'quota/idempotency errors must remain normal HTTP responses');
assert.ok(reserve < memory && reserve < publication && reserve < retrieval && reserve < provider,
  'reservation must precede costly context/retrieval/provider work');

console.log('Analysis quota reservation boundary checks passed.');

const auxiliaryQuota = server.indexOf('async function reserveAuxiliaryLlmUsage(');
assert.ok(auxiliaryQuota >= 0, 'auxiliary LLM quota reservation helper must exist');
for (const [route, featureKey] of [
  ["app.post('/api/chat/follow-ups'", "'chatFollowUps'"],
  ["app.post('/api/flood/analyze'", "'floodAnalysis'"],
  ["app.post('/api/flood/follow-up'", "'floodFollowUp'"],
] as const) {
  const routeIndex = server.indexOf(route);
  assert.ok(routeIndex >= 0, `${route} route must exist`);
  const nextRoute = server.indexOf("\napp.", routeIndex + route.length);
  const routeBody = server.slice(routeIndex, nextRoute >= 0 ? nextRoute : undefined);
  assert.ok(routeBody.includes('reserveAuxiliaryLlmUsage'), `${route} must reserve usage before provider work`);
  assert.ok(routeBody.includes(featureKey), `${route} must use its dedicated quota bucket`);
  assert.ok(routeBody.includes('USAGE_STORAGE_UNAVAILABLE'), `${route} must fail closed when quota storage is unavailable`);
  assert.ok(routeBody.includes('await refundUsage?.()'), `${route} must refund quota when provider generation fails`);
}

assert.ok(server.includes("timeZone: 'Asia/Bangkok'"), 'daily quota dates must use Thailand local time');
assert.ok((server.match(/getQuotaDateKey\(\)/g) || []).length >= 4,
  'primary, auxiliary, telemetry, and share-comment daily counters must use the same quota date key');

const auxiliaryHelperEnd = server.indexOf('\nfunction getRequestUserPlan(', auxiliaryQuota);
const auxiliaryHelperBody = server.slice(auxiliaryQuota, auxiliaryHelperEnd >= 0 ? auxiliaryHelperEnd : undefined);
assert.ok(auxiliaryHelperBody.includes('adminDb.runTransaction'), 'auxiliary quota reservation and refund must be transactional');
assert.ok(auxiliaryHelperBody.includes("collection('auxiliary_llm_reservations')"), 'auxiliary quota refunds must be tied to a reservation record');
assert.ok(auxiliaryHelperBody.includes("status: 'REFUNDED'"), 'auxiliary quota reservation must be marked refunded exactly once');
assert.ok(auxiliaryHelperBody.includes('let refunded = false'), 'refund callback must guard repeated invocation');
const followUpsRoute = server.indexOf("app.post('/api/chat/follow-ups'");
const floodFollowUpRoute = server.indexOf("app.post('/api/flood/follow-up'");
assert.ok(followUpsRoute >= 0 && floodFollowUpRoute > followUpsRoute, 'follow-up route boundaries must be identifiable');
const followUpsBody = server.slice(followUpsRoute, floodFollowUpRoute);
const providerCall = followUpsBody.indexOf('await callUnifiedLlmContent');
const providerCatch = followUpsBody.indexOf('catch (error)', providerCall);
const outputParsing = followUpsBody.indexOf('const raw =');
assert.ok(providerCall >= 0 && providerCatch > providerCall && outputParsing > providerCatch,
  'provider failure handling must be separate from response parsing');
assert.ok(providerCall < followUpsBody.indexOf('JSON.parse('),
  'follow-up output parsing must happen after the provider call');
assert.ok(!followUpsBody.slice(outputParsing).includes('await refundUsage?.()'),
  'malformed provider output must not refund a successful provider call');
