import { governClaimVerification, GovernedVerificationStatus, VerificationMethod } from './claimVerificationGovernance';
import { linkClaimEvidence, ClaimEvidenceLink } from '../../utils/claimEvidenceLinker';

export interface GovernableEvidence {
  id: string;
  source?: string;
  content?: string;
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
  const verification = governClaimVerification({
    claim,
    evidence,
    links: linking.links,
    verificationMethod,
  });

  return {
    evidence,
    evidenceIds: verification.evidenceIds,
    links: linking.links,
    linkScores: linking.scores,
    linkMethod: linking.method,
    verificationStatus: verification.status,
    verificationMethod: verification.verificationMethod,
    verificationReason: verification.reason,
  };
}
