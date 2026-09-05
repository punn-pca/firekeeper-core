export type GovernedVerificationStatus =
  | 'VERIFIED'
  | 'PARTIALLY_VERIFIED'
  | 'UNVERIFIED'
  | 'CONFLICTING';

export interface ClaimVerificationInput {
  claim: string;
  evidence: Array<{ id: string; content?: string; source?: string }>;
  conflictingEvidenceIds?: string[];
}

export interface ClaimVerificationResult {
  status: GovernedVerificationStatus;
  evidenceIds: string[];
  reason: string;
}

function normalize(text: string): string[] {
  return String(text || '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .split(/\s+/)
    .filter((token) => token.length >= 2);
}

/**
 * Conservative claim/evidence gate.
 * Retrieval alone is not verification. A claim can only be VERIFIED when
 * explicit evidence has substantial lexical overlap with the claim and no
 * contradiction signal is present. Partial overlap is PARTIALLY_VERIFIED.
 */
export function governClaimVerification(input: ClaimVerificationInput): ClaimVerificationResult {
  const evidence = Array.isArray(input.evidence) ? input.evidence : [];
  const claimTokens = Array.from(new Set(normalize(input.claim)));
  const conflicts = new Set(input.conflictingEvidenceIds || []);
  const matched = evidence.filter((item) => {
    const tokens = new Set(normalize(`${item.source || ''} ${item.content || ''}`));
    const overlap = claimTokens.filter((token) => tokens.has(token)).length;
    return claimTokens.length > 0 && overlap / claimTokens.length >= 0.50;
  });

  const hasConflict = evidence.some((item) => conflicts.has(item.id));
  if (hasConflict) {
    return {
      status: 'CONFLICTING',
      evidenceIds: matched.map((item) => item.id),
      reason: 'พบหลักฐานที่ถูกระบุว่า conflicting; ห้ามยกระดับ claim เป็น VERIFIED'
    };
  }

  if (matched.length === 0) {
    return {
      status: 'UNVERIFIED',
      evidenceIds: [],
      reason: 'พบผลการค้น/หลักฐาน แต่ยังไม่มีหลักฐานที่เชื่อมโยงกับ claim โดยตรงเพียงพอ'
    };
  }

  const allRelevant = evidence.length > 0 && matched.length === evidence.length;
  return {
    status: allRelevant ? 'VERIFIED' : 'PARTIALLY_VERIFIED',
    evidenceIds: matched.map((item) => item.id),
    reason: allRelevant
      ? 'หลักฐานที่ดึงมาเชื่อมโยงกับ claim โดยตรงตาม lexical evidence gate และไม่พบ conflict ที่ประกาศไว้'
      : 'มีหลักฐานบางส่วนเชื่อมโยงกับ claim แต่ยังไม่ครอบคลุมหลักฐานทั้งหมด'
  };
}
