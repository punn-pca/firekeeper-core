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

function hasTaxonomyTag(line: string): boolean {
  const match = line.match(TAXONOMY_TAG_PATTERN);
  if (!match) return false;
  return GOVERNANCE_TAXONOMY_TAGS.has(
    match[1].trim().toUpperCase().replace(/[ -]+/g, '_')
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

  const withoutFencedCode = text.replace(/```[\s\S]*?```/g, '');
  const hasAnyTag = withoutFencedCode.split('\n').some(hasTaxonomyTag);

  if (!claimLevel) {
    return hasAnyTag ? text : `[UNVERIFIED]\n\n${text}`;
  }

  const protectedBlocks: string[] = [];
  let body = text.replace(/```[\s\S]*?```/g, (block) => {
    const key = `__FK_CODE_${protectedBlocks.length}__`;
    protectedBlocks.push(block);
    return key;
  });

  body = body.split('\n').map((line) => {
    const trimmed = line.trim();
    if (!trimmed) return line;
    if (/^#{1,6}\s/.test(trimmed)) return line;
    if (/^__FK_CODE_\d+__$/.test(trimmed)) return line;
    if (startsWithTaxonomyTag(trimmed)) return line;

    // Tables are claims too, but keep the Markdown structure intact by tagging
    // the cell content rather than breaking the row syntax.
    if (trimmed.includes('|') && trimmed.split('|').length >= 3) {
      const cells = line.split('|');
      if (cells.length >= 3) {
        for (let i = 1; i < cells.length - 1; i++) {
          const cell = cells[i].trim();
          if (cell && !startsWithTaxonomyTag(cell) && !/^:?-{3,}:?$/.test(cell)) {
            const leading = cells[i].match(/^\s*/)?.[0] || '';
            cells[i] = `${leading}[UNVERIFIED] ${cell}`;
          }
        }
        return cells.join('|');
      }
    }

    return line.replace(/^(\s*(?:[-*•]\s+|\d+[.)]\s+)?)/, '$1[UNVERIFIED] ');
  }).join('\n');

  protectedBlocks.forEach((block, index) => {
    body = body.replace(`__FK_CODE_${index}__`, block);
  });

  return body;
}
