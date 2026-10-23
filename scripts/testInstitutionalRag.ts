import assert from 'node:assert/strict';
import { chunkTextWithOverlap } from '../src/server/utils/textChunking';
import { chunkInstitutionalMarkdown, formatInstitutionalContext, hasInstitutionalKnowledgeIntent, retrieveInstitutionalKnowledge, retrieveInstitutionalKnowledgeHybrid } from '../src/server/services/institutionalKnowledge';

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

assert.deepEqual(await retrieveInstitutionalKnowledgeHybrid('What is RAG?'), []);
assert.ok((await retrieveInstitutionalKnowledgeHybrid('FIREKEEPER ประวัติการตัดสินใจ')).length > 0, 'Hybrid fallback must retrieve historical chunks without API keys');
console.log('[Institutional RAG] PASS: hybrid route and lexical fallback');

const longThaiText = 'หัวข้อภาษาไทย\n' + 'หลักฐานสำคัญสำหรับการตัดสินใจ '.repeat(180) + '\nตาราง: ผู้อนุมัติ | วันที่ | สถานะ';
const overlapped = chunkTextWithOverlap(longThaiText, 240, 40);
assert.ok(overlapped.length > 2, 'Long Thai text should be split into multiple chunks');
assert.ok(overlapped.every(c => c.content.length <= 240), 'Chunks should respect the character limit');
assert.ok(overlapped.slice(1).every((c, i) => c.startOffset < overlapped[i].endOffset), 'Adjacent chunks should overlap in source offsets');
assert.ok(overlapped.some(c => c.content.includes('ตาราง:')), 'Tail content must not be dropped');
console.log('[Institutional RAG] PASS: Thai text chunking and overlap');