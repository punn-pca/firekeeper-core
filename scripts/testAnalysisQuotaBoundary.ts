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
