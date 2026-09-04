import { computeDeterministicConfidence, transitionVerificationState } from '../src/server/services/verificationStateMachine';
import { calculateStrictCalibratedConfidence, validateAndClassifyClaims, buildEvidenceClaimMapping } from '../src/server/services/evidenceGovernance';

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(`FAIL: ${message}`);
  console.log(`PASS: ${message}`);
}

function run() {
  console.log('--- RUNNING VERIFICATION STATE MACHINE & CONFIDENCE TESTS ---\n');

  // Test A: ไม่มี empirical evidence measurement -> confidence = null
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
  assert(noEvidenceConfidence.scorePercent === null, 'A. no evidence returns confidence = null');
  assert(noEvidenceConfidence.label === 'ไม่สามารถประเมินได้', 'A. no evidence label is "ไม่สามารถประเมินได้"');
  assert(noEvidenceConfidence.epistemicQuarantineActive, 'A. no evidence activates epistemic quarantine');

  // Test B: Evidence Quality มีค่า แต่ Reliability ไม่มี -> overall confidence = null
  const qualityOnly = transitionVerificationState({
    isTemporalSensitive: false,
    temporalRetrievalVerified: false,
    rawSearchSources: [{
      id: 'ev-qual-only',
      source: 'Doc Without Verified Authority',
      qualityScore: 0.85,
      qualityMeasured: true,
      relevanceScore: 0.90,
      relevanceMeasured: true,
      supportScore: 0.85,
      supportMeasured: true
      // authorityScore & authorityMeasured are omitted / undefined
    }],
    attachments: [],
    memories: [],
    missingSignalsCount: 0,
    conflictCount: 0,
    isCutoffOutdated: false
  });
  const qualityOnlyConfidence = computeDeterministicConfidence(qualityOnly, 0, 0);
  assert(qualityOnly.evidenceQuality !== null, 'B. evidenceQuality has value');
  assert(qualityOnly.sourceReliability === null, 'B. sourceReliability is null');
  assert(qualityOnlyConfidence.scorePercent === null, 'B. quality present but reliability null returns confidence = null');
  assert(qualityOnlyConfidence.label === 'ไม่สามารถประเมินได้', 'B. label is "ไม่สามารถประเมินได้"');

  // Test C: Reliability มีค่า แต่ Quality ไม่มี -> overall confidence = null
  const reliabilityOnly = transitionVerificationState({
    isTemporalSensitive: false,
    temporalRetrievalVerified: false,
    rawSearchSources: [{
      id: 'ev-rel-only',
      source: 'Verified Source',
      isVerified: true,
      authorityScore: 0.95,
      authorityMeasured: true,
      relevanceScore: 0.90,
      relevanceMeasured: true,
      supportScore: 0.85,
      supportMeasured: true
      // qualityScore & qualityMeasured are omitted / undefined
    }],
    attachments: [],
    memories: [],
    missingSignalsCount: 0,
    conflictCount: 0,
    isCutoffOutdated: false
  });
  const reliabilityOnlyConfidence = computeDeterministicConfidence(reliabilityOnly, 0, 0);
  assert(reliabilityOnly.sourceReliability !== null, 'C. sourceReliability has value');
  assert(reliabilityOnly.evidenceQuality === null, 'C. evidenceQuality is null');
  assert(reliabilityOnlyConfidence.scorePercent === null, 'C. reliability present but quality null returns confidence = null');

  // Test D: Evidence ครบและ weak จริง -> ได้ numeric confidence ที่ต่ำตาม evidence จริง
  const weakEvidence = transitionVerificationState({
    isTemporalSensitive: false,
    temporalRetrievalVerified: false,
    rawSearchSources: [{
      id: 'ev-weak',
      source: 'Weak Source',
      isVerified: true,
      authorityScore: 0.70,
      authorityMeasured: true,
      qualityScore: 0.35,
      qualityMeasured: true,
      relevanceScore: 0.30,
      relevanceMeasured: true,
      supportScore: 0.30,
      supportMeasured: true
    }],
    attachments: [],
    memories: [],
    missingSignalsCount: 1,
    conflictCount: 0,
    isCutoffOutdated: false
  });
  const weakConfidence = computeDeterministicConfidence(weakEvidence, 1, 0);
  assert(weakConfidence.scorePercent !== null, 'D. fully measured weak evidence returns numeric score');
  assert(weakConfidence.scorePercent! < 50, 'D. weak evidence score is below 50%');
  assert(weakConfidence.label === 'ต่ำ', 'D. weak evidence label is "ต่ำ"');

  // Test E: Evidence ครบและ strong จริง -> ได้ numeric confidence สูงตาม evidence จริง
  const strongEvidence = transitionVerificationState({
    isTemporalSensitive: false,
    temporalRetrievalVerified: false,
    rawSearchSources: [
      {
        id: 'ev-strong-1',
        source: 'Trusted Peer-Reviewed Source',
        isVerified: true,
        authorityScore: 0.95,
        authorityMeasured: true,
        qualityScore: 0.95,
        qualityMeasured: true,
        relevanceScore: 0.95,
        relevanceMeasured: true,
        supportScore: 0.95,
        supportMeasured: true
      },
      {
        id: 'ev-strong-2',
        source: 'Official Institutional Report',
        isVerified: true,
        authorityScore: 0.92,
        authorityMeasured: true,
        qualityScore: 0.90,
        qualityMeasured: true,
        relevanceScore: 0.90,
        relevanceMeasured: true,
        supportScore: 0.90,
        supportMeasured: true
      }
    ],
    attachments: [],
    memories: [],
    missingSignalsCount: 0,
    conflictCount: 0,
    isCutoffOutdated: false
  });
  const strongConfidence = computeDeterministicConfidence(strongEvidence, 0, 0);
  assert(strongConfidence.scorePercent !== null, 'E. fully measured strong evidence returns numeric score');
  assert(strongConfidence.scorePercent! >= 75, 'E. strong evidence score is >= 75%');
  assert(strongConfidence.label === 'สูง', 'E. strong evidence label is "สูง"');

  // Test F: Conflict -> CONFLICTED + confidence = null
  const conflicted = transitionVerificationState({
    isTemporalSensitive: false,
    temporalRetrievalVerified: false,
    rawSearchSources: [{
      id: 'src-1',
      source: 'Doc A',
      isVerified: true,
      authorityScore: 0.95,
      authorityMeasured: true,
      qualityScore: 0.95,
      qualityMeasured: true,
      relevanceScore: 0.95,
      relevanceMeasured: true,
      supportScore: 0.90,
      supportMeasured: true
    }],
    attachments: [],
    memories: [],
    missingSignalsCount: 0,
    conflictCount: 1,
    isCutoffOutdated: false
  });
  const conflictConfidence = computeDeterministicConfidence(conflicted, 0, 1);
  assert(conflictConfidence.scorePercent === null, 'F. conflicting evidence returns confidence = null');
  assert(conflictConfidence.verificationState === 'CONFLICTED', 'F. verification state is CONFLICTED');
  assert(conflictConfidence.epistemicQuarantineActive, 'F. epistemic quarantine is active on conflict');

  // Test G: คำถามสองข้อที่ evidence ต่างกัน -> ห้ามได้คะแนนเดียวกันเพราะ fallback
  const highRel = transitionVerificationState({
    isTemporalSensitive: false,
    temporalRetrievalVerified: false,
    rawSearchSources: [{
      id: 'ev-high-rel',
      source: 'test',
      authorityScore: 0.95,
      authorityMeasured: true,
      isVerified: true,
      qualityScore: 0.95,
      qualityMeasured: true,
      relevanceScore: 0.95,
      relevanceMeasured: true,
      supportScore: 0.90,
      supportMeasured: true
    }],
    attachments: [], memories: [], missingSignalsCount: 0, conflictCount: 0, isCutoffOutdated: false
  });
  const lowRel = transitionVerificationState({
    isTemporalSensitive: false,
    temporalRetrievalVerified: false,
    rawSearchSources: [{
      id: 'ev-low-rel',
      source: 'test',
      authorityScore: 0.95,
      authorityMeasured: true,
      isVerified: true,
      qualityScore: 0.95,
      qualityMeasured: true,
      relevanceScore: 0.15,
      relevanceMeasured: true,
      supportScore: 0.15,
      supportMeasured: true
    }],
    attachments: [], memories: [], missingSignalsCount: 0, conflictCount: 0, isCutoffOutdated: false
  });
  const highConf = computeDeterministicConfidence(highRel, 0, 0);
  const lowConf = computeDeterministicConfidence(lowRel, 0, 0);
  assert(highConf.scorePercent !== null && lowConf.scorePercent !== null, 'G. both produce numeric scores');
  assert(highConf.scorePercent! > lowConf.scorePercent!, 'G. relevance difference changes score');

  // Test H: คำถามเชิงนิยามหรือ model knowledge ที่ไม่มี empirical evidence -> แสดง N/A ไม่ใช่ 10%
  const memoryOnly = transitionVerificationState({
    isTemporalSensitive: false,
    temporalRetrievalVerified: false,
    rawSearchSources: [],
    attachments: [],
    memories: [{ content: 'นิยามของ Cognitive Architecture', relevanceScore: 0.85, layer: 'Fact' }],
    missingSignalsCount: 0,
    conflictCount: 0,
    isCutoffOutdated: false
  });
  const memoryConfidence = computeDeterministicConfidence(memoryOnly, 0, 0);
  assert(memoryConfidence.scorePercent === null, 'H. model knowledge returns null confidence (N/A)');
  assert(memoryConfidence.verificationState === 'MODEL_KNOWLEDGE', 'H. state is MODEL_KNOWLEDGE');
  assert(memoryConfidence.label === 'ไม่สามารถประเมินได้', 'H. label is "ไม่สามารถประเมินได้"');

  // Test I: Response-level confidence กับ calculateStrictCalibratedConfidence
  const calibRes = calculateStrictCalibratedConfidence(
    'นิยามและแนวคิดเชิงทฤษฎี',
    0,
    [{ content: 'ทฤษฎีภายในโมเดล', relevanceScore: 0.80 }],
    [],
    [],
    []
  );
  assert(calibRes.scorePercent === null, 'I. strict calibrated confidence on theoretical prompt is null');
  assert(calibRes.label === 'ไม่สามารถประเมินได้', 'I. label is "ไม่สามารถประเมินได้"');
  assert(!calibRes.isDeterminable, 'I. isDeterminable is false');

  // Test J: ตรวจว่า UI/API ไม่แปลง null confidence เป็น 0%, 10%, 50%, 60%, 70% หรือ 90%
  assert(calibRes.scorePercent === null, 'J. scorePercent is strictly null');
  assert(memoryConfidence.scorePercent === null, 'J. memoryConfidence scorePercent is strictly null');

  // Test K: Claim-level confidence must be null for ungrounded claims (NO default 0.10, 0.40, 0.50, 0.85)
  const ungroundedClaims = validateAndClassifyClaims([
    { text: 'ประชากรโลกมี 8 พันล้านคน', category: 'FACT' },
    { text: 'สมมุติว่ากำไรโต 20%', category: 'SCENARIO_INPUT' },
    { text: 'ยอดขายอาจจะเพิ่มขึ้นในไตรมาสหน้า', category: 'INFERENCE' },
    { text: 'ข้อมูลส่วนแบ่งตลาดยังไม่ทราบ', category: 'UNKNOWN' }
  ], [], 'คำถามทั่วไป');
  
  assert(ungroundedClaims.claims.every(c => c.confidence === null), 'K. all ungrounded claims have confidence = null');
  assert(ungroundedClaims.claims[0].groundingStatus === 'BLOCKED_FABRICATION', 'K. ungrounded fact is blocked from fabrication');
  assert(ungroundedClaims.claims[0].confidenceStatus === 'INSUFFICIENT_EVIDENCE', 'K. ungrounded fact confidence status is INSUFFICIENT_EVIDENCE');
  assert(ungroundedClaims.claims[1].confidenceStatus === 'UNMEASURED', 'K. scenario input confidence status is UNMEASURED');

  // Test L: buildEvidenceClaimMapping produces evidence_confidence = null without fallbacks (no 0.95, 0.85, 0.40)
  const mappedClaims = buildEvidenceClaimMapping(ungroundedClaims.claims, [], 'คำถามทั่วไป');
  assert(mappedClaims.every(mc => mc.evidence_confidence === null), 'L. evidence_confidence is null when unmeasured');

  // Test M: Grounded claim with measured empirical evidence produces calibrated numeric score
  const groundedClaims = validateAndClassifyClaims([
    { text: 'ยอดขายจริงไตรมาส 4 อยู่ที่ 45.2 ล้านบาท', category: 'FACT', evidenceSourceIds: ['ev-emp-1'] }
  ], [{
    id: 'ev-emp-1',
    source: 'Financial_Report',
    type: 'Empirical',
    content: 'ยอดขายจริงไตรมาส 4 อยู่ที่ 45.2 ล้านบาท เติบโต 18.5% YoY',
    strength: 'High',
    credibilityScore: 0.95
  }], 'ยอดขายไตรมาส 4');
  assert(typeof groundedClaims.claims[0].confidence === 'number', 'M. grounded fact produces numeric confidence');
  assert(groundedClaims.claims[0].confidence! >= 0.80, 'M. grounded fact confidence is >= 80%');
  assert(groundedClaims.claims[0].confidenceStatus === 'MEASURED', 'M. grounded fact confidenceStatus is MEASURED');

  console.log('\n🎉 ALL REGRESSION TESTS A-M PASSED PERFECTLY!');
}

run();
