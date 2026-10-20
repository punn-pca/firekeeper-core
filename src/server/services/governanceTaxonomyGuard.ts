/**
 * Fail-safe for governed responses when a provider omits all visible epistemic tags.
 *
 * This deliberately does not infer claim statuses or label individual sentences.
 * It marks the response as UNVERIFIED as a whole; a human/provider retry can add
 * claim-level labels when evidence supports them. Tags inside code samples do not count.
 */
const GOVERNANCE_TAXONOMY_TAGS = new Set([
  'FACT', 'EVIDENCE', 'USER_CLAIM', 'INFERENCE', 'ASSUMPTION', 'UNCERTAINTY',
  'HYPOTHESIS', 'UNKNOWN', 'CONTRADICTION', 'CONSTRAINT', 'DECISION_GAP',
  'TRADE_OFF', 'SCENARIO', 'ESTIMATE', 'MODEL_KNOWLEDGE', 'UNVERIFIED',
]);

export function ensureGovernanceTaxonomyPresence(text: string): string {
  if (!text || !text.trim()) return text;

  // Ignore fenced code blocks so examples or source code cannot satisfy the guard.
  const withoutFencedCode = text.replace(/```[\s\S]*?```/g, '');
  const hasTaxonomyTag = /\[([A-Za-z_ -]+)\]/g;
  let match: RegExpExecArray | null;
  while ((match = hasTaxonomyTag.exec(withoutFencedCode)) !== null) {
    if (GOVERNANCE_TAXONOMY_TAGS.has(match[1].trim().toUpperCase().replace(/[ -]+/g, '_'))) {
      return text;
    }
  }

  return `[UNVERIFIED]\n\n${text}`;
}
