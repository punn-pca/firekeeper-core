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

export interface GovernedEvidenceAssessment {
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

  return {
    evidence,
    evidenceIds: verification.evidenceIds,
    links: governedLinks,
    linkScores: linking.scores,
    linkMethod: linking.method,
    verificationStatus: verification.status,
    verificationMethod: verification.verificationMethod,
    verificationReason: verification.reason,
  };
}
