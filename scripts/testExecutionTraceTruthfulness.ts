import assert from 'node:assert/strict';
import { buildClaimEvidenceMatrix } from '../src/utils/claimEvidenceMatrix';
import { buildRealDecisionExecutionTrace, extractPublishedTaggedClaims } from '../src/utils/executionTraceEngine';
import { requestedHypothesisCount } from '../src/utils/governedDynamicACH';

const query = 'ข้อมูลสองแหล่งที่ขัดแย้งกัน แหล่ง A และ B รายงานตัวเลขไม่ตรงกัน ควรเชื่อแหล่งใด';
assert.equal(requestedHypothesisCount(query), 2, 'Competing evidence must activate two parallel hypotheses.');
assert.equal(requestedHypothesisCount('สวัสดีครับ'), 0, 'Casual chat must not activate ACH.');

const published = extractPublishedTaggedClaims(
  '[UNVERIFIED] ผลตอบแทนยังไม่มีหลักฐานยืนยัน\n[INFERENCE] จึงควรชะลอการตัดสินใจ\n[DECISION_GAP] ยังไม่มีรายงานการเงิน'
);
assert.deepEqual(published.map((claim) => claim.category), ['UNCLASSIFIED', 'INFERENCE', 'DECISION_GAP']);
assert.equal(published[0].verificationStatus, 'UNVERIFIED');

const matrix = buildClaimEvidenceMatrix(published, [], query);
assert.deepEqual(matrix.matrix.map((claim) => claim.category), ['UNCLASSIFIED', 'INFERENCE', 'DECISION_GAP']);
assert.equal(matrix.matrix[0].verification_status, 'UNVERIFIED');
assert.deepEqual(matrix.matrix.map((claim) => claim.epistemic_tag), ['[UNVERIFIED]', '[INFERENCE]', '[DECISION_GAP]']);
assert(matrix.matrix.every((claim) => claim.category !== 'USER_QUERY'), 'AI-generated claims must not be relabelled as user queries.');

const incomplete = buildRealDecisionExecutionTrace({
  userInput: query,
  assistantOutput: '[UNVERIFIED] ยังตัดสินไม่ได้',
  totalDurationMs: 1000,
  startTimeIso: '2026-11-20T13:45:36.000Z',
  endTimeIso: '2026-11-20T13:45:37.000Z',
});
assert.equal(incomplete.summary_metrics.requirement_status, 'FAILED', 'Missing required ACH must fail the requirement gate.');
assert.equal(incomplete.integrity_report.execution_status, 'PARTIAL');
assert.equal(incomplete.integrity_report.overall_integrity, 'INTEGRITY_WARNING', 'Valid hashes must not present an incomplete execution as fully verified.');
assert.equal(incomplete.integrity_report.process_integrity, 'PARTIAL');
assert(incomplete.steps.every((step) => step.status === 'NOT_RECORDED'));
assert(incomplete.steps.every((step) => step.status_badge === 'NOT_RECORDED'), 'Presentation badges must not imply that synthetic rows executed.');

const stages = [
  'INTENT_DEFINITION', 'CONTEXT_UNDERSTANDING', 'PURPOSE_SCOPE', 'DATA_STRUCTURING',
  'RELATIONSHIP_MODELING', 'EVIDENCE_EVALUATION', 'HYPOTHESIS_FORMATION',
  'RISK_CRITIQUE_ANALYSIS', 'STRATEGIC_DECISION', 'RESPONSE_FORMATTING',
  'META_REFLECTION', 'HUMAN_APPROVAL_GATE'
];
const runtimeTrace = stages.map((stage, index) => ({
  stage,
  stage_number: index + 1,
  start_time_ms: Date.parse('2026-11-20T13:45:36.000Z') + index * 100,
  end_time_ms: Date.parse('2026-11-20T13:45:36.000Z') + index * 100 + 50,
  output: { recorded: true }
}));
const complete = buildRealDecisionExecutionTrace({
  userInput: 'ตรวจสอบ trace',
  assistantOutput: 'ผลตรวจสอบ',
  pcaState: { trace: runtimeTrace, hypotheses_v2: [{ claim: 'H1', evidenceIds: [] }] } as any,
  totalDurationMs: 1200,
  startTimeIso: '2026-11-20T13:45:36.000Z',
  endTimeIso: '2026-11-20T13:45:37.000Z',
});
assert(complete.steps.every((step) => step.status === 'COMPLETED'));
assert(complete.steps.every((step) => step.status_badge !== 'NOT_RECORDED'));
assert.equal(complete.integrity_report.execution_status, 'COMPLETE');
assert.equal(complete.integrity_report.overall_integrity, 'VERIFIED');
assert.equal(complete.completed_at, new Date(runtimeTrace[11].end_time_ms).toISOString(), 'Execution envelope must end no earlier than the final recorded stage.');

console.log('Execution trace truthfulness and epistemic taxonomy checks passed');
