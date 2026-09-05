import { governClaimVerification } from '../src/server/services/claimVerificationGovernance';

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(`ASSERTION FAILED: ${message}`);
}

const supported = governClaimVerification({
  claim: 'ประเทศไทยมี GDP โต 5% ในปี 2026',
  evidence: [{ id: 'ev-1', source: 'official', content: 'ประเทศไทยมี GDP โต 5% ในปี 2026' }]
});
assert(supported.status === 'PARTIALLY_VERIFIED', 'retrieval support alone must not become VERIFIED');

const linkedSupport = governClaimVerification({
  claim: 'ประเทศไทยมี GDP โต 5% ในปี 2026',
  evidence: [{ id: 'ev-2', source: 'official', content: 'ประเทศไทยมี GDP โต 5% ในปี 2026' }],
  links: [{ evidenceId: 'ev-2', relation: 'SUPPORTS' }]
});
assert(linkedSupport.status === 'PARTIALLY_VERIFIED', 'explicit SUPPORTS without verification method must remain partial');

const verified = governClaimVerification({
  claim: 'ประเทศไทยมี GDP โต 5% ในปี 2026',
  evidence: [{ id: 'ev-3', source: 'official', content: 'ประเทศไทยมี GDP โต 5% ในปี 2026' }],
  links: [{ evidenceId: 'ev-3', relation: 'SUPPORTS' }],
  verificationMethod: 'EXPLICIT_VERIFIER'
});
assert(verified.status === 'VERIFIED', 'VERIFIED requires explicit verification method and SUPPORTS relation');

const methodWithoutLink = governClaimVerification({
  claim: 'ประเทศไทยมี GDP โต 5% ในปี 2026',
  evidence: [{ id: 'ev-4', source: 'official', content: 'ประเทศไทยมี GDP โต 5% ในปี 2026' }],
  verificationMethod: 'EXPLICIT_VERIFIER'
});
assert(methodWithoutLink.status === 'PARTIALLY_VERIFIED', 'verification method without explicit linkage must not verify');

const conflicting = governClaimVerification({
  claim: 'ประเทศไทยมี GDP โต 5% ในปี 2026',
  evidence: [
    { id: 'ev-5', source: 'official', content: 'ประเทศไทยมี GDP โต 5% ในปี 2026' },
    { id: 'ev-6', source: 'official', content: 'ประเทศไทยมี GDP ลดลง 2% ในปี 2026' }
  ],
  links: [
    { evidenceId: 'ev-5', relation: 'SUPPORTS' },
    { evidenceId: 'ev-6', relation: 'CONTRADICTS' }
  ],
  verificationMethod: 'EXPLICIT_VERIFIER'
});
assert(conflicting.status === 'CONFLICTING', 'CONTRADICTS must block VERIFIED');

const authorityOnly = governClaimVerification({
  claim: 'ประเทศไทยมี GDP โต 5% ในปี 2026',
  evidence: [{ id: 'ev-7', source: 'high-authority-official', content: 'ประกาศข้อมูลทั่วไป' }]
});
assert(authorityOnly.status === 'UNVERIFIED', 'source authority alone must not verify a claim');

console.log('PASS: Claim verification governance boundary.');
