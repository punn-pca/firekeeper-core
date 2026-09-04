/**
 * Verification State Machine & Epistemic Governance Module
 * Implements strict, deterministic state transitions for claims, evidence, and confidence.
 * 
 * Formal Verification States:
 * - USER_CLAIM: User-stated premise or constraint
 * - MODEL_KNOWLEDGE: Raw training distribution prior (unverified for current temporal facts)
 * - UNVERIFIED: No external source or insufficient evidence found
 * - SOURCE_FOUND: Candidate external source identified, but authenticity unvetted
 * - SOURCE_CHECKED: Source authority & provenance checked, but partial/incomplete coverage
 * - PARTIALLY_VERIFIED: At least 1 verified source with authority >= 0.70 and coverage >= 40%
 * - VERIFIED (EMPIRICAL_VERIFIED): Authoritative source (authority >= 0.85) with direct citation and coverage >= 80%
 * - STALE: Verified in the past, but outdated relative to current date (prior to knowledge cutoff or superseded)
 * - CONFLICTED: Contradictory claims found across authoritative sources
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
  sourceReliability: number | null; // null if no checked source
  evidenceCoverage: number; // 0.0 to 1.0
  evidenceQuality: number; // 0.0 to 1.0
  recencyFactor: number; // 0.0 to 1.0
  corroborationCount: number;
  conflictDetected: boolean;
  isStale: boolean;
  basedOnPremises?: string[]; // Cites FACT #X, etc.
  auditTrail: string[];
}

export interface VerificationStateMachineInput {
  isTemporalSensitive: boolean;
  temporalRetrievalVerified: boolean;
  temporalAuthorityScore?: number;
  temporalSourceTitle?: string;
  temporalSourceUrl?: string;
  rawSearchSources: Array<{
    id: string;
    source: string;
    authorityScore?: number;
    isVerified?: boolean;
    publishedDate?: string;
    content?: string;
  }>;
  attachments: Array<{
    id: string;
    name: string;
    quality?: number;
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
  evidenceCoverage: number; // 0.0 to 1.0
  sourceReliability: number | null; // null if unverified / no external source
  evidenceQuality: number | null; // null or 0.0 to 1.0
  recencyFactor: number; // 0.0 to 1.0
  directnessScore: number; // 0.0 to 1.0
  missingPenalty: number; // e.g. 0.00 to 0.40
  conflictPenalty: number; // e.g. 0.00 to 0.40
  mathematicalProof: string;
  formula: string;
  epistemicQuarantineActive: boolean;
  quarantineReason?: string;
}

/**
 * Deterministically computes the Verification State Machine transition.
 * INVARIANT: If sourceReliability === null, verificationState CAN NEVER BE 'PARTIALLY_VERIFIED' or 'VERIFIED'.
 */
export function transitionVerificationState(
  input: VerificationStateMachineInput
): {
  state: VerificationState;
  sourceReliability: number | null;
  evidenceCoverage: number;
  evidenceQuality: number | null;
  recencyFactor: number;
  directnessScore: number;
  reason: string;
} {
  const {
    isTemporalSensitive,
    temporalRetrievalVerified,
    temporalAuthorityScore,
    rawSearchSources,
    attachments,
    memories,
    missingSignalsCount,
    conflictCount,
    isCutoffOutdated
  } = input;

  // 1. Conflict State check
  if (conflictCount > 1) {
    return {
      state: 'CONFLICTED',
      sourceReliability: 0.50,
      evidenceCoverage: 0.30,
      evidenceQuality: 0.40,
      recencyFactor: 0.50,
      directnessScore: 0.40,
      reason: 'ตรวจพบหลักฐานที่มีความขัดแย้งเชิงตรรกะหรือข้อมูลไม่ตรงกันระหว่างแหล่งอ้างอิง (Contradictory Sources Detected)'
    };
  }

  // 2. Verified Temporal Current Source
  if (isTemporalSensitive && temporalRetrievalVerified) {
    const authority = temporalAuthorityScore || 0.95;
    const coverage = Math.max(0.70, Number((0.95 - missingSignalsCount * 0.05).toFixed(2)));
    return {
      state: 'VERIFIED',
      sourceReliability: authority,
      evidenceCoverage: coverage,
      evidenceQuality: 0.95,
      recencyFactor: 1.00,
      directnessScore: 0.92,
      reason: 'ผ่านการตรวจสอบและยืนยันข้อมูลจากแหล่งข้อมูลปฐมภูมิ/สถิติที่เป็นปัจจุบัน (Authoritative Live Verification)'
    };
  }

  // 3. Temporal Sensitive without verified current source -> Strictly UNVERIFIED / STALE
  if (isTemporalSensitive && !temporalRetrievalVerified) {
    const hasRawSearch = rawSearchSources.length > 0;
    return {
      state: isCutoffOutdated ? 'STALE' : (hasRawSearch ? 'SOURCE_FOUND' : 'UNVERIFIED'),
      sourceReliability: null, // Strictly null: no authenticated source
      evidenceCoverage: 0.00,
      evidenceQuality: hasRawSearch ? 0.10 : null,
      recencyFactor: 0.00,
      directnessScore: 0.00,
      reason: 'คำถามเกี่ยวข้องกับสถานะปัจจุบันแต่ไม่มีหลักฐานภายนอกที่เป็นปัจจุบันยืนยัน (Unverified Temporal Claim)'
    };
  }

  // 4. Attachments (Empirical Documents uploaded by user)
  if (attachments.length > 0) {
    const authority = 0.92;
    const coverage = Math.max(0.60, Number((0.95 - missingSignalsCount * 0.10).toFixed(2)));
    const quality = 0.90;
    return {
      state: missingSignalsCount <= 1 ? 'VERIFIED' : 'PARTIALLY_VERIFIED',
      sourceReliability: authority,
      evidenceCoverage: coverage,
      evidenceQuality: quality,
      recencyFactor: 1.00,
      directnessScore: 0.95,
      reason: 'วิเคราะห์โดยอ้างอิงจากเอกสารหลักฐานเชิงประจักษ์ที่ผู้ใช้นำเข้าโดยตรง (Empirical Document Evidence)'
    };
  }

  // 5. General Raw Search Sources
  if (rawSearchSources.length > 0) {
    const verifiedSources = rawSearchSources.filter(s => s.isVerified && (s.authorityScore || 0) >= 0.70);
    if (verifiedSources.length > 0) {
      const avgAuth = Number((verifiedSources.reduce((acc, s) => acc + (s.authorityScore || 0.75), 0) / verifiedSources.length).toFixed(2));
      const coverage = Math.max(0.40, Number((0.80 - missingSignalsCount * 0.10).toFixed(2)));
      return {
        state: avgAuth >= 0.85 && missingSignalsCount === 0 ? 'VERIFIED' : 'PARTIALLY_VERIFIED',
        sourceReliability: avgAuth,
        evidenceCoverage: coverage,
        evidenceQuality: 0.75,
        recencyFactor: 0.90,
        directnessScore: 0.80,
        reason: 'พบแหล่งค้นหาภายนอกและผ่านการประเมินความน่าเชื่อถือในระดับเบื้องต้น'
      };
    } else {
      return {
        state: 'SOURCE_FOUND',
        sourceReliability: null, // Candidate found but not verified
        evidenceCoverage: 0.15,
        evidenceQuality: 0.30,
        recencyFactor: 0.50,
        directnessScore: 0.30,
        reason: 'พบแหล่งข้อมูลภายนอกเบื้องต้นแต่ยังไม่ผ่านการตรวจสอบความน่าเชื่อถือทางสถิติ (Unvetted Candidate Sources)'
      };
    }
  }

  // 6. Context Memories Only (Model Knowledge / Internal Episodic)
  if (memories.length > 0) {
    const validMems = memories.filter(m => (m.relevanceScore || 0) >= 0.75);
    if (validMems.length > 0) {
      return {
        state: 'MODEL_KNOWLEDGE',
        sourceReliability: null, // Strictly null: Internal memories do not count as external source reliability
        evidenceCoverage: Number(Math.max(0.10, 0.40 - missingSignalsCount * 0.10).toFixed(2)),
        evidenceQuality: 0.40,
        recencyFactor: 0.60,
        directnessScore: 0.50,
        reason: 'อ้างอิงจากบริบทความจำภายใน (Episodic Context) แต่ไม่มีแหล่งหลักฐานภายนอกยืนยัน'
      };
    }
  }

  // 7. Fallback -> UNVERIFIED
  return {
    state: 'UNVERIFIED',
    sourceReliability: null,
    evidenceCoverage: 0.00,
    evidenceQuality: null,
    recencyFactor: 0.00,
    directnessScore: 0.00,
    reason: 'ไม่มีพยานหลักฐานเชิงประจักษ์ภายนอกรองรับ (No Empirical Evidence Available)'
  };
}

/**
 * Calculates deterministic, monotonic calibrated confidence score with mathematical traceability.
 * Guaranteed Properties:
 * 1. Monotonicity: Increasing verified coverage/quality NEVER reduces confidence.
 * 2. Invariant: If state is UNVERIFIED, STALE, or MODEL_KNOWLEDGE, confidence is mathematically capped <= 25% (Label: 'ต่ำ').
 * 3. Exact Traceability: Every penalty and weight is computed from discrete inputs.
 */
export function computeDeterministicConfidence(
  stateTransition: ReturnType<typeof transitionVerificationState>,
  missingCount: number,
  conflictCount: number
): DeterministicConfidenceBreakdown {
  const {
    state,
    sourceReliability,
    evidenceCoverage,
    evidenceQuality,
    recencyFactor,
    directnessScore,
    reason
  } = stateTransition;

  // Discrete, deterministic penalty calculations
  const missingPenalty = Number(Math.min(0.35, missingCount * 0.05 + (state === 'UNVERIFIED' || state === 'STALE' ? 0.15 : 0)).toFixed(2));
  const conflictPenalty = Number(Math.min(0.40, conflictCount * 0.15 + (state === 'CONFLICTED' ? 0.20 : 0)).toFixed(2));

  let scorePercent: number | null = null;
  let label: 'สูง' | 'ปานกลาง' | 'ต่ำ' | 'ไม่สามารถประเมินได้' = 'ต่ำ';
  let mathematicalProof = '';
  let formula = '';
  let epistemicQuarantineActive = false;
  let quarantineReason: string | undefined = undefined;

  switch (state) {
    case 'UNVERIFIED':
    case 'STALE': {
      epistemicQuarantineActive = true;
      quarantineReason = 'Epistemic Quarantine Active: สถานะ UNVERIFIED/STALE ห้ามสร้าง Inference หรือ Recommendation เชิงชี้นำโดยเด็ดขาด';
      
      // Strict deterministic lower bound: 10% - 15%
      const baseScore = 0.20;
      const calculated = Math.max(0.10, Math.min(0.15, baseScore - missingPenalty - conflictPenalty));
      scorePercent = Math.round(calculated * 100);
      label = 'ต่ำ';
      formula = `Calibrated Confidence (${scorePercent}%) = Base(${Math.round(baseScore * 100)}%) - MissingPenalty(${Math.round(missingPenalty * 100)}%) - ConflictPenalty(${Math.round(conflictPenalty * 100)}%) [State: ${state}, Coverage: 0%]`;
      mathematicalProof = `Status=${state} ⇒ Coverage=0%, Source=N/A ⇒ Maximum Permissible Confidence Ceiling ≤ 15%.`;
      break;
    }

    case 'SOURCE_FOUND':
    case 'MODEL_KNOWLEDGE': {
      epistemicQuarantineActive = true;
      quarantineReason = 'Epistemic Quarantine Active: ข้อมูลจากแหล่งค้นหาเบื้องต้นหรือ Memory ยังไม่ผ่านการรับรองความถูกต้อง';
      
      const qVal = evidenceQuality || 0.30;
      const covVal = evidenceCoverage;
      // Formula: (0.50 * Coverage + 0.50 * Quality) * 0.50 - Penalties
      const baseWeighted = (covVal * 0.50 + qVal * 0.50) * 0.50;
      const calculated = Math.max(0.15, Math.min(0.35, baseWeighted - missingPenalty - conflictPenalty));
      scorePercent = Math.round(calculated * 100);
      label = scorePercent >= 50 ? 'ปานกลาง' : 'ต่ำ';
      formula = `Calibrated Confidence (${scorePercent}%) = [0.50 × Cov(${Math.round(covVal * 100)}%) + 0.50 × Qual(${Math.round(qVal * 100)}%)] × 0.50 (Unchecked Sources: N/A) - Penalties [Missing: -${Math.round(missingPenalty * 100)}%, Conflicts: -${Math.round(conflictPenalty * 100)}%]`;
      mathematicalProof = `Status=${state} ⇒ Unchecked Source (Reliability: N/A). Scaled by 0.50 discount factor.`;
      break;
    }

    case 'SOURCE_CHECKED':
    case 'PARTIALLY_VERIFIED': {
      epistemicQuarantineActive = false;
      const relVal = sourceReliability || 0.70;
      const covVal = evidenceCoverage;
      const qVal = evidenceQuality || 0.70;
      const recVal = recencyFactor;
      
      // Weighted empirical formulation: 0.35 Coverage + 0.30 Reliability + 0.20 Quality + 0.15 Recency
      const baseWeighted = covVal * 0.35 + relVal * 0.30 + qVal * 0.20 + recVal * 0.15;
      const calculated = Math.max(0.35, Math.min(0.70, baseWeighted - missingPenalty - conflictPenalty));
      scorePercent = Math.round(calculated * 100);
      label = scorePercent >= 50 ? 'ปานกลาง' : 'ต่ำ';
      formula = `Calibrated Confidence (${scorePercent}%) = [0.35 × Cov(${Math.round(covVal * 100)}%) + 0.30 × Rel(${Math.round(relVal * 100)}%) + 0.20 × Qual(${Math.round(qVal * 100)}%) + 0.15 × Recency(${Math.round(recVal * 100)}%)] - Penalties [Missing: -${Math.round(missingPenalty * 100)}%, Conflicts: -${Math.round(conflictPenalty * 100)}%]`;
      mathematicalProof = `Status=${state} ⇒ Verified Rel=${Math.round(relVal * 100)}%, Cov=${Math.round(covVal * 100)}%. Monotonically bounded within [35%, 70%].`;
      break;
    }

    case 'VERIFIED': {
      epistemicQuarantineActive = false;
      const relVal = sourceReliability || 0.95;
      const covVal = evidenceCoverage;
      const qVal = evidenceQuality || 0.95;
      const recVal = recencyFactor;
      const dirVal = directnessScore;

      // Full empirical formulation: 0.30 Coverage + 0.30 Reliability + 0.20 Quality + 0.10 Recency + 0.10 Directness
      const baseWeighted = covVal * 0.30 + relVal * 0.30 + qVal * 0.20 + recVal * 0.10 + dirVal * 0.10;
      const calculated = Math.max(0.70, Math.min(0.98, baseWeighted - missingPenalty - conflictPenalty));
      scorePercent = Math.round(calculated * 100);
      label = scorePercent >= 75 ? 'สูง' : 'ปานกลาง';
      formula = `Calibrated Confidence (${scorePercent}%) = [0.30 × Cov(${Math.round(covVal * 100)}%) + 0.30 × Rel(${Math.round(relVal * 100)}%) + 0.20 × Qual(${Math.round(qVal * 100)}%) + 0.10 × Recency(${Math.round(recVal * 100)}%) + 0.10 × Direct(${Math.round(dirVal * 100)}%)] - Penalties [Missing: -${Math.round(missingPenalty * 100)}%, Conflicts: -${Math.round(conflictPenalty * 100)}%]`;
      mathematicalProof = `Status=VERIFIED ⇒ Authoritative Multi-Criteria Invariant satisfied. Verified Score ≥ 70%.`;
      break;
    }

    case 'CONFLICTED': {
      epistemicQuarantineActive = true;
      quarantineReason = 'Epistemic Quarantine Active: ข้อมูลขัดแย้งกันอย่างมีนัยสำคัญระหว่างแหล่งอ้างอิง';
      scorePercent = 25;
      label = 'ต่ำ';
      formula = `Calibrated Confidence (25%) = High Conflict Penalty (-${Math.round(conflictPenalty * 100)}%) [Contradictory Sources Detected]`;
      mathematicalProof = `Status=CONFLICTED ⇒ Strict Governance Penalty applied. Confidence reduced to 25%.`;
      break;
    }

    default: {
      scorePercent = null;
      label = 'ไม่สามารถประเมินได้';
      formula = 'Calibrated Confidence = N/A [Unknown State]';
      mathematicalProof = 'Undefined verification state';
    }
  }

  return {
    scorePercent,
    label,
    verificationState: state,
    evidenceCoverage,
    sourceReliability,
    evidenceQuality,
    recencyFactor,
    directnessScore,
    missingPenalty,
    conflictPenalty,
    mathematicalProof,
    formula,
    epistemicQuarantineActive,
    quarantineReason
  };
}
