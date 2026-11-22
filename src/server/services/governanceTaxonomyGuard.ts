/**
 * Fail-safe taxonomy visibility for governed responses.
 *
 * The guard never invents FACT/INFERENCE/RECOMMENDATION semantics. When
 * claim-level enforcement is requested, any material untagged line is marked
 * [UNVERIFIED] so the UI cannot present an unlabeled analytical claim as known.
 */
const GOVERNANCE_TAXONOMY_TAGS = new Set([
  'FACT', 'EVIDENCE', 'USER_CLAIM', 'INFERENCE', 'ASSUMPTION', 'UNCERTAINTY',
  'HYPOTHESIS', 'UNKNOWN', 'CONTRADICTION', 'CONSTRAINT', 'DECISION_GAP',
  'TRADE_OFF', 'SCENARIO', 'ESTIMATE', 'MODEL_KNOWLEDGE', 'UNVERIFIED',
  'RECOMMENDATION', 'RISK',
]);

const TAXONOMY_TAG_PATTERN = /\[([A-Za-z_ -]+)\]/;

function normalizeTag(raw: string): string {
  return raw.trim().toUpperCase().replace(/[ -]+/g, '_');
}

function hasTaxonomyTag(line: string): boolean {
  const match = line.match(TAXONOMY_TAG_PATTERN);
  if (!match) return false;
  return GOVERNANCE_TAXONOMY_TAGS.has(
    normalizeTag(match[1])
  );
}

// In claim-level mode, a tag anywhere in a sentence must not certify
// preceding unlabelled text. Only a leading claim label protects the line.
function startsWithTaxonomyTag(line: string): boolean {
  const normalized = line.trim().replace(/^(?:[-*•]\s+|\d+[.)]\s+)?/, '');
  const candidate = normalized.replace(/^\*\*/, '').trimStart();
  const match = candidate.match(/^\[([A-Za-z_ -]+)\]/);
  if (!match) return false;
  return GOVERNANCE_TAXONOMY_TAGS.has(
    match[1].trim().toUpperCase().replace(/[ -]+/g, '_')
  );
}

export function ensureGovernanceTaxonomyPresence(text: string, claimLevel = false): string {
  if (!text || !text.trim()) return text;

  // Never infer semantic labels. In claim-level governed output, every non-empty
  // line must carry an explicit valid taxonomy tag or fail closed as UNVERIFIED.
  const lines = text.split('\n');
  const hasAnyTag = lines.some((line) => hasTaxonomyTag(line));
  if (!hasAnyTag) return '[UNVERIFIED]\n\n' + text;
  if (!claimLevel) return text;

  let insideCodeFence = false;
  return lines.map((line) => {
    if (/^\s*```/.test(line)) {
      insideCodeFence = !insideCodeFence;
      return line;
    }
    if (insideCodeFence || !line.trim()) return line;
    return startsWithTaxonomyTag(line) ? line : '[UNVERIFIED] ' + line;
  }).join('\n');
}
