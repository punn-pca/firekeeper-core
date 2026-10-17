import assert from 'node:assert/strict';
import fs from 'node:fs';
import { assessClaimEvidence, assessRecordedStageCompletion, buildDecisionGapInventory } from '../src/server/services/evidenceGovernanceCore';

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
assert.equal(linkedOnly.claimStatus, 'UNVERIFIED', 'Lexical matches without semantic verification must remain UNVERIFIED.');
assert.equal(semanticallyVerified.claimStatus, 'VERIFIED', 'Claim status may be VERIFIED only when governed verification succeeds.');

const contradicted = assessClaimEvidence({
  claim: 'ประเทศไทยมี GDP โต 5% ในปี 2026',
  evidence: [{
    id: 'ev-contradiction',
    sourceUrl: 'https://official.example/statistics',
    source: 'official statistics',
    content: 'ประเทศไทยมี GDP โต 2% ในปี 2026'
  }],
  semanticLinks: [{ evidenceId: 'ev-contradiction', relation: 'CONTRADICTS' }]
});
assert.equal(contradicted.claimStatus, 'CONTRADICTED', 'A traceable explicit contradiction must be distinguishable from missing verification.');

const untraceableContradiction = assessClaimEvidence({
  claim: 'ประเทศไทยมี GDP โต 5% ในปี 2026',
  evidence: [{ id: 'ev-no-origin', source: 'unknown', content: 'ประเทศไทยมี GDP โต 2% ในปี 2026' }],
  semanticLinks: [{ evidenceId: 'ev-no-origin', relation: 'CONTRADICTS' }]
});
assert.equal(untraceableContradiction.claimStatus, 'UNVERIFIED', 'A contradiction without traceable provenance must not be promoted to CONTRADICTED.');

const gaps = buildDecisionGapInventory({
  availableData: ['  ข้อมูลในเอกสาร  ', 'ข้อมูลในเอกสาร'],
  missingData: ['ข้อมูลการย้ายถิ่น'],
  verificationRequired: ['https://nso.go.th/statistics']
});
assert.deepEqual(gaps, {
  availableData: ['ข้อมูลในเอกสาร'],
  missingData: ['ข้อมูลการย้ายถิ่น'],
  verificationRequired: ['https://nso.go.th/statistics']
}, 'Decision Gap must separate known, missing, and verification-required data without inventing records.');

const completeTrace = assessRecordedStageCompletion(['A', 'B'], [
  { stage: 'A', start_time_ms: 1, end_time_ms: 2, output: { result: true } },
  { stage: 'B', start_time_ms: 3, end_time_ms: 4, output: { result: true } }
]);
assert.equal(completeTrace.complete, true, 'Stages count as complete only with recorded timing and output.');
const incompleteTrace = assessRecordedStageCompletion(['A', 'B'], [
  { stage: 'A', start_time_ms: 1, end_time_ms: 2, output: { result: true } },
  { stage: 'B', output: { result: true } }
]);
assert.equal(incompleteTrace.complete, false, 'A declared stage or output without timing must not count as executed.');
assert.deepEqual(incompleteTrace.missingStages, ['B']);

const pcaSource = fs.readFileSync(new URL('../src/server/services/pcaEngine.ts', import.meta.url), 'utf8');
const passportSource = fs.readFileSync(new URL('../src/server/services/aiPassportVerification.ts', import.meta.url), 'utf8');
const traceEngineSource = fs.readFileSync(new URL('../src/utils/executionTraceEngine.ts', import.meta.url), 'utf8');
const mobileChatSource = fs.readFileSync(new URL('../mobile/src/screens/ChatScreen.tsx', import.meta.url), 'utf8');
assert(pcaSource.includes('assessClaimEvidence('), 'Production retrieval must use the shared evidence governance primitive.');
assert(passportSource.includes('assessClaimEvidence('), 'AI Passport adapter must use the shared evidence governance primitive.');
assert(traceEngineSource.includes('Only ${recordedStageCount} of 12 canonical stages have qualifying runtime trace entries'), 'Trace must disclose when real stage records are missing.');
assert(traceEngineSource.includes("status: hasRecordedExecution ? 'COMPLETED' : 'NOT_RECORDED'"), 'Synthetic stage rows must not be marked completed.');
assert(traceEngineSource.includes("execution_status: allStagesRecorded && hypothesisRequirementStatus !== 'FAILED' ? 'COMPLETE' : 'PARTIAL'"), 'Overall completion must require recorded evidence for all 12 stages.');
assert(!mobileChatSource.includes('pca_stages_completed: 12'), 'Mobile must not fabricate a 12/12 stage count.');
assert(mobileChatSource.includes('pca_stages_completed: recordedStages.size'), 'Mobile stage count must be derived from qualifying trace entries.');

console.log('Shared evidence governance core checks passed.');
