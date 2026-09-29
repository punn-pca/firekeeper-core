import assert from 'node:assert/strict';
import { buildRealDecisionExecutionTrace } from '../src/utils/executionTraceEngine';
import { buildTieredAuditLog, verifyStoredAuditLog } from '../src/server/services/auditLogger';
import { sanitizeAuditEntryForStorage } from '../src/utils/auditSanitizer';

const trace = buildRealDecisionExecutionTrace({ userInput: 'ตรวจสอบ', assistantOutput: 'ยังไม่มีข้อมูลยืนยัน', pcaState: {} });
const log = buildTieredAuditLog({ end_time: trace.completed_at, evidence_explorer: [], conflicts: [], missing_info: [] }, trace,
  'ตรวจสอบ', 'ยังไม่มีข้อมูลยืนยัน', 'test-model');
assert.equal(verifyStoredAuditLog(log).status, 'SUMMARY_LINKS_VALID');
assert.equal(log.confidence.calibrated_level, 'ไม่สามารถประเมินได้');
assert.equal(log.confidence.posterior_score, null, 'No ACH hypothesis must not create a 0.5 posterior');
const auditLog = buildTieredAuditLog({ end_time: trace.completed_at, hypotheses_v2: [{ claim: 'Unmeasured' }] }, trace,
  'ตรวจสอบ', 'ยังไม่มีข้อมูลยืนยัน', 'test-model', 'AUDIT');
assert.deepEqual([auditLog.hypotheses_matrix?.[0].prior, auditLog.hypotheses_matrix?.[0].likelihood,
  auditLog.hypotheses_matrix?.[0].posterior], [null, null, null]);
const changedHash = structuredClone(log);
changedHash.integrity.stage_hash_chain[2].event_hash = 'f'.repeat(64);
assert.equal(verifyStoredAuditLog(changedHash).status, 'MISMATCH');
const changedPointer = structuredClone(log);
changedPointer.integrity.stage_hash_chain[2].prev_hash = 'f'.repeat(64);
assert.equal(verifyStoredAuditLog(changedPointer).status, 'MISMATCH');
const changedRoot = structuredClone(log);
changedRoot.integrity.root_hash = 'f'.repeat(64);
assert.equal(verifyStoredAuditLog(changedRoot).status, 'MISMATCH');
const redacted = sanitizeAuditEntryForStorage({ preview: 'password=topsecret Bearer abcdefghijklmnop sk-proj-abcdefghijklmnop',
  output_hash: 'a'.repeat(64), headers: { authorization: 'Bearer abcdefghijklmnop' } });
assert.doesNotMatch(redacted.preview, /topsecret|abcdefghijklmnop/);
assert.equal(redacted.output_hash, 'a'.repeat(64));
assert.equal(redacted.headers.authorization, '[REDACTED]');
console.log('Stored audit summary integrity checks passed.');
