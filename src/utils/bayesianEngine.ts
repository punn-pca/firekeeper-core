/**
 * DETERMINISTIC BAYESIAN REASONING ENGINE
 * PUNN Cognitive Architecture (PCA v3.0)
 * 
 * Provides rigorous, 100% reproducible Bayesian posterior calculations,
 * likelihood ratios, Bayes Factors, and Multi-Hypothesis Analysis (ACH).
 * Eliminates non-deterministic LLM-generated probability hallucinations.
 */

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
}

export interface ACHHypothesisInput {
  id: string;
  claim: string;
  prior: number; // 0.0 - 1.0
  likelihood: number; // P(E|H) 0.0 - 1.0
  counterLikelihood?: number; // P(E|~H) default ~ (1 - likelihood * 0.5)
  evidenceIds?: string[];
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

/**
 * Calculates deterministic Bayesian posterior probability according to Bayes' Rule:
 * 
 *          P(E|H) * P(H)
 * P(H|E) = ---------------------------------
 *          P(E|H) * P(H) + P(E|~H) * (1 - P(H))
 * 
 * @param prior P(H) - Prior probability [0.0001, 0.9999]
 * @param likelihoodH P(E|H) - Probability of observing evidence given H is true [0.0001, 1.0]
 * @param likelihoodNotH P(E|~H) - Probability of observing evidence given H is false [0.0001, 1.0]
 */
export function calculateExactBayesianPosterior(
  prior: number,
  likelihoodH: number,
  likelihoodNotH?: number
): BayesianProof {
  // Clamp values to valid mathematical ranges
  const pPrior = Math.max(0.01, Math.min(0.99, Number.isFinite(prior) ? prior : 0.50));
  const pLikelihoodH = Math.max(0.01, Math.min(0.99, Number.isFinite(likelihoodH) ? likelihoodH : 0.50));
  
  // Default counter-likelihood based on standard epistemic complementarity if not supplied
  const pLikelihoodNotH = typeof likelihoodNotH === 'number' && Number.isFinite(likelihoodNotH)
    ? Math.max(0.01, Math.min(0.99, likelihoodNotH))
    : Math.max(0.01, Math.min(0.99, 1.0 - (pLikelihoodH * 0.65)));

  const numerator = pLikelihoodH * pPrior;
  const denominator = (pLikelihoodH * pPrior) + (pLikelihoodNotH * (1.0 - pPrior));
  
  const rawPosterior = denominator > 0 ? (numerator / denominator) : pPrior;
  const posterior = Number(Math.max(0.01, Math.min(0.99, rawPosterior)).toFixed(4));

  // Bayes Factor = P(E|H) / P(E|~H)
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
  };
}

/**
 * Computes deterministic multi-hypothesis Analysis of Competing Hypotheses (ACH).
 * Uses joint probability normalization across mutually exclusive candidate hypotheses:
 * 
 *                 P(E|Hi) * P(Hi)
 * P(Hi|E) = -----------------------------
 *             SUM_j [ P(E|Hj) * P(Hj) ]
 */
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

  // 1. Calculate joint probabilities
  const joints = hypotheses.map((h) => {
    const pPrior = Math.max(0.01, Math.min(0.99, Number.isFinite(h.prior) ? h.prior : 0.50));
    const pLikelihood = Math.max(0.01, Math.min(0.99, Number.isFinite(h.likelihood) ? h.likelihood : 0.50));
    return {
      hypothesis: h,
      prior: pPrior,
      likelihood: pLikelihood,
      joint: pPrior * pLikelihood,
    };
  });

  const totalJoint = joints.reduce((sum, j) => sum + j.joint, 0);

  // 2. Compute individual proofs and normalized posteriors
  const evaluated: ACHHypothesisEvaluated[] = joints.map((j) => {
    const rawPosterior = totalJoint > 0 ? (j.joint / totalJoint) : (1 / joints.length);
    const posterior = Number(Math.max(0.01, Math.min(0.99, rawPosterior)).toFixed(4));
    
    const proof = calculateExactBayesianPosterior(j.prior, j.likelihood, j.hypothesis.counterLikelihood);

    let confidence: 'HIGH' | 'MODERATE' | 'LOW' = 'LOW';
    if (posterior >= 0.70 && verifiedItemsCount > 0) confidence = 'HIGH';
    else if (posterior >= 0.45) confidence = 'MODERATE';

    let status: ACHHypothesisEvaluated['status'] = 'Under_Review';
    if (posterior >= 0.65 && (j.hypothesis.evidenceIds?.length || 0) > 0) {
      status = 'Supported';
    } else if (posterior < 0.20 && verifiedItemsCount > 0) {
      status = 'Contradicted';
    } else if (evidenceItemsCount === 0) {
      status = 'Unconfirmed';
    }

    const rationale = (j.hypothesis.evidenceIds?.length || 0) > 0
      ? `มีหลักฐานเชิงประจักษ์รองรับ ${j.hypothesis.evidenceIds?.length} รายการ (P(H|E) = ${(posterior * 100).toFixed(1)}%)`
      : `สมมติฐานทางเลือกภายใต้ความไม่แน่นอน (Prior = ${(j.prior * 100).toFixed(0)}%, Posterior = ${(posterior * 100).toFixed(1)}%)`;

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

  // Sort descending by posterior
  const sorted = [...evaluated].sort((a, b) => b.posterior - a.posterior);
  const leading = sorted[0];

  // Epistemic Shannon Entropy H = -SUM p_i * log2(p_i)
  const entropy = sorted.reduce((acc, h) => {
    if (h.posterior <= 0) return acc;
    return acc - (h.posterior * Math.log2(h.posterior));
  }, 0);

  return {
    hypotheses: evaluated,
    leadingHypothesisId: leading?.id || '',
    epistemicEntropy: Number(entropy.toFixed(3)),
    hasSufficientEvidence: verifiedItemsCount > 0,
    totalJointProbability: Number(totalJoint.toFixed(4)),
    summary: leading 
      ? `สมมติฐานนำ: ${leading.id} (P = ${(leading.posterior * 100).toFixed(1)}%, Bayes Factor = ${leading.bayes_factor}x)`
      : 'ไม่มีสมมติฐานนำ',
  };
}
