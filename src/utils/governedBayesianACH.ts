import { calculateExactBayesianPosterior } from './bayesianEngine';
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
    resolved.counterLikelihood
  );

  return {
    prior,
    likelihood: resolved.likelihood,
    counterLikelihood: resolved.counterLikelihood,
    posterior: proof.posterior,
    quarantined: resolved.quarantined,
    provenance: resolved.provenance
  };
}
