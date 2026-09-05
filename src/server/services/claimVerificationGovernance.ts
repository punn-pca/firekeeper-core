export type GovernedVerificationStatus =
  | 'VERIFIED'
  | 'PARTIALLY_VERIFIED'
  | 'UNVERIFIED'
  | 'CONFLICTING';

export type VerificationMethod =
  | 'EXPLICIT_VERIFIER'
  | 'INDEPENDENT_CORROBORATION'
  | 'NONE';

export interface ClaimEvidenceLink {
  evidenceId: string;
  relation: 'SUPPORTS' | 'CONTRADICTS' | 'NEUTRAL' | 'CONTEXTUAL';
}

export interface ClaimVerificationInput {
  claim: string;
  evidence: Array<{ id: string; content?: string; source?: string }>;
  links?: ClaimEvidenceLink[];
  conflictingEvidenceIds?: string[];
  verificationMethod?: VerificationMethod;
}

export interface ClaimVerificationResult {
  status: GovernedVerificationStatus;
  evidenceIds: string[];
  supportingEvidenceIds: string[];
  conflictingEvidenceIds: string[];
  verificationMethod: VerificationMethod;
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
 *
 * Lexical overlap is retained only as a discovery signal for PARTIALLY_VERIFIED.
 * VERIFIED requires an explicit verification method and an explicit SUPPORTS
 * relation. Source authority alone never establishes verification.
 */
export function governClaimVerification(input: ClaimVerificationInput): ClaimVerificationResult {
  const evidence = Array.isArray(input.evidence) ? input.evidence : [];
  const links = Array.isArray(input.links) ? input.links : [];
  const claimTokens = Array.from(new Set(normalize(input.claim)));
  const evidenceIds = new Set(evidence.map((item) => item.id));
  const legacyConflicts = new Set(input.conflictingEvidenceIds || []);

  const lexicalMatches = evidence.filter((item) => {
    const tokens = new Set(normalize(`${item.source || ''} ${item.content || ''}`));
    const overlap = claimTokens.filter((token) => tokens.has(token)).length;
    return claimTokens.length > 0 && overlap / claimTokens.length >= 0.50;
  });

  const linkedSupport = links
    .filter((link) => link.relation === 'SUPPORTS' && evidenceIds.has(link.evidenceId))
    .map((link) => link.evidenceId);
  const linkedConflicts = links
    .filter((link) => link.relation === 'CONTRADICTS' && evidenceIds.has(link.evidenceId))
    .map((link) => link.evidenceId);
  const allConflicts = Array.from(new Set([
    ...Array.from(legacyConflicts).filter((id) => evidenceIds.has(id)),
    ...linkedConflicts
  ]));

  if (allConflicts.length > 0) {
    return {
      status: 'CONFLICTING',
      evidenceIds: Array.from(new Set([...linkedSupport, ...allConflicts])),
      supportingEvidenceIds: Array.from(new Set(linkedSupport)),
      conflictingEvidenceIds: allConflicts,
      verificationMethod: input.verificationMethod || 'NONE',
      reason: 'พบหลักฐานที่ระบุว่า CONTRADICTS claim; ห้ามยกระดับเป็น VERIFIED'
    };
  }

  if (input.verificationMethod !== undefined && input.verificationMethod !== 'NONE') {
    if (linkedSupport.length === 0) {
      return {
        status: lexicalMatches.length > 0 ? 'PARTIALLY_VERIFIED' : 'UNVERIFIED',
        evidenceIds: lexicalMatches.map((item) => item.id),
        supportingEvidenceIds: [],
        conflictingEvidenceIds: [],
        verificationMethod: input.verificationMethod,
        reason: 'มี verification method แต่ยังไม่มี explicit SUPPORTS relation ที่ผูกกับ evidence'
      };
    }

    return {
      status: 'VERIFIED',
      evidenceIds: Array.from(new Set(linkedSupport)),
      supportingEvidenceIds: Array.from(new Set(linkedSupport)),
      conflictingEvidenceIds: [],
      verificationMethod: input.verificationMethod,
      reason: 'มี explicit verification method และ explicit SUPPORTS relation'
    };
  }

  if (linkedSupport.length > 0) {
    return {
      status: 'PARTIALLY_VERIFIED',
      evidenceIds: Array.from(new Set(linkedSupport)),
      supportingEvidenceIds: Array.from(new Set(linkedSupport)),
      conflictingEvidenceIds: [],
      verificationMethod: 'NONE',
      reason: 'มี explicit SUPPORTS relation แต่ยังไม่มี verification method'
    };
  }

  if (lexicalMatches.length === 0) {
    return {
      status: 'UNVERIFIED',
      evidenceIds: [],
      supportingEvidenceIds: [],
      conflictingEvidenceIds: [],
      verificationMethod: 'NONE',
      reason: 'ยังไม่มีหลักฐานที่เชื่อมโยงกับ claim โดยตรงเพียงพอ'
    };
  }

  return {
    status: 'PARTIALLY_VERIFIED',
    evidenceIds: lexicalMatches.map((item) => item.id),
    supportingEvidenceIds: [],
    conflictingEvidenceIds: [],
    verificationMethod: 'NONE',
    reason: 'หลักฐานมี lexical support ต่อ claim แต่ยังไม่มี explicit claim-evidence relation และ verification method'
  };
}
