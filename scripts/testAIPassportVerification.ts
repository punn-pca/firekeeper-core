import assert from 'node:assert/strict';
import { verifyAIPassportResponse } from '../src/server/services/aiPassportVerification';

const missingEvidence = verifyAIPassportResponse({
  question: 'ประเทศไทยมีนโยบายนี้หรือไม่?',
  response: 'ใช่ แน่นอน 100% และควรทำทันที',
  provider: 'other',
});
assert.equal(missingEvidence.mode, 'AI_PASSPORT_VERIFICATION');
assert.ok(missingEvidence.score < 100);
assert.ok(missingEvidence.decision === 'NEEDS_EVIDENCE' || missingEvidence.decision === 'HIGH_RISK');
assert.equal(missingEvidence.checks.evidence_present, false);

const grounded = verifyAIPassportResponse({
  question: 'ข้อเท็จจริงนี้คืออะไร?',
  response: 'ข้อมูลนี้อ้างอิงจากแหล่งทางการ: https://example.com. หากหลักฐานเพิ่มเติมขัดแย้งกัน ควรตรวจสอบก่อนตัดสินใจ',
  provider: 'gemini',
});
assert.equal(grounded.checks.evidence_present, false, 'A URL mentioned in model output is not independently supplied evidence');
assert.equal(grounded.checks.human_agency_preserved, true);
assert.equal(grounded.decision, 'NEEDS_EVIDENCE');
assert.equal(grounded.verificationStatus, 'UNVERIFIED');

console.log('AI Passport verification checks passed.');
