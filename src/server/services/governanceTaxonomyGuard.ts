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

function inferConservativeTag(line: string): string {
  const text = line.replace(/^(?:[-*•]\s+|\d+[.)]\s+)/, '').replace(/^\*\*/, '').trim();
  if (/^(?:คำแนะนำ|ข้อเสนอแนะ|แนะนำว่า|ควร(?:เลือก|เรียน|ทำ|พิจารณา)|recommendation|recommend|i recommend|you should)\b/i.test(text) || /^คำแนะนำ\s*:/i.test(text)) return '[RECOMMENDATION]';
  if (/(?:ยังขาด|ข้อมูลยังไม่พอ|ข้อมูลไม่เพียงพอ|ยังไม่มีข้อมูล|ยังไม่สามารถสรุป|ไม่เพียงพอที่จะตัดสินใจ|decision gap|missing information)/i.test(text)) return '[DECISION_GAP]';
  if (/(?:อาจ|น่าจะ|มีแนวโน้ม|เป็นไปได้|สมมติว่า|หาก|ถ้า|ถ้าหาก|might|may|could|possibly|hypothes(?:is|ize)|assuming)\b/i.test(text)) return '[HYPOTHESIS]';
  if (/(?:ดังนั้น|จึง|จึงควร|เพราะ|เนื่องจาก|เมื่อพิจารณา|สอดคล้องกับ|therefore|because|based on)/i.test(text)) return '[INFERENCE]';
  return '[UNVERIFIED]';
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

  // Governed mode must preserve model/runtime claim semantics. If the response
  // contains no visible epistemic tag, fail conservatively by marking the whole
  // response UNVERIFIED. Do not manufacture claim-level tags from sentence
  // heuristics: that can turn a recommendation into a FACT or an inference into
  // a false certainty.
  const withoutFencedCode = text.replace(/```[\s\S]*?```/g, '');
  const hasAnyTag = withoutFencedCode.split('\n').some(hasTaxonomyTag);

  // claimLevel is intentionally retained for API compatibility. The semantic
  // labeling decision belongs to the governed model/runtime, not this fallback.
  void claimLevel;
  return hasAnyTag ? text : '[UNVERIFIED]\n\n' + text;
}
