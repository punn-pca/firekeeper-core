/**
 * Evidence-derived confidence metrics.
 *
 * IMPORTANT: these metrics are measurements of supplied evidence metadata,
 * not empirical probability calibration. Missing measurements remain null.
 */
export interface ConfidenceMetricInput {
  authorityScores?: number[];
  qualityScores?: number[];
  relevanceScores?: number[];
  corroborationCount?: number;
  evidenceCount?: number;
  missingSignalsCount?: number;
  conflictCount?: number;
  recencyFactors?: number[];
}

export interface ConfidenceMetrics {
  evidenceQuality: number | null;
  sourceReliability: number | null;
  evidenceCoverage: number | null;
  recencyFactor: number | null;
  conflictPenalty: number;
  missingInfoPenalty: number;
}

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const avg = (values: number[]) => values.length ? values.reduce((a, b) => a + b, 0) / values.length : null;
const clean = (values: number[] = []) => values.filter(Number.isFinite).map(clamp01);

export function deriveConfidenceMetrics(input: ConfidenceMetricInput): ConfidenceMetrics {
  const authorities = clean(input.authorityScores);
  const qualities = clean(input.qualityScores);
  const relevance = clean(input.relevanceScores);
  const recency = clean(input.recencyFactors);

  // Do not manufacture evidence quality/reliability when the source did not provide it.
  const evidenceQuality = avg(qualities.length ? qualities : relevance);
  const sourceReliability = avg(authorities);

  const evidenceCount = Math.max(0, input.evidenceCount ?? 0);
  const corroboration = Math.max(0, input.corroborationCount ?? 0);
  const missing = Math.max(0, input.missingSignalsCount ?? 0);
  const conflicts = Math.max(0, input.conflictCount ?? 0);

  // Coverage is based on observed evidence/corroboration, with no artificial floor.
  const evidenceCoverage = evidenceCount > 0
    ? clamp01((evidenceCount + corroboration) / Math.max(1, evidenceCount * 2))
    : 0;

  return {
    evidenceQuality,
    sourceReliability,
    evidenceCoverage,
    recencyFactor: avg(recency),
    conflictPenalty: Number(Math.min(0.40, conflicts * 0.15).toFixed(2)),
    missingInfoPenalty: Number(Math.min(0.35, missing * 0.05).toFixed(2))
  };
}
