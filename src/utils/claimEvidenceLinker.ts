import { ClaimEvidenceLink } from '../server/services/claimVerificationGovernance';

export interface LinkableEvidence {
  id: string;
  source?: string;
  content?: string;
}

export interface ClaimEvidenceLinkResult {
  links: ClaimEvidenceLink[];
  scores: Array<{ evidenceId: string; supportScore: number; contradictionScore: number; relation: ClaimEvidenceLink['relation'] }>;
  method: 'CONSERVATIVE_LEXICAL';
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

/**
 * Conservative linker: produces relations for downstream governance, but never
 * treats lexical similarity as verification. Contradiction detection is limited
 * to explicit negation markers, so uncertain cases remain NEUTRAL.
 */
export function linkClaimEvidence(claim: string, evidence: LinkableEvidence[]): ClaimEvidenceLinkResult {
  const claimTokens = tokens(claim);
  const links: ClaimEvidenceLink[] = [];
  const scores: ClaimEvidenceLinkResult['scores'] = [];
  const warnings = ['Lexical linking is a discovery signal; it cannot independently establish VERIFIED.'];

  for (const item of Array.isArray(evidence) ? evidence : []) {
    const evidenceText = String(item.content || '');
    const evidenceTokens = tokens(`${item.source || ''} ${evidenceText}`);
    const supportScore = Number(overlap(claimTokens, evidenceTokens).toFixed(2));
    const contradictionScore = /\b(no|not|false|incorrect|denied|reject|contradict|decrease|decline)\b|ไม่ใช่|ไม่จริง|ปฏิเสธ|ขัดแย้ง|ลดลง|ไม่พบ/i.test(evidenceText)
      ? supportScore
      : 0;

    let relation: ClaimEvidenceLink['relation'] = 'NEUTRAL';
    if (supportScore >= 0.50 && contradictionScore === 0) relation = 'SUPPORTS';
    else if (contradictionScore >= 0.50) relation = 'CONTRADICTS';
    else if (supportScore >= 0.25) relation = 'CONTEXTUAL';

    links.push({ evidenceId: item.id, relation });
    scores.push({ evidenceId: item.id, supportScore, contradictionScore, relation });
  }

  return { links, scores, method: 'CONSERVATIVE_LEXICAL', warnings };
}
