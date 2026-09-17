import { verifyAIPassportResponse } from '../src/server/services/aiPassportVerification';

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(`ASSERTION FAILED: ${message}`);
}

const noEvidence = verifyAIPassportResponse({
  question: 'ประเทศไทยมี GDP โต 5% ในปี 2026 หรือไม่',
  response: 'อาจเป็นไปได้ แต่ยังไม่สามารถยืนยันได้'
});
assert(noEvidence.verificationStatus === 'UNVERIFIED', 'AI response alone must remain unverified');
assert(noEvidence.evidenceIds.length === 0, 'AI response must not become evidence');

const supported = verifyAIPassportResponse({
  question: 'ประเทศไทยมี GDP โต 5% ในปี 2026 หรือไม่',
  response: 'แหล่งอ้างอิงระบุว่ามีการเติบโต 5% ในปี 2026',
  evidence: [{
    id: 'ev-1',
    source: 'official-a',
    content: 'ประเทศไทยมี GDP โต 5% ในปี 2026'
  }]
});
assert(supported.verificationStatus === 'PARTIALLY_VERIFIED', 'linked evidence without verification method must remain partial');
assert(supported.claimEvidenceLinks.length > 0, 'caller-supplied evidence must pass through claim-evidence linking');

const verified = verifyAIPassportResponse({
  question: 'ประเทศไทยมี GDP โต 5% ในปี 2026 หรือไม่',
  response: 'แหล่งอ้างอิงระบุว่ามีการเติบโต 5% ในปี 2026',
  evidence: [{
    id: 'ev-2',
    source: 'official-a',
    content: 'ประเทศไทยมี GDP โต 5% ในปี 2026'
  }],
  verificationMethod: 'EXPLICIT_VERIFIER'
});
assert(verified.verificationStatus === 'VERIFIED', 'explicit verifier plus SUPPORTS may verify');

const conflict = verifyAIPassportResponse({
  question: 'ประเทศไทยมี GDP โต 5% ในปี 2026 หรือไม่',
  response: 'มีข้อมูลที่ขัดแย้งกัน จึงควรตรวจสอบต่อ',
  evidence: [
    { id: 'ev-3', source: 'official-a', content: 'ประเทศไทยมี GDP โต 5% ในปี 2026' },
    { id: 'ev-4', source: 'official-b', content: 'ประเทศไทยมี GDP ลดลง 2% ในปี 2026' }
  ],
  verificationMethod: 'EXPLICIT_VERIFIER'
});
assert(conflict.verificationStatus === 'CONFLICTING', 'contradictory linked evidence must block verification');

console.log('PASS: AI Passport governed evidence integration boundary.');
