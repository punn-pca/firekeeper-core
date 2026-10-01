import assert from 'node:assert/strict';
import fs from 'node:fs';
import { assessClaimEvidence } from '../src/server/services/evidenceGovernanceCore';

const evidence = [
  {
    id: 'ev-support',
    source: 'source-a',
    content: 'ประเทศไทยมี GDP โต 5% ในปี 2026'
  }
];

const linkedOnly = assessClaimEvidence({
  claim: 'ประเทศไทยมี GDP โต 5% ในปี 2026',
  evidence
});

assert(linkedOnly.links.some((link) => link.relation === 'SUPPORTS'), 'Matching evidence should create a diagnostic SUPPORTS relation.');
assert.notEqual(linkedOnly.verificationStatus, 'VERIFIED', 'SUPPORTS alone must never become VERIFIED.');

const crossChecked = assessClaimEvidence({
  claim: 'ประเทศไทยมี GDP โต 5% ในปี 2026',
  evidence: [
    ...evidence,
    { id: 'ev-support-2', source: 'source-b', content: 'ประเทศไทยมี GDP โต 5% ในปี 2026' }
  ],
  verificationMethod: 'INDEPENDENT_CORROBORATION'
});
assert.equal(crossChecked.verificationStatus, 'VERIFIED', 'Explicit cross-source verification may verify when governance requirements are satisfied.');
assert.deepEqual(new Set(crossChecked.evidenceIds), new Set(['ev-support', 'ev-support-2']));

const pcaSource = fs.readFileSync(new URL('../src/server/services/pcaEngine.ts', import.meta.url), 'utf8');
const passportSource = fs.readFileSync(new URL('../src/server/services/aiPassportVerification.ts', import.meta.url), 'utf8');
assert(pcaSource.includes('assessClaimEvidence('), 'Production retrieval must use the shared evidence governance primitive.');
assert(passportSource.includes('assessClaimEvidence('), 'AI Passport adapter must use the shared evidence governance primitive.');

console.log('Shared evidence governance core checks passed.');
