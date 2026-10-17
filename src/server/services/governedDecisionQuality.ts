/**
 * Governed decision-quality checks. Pure functions: never fabricate evidence,
 * confidence, or options. Intended for the governed pipeline only.
 */
export interface DecisionOption {
  id: string;
  title: string;
  type: 'primary' | 'intermediate' | 'defer';
  benefits: string[];
  costs: string[];
  risks: string[];
  assumptions: string[];
  evidenceIds: string[];
}
export interface DecisionEvidence {
  id: string;
  verified: boolean;
  source?: string;
}
export interface DecisionQuality {
  passed: boolean;
  issues: string[];
  missingEvidenceIds: string[];
  verifiedEvidenceCount: number;
  confidenceDisplay: string;
}
export function reviewGovernedDecision(input: {
  options: DecisionOption[];
  evidence: DecisionEvidence[];
  isComplexDecision: boolean;
  confidence: number | null | undefined;
}): DecisionQuality {
  const issues: string[] = [];
  const options = input.options ?? [];
  const evidence = input.evidence ?? [];
  const verified = new Set(evidence.filter(e => e.verified && e.source?.trim()).map(e => e.id));
  const referenced = new Set(options.flatMap(o => o.evidenceIds ?? []));
  const missingEvidenceIds = [...referenced].filter(id => !verified.has(id));
  if (input.isComplexDecision) {
    if (options.length < 3) issues.push('INSUFFICIENT_OPTIONS');
    if (!options.some(o => o.type === 'intermediate' || o.type === 'defer')) issues.push('MISSING_INTERMEDIATE_OPTION');
    if (options.some(o => !o.benefits?.length || !o.costs?.length || !o.risks?.length)) issues.push('INCOMPLETE_TRADEOFF');
    if (options.some(o => !o.assumptions?.length)) issues.push('MISSING_ASSUMPTIONS');
  }
  if (missingEvidenceIds.length) issues.push('UNVERIFIED_EVIDENCE_REFERENCES');
  const confidence = input.confidence;
  const validConfidence = typeof confidence === 'number' && Number.isFinite(confidence) && confidence >= 0 && confidence <= 1;
  if (!validConfidence) issues.push('CONFIDENCE_NOT_MEASURED');
  return {
    passed: issues.length === 0,
    issues,
    missingEvidenceIds,
    verifiedEvidenceCount: verified.size,
    confidenceDisplay: validConfidence ? `${(confidence * 100).toFixed(1)}% (evidence-derived metric; not calibrated probability)` : 'Not measured'
  };
}
