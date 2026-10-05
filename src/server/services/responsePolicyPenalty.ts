import type { CalibratedConfidenceResult } from './evidenceGovernance';

/** Apply an auditable output-policy penalty without creating a score when evidence is insufficient. */
export function applyResponsePolicyPenalty(
  confidence: CalibratedConfidenceResult,
  governanceState: 'PASS' | 'REVISE' | 'BLOCK' | 'GOVERNANCE_REVIEW',
  qualityReviewRequired: boolean,
  invalidCitationCount: number
): CalibratedConfidenceResult {
  const governancePenalty = governanceState === 'BLOCK' ? 0.20 : governanceState === 'REVISE' || governanceState === 'GOVERNANCE_REVIEW' ? 0.10 : 0;
  const qualityPenalty = qualityReviewRequired ? 0.10 : 0;
  const citationPenalty = Math.min(0.10, Math.max(0, invalidCitationCount) * 0.05);
  const policyPenalty = Number(Math.min(0.40, governancePenalty + qualityPenalty + citationPenalty).toFixed(2));
  if (typeof confidence.scorePercent !== 'number') {
    return { ...confidence, policyPenalty };
  }
  const scorePercent = Math.max(0, confidence.scorePercent - Math.round(policyPenalty * 100));
  return {
    ...confidence,
    policyPenalty,
    scorePercent,
    label: scorePercent >= 75 && policyPenalty === 0 && confidence.label === 'สูง' ? 'สูง' : scorePercent >= 50 ? 'ปานกลาง' : 'ต่ำ',
    formula: `${confidence.formula} − Policy P(${Math.round(policyPenalty * 100)}%)`,
    mathematicalProof: `${confidence.mathematicalProof || ''} Output policy penalty P=${policyPenalty} (governance=${governanceState}, qualityReview=${qualityReviewRequired}, invalidCitations=${invalidCitationCount}); final=${scorePercent}%.`
  };
}
