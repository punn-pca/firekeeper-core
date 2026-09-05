export type EvidenceStrength = 'High' | 'Medium' | 'Low';

/** Normalize credibility/reliability scores at the evidence boundary.
 * Accept both 0..1 and 0..100 inputs, but expose a canonical 0..100 score.
 */
export function normalizeEvidenceScore(value: unknown): number {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) return 0;
  if (n >= 0 && n <= 1) return Math.round(n * 100);
  return Math.round(Math.max(0, Math.min(100, n)));
}

export function evidenceStrengthFromScore(score: unknown): EvidenceStrength {
  const normalized = normalizeEvidenceScore(score);
  return normalized >= 85 ? 'High' : normalized >= 65 ? 'Medium' : 'Low';
}
