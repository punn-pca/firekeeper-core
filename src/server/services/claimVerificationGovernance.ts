export type GovernedVerificationStatus =
  | 'VERIFIED'
  | 'PARTIALLY_VERIFIED'
  | 'UNVERIFIED'
  | 'CONFLICTING';

export interface ClaimVerificationInput {
  claim: string;
  evidence: Array<{ id: string; content?: string; source?: string }>;
  conflictingEvidenceIds?: string[];
  explicitVerification?: boolean;
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
 * Retrieval and lexical overlap establish support signals only. VERIFIED is
 * reserved for an explicit verification method/result supplied by a trusted
 * verifier; a web search result alone can never manufacture verification.
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

  if (evidence.some((item) => conflicts.has(item.id))) {
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

  if (input.explicitVerification === true) {
    return {
      status: 'VERIFIED',
      evidenceIds: matched.map((item) => item.id),
      reason: 'มี explicit verification result จาก verification layer และพบ evidence linkage'
    };
  }

  return {
    status: 'PARTIALLY_VERIFIED',
    evidenceIds: matched.map((item) => item.id),
    reason: 'หลักฐานมี lexical support ต่อ claim แต่ retrieval เพียงอย่างเดียวไม่ถือเป็น verification'
  };
}
