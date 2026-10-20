export type BalancedVerificationLevel = 'V0' | 'V1' | 'V2' | 'V3';
export type BalancedClaimCategory =
  | 'FACT'
  | 'INFERENCE'
  | 'UNCERTAINTY'
  | 'CONTRADICTION'
  | 'ASSUMPTION'
  | 'USER_QUERY';

export interface VerificationSource {
  /** Stable source identity, ideally canonical publisher/document identity. */
  sourceId: string;
  /** Normalized hostname; used as a guard, not proof of independence by itself. */
  domain: string;
  /** Whether this is a primary source for the claim being evaluated. */
  primary?: boolean;
  /** Whether the source is authoritative for this claim's domain. */
  authoritative?: boolean;
}

export interface BalancedClaimInput {
  text: string;
  category: BalancedClaimCategory;
  fullContentRetrieved: boolean;
  hasPublishOrRefreshDate: boolean;
  internalContradiction?: boolean;
  hasUnresolvedContradiction?: boolean;
  numericClaim?: boolean;
  marketShareOrDominance?: boolean;
  isInference?: boolean;
  hasCriticalMissingInformation?: boolean;
  sources?: VerificationSource[];
}

export interface BalancedClaimResult {
  category: BalancedClaimCategory;
  verificationLevel: BalancedVerificationLevel;
  sourceCount: number;
  independentSourceCount: number;
  hasPrimarySource: boolean;
  blocked: boolean;
  reasons: string[];
}

const normalize = (value: string): string =>
  value.trim().toLowerCase().replace(/^www\./, '');

function uniqueSources(sources: VerificationSource[]): VerificationSource[] {
  const seen = new Set<string>();
  return sources.filter((source) => {
    const id = normalize(source.sourceId);
    const domain = normalize(source.domain);
    if (!id || !domain) return false;
    // One source identity counts once even if cited multiple times.
    const key = id;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function countIndependentSources(sources: VerificationSource[]): number {
  // Different domains alone do not establish independence. Require distinct
  // source identities and domains; shared-origin/copying relationships must be
  // resolved by the caller before marking sources independent.
  return new Set(sources.map((source) => normalize(source.domain)).filter(Boolean)).size;
}

/**
 * Evaluates a claim against Balanced Verification Criteria v1.0.
 * This is a deterministic criteria evaluator, not a semantic truth detector:
 * callers must supply vetted source provenance and contradiction findings.
 */
export function evaluateBalancedClaim(input: BalancedClaimInput): BalancedClaimResult {
  const reasons: string[] = [];
  const sources = uniqueSources(Array.isArray(input.sources) ? input.sources : []);
  const sourceCount = sources.length;
  const independentSourceCount = countIndependentSources(sources);
  const hasPrimarySource = sources.some((source) => source.primary === true);
  const unresolvedContradiction = input.hasUnresolvedContradiction === true ||
    input.internalContradiction === true || input.category === 'CONTRADICTION';

  if (unresolvedContradiction) {
    return {
      category: 'CONTRADICTION',
      verificationLevel: 'V0',
      sourceCount,
      independentSourceCount,
      hasPrimarySource,
      blocked: true,
      reasons: ['Unresolved contradiction blocks verification upgrades.'],
    };
  }

  if (input.marketShareOrDominance && !hasPrimarySource) {
    return {
      category: 'UNCERTAINTY',
      verificationLevel: 'V0',
      sourceCount,
      independentSourceCount,
      hasPrimarySource,
      blocked: true,
      reasons: ['Market-share or dominance claims require a primary source; otherwise classify as UNCERTAINTY.'],
    };
  }

  if (input.category === 'INFERENCE' || input.isInference) {
    const eligibleV1 = input.fullContentRetrieved && input.hasPublishOrRefreshDate &&
      sourceCount > 0 && !input.internalContradiction;
    return {
      category: 'INFERENCE',
      verificationLevel: eligibleV1 ? 'V1' : 'V0',
      sourceCount,
      independentSourceCount,
      hasPrimarySource,
      blocked: false,
      reasons: [eligibleV1
        ? 'Inference is capped at V1 because it is an interpretation, not a directly verified fact.'
        : 'Inference lacks the minimum retrievable, dated evidence required for V1.'],
    };
  }

  if (!input.fullContentRetrieved || !input.hasPublishOrRefreshDate || sourceCount === 0) {
    if (!input.fullContentRetrieved) reasons.push('Full source content has not been retrieved.');
    if (!input.hasPublishOrRefreshDate) reasons.push('Publication or refresh date is missing.');
    if (sourceCount === 0) reasons.push('No traceable source was supplied.');
    return {
      category: input.category,
      verificationLevel: 'V0',
      sourceCount,
      independentSourceCount,
      hasPrimarySource,
      blocked: false,
      reasons,
    };
  }

  let verificationLevel: BalancedVerificationLevel = 'V1';
  reasons.push('Full content, a publication/refresh date, and at least one traceable source are present.');

  if (independentSourceCount >= 2) {
    verificationLevel = 'V2';
    reasons.push('At least two distinct source domains are present; true independence must be established by provenance checks.');
  }

  const authoritativeOrThreeSources = sources.some((source) => source.primary || source.authoritative) ||
    independentSourceCount >= 3;
  if (verificationLevel === 'V2' && authoritativeOrThreeSources) {
    verificationLevel = 'V3';
    reasons.push(hasPrimarySource
      ? 'Primary/authoritative source requirement is satisfied.'
      : 'Three distinct source domains satisfy the non-numeric V3 fallback.');
  }

  if (input.numericClaim && verificationLevel === 'V3' && !hasPrimarySource) {
    verificationLevel = 'V2';
    reasons.push('Numeric claims cannot reach V3 without a primary source.');
  }

  if (input.hasCriticalMissingInformation) {
    reasons.push('Critical information is missing; confidence scoring applies a penalty.');
  }

  return {
    category: input.category,
    verificationLevel,
    sourceCount,
    independentSourceCount,
    hasPrimarySource,
    blocked: false,
    reasons,
  };
}

export interface BalancedConfidenceInput {
  claims: Array<{
    claimId: string;
    verificationLevel: BalancedVerificationLevel;
    category: BalancedClaimCategory;
    hasCriticalMissingInformation?: boolean;
    hasUnresolvedContradiction?: boolean;
  }>;
}

export interface BalancedConfidenceResult {
  score: number;
  uncappedScore: number;
  counts: { V1: number; V2: number; V3: number };
  contradictionCount: number;
  missingCriticalCount: number;
  capApplied: number;
}

/**
 * Applies the supplied v1.0 scoring weights. The result is a policy score,
 * not a statistically calibrated probability of truth.
 */
export function calculateBalancedConfidence(input: BalancedConfidenceInput): BalancedConfidenceResult {
  const uniqueClaims = new Map<string, BalancedConfidenceInput['claims'][number]>();
  for (const claim of input.claims || []) {
    const id = String(claim.claimId || '').trim();
    if (id && !uniqueClaims.has(id)) uniqueClaims.set(id, claim);
  }
  const claims = Array.from(uniqueClaims.values());
  const counts = {
    V1: claims.filter((claim) => claim.verificationLevel === 'V1').length,
    V2: claims.filter((claim) => claim.verificationLevel === 'V2').length,
    V3: claims.filter((claim) => claim.verificationLevel === 'V3').length,
  };
  const contradictionCount = claims.filter((claim) =>
    claim.hasUnresolvedContradiction || claim.category === 'CONTRADICTION'
  ).length;
  const missingCriticalCount = claims.filter((claim) => claim.hasCriticalMissingInformation).length;
  const uncappedScore = Math.max(0,
    counts.V1 * 8 + counts.V2 * 15 + counts.V3 * 22 -
    contradictionCount * 12 - missingCriticalCount * 10
  );
  const capApplied = counts.V3 > 0 ? 85 : 75;
  return {
    score: Math.min(uncappedScore, capApplied),
    uncappedScore,
    counts,
    contradictionCount,
    missingCriticalCount,
    capApplied,
  };
}
