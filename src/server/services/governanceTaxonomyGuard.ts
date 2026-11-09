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
  'TRADE_OFF', 'SCENARIO', 'ESTIMATE', 'MODEL_KNOWLEDGE', 'UNVERIFIED', 'RECOMMENDATION', 'RISK',
]);

export function ensureGovernanceTaxonomyPresence(text: string, claimLevel = false): string {
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

  if (!claimLevel) return `[UNVERIFIED]\n\n${text}`;

  // For decision/analysis responses, enforce claim-level visibility without
  // pretending to know the correct epistemic class. Existing provider tags are
  // preserved; only untagged material lines are conservatively marked UNVERIFIED.
  const protectedBlocks: string[] = [];
  let body = text.replace(/\`\`\`[\\s\\S]*?\`\`\`/g, (block) => {
    const key = `__FK_CODE_${protectedBlocks.length}__`;
    protectedBlocks.push(block);
    return key;
  });
  body = body.split(/\\n/).map((line) => {
    const trimmed = line.trim();
    if (!trimmed || /^#{1,6}\\s/.test(trimmed) || /^__FK_CODE_\\d+__$/.test(trimmed)) return line;
    if (/\\[([A-Za-z_ -]+)\\]/.test(trimmed)) return line;
    return line.replace(/^(\\s*(?:[-*•]\\s+|\\d+[.)]\\s+)?)/, '$1[UNVERIFIED] ');
  }).join('\\n');
  protectedBlocks.forEach((block, index) => {
    body = body.replace(`__FK_CODE_${index}__`, block);
  });
  return body;
}
