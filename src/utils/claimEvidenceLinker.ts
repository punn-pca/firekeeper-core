import { ClaimEvidenceLink } from '../server/services/claimVerificationGovernance';

export interface LinkableEvidence {
  id: string;
  source?: string;
  content?: string;
}

export interface ClaimEvidenceLinkResult {
  links: ClaimEvidenceLink[];
  scores: Array<{
    evidenceId: string;
    supportScore: number;
    contradictionScore: number;
    relation: ClaimEvidenceLink['relation'];
    numericConsistency: 'MATCH' | 'MISMATCH' | 'NOT_APPLICABLE';
  }>;
  method: 'CONSERVATIVE_STRUCTURED_LEXICAL';
  warnings: string[];
}

function tokens(text: string): Set<string> {
  return new Set(String(text || '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .split(/\s+/)
    .filter((token) => token.length >= 2));
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
  return /\b(no|not|false|incorrect|denied|reject|contradict|decrease|decline)\b|ไม่ใช่|ไม่จริง|ปฏิเสธ|ขัดแย้ง|ลดลง|ไม่พบ/i.test(text);
}

/**
 * Conservative relation discovery. Structured numeric/year checks are used to
 * reduce false SUPPORTS, while ambiguous evidence remains NEUTRAL/CONTEXTUAL.
 * This layer never establishes verification and never uses source authority as
 * an epistemic signal.
 */
export function linkClaimEvidence(claim: string, evidence: LinkableEvidence[]): ClaimEvidenceLinkResult {
  const claimTokens = tokens(claim);
  const claimNumbers = numericTokens(claim);
  const claimYears = yearTokens(claim);
  const links: ClaimEvidenceLink[] = [];
  const scores: ClaimEvidenceLinkResult['scores'] = [];
  const warnings = [
    'Lexical/structured linking is a discovery signal; it cannot independently establish VERIFIED.',
    'Numeric/year mismatch can downgrade a relation, but absence of mismatch does not prove semantic equivalence.'
  ];

  for (const item of Array.isArray(evidence) ? evidence : []) {
    const evidenceText = String(item.content || '');
    const evidenceTokens = tokens(`${item.source || ''} ${evidenceText}`);
    const supportScore = Number(overlap(claimTokens, evidenceTokens).toFixed(2));
    const evidenceNumbers = numericTokens(evidenceText);
    const evidenceYears = yearTokens(evidenceText);
    const hasNumericSignal = claimNumbers.length > 0;
    const numericConsistent = hasNumericSignal
      ? claimNumbers.every((value) => evidenceNumbers.includes(value))
        ? 'MATCH'
        : 'MISMATCH'
      : 'NOT_APPLICABLE';
    const yearConsistent = claimYears.length > 0
      ? claimYears.every((value) => evidenceYears.includes(value))
      : true;

    const contradictionMarker = hasExplicitContradiction(evidenceText);
    const structuredContradiction = supportScore >= 0.50
      && ((hasNumericSignal && numericConsistent === 'MISMATCH') || !yearConsistent);
    const contradictionScore = (contradictionMarker || structuredContradiction) ? supportScore : 0;

    let relation: ClaimEvidenceLink['relation'] = 'NEUTRAL';
    if (contradictionScore >= 0.50) relation = 'CONTRADICTS';
    else if (supportScore >= 0.50 && numericConsistent !== 'MISMATCH' && yearConsistent) relation = 'SUPPORTS';
    else if (supportScore >= 0.25) relation = 'CONTEXTUAL';

    links.push({ evidenceId: item.id, relation });
    scores.push({ evidenceId: item.id, supportScore, contradictionScore, relation, numericConsistency: numericConsistent });
  }

  return { links, scores, method: 'CONSERVATIVE_STRUCTURED_LEXICAL', warnings };
}
