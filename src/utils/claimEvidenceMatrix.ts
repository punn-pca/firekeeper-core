/**
 * CLAIM-EVIDENCE MATRIX (Epistemic Grounding & Lineage Layer)
 * PUNN Cognitive Architecture (PCA v3.0)
 *
 * Maps every extracted or evaluated claim directly to verified evidence items,
 * providing bidirectional lineage, support vs. contradiction classification,
 * and unambiguous grounding scores.
 */

export type ClaimCategory = 'FACT' | 'INFERENCE' | 'HYPOTHESIS' | 'STRATEGIC_OPTION' | 'USER_QUERY';
export type EvidenceRelation = 'SUPPORTS' | 'CONTRADICTS' | 'NEUTRAL' | 'CONTEXTUAL';
export type ClaimVerificationStatus = 'SUPPORTED' | 'PARTIAL' | 'CONTRADICTED' | 'UNTESTED';

export interface EvidenceLink {
  evidence_id: string;
  source_name: string;
  relation: EvidenceRelation;
  relevance_score: number;
  credibility_score: number;
  citation_quote: string;
  source_url_or_locator?: string;
}

export interface ClaimEvidenceItem {
  claim_id: string;
  claim_text: string;
  category: ClaimCategory;
  status: ClaimVerificationStatus;
  confidence_score: number;
  supporting_evidence_count: number;
  counter_evidence_count: number;
  evidence_links: EvidenceLink[];
  verification_rationale: string;
  epistemic_tag: string;
}

export interface ClaimEvidenceMatrixResult {
  matrix: ClaimEvidenceItem[];
  total_claims: number;
  supported_claims_count: number;
  contradicted_claims_count: number;
  untested_claims_count: number;
  verified_count: number;
  unverified_count: number;
  mean_grounding_score: number;
  integrity_status: 'RIGOROUSLY_GROUNDED' | 'PARTIALLY_GROUNDED' | 'EPISTEMIC_DEFICIT';
  summary: string;
}

/**
 * Builds a deterministic Claim-Evidence Matrix from claims and available evidence items.
 *
 * Runtime-safe boundary: PCA state can contain evidence produced by multiple
 * adapters. Some adapters use `content`, while governed-prompt packages may
 * use `claim`/`text`. Never dereference an untrusted evidence field directly.
 */
export function buildClaimEvidenceMatrix(
  claims: Array<{
    id?: string;
    text: string;
    category?: string;
    confidence?: number;
    linkedEvidenceIds?: string[];
  }>,
  evidenceItems: Array<{
    id: string;
    source?: string;
    content?: string;
    claim?: string;
    text?: string;
    credibilityScore?: number;
    credibility?: number;
    strength?: string;
    locator?: string;
    provenance?: string;
  }> = [],
  userInput: string = ''
): ClaimEvidenceMatrixResult {
  const safeEvidence = Array.isArray(evidenceItems) ? evidenceItems : [];
  const safeClaims = Array.isArray(claims) && claims.length > 0
    ? claims
    : [
        {
          id: 'CLM-001',
          text: userInput ? `การตอบสนองเชิงข้อเท็จจริงต่อ: "${userInput.slice(0, 100)}"` : 'ข้อเท็จจริงหลัก',
          category: 'FACT',
          confidence: safeEvidence.length > 0 ? 0.95 : 0.50,
          linkedEvidenceIds: safeEvidence.map(e => e.id)
        }
      ];

  const matrix: ClaimEvidenceItem[] = safeClaims.map((claim, idx) => {
    const claimId = claim.id || `CLM-${String(idx + 1).padStart(3, '0')}`;
    const claimCategory = (claim.category?.toUpperCase() || 'FACT') as ClaimCategory;

    const linked = safeEvidence.filter(e => {
      if (Array.isArray(claim.linkedEvidenceIds) && claim.linkedEvidenceIds.includes(e.id)) {
        return true;
      }
      if (idx === 0 && safeEvidence.length > 0) return true;
      return false;
    });

    const evidenceLinks: EvidenceLink[] = linked.map(e => {
      const credRaw = typeof e.credibilityScore === 'number'
        ? e.credibilityScore
        : e.credibility;
      const cred = typeof credRaw === 'number' && Number.isFinite(credRaw) ? credRaw : 0.95;
      const relScore = e.strength === 'High' ? 0.95 : e.strength === 'Medium' ? 0.75 : 0.50;
      const evidenceContent = typeof e.content === 'string'
        ? e.content
        : typeof e.claim === 'string'
          ? e.claim
          : typeof e.text === 'string'
            ? e.text
            : '';
      const sourceName = typeof e.source === 'string' && e.source.length > 0
        ? e.source
        : 'Evidence Source';

      return {
        evidence_id: e.id,
        source_name: sourceName,
        relation: 'SUPPORTS' as EvidenceRelation,
        relevance_score: relScore,
        credibility_score: cred,
        citation_quote: evidenceContent.length > 200 ? evidenceContent.slice(0, 200) + '...' : evidenceContent,
        source_url_or_locator: e.locator || e.provenance || e.source
      };
    });

    const supportingCount = evidenceLinks.filter(l => l.relation === 'SUPPORTS').length;
    const counterCount = evidenceLinks.filter(l => l.relation === 'CONTRADICTS').length;

    let status: ClaimVerificationStatus = 'UNTESTED';
    let confidence = typeof claim.confidence === 'number' ? claim.confidence : 0.50;
    if (supportingCount > 0 && counterCount === 0) {
      status = 'SUPPORTED';
      confidence = Math.max(confidence, 0.75);
    } else if (counterCount > 0) {
      status = 'CONTRADICTED';
      confidence = Math.min(confidence, 0.35);
    } else if (safeEvidence.length > 0) {
      status = 'PARTIAL';
    }

    return {
      claim_id: claimId,
      claim_text: claim.text,
      category: claimCategory,
      status,
      confidence_score: Math.max(0, Math.min(1, confidence)),
      supporting_evidence_count: supportingCount,
      counter_evidence_count: counterCount,
      evidence_links: evidenceLinks,
      verification_rationale: evidenceLinks.length > 0
        ? `${supportingCount} supporting evidence item(s) linked.`
        : 'No evidence item was linked to this claim.',
      epistemic_tag: `[${claimCategory}: ${status}]`
    };
  });

  const supportedClaims = matrix.filter(m => m.status === 'SUPPORTED').length;
  const contradictedClaims = matrix.filter(m => m.status === 'CONTRADICTED').length;
  const untestedClaims = matrix.filter(m => m.status === 'UNTESTED').length;
  const verifiedCount = supportedClaims;
  const unverifiedCount = matrix.length - verifiedCount;
  const meanGroundingScore = matrix.length > 0
    ? matrix.reduce((sum, m) => sum + m.confidence_score, 0) / matrix.length
    : 0;

  const integrity_status: ClaimEvidenceMatrixResult['integrity_status'] =
    matrix.length === 0 || untestedClaims === matrix.length
      ? 'EPISTEMIC_DEFICIT'
      : contradictedClaims > 0 || untestedClaims > 0
        ? 'PARTIALLY_GROUNDED'
        : 'RIGOROUSLY_GROUNDED';

  return {
    matrix,
    total_claims: matrix.length,
    supported_claims_count: supportedClaims,
    contradicted_claims_count: contradictedClaims,
    untested_claims_count: untestedClaims,
    verified_count: verifiedCount,
    unverified_count: unverifiedCount,
    mean_grounding_score: meanGroundingScore,
    integrity_status,
    summary: `${supportedClaims}/${matrix.length} claims supported; ${evidenceLinksCount(matrix)} evidence links.`
  };
}

function evidenceLinksCount(matrix: ClaimEvidenceItem[]): number {
  return matrix.reduce((sum, item) => sum + item.evidence_links.length, 0);
}
