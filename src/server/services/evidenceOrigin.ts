export type EvidenceOrigin =
  | 'USER_PROVIDED'
  | 'HYPOTHETICAL'
  | 'EXTERNAL_SOURCE'
  | 'INTERNAL_DOCUMENT'
  | 'DERIVED_CALCULATION';

export type EvidenceVerification = 'NOT_APPLICABLE' | 'UNVERIFIED' | 'VERIFIED';

export interface ClassifiedEvidence {
  origin: EvidenceOrigin;
  verification: EvidenceVerification;
  canUseAsConditionalPremise: boolean;
  canEstablishExternalFact: boolean;
}

/**
 * Origin and verification are independent dimensions.
 * An internal document can be authentic without proving its claims.
 * A hypothetical premise needs no real-world source to support conditional math.
 */
export function classifyEvidence(origin: EvidenceOrigin, verified: boolean = false): ClassifiedEvidence {
  if (origin === 'HYPOTHETICAL' || origin === 'DERIVED_CALCULATION') {
    return {
      origin,
      verification: 'NOT_APPLICABLE',
      canUseAsConditionalPremise: true,
      canEstablishExternalFact: false,
    };
  }
  return {
    origin,
    verification: verified ? 'VERIFIED' : 'UNVERIFIED',
    canUseAsConditionalPremise: true,
    canEstablishExternalFact: verified && origin === 'EXTERNAL_SOURCE',
  };
}
