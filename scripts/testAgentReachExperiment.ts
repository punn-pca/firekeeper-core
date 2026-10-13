import assert from 'node:assert/strict';
import { normalizeAgentReachCandidate } from '../src/server/services/agentReach/normalizeAgentReachCandidate.ts';
const good = normalizeAgentReachCandidate({url:'https://example.org/article',title:'Example',snippet:'Evidence'});
assert.equal(good?.sourceUrl,'https://example.org/article');
assert.equal(good?.verificationStatus,'CONTEXTUAL_UNVERIFIED');
for (const url of ['file:///etc/passwd','http://localhost:8080','http://127.0.0.1','http://169.254.169.254/latest','https://user:pass@example.org','not a url']) {
  assert.equal(normalizeAgentReachCandidate({url}),null,url);
}
assert.equal(normalizeAgentReachCandidate({url:'https://example.org',title:42})?.title,'');
console.log('Agent Reach mock normalization checks passed');
