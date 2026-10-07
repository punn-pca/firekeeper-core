import { buildGovernedDynamicACH, requestedHypothesisCount } from '../src/utils/governedDynamicACH';
import { buildRealDecisionExecutionTrace } from '../src/utils/executionTraceEngine';

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(`ASSERTION FAILED: ${message}`);
}

const highAuthority = buildGovernedDynamicACH('governed ACH boundary', [
  {
    id: 'ev-high-authority',
    source: 'Authoritative source',
    content: 'High authority evidence without a probability model.',
    credibilityScore: 0.99,
    strength: 'High',
    type: 'Empirical'
  } as any
]);

const lowAuthority = buildGovernedDynamicACH('governed ACH boundary', [
  {
    id: 'ev-low-authority',
    source: 'Low authority source',
    content: 'Low authority evidence without a probability model.',
    credibilityScore: 0.20,
    strength: 'Low',
    type: 'Empirical'
  } as any
]);

assert(highAuthority.hypotheses[0].likelihood === 0.5, 'Authority must not become H1 likelihood.');
assert(lowAuthority.hypotheses[0].likelihood === 0.5, 'Low authority must also remain neutral without provenance.');
assert(highAuthority.hypotheses[0].posterior === 0.5, 'High authority alone must not move posterior.');
assert(lowAuthority.hypotheses[0].posterior === 0.5, 'Low authority alone must not move posterior.');
assert(highAuthority.hypotheses[0].quarantined, 'Uncalibrated probability must be quarantined.');

const calibrated = buildGovernedDynamicACH('governed ACH calibrated', [
  {
    id: 'ev-calibrated',
    sourceUrl: 'https://evidence.example/ev-calibrated',
    source: 'Calibrated dataset',
    content: 'Explicit calibrated likelihood.',
    locator: 'Held-out calibration benchmark, section 1',
    credibilityScore: 0.99,
    strength: 'High',
    type: 'Empirical',
    evidence_status: 'VERIFIED',
    likelihood: 0.80,
    counterLikelihood: 0.20,
    probabilityProvenance: {
      status: 'CALIBRATED',
      evidenceIds: ['ev-calibrated'],
      source: 'calibration dataset',
      calibrationDataset: 'test-dataset-v1',
      calibrationDate: '2026-09-05',
      rationale: 'Held-out calibration benchmark'
    }
  } as any
]);

assert(calibrated.hypotheses[0].likelihood === 0.80, 'Explicit calibrated likelihood must be preserved.');
assert(calibrated.hypotheses[0].posterior > 0.5, 'Calibrated likelihood must move posterior.');
assert(!calibrated.hypotheses[0].quarantined, 'Calibrated probability must not be quarantined.');

const requested = requestedHypothesisCount('ขออย่างน้อย 5 สมมติฐานสำหรับกรณีนี้');
const expanded = buildGovernedDynamicACH('ขออย่างน้อย 5 สมมติฐานสำหรับกรณีนี้', [], [], [], requested);
assert(requested === 5 && expanded.hypotheses.length === 5, 'Explicit hypothesis count must be represented in ACH.');
assert(expanded.hypotheses.slice(2).every((h) => h.quarantined && h.status === 'Unconfirmed' && h.evidenceIds.length === 0), 'Additional candidates must remain unverified.');
assert(requestedHypothesisCount('วิเคราะห์สมมติฐานของกรณีนี้') === 0, 'Normal analysis must not expand candidate count.');
const trace = buildRealDecisionExecutionTrace({
  userInput: 'ขออย่างน้อย 5 สมมติฐาน', assistantOutput: 'รอตรวจสอบ', requestedMinHypotheses: requested,
  pcaState: { hypotheses_v2: expanded.hypotheses, evidence_explorer: [] } as any
});
assert(trace.summary_metrics.requested_hypotheses === 5 && trace.summary_metrics.requirement_status === 'PASSED', 'Trace must record and validate the explicit minimum.');
assert(trace.decision_lineage.hypotheses.every((h) => h.linked_evidence_refs.length === 0), 'Trace must not invent evidence links for unverified candidates.');
const directTrace = buildRealDecisionExecutionTrace({ userInput: 'สวัสดี', assistantOutput: 'สวัสดีครับ', pcaState: { hypotheses: [], evidence_explorer: [] } as any });
assert(directTrace.summary_metrics.hypotheses_count === 0, 'A direct answer must not acquire synthetic hypotheses in its trace.');
assert(directTrace.decision_lineage.risks.every((risk) => risk.residual_risk === 'UNKNOWN' && risk.linked_evidence_refs.length === 0),
  'Risk trace must not invent residual risk reduction or evidence links.');

console.log('PASS: Governed Dynamic ACH — credibility is not likelihood; provenance gates posterior movement.');
