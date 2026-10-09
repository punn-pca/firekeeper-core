/**
 * Server-owned temporal and epistemic guardrails for PCA responses.
 * This does not certify claims or replace source-based verification.
 */
export function buildRuntimeGrounding(now: Date = new Date()): string {
  if (!Number.isFinite(now.getTime())) throw new Error('Invalid runtime date');
  return [
    'SERVER RUNTIME CONTEXT (authoritative for date comparisons):',
    `CURRENT_TIMESTAMP_UTC: ${now.toISOString()}`,
    `CURRENT_DATE_UTC: ${now.toISOString().slice(0, 10)}`,
    'Use the supplied current date rather than guessing from training cutoff.',
    'Do not claim that an earlier year is in the future.',
    'Distinguish hypothetical user inputs from independently verified evidence.',
    'Hypothetical numbers may be used for conditional calculations without external verification.',
    'Check all factual assertions in the final explanation, not just the user claim.',
    'Do not invent award categories, researchers, papers, institutions, or source URLs.',
    'If evidence is unavailable, say it is unverified; do not assert nonexistence.',
  ].join('\n');
}
