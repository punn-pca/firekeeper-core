import { governClaimVerification, GovernedVerificationStatus, VerificationMethod } from './claimVerificationGovernance';
import { linkClaimEvidence, ClaimEvidenceLink } from '../../utils/claimEvidenceLinker';

export interface GovernableEvidence {
  id: string;
  source?: string;
  content?: string;
  sourceUrl?: string;
  locator?: string;
  documentId?: string;
}

export type ClaimTruthStatus = 'VERIFIED' | 'UNVERIFIED' | 'CONTRADICTED';

export interface GovernedEvidenceAssessment {
  /** Claim truth status is distinct from evidence availability and link discovery. */
  claimStatus: ClaimTruthStatus;
  evidence: GovernableEvidence[];
  evidenceIds: string[];
  links: ClaimEvidenceLink[];
  linkScores: ReturnType<typeof linkClaimEvidence>['scores'];
  linkMethod: string;
  verificationStatus: GovernedVerificationStatus;
  verificationMethod: VerificationMethod;
  verificationReason: string;
}

/**
 * Canonical claim -> evidence governance primitive.
 *
 * Retrieval adapters may discover/normalize evidence differently, but they must
 * not implement their own epistemic meaning for SUPPORTS/CONTRADICTS or their
 * own verification state. This primitive centralizes linking + verification.
 *
 * A relation is diagnostic only. SUPPORTS never means VERIFIED, and source
 * credibility never becomes probability or verification authority.
 */
export function assessClaimEvidence(input: {
  claim: string;
  evidence?: GovernableEvidence[];
  verificationMethod?: VerificationMethod;
  semanticLinks?: Array<{ evidenceId: string; relation: 'SUPPORTS' | 'CONTRADICTS' }>;
}): GovernedEvidenceAssessment {
  const claim = String(input.claim || '').trim();
  const evidence = Array.isArray(input.evidence)
    ? input.evidence.filter((item) => item && item.id)
    : [];
  const verificationMethod: VerificationMethod = input.verificationMethod || 'NONE';

  if (!claim || evidence.length === 0) {
    return {
      evidence,
      evidenceIds: [],
      links: [],
      linkScores: [],
      linkMethod: 'NO_EVIDENCE',
      claimStatus: 'UNVERIFIED',
      verificationStatus: 'UNVERIFIED',
      verificationMethod,
      verificationReason: !claim ? 'No claim was supplied for verification.' : 'No evidence was supplied for verification.',
    };
  }

  const linking = linkClaimEvidence(claim, evidence);
  // Deterministic linking is candidate discovery only. Only a semantic verifier
  // may contribute SUPPORTS; deterministic structured contradictions are retained.
  const deterministicConflicts = linking.links.filter((link) => link.relation === 'CONTRADICTS');
  const semanticLinks = Array.isArray(input.semanticLinks)
    ? input.semanticLinks.filter((link) => evidence.some((item) => item.id === link.evidenceId))
    : [];
  const governedLinks = [
    ...linking.links.filter((link) => link.relation !== 'SUPPORTS'),
    ...semanticLinks,
    ...deterministicConflicts.filter((link) => !semanticLinks.some((semantic) => semantic.evidenceId === link.evidenceId && semantic.relation === 'CONTRADICTS')),
  ];
  const verification = governClaimVerification({
    claim,
    evidence,
    links: governedLinks,
    verificationMethod,
  });

  const traceableContradiction = governedLinks.some((link) => {
    if (link.relation !== 'CONTRADICTS') return false;
    const item = evidence.find((candidate) => candidate.id === link.evidenceId);
    return Boolean(item && item.source?.trim() && item.content?.trim() && (
      (typeof item.sourceUrl === 'string' && /^https?:\/\/[^\s]+$/i.test(item.sourceUrl.trim())) ||
      String(item.locator || '').trim() ||
      String(item.documentId || '').trim()
    ));
  });
  const traceableSupport = governedLinks.some((link) => {
    if (link.relation !== 'SUPPORTS') return false;
    const item = evidence.find((candidate) => candidate.id === link.evidenceId);
    return Boolean(item && item.source?.trim() && item.content?.trim() && (
      (typeof item.sourceUrl === 'string' && /^https?:\/\/[^\s]+$/i.test(item.sourceUrl.trim())) ||
      String(item.locator || '').trim() ||
      String(item.documentId || '').trim()
    ));
  });
  // Conflicting traceable support and contradiction is unresolved, not a verdict.
  const claimStatus: ClaimTruthStatus = verification.status === 'VERIFIED'
    ? 'VERIFIED'
    : traceableContradiction && !traceableSupport
      ? 'CONTRADICTED'
      : 'UNVERIFIED';

  return {
    evidence,
    evidenceIds: verification.evidenceIds,
    claimStatus,
    links: governedLinks,
    linkScores: linking.scores,
    linkMethod: linking.method,
    verificationStatus: verification.status,
    verificationMethod: verification.verificationMethod,
    verificationReason: verification.reason,
  };
}


export interface DecisionGapInventory {
  /** Information already available in the current analysis context. */
  availableData: string[];
  /** Information known to be missing for the requested conclusion. */
  missingData: string[];
  /** Existing or external records that still need to be checked. */
  verificationRequired: string[];
}

/**
 * Keep known, missing, and to-be-verified data separate. This function does not
 * guess which data exists: callers must populate each list from inspected context.
 */
export function buildDecisionGapInventory(input: DecisionGapInventory): DecisionGapInventory {
  const normalizeList = (items: string[]) => Array.from(new Set(
    (Array.isArray(items) ? items : [])
      .map((item) => String(item || '').trim())
      .filter(Boolean)
  ));
  return {
    availableData: normalizeList(input.availableData),
    missingData: normalizeList(input.missingData),
    verificationRequired: normalizeList(input.verificationRequired),
  };
}

export interface RecordedStageTrace {
  stage: string;
  start_time_ms?: number;
  end_time_ms?: number;
  timestamp?: string;
  output?: Record<string, unknown>;
}

export interface StageTraceCompletion {
  complete: boolean;
  completedStages: string[];
  missingStages: string[];
  invalidTraceStages: string[];
}

/**
 * A stage counts as executed only when a matching trace entry records a finite
 * start/end time and an output object. Stage declarations alone are not evidence.
 */
export function assessRecordedStageCompletion(
  expectedStages: string[],
  trace: RecordedStageTrace[]
): StageTraceCompletion {
  const recorded = Array.isArray(trace) ? trace : [];
  const completedStages: string[] = [];
  const missingStages: string[] = [];
  const invalidTraceStages: string[] = [];
  for (const stage of expectedStages) {
    const entries = recorded.filter((entry) => entry?.stage === stage);
    const valid = entries.some((entry) =>
      Number.isFinite(entry.start_time_ms) &&
      Number.isFinite(entry.end_time_ms) &&
      Number(entry.end_time_ms) >= Number(entry.start_time_ms) &&
      Boolean(entry.output && typeof entry.output === 'object' && !Array.isArray(entry.output))
    );
    if (valid) completedStages.push(stage);
    else {
      missingStages.push(stage);
      if (entries.length > 0) invalidTraceStages.push(stage);
    }
  }
  return {
    complete: expectedStages.length > 0 && missingStages.length === 0,
    completedStages,
    missingStages,
    invalidTraceStages,
  };
}
