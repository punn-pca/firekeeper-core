import { governClaimVerification } from '../src/server/services/claimVerificationGovernance';

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(`ASSERTION FAILED: ${message}`);
}

const supported = governClaimVerification({
  claim: 'ประเทศไทยมี GDP โต 5% ในปี 2026',
  evidence: [{ id: 'ev-1', source: 'official', content: 'ประเทศไทยมี GDP โต 5% ในปี 2026' }]
});
assert(supported.status === 'PARTIALLY_VERIFIED', 'retrieval support alone must not become VERIFIED');

const unrelated = governClaimVerification({
  claim: 'ประเทศไทยมี GDP โต 5% ในปี 2026',
  evidence: [{ id: 'ev-2', source: 'official', content: 'สภาพอากาศวันนี้มีฝนตกในกรุงเทพฯ' }]
});
assert(unrelated.status === 'UNVERIFIED', 'unrelated evidence must remain UNVERIFIED');

const verified = governClaimVerification({
  claim: 'ประเทศไทยมี GDP โต 5% ในปี 2026',
  evidence: [{ id: 'ev-3', source: 'official', content: 'ประเทศไทยมี GDP โต 5% ในปี 2026' }],
  explicitVerification: true
});
assert(verified.status === 'VERIFIED', 'VERIFIED requires explicit verification');

const conflicting = governClaimVerification({
  claim: 'ประเทศไทยมี GDP โต 5% ในปี 2026',
  evidence: [
    { id: 'ev-4', source: 'official', content: 'ประเทศไทยมี GDP โต 5% ในปี 2026' },
    { id: 'ev-5', source: 'official', content: 'ประเทศไทยมี GDP ลดลง 2% ในปี 2026' }
  ],
  conflictingEvidenceIds: ['ev-5'],
  explicitVerification: true
});
assert(conflicting.status === 'CONFLICTING', 'conflicting evidence must block VERIFIED');

const authorityOnly = governClaimVerification({
  claim: 'ประเทศไทยมี GDP โต 5% ในปี 2026',
  evidence: [{ id: 'ev-6', source: 'high-authority-official', content: 'ประกาศข้อมูลทั่วไป' }]
});
assert(authorityOnly.status === 'UNVERIFIED', 'source authority alone must not verify a claim');

console.log('PASS: Claim verification governance boundary.');
