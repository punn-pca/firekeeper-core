import { ClaimEvidenceLink } from '../server/services/claimVerificationGovernance';
export type { ClaimEvidenceLink };

export interface LinkableEvidence {
  id: string;
  source?: string;
  content?: string;
  sourceUrl?: string;
  locator?: string;
  documentId?: string;
}

export interface ClaimEvidenceLinkResult {
  links: ClaimEvidenceLink[];
  scores: Array<{
    evidenceId: string;
    supportScore: number;
    contradictionScore: number;
    relation: ClaimEvidenceLink['relation'];
    numericConsistency: 'MATCH' | 'MISMATCH' | 'NOT_APPLICABLE';
    yearConsistency: 'MATCH' | 'MISMATCH' | 'NOT_APPLICABLE';
  }>;
  method: 'CONSERVATIVE_DISCOVERY_ONLY';
  warnings: string[];
}

function normalize(text: string): string {
  return String(text || '').toLowerCase().replace(/[^\p{L}\p{N}%]+/gu, ' ').trim();
}

function tokens(text: string): Set<string> {
  return new Set(normalize(text).split(/\s+/).filter((token) => token.length >= 2));
}

function overlap(a: Set<string>, b: Set<string>): number {
  if (a.size === 0) return 0;
  let matched = 0;
  for (const token of a) if (b.has(token)) matched += 1;
  return matched / a.size;
}

function numericTokens(text: string): string[] {
  return Array.from(String(text || '').matchAll(/\b\d+(?:[.,]\d+)?%?\b/g), (match) => match[0].replace(',', '.'));
}

function yearTokens(text: string): string[] {
  return Array.from(String(text || '').matchAll(/\b(?:19|20)\d{2}\b/g), (match) => match[0]);
}

function hasExplicitContradiction(text: string): boolean {
  // Thai has no reliable regex word-boundary semantics. Match explicit
  // contradiction phrases only; never treat the substring "ไม่" inside an
  // unrelated Thai word (for example "ใหม่") as negation.
  return /\b(no|not|false|incorrect|denied|reject|contradict|decrease|decline)\b|(?:^|[\s,.;:!?()\[\]{}"'“”‘’])(?:ไม่ใช่|ไม่จริง|ไม่พบ)(?=$|[\s,.;:!?()\[\]{}"'“”‘’])|ปฏิเสธ|ขัดแย้ง|ลดลง/iu.test(String(text || ''));
}

function propositionTokens(text: string): Set<string> {
  const excluded = new Set([
    'the', 'a', 'an', 'is', 'are', 'was', 'were', 'has', 'have', 'had',
    'มี', 'เป็น', 'คือ', 'และ', 'ของ', 'ใน', 'ปี', 'ว่า', 'ที่',
    'หรือไม่', 'ไหม', 'ใช่หรือไม่', 'หรือเปล่า', 'หรือ'
  ]);
  return new Set(Array.from(tokens(text)).filter((token) => !excluded.has(token)));
}

/**
 * Conservative relation discovery. This is intentionally asymmetric:
 * - Lexical/propositional overlap is candidate discovery only and never establishes SUPPORTS.
 * - CONTRADICTS requires strong overlap plus an explicit contradiction signal or a structured mismatch (numeric/year).
 * - Affirmative semantic support is reserved for the adversarial verifier; this linker returns CONTEXTUAL/NEUTRAL otherwise.
 *
 * Source authority is never used to infer an epistemic relation.
 */
export function linkClaimEvidence(claim: string, evidence: LinkableEvidence[]): ClaimEvidenceLinkResult {
  const claimTokens = propositionTokens(claim);
  const claimNumbers = numericTokens(claim);
  const claimYears = yearTokens(claim);
  const links: ClaimEvidenceLink[] = [];
  const scores: ClaimEvidenceLinkResult['scores'] = [];
  const warnings = [
    'Linking is deterministic candidate discovery only, not semantic verification.',
    'Lexical overlap MUST NOT establish SUPPORTS. Only explicit structured contradictions may be classified here; semantic support requires an adversarial verifier.',
    'Source authority/credibility is deliberately excluded from relation scoring.'
  ];

  for (const item of Array.isArray(evidence) ? evidence : []) {
    const evidenceText = String(item.content || '');
    const evidenceTokens = propositionTokens(`${item.source || ''} ${evidenceText}`);
    const supportScore = Number(overlap(claimTokens, evidenceTokens).toFixed(2));
    const evidenceNumbers = numericTokens(evidenceText);
    const evidenceYears = yearTokens(evidenceText);

    const numericConsistency: 'MATCH' | 'MISMATCH' | 'NOT_APPLICABLE' = claimNumbers.length === 0
      ? 'NOT_APPLICABLE'
      : claimNumbers.every((value) => evidenceNumbers.includes(value))
        ? 'MATCH'
        : 'MISMATCH';

    const yearConsistency: 'MATCH' | 'MISMATCH' | 'NOT_APPLICABLE' = claimYears.length === 0
      ? 'NOT_APPLICABLE'
      : claimYears.every((value) => evidenceYears.includes(value))
        ? 'MATCH'
        : 'MISMATCH';

    const strongOverlap = supportScore >= 0.70;
    const explicitContradiction = hasExplicitContradiction(evidenceText);
    const structuredContradiction = (supportScore >= 0.50)
      && ((numericConsistency === 'MISMATCH') || (yearConsistency === 'MISMATCH'));
    const contradictionScore = (explicitContradiction || structuredContradiction) && (supportScore >= 0.50)
      ? Math.max(supportScore, 0.85)
      : (explicitContradiction || structuredContradiction) ? supportScore : 0;

    let relation: ClaimEvidenceLink['relation'] = 'NEUTRAL';
    if (contradictionScore >= 0.70) {
      relation = 'CONTRADICTS';
    } else if (strongOverlap && numericConsistency !== 'MISMATCH' && yearConsistency !== 'MISMATCH') {
      relation = 'CONTEXTUAL';
    } else if (supportScore >= 0.35) {
      relation = 'CONTEXTUAL';
    }

    links.push({ evidenceId: item.id, relation });
    scores.push({
      evidenceId: item.id,
      supportScore,
      contradictionScore,
      relation,
      numericConsistency,
      yearConsistency
    });
  }

  return { links, scores, method: 'CONSERVATIVE_DISCOVERY_ONLY', warnings };
}
