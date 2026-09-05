/**
 * DETERMINISTIC BAYESIAN REASONING ENGINE
 * PUNN Cognitive Architecture (PCA v3.0)
 *
 * Bayesian arithmetic is deterministic, but deterministic arithmetic alone does
 * NOT make a probability empirical. This module therefore distinguishes
 * source-backed likelihoods from uncalibrated model/user supplied numbers.
 */

export interface BayesianProbabilityProvenance {
  sourceEvidenceIds: string[];
  method: 'EMPIRICAL_RATE' | 'CALIBRATED_MODEL' | 'EXPERT_ELICITATION' | 'USER_SCENARIO';
  sampleSize?: number;
  calibrationDataset?: string;
  calibrationDate?: string;
  priorSource?: string;
  likelihoodSource?: string;
  counterLikelihoodSource?: string;
}

export interface BayesianProof {
  formula: string;
  prior: number;
  likelihood_h: number;
  likelihood_not_h: number;
  numerator: number;
  denominator: number;
  posterior: number;
  bayes_factor: number;
  odds_prior: number;
  odds_posterior: number;
  evidence_strength_label: 'EXTREME' | 'STRONG' | 'MODERATE' | 'WEAK' | 'INCONCLUSIVE' | 'NEGATIVE';
  proof_text: string;
  probability_status: 'SOURCE_BACKED' | 'CALIBRATED_MODEL' | 'EXPERT_ELICITED' | 'SCENARIO_ONLY' | 'UNCALIBRATED';
  provenance?: BayesianProbabilityProvenance;
  provenance_warnings: string[];
}

export interface ACHHypothesisInput {
  id: string;
  claim: string;
  prior: number;
  likelihood: number;
  counterLikelihood?: number;
  evidenceIds?: string[];
  /** Required to let likelihood move the posterior away from the prior. */
  probabilityProvenance?: BayesianProbabilityProvenance;
}

export interface ACHHypothesisEvaluated {
  id: string;
  claim: string;
  prior: number;
  likelihood: number;
  posterior: number;
  confidence: 'HIGH' | 'MODERATE' | 'LOW';
  status: 'Supported' | 'Under_Review' | 'Unconfirmed' | 'Contradicted';
  bayes_factor: number;
  evidenceIds: string[];
  rationale: string;
  mathematicalProof: BayesianProof;
}

export interface ACHResult {
  hypotheses: ACHHypothesisEvaluated[];
  leadingHypothesisId: string;
  epistemicEntropy: number;
  hasSufficientEvidence: boolean;
  totalJointProbability: number;
  summary: string;
}

function validateProbabilityProvenance(
  provenance?: BayesianProbabilityProvenance
): { status: BayesianProof['probability_status']; warnings: string[] } {
  if (!provenance) {
    return {
      status: 'UNCALIBRATED',
      warnings: [
        'Likelihood is not source-backed or calibrated; Bayesian update is quarantined to neutral evidence.',
        'Do not interpret the resulting posterior as an empirical probability.'
      ]
    };
  }

  const warnings: string[] = [];
  if (!Array.isArray(provenance.sourceEvidenceIds) || provenance.sourceEvidenceIds.length === 0) {
    warnings.push('Probability provenance has no evidence IDs.');
  }
  if (provenance.method === 'EMPIRICAL_RATE' && (!Number.isFinite(provenance.sampleSize) || (provenance.sampleSize as number) < 1)) {
    warnings.push('EMPIRICAL_RATE requires a positive sample size.');
  }

  const status: BayesianProof['probability_status'] =
    provenance.method === 'EMPIRICAL_RATE' ? 'SOURCE_BACKED' :
    provenance.method === 'CALIBRATED_MODEL' ? 'CALIBRATED_MODEL' :
    provenance.method === 'EXPERT_ELICITATION' ? 'EXPERT_ELICITED' :
    'SCENARIO_ONLY';

  return { status, warnings };
}

/**
 * Calculates deterministic Bayesian posterior probability.
 *
 * SECURITY/INTEGRITY RULE:
 * If no probability provenance is supplied, likelihoods are neutralized to
 * 0.50 / 0.50. This prevents an LLM from manufacturing a likelihood such as
 * 0.65 and then presenting the resulting posterior as evidence-based.
 */
export function calculateExactBayesianPosterior(
  prior: number,
  likelihoodH: number,
  likelihoodNotH?: number,
  probabilityProvenance?: BayesianProbabilityProvenance
): BayesianProof {
  const pPrior = Math.max(0.01, Math.min(0.99, Number.isFinite(prior) ? prior : 0.50));
  const provenanceCheck = validateProbabilityProvenance(probabilityProvenance);
  const isUncalibrated = provenanceCheck.status === 'UNCALIBRATED';

  const pLikelihoodH = isUncalibrated
    ? 0.50
    : Math.max(0.01, Math.min(0.99, Number.isFinite(likelihoodH) ? likelihoodH : 0.50));

  const pLikelihoodNotH = isUncalibrated
    ? 0.50
    : typeof likelihoodNotH === 'number' && Number.isFinite(likelihoodNotH)
      ? Math.max(0.01, Math.min(0.99, likelihoodNotH))
      : Math.max(0.01, Math.min(0.99, 1.0 - (pLikelihoodH * 0.65)));

  const numerator = pLikelihoodH * pPrior;
  const denominator = (pLikelihoodH * pPrior) + (pLikelihoodNotH * (1.0 - pPrior));
  const rawPosterior = denominator > 0 ? (numerator / denominator) : pPrior;
  const posterior = Number(Math.max(0.01, Math.min(0.99, rawPosterior)).toFixed(4));

  const bayesFactor = Number((pLikelihoodH / pLikelihoodNotH).toFixed(3));
  const oddsPrior = Number((pPrior / (1 - pPrior)).toFixed(3));
  const oddsPosterior = Number((posterior / (1 - posterior)).toFixed(3));

  let evidenceStrength: BayesianProof['evidence_strength_label'] = 'INCONCLUSIVE';
  if (bayesFactor >= 100) evidenceStrength = 'EXTREME';
  else if (bayesFactor >= 10) evidenceStrength = 'STRONG';
  else if (bayesFactor >= 3) evidenceStrength = 'MODERATE';
  else if (bayesFactor >= 1.2) evidenceStrength = 'WEAK';
  else if (bayesFactor < 0.8) evidenceStrength = 'NEGATIVE';

  const formula = 'P(H|E) = [P(E|H) * P(H)] / [P(E|H)*P(H) + P(E|~H)*(1-P(H))]';
  const proofText =
    `P(H) = ${pPrior.toFixed(2)}, P(E|H) = ${pLikelihoodH.toFixed(2)}, P(E|~H) = ${pLikelihoodNotH.toFixed(2)} → ` +
    `Numerator = (${pLikelihoodH.toFixed(2)} × ${pPrior.toFixed(2)}) = ${numerator.toFixed(4)}, ` +
    `Denominator = (${numerator.toFixed(4)} + ${((1.0 - pPrior) * pLikelihoodNotH).toFixed(4)}) = ${denominator.toFixed(4)} → ` +
    `P(H|E) = ${(posterior * 100).toFixed(1)}% (Bayes Factor: ${bayesFactor}x [${evidenceStrength}])`;

  return {
    formula,
    prior: pPrior,
    likelihood_h: pLikelihoodH,
    likelihood_not_h: pLikelihoodNotH,
    numerator: Number(numerator.toFixed(4)),
    denominator: Number(denominator.toFixed(4)),
    posterior,
    bayes_factor: bayesFactor,
    odds_prior: oddsPrior,
    odds_posterior: oddsPosterior,
    evidence_strength_label: evidenceStrength,
    proof_text: proofText,
    probability_status: provenanceCheck.status,
    provenance: probabilityProvenance,
    provenance_warnings: provenanceCheck.warnings,
  };
}

/** Explicit name for callers that require empirical/source-backed probability. */
export function calculateSourceBackedBayesianPosterior(
  prior: number,
  likelihoodH: number,
  likelihoodNotH: number,
  provenance: BayesianProbabilityProvenance
): BayesianProof {
  return calculateExactBayesianPosterior(prior, likelihoodH, likelihoodNotH, provenance);
}

export function computeDeterministicACH(
  hypotheses: ACHHypothesisInput[],
  evidenceItemsCount: number = 0,
  verifiedItemsCount: number = 0
): ACHResult {
  if (!Array.isArray(hypotheses) || hypotheses.length === 0) {
    return {
      hypotheses: [],
      leadingHypothesisId: '',
      epistemicEntropy: 1.0,
      hasSufficientEvidence: false,
      totalJointProbability: 0,
      summary: 'ไม่มีสมมติฐานสำหรับการวิเคราะห์ ACH',
    };
  }

  const joints = hypotheses.map((h) => {
    const pPrior = Math.max(0.01, Math.min(0.99, Number.isFinite(h.prior) ? h.prior : 0.50));
    const proof = calculateExactBayesianPosterior(
      pPrior,
      h.likelihood,
      h.counterLikelihood,
      h.probabilityProvenance
    );
    return {
      hypothesis: h,
      prior: pPrior,
      likelihood: proof.likelihood_h,
      joint: pPrior * proof.likelihood_h,
      proof,
    };
  });

  const totalJoint = joints.reduce((sum, j) => sum + j.joint, 0);

  const evaluated: ACHHypothesisEvaluated[] = joints.map((j) => {
    const rawPosterior = totalJoint > 0 ? (j.joint / totalJoint) : (1 / joints.length);
    const posterior = Number(Math.max(0.01, Math.min(0.99, rawPosterior)).toFixed(4));
    const proof = j.proof;
    const isCalibrated = proof.probability_status !== 'UNCALIBRATED' && proof.provenance_warnings.length === 0;

    let confidence: 'HIGH' | 'MODERATE' | 'LOW' = 'LOW';
    if (isCalibrated && posterior >= 0.70 && verifiedItemsCount > 0) confidence = 'HIGH';
    else if (isCalibrated && posterior >= 0.45) confidence = 'MODERATE';

    let status: ACHHypothesisEvaluated['status'] = 'Under_Review';
    if (isCalibrated && posterior >= 0.65 && (j.hypothesis.evidenceIds?.length || 0) > 0) {
      status = 'Supported';
    } else if (isCalibrated && posterior < 0.20 && verifiedItemsCount > 0) {
      status = 'Contradicted';
    } else if (evidenceItemsCount === 0 || !isCalibrated) {
      status = 'Unconfirmed';
    }

    const rationale = isCalibrated
      ? `ใช้ likelihood ที่มี provenance (${proof.probability_status}) และคำนวณ P(H|E) = ${(posterior * 100).toFixed(1)}%`
      : `Likelihood ถูกกักไว้ที่ 0.50 เนื่องจากไม่มี probability provenance; posterior นี้ไม่ใช่ empirical probability (Prior = ${(j.prior * 100).toFixed(0)}%)`;

    return {
      id: j.hypothesis.id,
      claim: j.hypothesis.claim,
      prior: j.prior,
      likelihood: j.likelihood,
      posterior,
      confidence,
      status,
      bayes_factor: proof.bayes_factor,
      evidenceIds: j.hypothesis.evidenceIds || [],
      rationale,
      mathematicalProof: proof,
    };
  });

  const sorted = [...evaluated].sort((a, b) => b.posterior - a.posterior);
  const leading = sorted[0];
  const entropy = sorted.reduce((acc, h) => {
    if (h.posterior <= 0) return acc;
    return acc - (h.posterior * Math.log2(h.posterior));
  }, 0);

  const allCalibrated = joints.every((j) => j.proof.probability_status !== 'UNCALIBRATED' && j.proof.provenance_warnings.length === 0);
  const hasSufficientEvidence = verifiedItemsCount > 0 && allCalibrated;

  return {
    hypotheses: evaluated,
    leadingHypothesisId: leading?.id || '',
    epistemicEntropy: Number(entropy.toFixed(3)),
    hasSufficientEvidence,
    totalJointProbability: Number(totalJoint.toFixed(4)),
    summary: leading
      ? `สมมติฐานนำ: ${leading.id} (P = ${(leading.posterior * 100).toFixed(1)}%, Bayes Factor = ${leading.bayes_factor}x; probability status = ${leading.mathematicalProof.probability_status})`
      : 'ไม่มีสมมติฐานนำ',
  };
}
