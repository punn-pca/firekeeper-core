import assert from 'node:assert/strict';
import { buildRealDecisionExecutionTrace } from '../src/utils/executionTraceEngine';
import { buildTieredAuditLog } from '../src/server/services/auditLogger';

const evidence = { id: 'ev-1', source: 'Example', sourceUrl: 'https://example.org', content: 'Unverified retrieved claim', evidence_status: 'UNVERIFIED' };
const state = { evidence_explorer: [evidence], hypotheses_v2: [{ id: 'h1', claim: 'Candidate', prior: 0.5, likelihood: 0.5, posterior: 0.5, status: 'Unconfirmed' }] };
const trace = buildRealDecisionExecutionTrace({ userInput: 'ตรวจข้อมูล', assistantOutput: 'ยังไม่ยืนยัน', pcaState: state as any });
const log = buildTieredAuditLog(state, trace, 'ตรวจข้อมูล', 'ยังไม่ยืนยัน', 'test-model', 'AUDIT');
assert.equal(log.evidence_sources?.[0]?.reliability_grade, 'UNVERIFIED');
assert.equal(log.evidence_sources?.[0]?.epistemic_tag, '[UNVERIFIED]');
assert.equal(log.epistemic?.verification_blocked, true);
assert.equal(log.hypotheses_matrix?.[0]?.posterior, 0.5);
assert.equal(log.confidence.brier_bound, undefined, 'Brier score requires an observed outcome and must not be fabricated');
console.log('Audit evidence and probability status tests passed.');
