import { computeDeterministicConfidence, transitionVerificationState } from '../src/server/services/verificationStateMachine';

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(`FAIL: ${message}`);
  console.log(`PASS: ${message}`);
}

function run() {
  // No measured evidence => no numeric confidence.
  const noEvidence = transitionVerificationState({
    isTemporalSensitive: false,
    temporalRetrievalVerified: false,
    rawSearchSources: [],
    attachments: [],
    memories: [],
    missingSignalsCount: 0,
    conflictCount: 0,
    isCutoffOutdated: false
  });
  const noEvidenceConfidence = computeDeterministicConfidence(noEvidence, 0, 0);
  assert(noEvidenceConfidence.scorePercent === null, 'no evidence remains N/A');
  assert(noEvidenceConfidence.epistemicQuarantineActive, 'no evidence activates epistemic quarantine');

  // Authority alone is not enough: quality and relevance must also be measured.
  const authorityOnly = transitionVerificationState({
    isTemporalSensitive: false,
    temporalRetrievalVerified: false,
    rawSearchSources: [{
      id: 'ev-1', source: 'test', authorityScore: 0.95, authorityMeasured: true,
      isVerified: true, qualityScore: 0.95, qualityMeasured: true
    }],
    attachments: [],
    memories: [],
    missingSignalsCount: 0,
    conflictCount: 0,
    isCutoffOutdated: false
  });
  const authorityOnlyConfidence = computeDeterministicConfidence(authorityOnly, 0, 0);
  assert(authorityOnlyConfidence.scorePercent === null, 'reliable evidence without measured relevance remains N/A');

  // Measured relevance changes the result; identical evidence with different
  // question relevance must not collapse to the same confidence score.
  const highRelevance = transitionVerificationState({
    isTemporalSensitive: false,
    temporalRetrievalVerified: false,
    rawSearchSources: [{
      id: 'ev-high', source: 'test', authorityScore: 0.95, authorityMeasured: true,
      isVerified: true, qualityScore: 0.95, qualityMeasured: true,
      relevanceScore: 0.95, relevanceMeasured: true,
      supportScore: 0.90, supportMeasured: true
    }],
    attachments: [], memories: [], missingSignalsCount: 0, conflictCount: 0, isCutoffOutdated: false
  });
  const lowRelevance = transitionVerificationState({
    isTemporalSensitive: false,
    temporalRetrievalVerified: false,
    rawSearchSources: [{
      id: 'ev-low', source: 'test', authorityScore: 0.95, authorityMeasured: true,
      isVerified: true, qualityScore: 0.95, qualityMeasured: true,
      relevanceScore: 0.10, relevanceMeasured: true,
      supportScore: 0.10, supportMeasured: true
    }],
    attachments: [], memories: [], missingSignalsCount: 0, conflictCount: 0, isCutoffOutdated: false
  });
  const highConfidence = computeDeterministicConfidence(highRelevance, 0, 0);
  const lowConfidence = computeDeterministicConfidence(lowRelevance, 0, 0);
  assert(highConfidence.scorePercent !== null, 'fully measured relevant evidence produces a numeric score');
  assert(lowConfidence.scorePercent !== null, 'fully measured low-relevance evidence produces a numeric score');
  assert(highConfidence.scorePercent! > lowConfidence.scorePercent!, 'question relevance changes confidence');

  // Conflicts always quarantine numeric confidence.
  const conflicted = transitionVerificationState({
    ...highRelevance,
    conflictCount: 1
  });
  const conflictConfidence = computeDeterministicConfidence(conflicted, 0, 1);
  assert(conflictConfidence.scorePercent === null, 'conflicting evidence cannot receive numeric confidence');
  assert(conflictConfidence.verificationState === 'CONFLICTED', 'conflict state is preserved');

  console.log('\nVerification state machine audit passed.');
}

run();
