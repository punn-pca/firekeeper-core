import { calculateExactBayesianPosterior, BayesianProbabilityProvenance } from './bayesianEngine';
import {
  resolveSourceBackedLikelihood,
  SourceBackedEvidence,
  ProbabilityProvenance
} from './sourceBackedACH';

export interface GovernedACHHypothesis {
  prior: number;
  likelihood: number;
  counterLikelihood: number;
  posterior: number;
  quarantined: boolean;
  provenance: ProbabilityProvenance;
}

function toBayesianProvenance(provenance: ProbabilityProvenance): BayesianProbabilityProvenance {
  const method: BayesianProbabilityProvenance['method'] =
    provenance.status === 'CALIBRATED'
      ? 'CALIBRATED_MODEL'
      : provenance.status === 'EXPERT_ELICITATION'
        ? 'EXPERT_ELICITATION'
        : provenance.status === 'USER_SCENARIO'
          ? 'USER_SCENARIO'
          : 'EMPIRICAL_RATE';

  return {
    sourceEvidenceIds: provenance.evidenceIds,
    method,
    sampleSize: provenance.sampleSize,
    calibrationDataset: provenance.calibrationDataset,
    calibrationDate: provenance.calibrationDate,
    likelihoodSource: provenance.source,
    counterLikelihoodSource: provenance.source
  };
}

/**
 * Governance boundary for Bayesian ACH.
 * Source authority/credibility may describe evidence quality, but it is never
 * converted into P(E|H). Only an explicitly declared numeric likelihood with
 * preserved probability provenance may move the posterior.
 */
export function calculateGovernedACHHypothesis(
  prior: number,
  evidence: SourceBackedEvidence[],
  purpose: string
): GovernedACHHypothesis {
  const resolved = resolveSourceBackedLikelihood(prior, evidence, purpose);
  const proof = calculateExactBayesianPosterior(
    prior,
    resolved.likelihood,
    resolved.counterLikelihood,
    toBayesianProvenance(resolved.provenance)
  );

  return {
    prior,
    likelihood: proof.likelihood_h,
    counterLikelihood: proof.likelihood_not_h,
    posterior: proof.posterior,
    quarantined: resolved.quarantined,
    provenance: resolved.provenance
  };
}
