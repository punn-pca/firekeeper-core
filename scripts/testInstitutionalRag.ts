import assert from 'node:assert/strict';
import { chunkInstitutionalMarkdown, formatInstitutionalContext, hasInstitutionalKnowledgeIntent, retrieveInstitutionalKnowledge } from '../src/server/services/institutionalKnowledge';

assert.equal(hasInstitutionalKnowledgeIntent('ประวัติการตัดสินใจของ FIREKEEPER'), true);
assert.equal(hasInstitutionalKnowledgeIntent('Firekeeper founder cognitive model'), true);
assert.equal(hasInstitutionalKnowledgeIntent('RAG คืออะไร'), false);
assert.equal(hasInstitutionalKnowledgeIntent('Firekeeper คืออะไร'), false);

const fixture = '# Decision History\nFACT: The project adopted PCA.\n\n## Failed Experiments\nHYPOTHESIS: Memory was not injected.\n';
const chunks = chunkInstitutionalMarkdown(fixture);
assert.ok(chunks.length >= 2);
assert.ok(chunks.every(c => c.hash.length === 64 && c.sourceType === 'INSTITUTIONAL_ARCHIVE' && c.epistemicStatus === 'CONTEXT_ONLY'));
assert.ok(formatInstitutionalContext(chunks).includes('HYPOTHESIS:'));
assert.deepEqual(retrieveInstitutionalKnowledge('What is RAG?'), []);
console.log('[Institutional RAG] PASS: intent gating, provenance, chunking and epistemic status');
