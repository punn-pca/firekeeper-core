export type ProbabilityProvenanceStatus =
  | 'SOURCE_BACKED'
  | 'CALIBRATED'
  | 'EXPERT_ELICITATION'
  | 'USER_SCENARIO'
  | 'UNCALIBRATED';

export interface ProbabilityProvenance {
  status: ProbabilityProvenanceStatus;
  evidenceIds: string[];
  source: string;
  methodology?: string;
  sampleSize?: number;
  calibrationDataset?: string;
  calibrationDate?: string;
  rationale: string;
}

export interface ProbabilityInput {
  prior: number;
  likelihood?: number;
  counterLikelihood?: number;
  provenance?: ProbabilityProvenance;
}

export interface ProbabilityGateResult {
  accepted: boolean;
  likelihood: number;
  counterLikelihood: number;
  posteriorMustRemainPrior: boolean;
  reason: string;
}

const isProbability = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 1;

/**
 * Epistemic gate for Bayesian inputs.
 * Evidence credibility/relevance is not itself a probability.
 * A numeric likelihood may affect a posterior only when its provenance is explicit.
 */
export function gateProbabilityInput(input: ProbabilityInput): ProbabilityGateResult {
  const prior = isProbability(input.prior) ? input.prior : 0.5;
  const provenance = input.provenance;
  const hasProvenance = Boolean(provenance && provenance.status !== 'UNCALIBRATED');
  const hasEvidenceLink = Boolean(provenance?.evidenceIds?.length);
  const likelihood = input.likelihood;
  const counterLikelihood = input.counterLikelihood;

  if (!hasProvenance || !hasEvidenceLink || !isProbability(likelihood) || !isProbability(counterLikelihood)) {
    return {
      accepted: false,
      likelihood: prior,
      counterLikelihood: prior,
      posteriorMustRemainPrior: true,
      reason: 'Bayesian likelihood quarantined: missing explicit probability provenance, evidence linkage, or valid likelihood pair.'
    };
  }

  return {
    accepted: true,
    likelihood,
    counterLikelihood,
    posteriorMustRemainPrior: false,
    reason: 'Probability accepted with explicit provenance and evidence linkage.'
  };
}

export function buildSourceBackedProvenance(
  evidenceIds: string[],
  source: string,
  rationale = 'Likelihood is explicitly linked to source evidence.'
): ProbabilityProvenance {
  if (!evidenceIds.length) {
    return {
      status: 'UNCALIBRATED',
      evidenceIds: [],
      source: 'NONE',
      rationale: 'No evidence is linked to the probability.'
    };
  }
  return {
    status: 'SOURCE_BACKED',
    evidenceIds: [...new Set(evidenceIds)],
    source,
    methodology: 'source-backed likelihood; source credibility is not treated as probability',
    rationale
  };
}
