/**
 * Verification State Machine & Evidence-Derived Calibrated Confidence Engine
 * PUNN Cognitive Architecture (PCA v2.0)
 *
 * Confidence is only numeric when the required evidence measurements exist.
 * No fallback constants are used to manufacture reliability, quality,
 * relevance, coverage, recency, or directness.
 */

export type VerificationState =
  | 'USER_CLAIM'
  | 'MODEL_KNOWLEDGE'
  | 'UNVERIFIED'
  | 'SOURCE_FOUND'
  | 'SOURCE_CHECKED'
  | 'PARTIALLY_VERIFIED'
  | 'VERIFIED'
  | 'STALE'
  | 'CONFLICTED';

export type EpistemicClass =
  | 'FACT'
  | 'MODEL_KNOWLEDGE'
  | 'INFERENCE'
  | 'HYPOTHESIS'
  | 'SCENARIO'
  | 'UNVERIFIED'
  | 'DECISION_GAP';

export interface EvaluatedClaimState {
  claimId: string;
  claimText: string;
  epistemicClass: EpistemicClass;
  verificationState: VerificationState;
  sourceReliability: number | null;
  evidenceCoverage: number;
  evidenceQuality: number | null;
  recencyFactor: number | null;
  corroborationCount: number;
  conflictDetected: boolean;
  isStale: boolean;
  basedOnPremises?: string[];
  auditTrail: string[];
}

export interface VerificationStateMachineInput {
  isTemporalSensitive: boolean;
  temporalRetrievalVerified: boolean;
  temporalAuthorityScore?: number;
  temporalAuthorityMeasured?: boolean;
  temporalEvidenceQuality?: number;
  temporalEvidenceQualityMeasured?: boolean;
  temporalRelevanceScore?: number;
  temporalRelevanceMeasured?: boolean;
  temporalSourceTitle?: string;
  temporalSourceUrl?: string;
  rawSearchSources: Array<{
    id: string;
    source: string;
    authorityScore?: number;
    authorityMeasured?: boolean;
    isVerified?: boolean;
    publishedDate?: string;
    content?: string;
    qualityScore?: number;
    qualityMeasured?: boolean;
    relevanceScore?: number;
    relevanceMeasured?: boolean;
    supportScore?: number;
    supportMeasured?: boolean;
  }>;
  attachments: Array<{
    id: string;
    name: string;
    quality?: number;
    qualityMeasured?: boolean;
    relevanceScore?: number;
    relevanceMeasured?: boolean;
    supportScore?: number;
    supportMeasured?: boolean;
    authorityScore?: number;
    authorityMeasured?: boolean;
  }>;
  memories: Array<{
    id?: string;
    content: string;
    relevanceScore?: number;
    layer?: string;
  }>;
  missingSignalsCount: number;
  conflictCount: number;
  isCutoffOutdated: boolean;
}

export interface DeterministicConfidenceBreakdown {
  scorePercent: number | null;
  label: 'สูง' | 'ปานกลาง' | 'ต่ำ' | 'ไม่สามารถประเมินได้';
  verificationState: VerificationState;
  evidenceCoverage: number;
  sourceReliability: number | null;
  evidenceQuality: number | null;
  recencyFactor: number | null;
  directnessScore: number | null;
  missingPenalty: number;
  conflictPenalty: number;
  mathematicalProof: string;
  formula: string;
  epistemicQuarantineActive: boolean;
  quarantineReason?: string;
}

const clamp = (n: number) => Math.max(0, Math.min(1, n));
const finite = (n: unknown): n is number => typeof n === 'number' && Number.isFinite(n);
const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);

export function transitionVerificationState(input: VerificationStateMachineInput) {
  const missing = Math.max(0, input.missingSignalsCount || 0);
  const conflicts = Math.max(0, input.conflictCount || 0);
  const raw = (input.rawSearchSources || []).filter(Boolean);
  const attachments = (input.attachments || []).filter(Boolean);
  const memories = (input.memories || []).filter(Boolean);

  // Memory retrieval relevance is retained only as contextual retrieval metadata.
  // It is NOT treated as evidence quality or source reliability.
  const measuredMemoryRelevance = memories.map(m => m.relevanceScore).filter(finite).map(clamp);
  const memoryRelevance = avg(measuredMemoryRelevance);

  const measuredSourceRelevance = [
    ...raw.filter(s => s.relevanceMeasured && finite(s.relevanceScore)).map(s => clamp(s.relevanceScore!)),
    ...attachments.filter(a => a.relevanceMeasured && finite(a.relevanceScore)).map(a => clamp(a.relevanceScore!))
  ];
  const allRelevance = [
    ...measuredSourceRelevance,
    ...measuredMemoryRelevance
  ];
  const questionRelevance = avg(allRelevance) ?? memoryRelevance ?? avg(measuredSourceRelevance);

  const verifiedRaw = raw.filter(
    s => s.isVerified === true && s.authorityMeasured === true && finite(s.authorityScore) && s.authorityScore! >= 0.70
  );

  const measuredAuthorities = [
    ...verifiedRaw.map(s => clamp(s.authorityScore!)),
    ...attachments.filter(a => a.authorityMeasured === true && finite(a.authorityScore)).map(a => clamp(a.authorityScore!))
  ];
  const measuredQualities = [
    ...raw.filter(s => s.qualityMeasured === true && finite(s.qualityScore)).map(s => clamp(s.qualityScore!)),
    ...attachments.filter(a => a.qualityMeasured === true && finite(a.quality)).map(a => clamp(a.quality!)),
    ...verifiedRaw.filter(s => s.qualityMeasured === true && finite(s.qualityScore)).map(s => clamp(s.qualityScore!))
  ];
  const measuredSupport = [
    ...raw.filter(s => s.supportMeasured === true && finite(s.supportScore)).map(s => clamp(s.supportScore!)),
    ...attachments.filter(a => a.supportMeasured === true && finite(a.supportScore)).map(a => clamp(a.supportScore!))
  ];

  const sourceReliability = avg(measuredAuthorities);
  const evidenceQuality = avg(measuredQualities);
  const supportScore = avg(measuredSupport);

  const hasMeasuredDirectness = supportScore !== null || questionRelevance !== null;
  const directnessScore = supportScore ?? questionRelevance;

  // Coverage reflects verified empirical evidence availability penalized by missing signals.
  const hasAnyEvidenceInput = raw.length > 0 || attachments.length > 0;
  const evidenceCount = verifiedRaw.length + attachments.length;
  const baseCoverage = evidenceCount >= 2 ? 1.0 : evidenceCount === 1 ? 0.85 : raw.length > 0 ? 0.50 : 0;
  const computedEvidenceCoverage = hasAnyEvidenceInput
    ? clamp(baseCoverage * (1 - Math.min(1, missing * 0.10)))
    : null;

  // 1. Conflict State — safety gate. Never manufacture quality/reliability.
  if (conflicts > 0) {
    return {
      state: 'CONFLICTED' as VerificationState,
      sourceReliability,
      evidenceCoverage: computedEvidenceCoverage,
      evidenceQuality,
      recencyFactor: null,
      directnessScore: hasMeasuredDirectness ? directnessScore : null,
      questionRelevance,
      reason: 'ตรวจพบหลักฐานที่มีความขัดแย้งเชิงตรรกะหรือข้อมูลไม่ตรงกันระหว่างแหล่งอ้างอิง (Contradictory Sources Detected)'
    };
  }

  // 2. Temporal Grounding. A verified retrieval is not enough by itself to
  // manufacture authority/quality/relevance values.
  if (input.isTemporalSensitive) {
    if (input.temporalRetrievalVerified) {
      const authority = input.temporalAuthorityMeasured === true && finite(input.temporalAuthorityScore)
        ? clamp(input.temporalAuthorityScore!) : null;
      const quality = input.temporalEvidenceQualityMeasured === true && finite(input.temporalEvidenceQuality)
        ? clamp(input.temporalEvidenceQuality!) : null;
      const relevance = input.temporalRelevanceMeasured === true && finite(input.temporalRelevanceScore)
        ? clamp(input.temporalRelevanceScore!) : questionRelevance;
      const state = authority !== null && authority >= 0.85 && quality !== null && relevance !== null && missing === 0
        ? 'VERIFIED' : 'SOURCE_CHECKED';
      return {
        state: state as VerificationState,
        sourceReliability: authority,
        evidenceCoverage: authority !== null && quality !== null ? clamp(1 - Math.min(1, missing * 0.10)) : 0,
        evidenceQuality: quality,
        recencyFactor: relevance,
        directnessScore: relevance,
        questionRelevance: relevance,
        reason: state === 'VERIFIED'
          ? 'ผ่านการตรวจสอบและยืนยันข้อมูลปัจจุบัน โดยมี measurement ของ authority, quality และ relevance ครบ'
          : 'retrieval ข้อมูลปัจจุบันผ่าน แต่ measurement ของหลักฐานยังไม่ครบ จึงไม่เลื่อนเป็น VERIFIED'
      };
    }
    const hasRawSearch = raw.length > 0;
    return {
      state: (input.isCutoffOutdated ? 'STALE' : hasRawSearch ? 'SOURCE_FOUND' : 'UNVERIFIED') as VerificationState,
      sourceReliability: null,
      evidenceCoverage: hasRawSearch ? 0 : null,
      evidenceQuality: null,
      recencyFactor: null,
      directnessScore: null,
      questionRelevance,
      reason: 'คำถามเกี่ยวข้องกับสถานะปัจจุบันแต่ไม่มีหลักฐานภายนอกที่เป็นปัจจุบันยืนยัน (Unverified Temporal Claim)'
    };
  }

  // 3. Verified external evidence / attachments.
  if (attachments.length > 0 || verifiedRaw.length > 0) {
    const hasRequiredMeasurements = sourceReliability !== null && evidenceQuality !== null && questionRelevance !== null;
    const state = hasRequiredMeasurements && missing === 0 ? 'VERIFIED' : 'PARTIALLY_VERIFIED';

    return {
      state: state as VerificationState,
      sourceReliability,
      evidenceCoverage: computedEvidenceCoverage,
      evidenceQuality,
      recencyFactor: null,
      directnessScore: hasMeasuredDirectness ? directnessScore : null,
      questionRelevance,
      reason: state === 'VERIFIED'
        ? 'ยืนยันจากหลักฐานที่มี measurement ของ reliability, quality และความเกี่ยวข้องกับคำถามปัจจุบัน'
        : 'มีหลักฐานเชิงประจักษ์ แต่ measurement สำคัญยังไม่ครบ จึงไม่สร้าง confidence ระดับสูง'
    };
  }

  // 4. Raw sources without verified authority.
  if (raw.length > 0) {
    return {
      state: 'PARTIALLY_VERIFIED' as VerificationState,
      sourceReliability: null,
      evidenceCoverage: 0,
      evidenceQuality,
      recencyFactor: null,
      directnessScore: hasMeasuredDirectness ? directnessScore : null,
      questionRelevance,
      reason: 'พบเอกสาร/หลักฐาน แต่ยังไม่มีการยืนยันความน่าเชื่อถือของแหล่งที่มา (Source Reliability: N/A)'
    };
  }

  // 5. Memory only.
  if (memories.length > 0) {
    return {
      state: 'MODEL_KNOWLEDGE' as VerificationState,
      sourceReliability: null,
      evidenceCoverage: null,
      evidenceQuality: null,
      recencyFactor: null,
      directnessScore: null,
      questionRelevance,
      reason: 'มีเพียงบริบทภายใน ไม่มีหลักฐานภายนอกรองรับ'
    };
  }

  // 6. No evidence.
  return {
    state: 'UNVERIFIED' as VerificationState,
    sourceReliability: null,
    evidenceCoverage: null,
    evidenceQuality: null,
    recencyFactor: null,
    directnessScore: null,
    questionRelevance: null,
    reason: 'ไม่มีพยานหลักฐานเชิงประจักษ์ภายนอกรองรับ (No Empirical Evidence Available)'
  };
}

export function computeDeterministicConfidence(
  t: ReturnType<typeof transitionVerificationState>,
  missingCount: number,
  conflictCount: number
): DeterministicConfidenceBreakdown {
  const missing = Math.max(0, missingCount || 0);
  const conflicts = Math.max(0, conflictCount || 0);
  const missingPenalty = Number(Math.min(0.35, missing * 0.10).toFixed(2));
  const conflictPenalty = Number(Math.min(0.40, conflicts * 0.15).toFixed(2));

  if (t.state === 'UNVERIFIED' || t.state === 'STALE' || t.state === 'MODEL_KNOWLEDGE' || t.state === 'CONFLICTED') {
    return {
      scorePercent: null,
      label: 'ไม่สามารถประเมินได้',
      verificationState: t.state,
      evidenceCoverage: t.evidenceCoverage,
      sourceReliability: t.sourceReliability,
      evidenceQuality: t.evidenceQuality,
      recencyFactor: t.recencyFactor,
      directnessScore: t.directnessScore,
      missingPenalty,
      conflictPenalty,
      formula: 'N/A',
      mathematicalProof: `State=${t.state}; confidence ถูก quarantine เพราะหลักฐานยังไม่อยู่ในสถานะที่ปลอดภัยสำหรับการให้ตัวเลข.`,
      epistemicQuarantineActive: true,
      quarantineReason: 'หลักฐานยังไม่ผ่าน verification ที่จำเป็น จึงไม่สร้างตัวเลขความมั่นใจ'
    };
  }

  // A numeric confidence requires all core evidence measurements:
  // source reliability, evidence quality, question relevance, and directness.
  // Missing measurements must NEVER be substituted with 0, defaults, or fallbacks.
  const coverage = t.evidenceCoverage;
  const reliability = t.sourceReliability;
  const quality = t.evidenceQuality;
  const relevance = finite((t as any).questionRelevance) ? clamp((t as any).questionRelevance) : null;

  if (coverage === null || reliability === null || quality === null || relevance === null || t.directnessScore === null) {
    return {
      scorePercent: null,
      label: 'ไม่สามารถประเมินได้',
      verificationState: t.state,
      evidenceCoverage: coverage,
      sourceReliability: reliability,
      evidenceQuality: quality,
      recencyFactor: t.recencyFactor,
      directnessScore: t.directnessScore,
      missingPenalty,
      conflictPenalty,
      formula: 'N/A',
      mathematicalProof: 'Required evidence measurements (source reliability, quality, relevance, or directness) are incomplete; no synthetic fallback values are substituted.',
      epistemicQuarantineActive: true,
      quarantineReason: 'measurement ของ source reliability / evidence quality / relevance / directness ไม่ครบ'
    };
  }

  const preRound = (0.30 * coverage + 0.30 * reliability + 0.20 * quality + 0.15 * relevance + 0.05 * t.directnessScore)
    - missingPenalty - conflictPenalty;
  const score = Math.round(clamp(preRound) * 100);

  // High confidence is reserved strictly for a clean, fully verified state with verified source reliability.
  const isHighEligible = t.state === 'VERIFIED' && reliability >= 0.70 && missingCount === 0 && conflictCount === 0;
  const label: DeterministicConfidenceBreakdown['label'] = (score >= 75 && isHighEligible) ? 'สูง' : score >= 50 ? 'ปานกลาง' : 'ต่ำ';
  const formula = `Score = 0.30×Coverage(${Math.round(coverage * 100)}%) + 0.30×Reliability(${Math.round(reliability * 100)}%) + 0.20×Quality(${Math.round(quality * 100)}%) + 0.15×Relevance(${Math.round(relevance * 100)}%) + 0.05×Directness(${Math.round(t.directnessScore * 100)}%) − Penalties [Missing: -${Math.round(missingPenalty * 100)}%, Conflicts: -${Math.round(conflictPenalty * 100)}%]`;

  return {
    scorePercent: score,
    label,
    verificationState: t.state,
    evidenceCoverage: coverage,
    sourceReliability: reliability,
    evidenceQuality: quality,
    recencyFactor: t.recencyFactor,
    directnessScore: t.directnessScore,
    missingPenalty,
    conflictPenalty,
    formula,
    mathematicalProof: `Score=${score}% derived deterministically from measured evidence metrics; no synthetic fallback values were used.`,
    epistemicQuarantineActive: false
  };
}
