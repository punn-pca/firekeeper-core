/**
 * Verification State Machine & Evidence-Derived Calibrated Confidence Engine
 * PUNN Cognitive Architecture (PCA v2.0)
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
  recencyFactor: number;
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
  }>;
  attachments: Array<{
    id: string;
    name: string;
    quality?: number;
    qualityMeasured?: boolean;
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
  recencyFactor: number;
  directnessScore: number;
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

  // 1. Conflict State
  if (conflicts > 0) {
    const verifiedRaw = raw.filter(s => s.isVerified && finite(s.authorityScore));
    const avgAuth = verifiedRaw.length
      ? avg(verifiedRaw.map(s => clamp(s.authorityScore!)))
      : (attachments.length ? 0.85 : null);
    const avgQual = verifiedRaw.length
      ? avg(verifiedRaw.map(s => clamp(s.qualityScore ?? s.authorityScore!)))
      : (attachments.length ? 0.85 : null);

    return {
      state: 'CONFLICTED' as VerificationState,
      sourceReliability: avgAuth,
      evidenceCoverage: Math.max(0.40, Number((0.95 - missing * 0.10).toFixed(2))),
      evidenceQuality: avgQual,
      recencyFactor: 0.50,
      directnessScore: 0.50,
      reason: 'ตรวจพบหลักฐานที่มีความขัดแย้งเชิงตรรกะหรือข้อมูลไม่ตรงกันระหว่างแหล่งอ้างอิง (Contradictory Sources Detected)'
    };
  }

  // 2. Temporal Grounding
  if (input.isTemporalSensitive) {
    if (input.temporalRetrievalVerified) {
      const authority = finite(input.temporalAuthorityScore) ? clamp(input.temporalAuthorityScore!) : 0.95;
      const quality = finite(input.temporalEvidenceQuality) ? clamp(input.temporalEvidenceQuality!) : 0.95;
      const coverage = Math.max(0.70, Number((0.95 - missing * 0.05).toFixed(2)));
      const state = authority >= 0.85 && missing === 0 ? 'VERIFIED' : 'SOURCE_CHECKED';
      return {
        state: state as VerificationState,
        sourceReliability: authority,
        evidenceCoverage: coverage,
        evidenceQuality: quality,
        recencyFactor: 1.0,
        directnessScore: 0.92,
        reason:
          state === 'VERIFIED'
            ? 'ผ่านการตรวจสอบและยืนยันข้อมูลจากแหล่งข้อมูลปฐมภูมิ/สถิติที่เป็นปัจจุบัน (Authoritative Live Verification)'
            : 'retrieval ข้อมูลปัจจุบันผ่าน แต่ยังมีข้อจำกัดด้านความสมบูรณ์'
      };
    }
    const hasRawSearch = raw.length > 0;
    return {
      state: (input.isCutoffOutdated ? 'STALE' : hasRawSearch ? 'SOURCE_FOUND' : 'UNVERIFIED') as VerificationState,
      sourceReliability: null,
      evidenceCoverage: 0.0,
      evidenceQuality: hasRawSearch ? 0.20 : null,
      recencyFactor: 0.0,
      directnessScore: 0.0,
      reason: 'คำถามเกี่ยวข้องกับสถานะปัจจุบันแต่ไม่มีหลักฐานภายนอกที่เป็นปัจจุบันยืนยัน (Unverified Temporal Claim)'
    };
  }

  // 3. Attachments + Raw Search combined or Attachments alone
  const hasAttachments = attachments.length > 0;
  const verifiedRaw = raw.filter(s => s.isVerified && finite(s.authorityScore) && (s.authorityScore || 0) >= 0.70);

  if (hasAttachments || verifiedRaw.length > 0) {
    let sourceReliability: number | null = null;
    if (verifiedRaw.length > 0) {
      sourceReliability = avg(verifiedRaw.map(s => clamp(s.authorityScore!)));
    } else if (hasAttachments) {
      const attachQualities = attachments.map(a => a.quality).filter(finite).map(clamp);
      sourceReliability = attachQualities.length ? avg(attachQualities) : 0.92;
    }

    const allQualities: number[] = [];
    if (hasAttachments) {
      allQualities.push(...attachments.map(a => a.quality).filter(finite).map(clamp));
    }
    if (verifiedRaw.length > 0) {
      allQualities.push(...verifiedRaw.map(s => s.qualityScore ?? s.authorityScore!).filter(finite).map(clamp));
    }
    const evidenceQuality = allQualities.length ? avg(allQualities) : 0.90;

    const baseCov = hasAttachments && verifiedRaw.length > 0 ? 0.98 : hasAttachments ? 0.95 : 0.85;
    const coverage = Math.max(0.40, Number((baseCov - missing * 0.10).toFixed(2)));

    const isVerified = (sourceReliability ?? 0) >= 0.85 && coverage >= 0.80 && missing === 0 && evidenceQuality !== null;
    const state = isVerified ? 'VERIFIED' : 'PARTIALLY_VERIFIED';

    return {
      state: state as VerificationState,
      sourceReliability,
      evidenceCoverage: coverage,
      evidenceQuality,
      recencyFactor: 1.0,
      directnessScore: hasAttachments ? 0.95 : 0.85,
      reason: isVerified
        ? 'ยืนยันจากเอกสารหลักฐานเชิงประจักษ์และแหล่งอ้างอิงที่ตรวจสอบความน่าเชื่อถือแล้ว'
        : 'มีหลักฐานเชิงประจักษ์บางส่วน แต่ยังมีข้อมูลขาดหายหรือความครอบคลุมไม่สมบูรณ์'
    };
  }

  // 4. Raw sources without verified authority score (e.g. Test Case 2: evidenceNoCred)
  if (raw.length > 0) {
    const qualities = raw.map(s => s.qualityScore).filter(finite).map(clamp);
    const quality = qualities.length ? avg(qualities) : 0.65;
    const coverage = Math.max(0.20, Number((0.50 - missing * 0.10).toFixed(2)));
    return {
      state: 'PARTIALLY_VERIFIED' as VerificationState,
      sourceReliability: null, // deliberately null: no authority measured
      evidenceCoverage: coverage,
      evidenceQuality: quality,
      recencyFactor: 0.50,
      directnessScore: 0.50,
      reason: 'พบเอกสาร/หลักฐาน แต่ยังไม่มีการยืนยันความน่าเชื่อถือของแหล่งที่มา (Source Reliability: N/A)'
    };
  }

  // 5. Memory only
  if (memories.some(m => finite(m.relevanceScore))) {
    return {
      state: 'MODEL_KNOWLEDGE' as VerificationState,
      sourceReliability: null,
      evidenceCoverage: 0.0,
      evidenceQuality: null,
      recencyFactor: 0.0,
      directnessScore: 0.0,
      reason: 'มีเพียงบริบทภายใน ไม่มีหลักฐานภายนอกรองรับ'
    };
  }

  // 6. No evidence at all
  return {
    state: 'UNVERIFIED' as VerificationState,
    sourceReliability: null,
    evidenceCoverage: 0.0,
    evidenceQuality: null,
    recencyFactor: 0.0,
    directnessScore: 0.0,
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

  // If no empirical evidence at all
  if (t.state === 'UNVERIFIED' || t.state === 'STALE' || t.state === 'MODEL_KNOWLEDGE') {
    return {
      scorePercent: null,
      label: 'ไม่สามารถประเมินได้',
      verificationState: t.state,
      evidenceCoverage: 0,
      sourceReliability: null,
      evidenceQuality: null,
      recencyFactor: 0,
      directnessScore: 0,
      missingPenalty,
      conflictPenalty,
      formula: 'N/A',
      mathematicalProof: `State=${t.state}; ไม่มีหลักฐานเชิงประจักษ์ที่ตรวจสอบได้ จึงไม่คำนวณตัวเลข confidence.`,
      epistemicQuarantineActive: true,
      quarantineReason: 'หลักฐานยังไม่ผ่าน verification จึงไม่สร้างตัวเลขความมั่นใจ'
    };
  }

  // Mathematical formula weights
  const wComp = 0.40;
  const wRel = 0.35;
  const wQual = 0.25;

  const comp = t.evidenceCoverage;
  const rel = t.sourceReliability ?? 0;
  const qual = t.evidenceQuality ?? 0;

  const preRound = (wComp * comp + wRel * rel + wQual * qual) - missingPenalty - conflictPenalty;
  let score = Math.round(clamp(preRound) * 100);

  // Status & Label Determination
  let label: 'สูง' | 'ปานกลาง' | 'ต่ำ' | 'ไม่สามารถประเมินได้' = 'ต่ำ';

  if (
    t.state === 'VERIFIED' &&
    conflicts === 0 &&
    missing === 0 &&
    t.sourceReliability !== null &&
    t.evidenceQuality !== null
  ) {
    label = score >= 75 ? 'สูง' : 'ปานกลาง';
  } else {
    // Invariant: Unverified / Conflicted / Missing cannot be 'สูง'
    if (score >= 75) score = 74;
    label = score >= 50 ? 'ปานกลาง' : 'ต่ำ';
  }

  const formula = `Score = 0.40×Coverage(${Math.round(comp * 100)}%) + 0.35×Reliability(${
    t.sourceReliability !== null ? Math.round(rel * 100) + '%' : 'N/A'
  }) + 0.25×Quality(${
    t.evidenceQuality !== null ? Math.round(qual * 100) + '%' : 'N/A'
  }) − Penalties [Missing: -${Math.round(missingPenalty * 100)}%, Conflicts: -${Math.round(conflictPenalty * 100)}%]`;

  return {
    scorePercent: score,
    label,
    verificationState: t.state,
    evidenceCoverage: t.evidenceCoverage,
    sourceReliability: t.sourceReliability,
    evidenceQuality: t.evidenceQuality,
    recencyFactor: t.recencyFactor,
    directnessScore: t.directnessScore,
    missingPenalty,
    conflictPenalty,
    formula,
    mathematicalProof: `Score=${score}% derived deterministically from evidence metrics (weights: 40/35/25).`,
    epistemicQuarantineActive: t.state === 'CONFLICTED' || t.state === 'SOURCE_FOUND'
  };
}
