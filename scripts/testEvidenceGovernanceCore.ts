import assert from 'node:assert/strict';
import fs from 'node:fs';
import { assessClaimEvidence } from '../src/server/services/evidenceGovernanceCore';

const evidence = [
  {
    id: 'ev-support',
    sourceUrl: 'https://source-a.example/report',
    source: 'source-a',
    content: 'ประเทศไทยมี GDP โต 5% ในปี 2026'
  }
];

const linkedOnly = assessClaimEvidence({
  claim: 'ประเทศไทยมี GDP โต 5% ในปี 2026',
  evidence
});

assert(!linkedOnly.links.some((link) => link.relation === 'SUPPORTS'), 'Lexical matching alone must not create SUPPORTS.');
assert.notEqual(linkedOnly.verificationStatus, 'VERIFIED', 'SUPPORTS alone must never become VERIFIED.');


const semanticallyVerified = assessClaimEvidence({
  claim: 'ประเทศไทยมี GDP โต 5% ในปี 2026',
  evidence,
  semanticLinks: [{ evidenceId: 'ev-support', relation: 'SUPPORTS' }],
  verificationMethod: 'EXPLICIT_VERIFIER'
});
assert.equal(semanticallyVerified.verificationStatus, 'VERIFIED', 'Explicit semantic SUPPORTS with verifier method may verify traceable evidence.');
assert.deepEqual(semanticallyVerified.evidenceIds, ['ev-support']);

const crossChecked = assessClaimEvidence({
  claim: 'ประเทศไทยมี GDP โต 5% ในปี 2026',
  evidence: [
    ...evidence,
    { id: 'ev-support-2', sourceUrl: 'https://source-b.example/report', source: 'source-b', content: 'ประเทศไทยมี GDP โต 5% ในปี 2026' }
  ],
  verificationMethod: 'INDEPENDENT_CORROBORATION'
});
assert.equal(crossChecked.verificationStatus, 'UNVERIFIED', 'Naming corroboration cannot verify evidence without semantic SUPPORTS relations.');
assert.deepEqual(crossChecked.evidenceIds, []);

const pcaSource = fs.readFileSync(new URL('../src/server/services/pcaEngine.ts', import.meta.url), 'utf8');
const passportSource = fs.readFileSync(new URL('../src/server/services/aiPassportVerification.ts', import.meta.url), 'utf8');
assert(pcaSource.includes('assessClaimEvidence('), 'Production retrieval must use the shared evidence governance primitive.');
assert(passportSource.includes('assessClaimEvidence('), 'AI Passport adapter must use the shared evidence governance primitive.');

console.log('Shared evidence governance core checks passed.');
