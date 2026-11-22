import assert from 'node:assert/strict';
import { ensureGovernanceTaxonomyPresence } from '../src/server/services/governanceTaxonomyGuard';
import { buildClaimEvidenceMatrix } from '../src/utils/claimEvidenceMatrix';

const raw = [
  '### การตลาด',
  'มีข้อมูลไม่พอสำหรับยืนยันว่าการตลาดเหมาะกับคุณกว่า AI',
  'ดังนั้นควรพิจารณาเป้าหมายอาชีพก่อนเลือก',
  'อาจเหมาะกับคนที่ต้องการเปลี่ยนสายงาน'
].join('\n');

const tagged = ensureGovernanceTaxonomyPresence(raw, true);
assert.match(tagged, /^\[UNVERIFIED\]/, 'untagged governed output must fail closed as whole-response UNVERIFIED');
assert.doesNotMatch(tagged, /\[INFERENCE\]/, 'guard must not invent INFERENCE from sentence heuristics');
assert.doesNotMatch(tagged, /\[RECOMMENDATION\]|\[DECISION_GAP\]/, 'guard must not invent claim semantics from sentence heuristics');
assert.doesNotMatch(tagged, /\[FACT\]/, 'guard must not fabricate FACT when no verified evidence exists');

const matrix = buildClaimEvidenceMatrix([
  { id: 'c1', text: 'ข้อเท็จจริงที่มีหลักฐานยืนยัน', category: 'FACT', linkedEvidenceIds: ['e1'] },
  { id: 'c2', text: 'ข้อสรุปจากบริบท', category: 'INFERENCE', linkedEvidenceIds: [] },
  { id: 'c3', text: 'คำแนะนำ', category: 'RECOMMENDATION', linkedEvidenceIds: [] },
], [
  { id: 'e1', source: 'Primary source', content: 'verified content', evidenceStatus: 'VERIFIED', relation: 'SUPPORTS' },
]);

assert.equal(matrix.matrix[0].epistemic_tag, '[FACT]');
assert.equal(matrix.matrix[1].epistemic_tag, '[INFERENCE]');
assert.equal(matrix.matrix[2].epistemic_tag, '[RECOMMENDATION]');
assert.ok(!matrix.matrix.some((item) => item.category === 'USER_QUERY' && item.claim_text === 'ข้อสรุปจากบริบท'));

console.log('visible epistemic taxonomy regression checks passed');
