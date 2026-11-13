import assert from 'node:assert/strict';
import { auditRecommendationCitations, normalizeDecisionEvidence } from '../src/utils/evidenceBindingAudit';

const evidence = [
  { id: 'source-a', source: 'A', sourceUrl: 'https://example.com/a', content: 'หลักฐาน A' },
  { id: 'duplicate-a', source: 'A', sourceUrl: 'https://example.com/a', content: 'หลักฐาน A' },
  { id: 'source-b', source: 'B', sourceUrl: 'https://example.com/b', content: 'หลักฐาน B' },
];

const normalized = normalizeDecisionEvidence(evidence);
assert.equal(normalized.length, 2, 'duplicate evidence must be deduplicated');
assert.deepEqual(normalized.map((item) => item.id), ['E1', 'E2']);

let result = auditRecommendationCitations('ควรดำเนินการตามแนวทางนี้ [E1]', evidence);
assert.equal(result.passed, true);
assert.equal(result.status, 'PASS');

result = auditRecommendationCitations('ควรดำเนินการตามแนวทางนี้ [E99]', evidence);
assert.equal(result.passed, false);
assert.equal(result.status, 'HALLUCINATED_EVIDENCE_IDS');

result = auditRecommendationCitations('ควรดำเนินการตามแนวทางนี้', evidence);
assert.equal(result.passed, false);
assert.equal(result.status, 'ZERO_CITATIONS_IN_RECOMMENDATION');

result = auditRecommendationCitations('สรุปข้อมูลทั่วไป\n\nคำถามต่อยอด: ต้องการข้อมูลเพิ่มไหม', evidence);
assert.equal(result.passed, true, 'non-recommendation text must not be blocked by citation policy');

console.log('PASS: Evidence binding audit prevents invalid IDs, missing recommendation citations, and duplicate evidence.');
