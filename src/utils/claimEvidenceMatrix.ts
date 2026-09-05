/**
 * CLAIM-EVIDENCE MATRIX (Epistemic Grounding & Lineage Layer)
 * PUNN Cognitive Architecture (PCA v3.0)
 *
 * Maps claims to explicitly linked evidence without silently treating all
 * retrieved evidence as proof. Evidence quality is kept separate from claim
 * verification and Bayesian probability.
 */

export type ClaimCategory = 'FACT' | 'INFERENCE' | 'HYPOTHESIS' | 'STRATEGIC_OPTION' | 'USER_QUERY';
export type EvidenceRelation = 'SUPPORTS' | 'CONTRADICTS' | 'NEUTRAL' | 'CONTEXTUAL';
export type ClaimVerificationStatus = 'SUPPORTED' | 'PARTIAL' | 'CONTRADICTED' | 'UNTESTED';

export interface EvidenceLink {
  evidence_id: string;
  source_name: string;
  relation: EvidenceRelation;
  relevance_score: number; // 0.0 - 1.0
  credibility_score: number; // normalized to 0.0 - 1.0
  citation_quote: string;
  source_url_or_locator?: string;
}

export interface ClaimEvidenceItem {
  claim_id: string;
  claim_text: string;
  category: ClaimCategory;
  status: ClaimVerificationStatus;
  confidence_score: number; // 0.0 - 1.0; conservative claim-level confidence
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

function normalizeCredibility(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return 0;
  // Existing Firekeeper evidence can use either 0..1 or 0..100.
  if (value > 1 && value <= 100) return Number((value / 100).toFixed(4));
  return Math.max(0, Math.min(1, value));
}

function normalizeScore(value: unknown, fallback: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback;
  if (value > 1 && value <= 100) return Number((value / 100).toFixed(4));
  return Math.max(0, Math.min(1, value));
}

/**
 * Builds a deterministic Claim-Evidence Matrix from claims and available evidence.
 *
 * Governance rule: evidence is linked only when the claim explicitly names the
 * evidence ID. The first claim no longer receives every retrieved source by
 * default. This prevents retrieval availability from being mistaken for support.
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
    source: string;
    content: string;
    claim?: string;
    text?: string;
    credibilityScore?: number;
    relevanceScore?: number;
    strength?: string;
    locator?: string;
    provenance?: string;
    relation?: EvidenceRelation;
  }> = [],
  userInput: string = ''
): ClaimEvidenceMatrixResult {
  const safeEvidence = Array.isArray(evidenceItems) ? evidenceItems : [];
  const safeClaims = Array.isArray(claims) && claims.length > 0
    ? claims
    : [
        {
          id: 'CLM-001',
          text: userInput ? `ข้อความที่ต้องตรวจสอบ: "${userInput.slice(0, 100)}"` : 'ข้อกล่าวอ้างหลัก',
          category: 'FACT',
          confidence: 0.50,
          linkedEvidenceIds: []
        }
      ];

  const matrix: ClaimEvidenceItem[] = safeClaims.map((claim, idx) => {
    const claimId = claim.id || `CLM-${String(idx + 1).padStart(3, '0')}`;
    const rawCategory = claim.category?.toUpperCase() || 'FACT';
    const claimCategory: ClaimCategory = (
      ['FACT', 'INFERENCE', 'HYPOTHESIS', 'STRATEGIC_OPTION', 'USER_QUERY'].includes(rawCategory)
        ? rawCategory
        : 'FACT'
    ) as ClaimCategory;

    const linkedIds = new Set(Array.isArray(claim.linkedEvidenceIds) ? claim.linkedEvidenceIds : []);
    const linked = safeEvidence.filter(e => linkedIds.has(e.id));

    const evidenceLinks: EvidenceLink[] = linked.map(e => {
      const credibility = normalizeCredibility(e.credibilityScore);
      const relevance = normalizeScore(e.relevanceScore, 0.50);
      const relation: EvidenceRelation = e.relation || 'SUPPORTS';
      const evidenceContent = typeof e.content === 'string'
        ? e.content
        : typeof e.claim === 'string'
          ? e.claim
          : typeof e.text === 'string'
            ? e.text
            : '';

      return {
        evidence_id: e.id,
        source_name: e.source || 'Unknown Evidence Source',
        relation,
        relevance_score: relevance,
        credibility_score: credibility,
        citation_quote: evidenceContent.length > 200 ? evidenceContent.slice(0, 200) + '...' : evidenceContent,
        source_url_or_locator: e.locator || e.provenance || e.source
      };
    });

    const supportingCount = evidenceLinks.filter(l => l.relation === 'SUPPORTS').length;
    const counterCount = evidenceLinks.filter(l => l.relation === 'CONTRADICTS').length;
    const hasEvidence = evidenceLinks.length > 0;

    let status: ClaimVerificationStatus = 'UNTESTED';
    const suppliedConfidence = normalizeScore(claim.confidence, 0.50);
    let confidence = suppliedConfidence;
    let rationale = '';

    if (supportingCount > 0 && counterCount === 0) {
      status = 'SUPPORTED';
      // Do not manufacture confidence from evidence presence. Preserve the
      // supplied claim confidence and let grounding be reported separately.
      confidence = suppliedConfidence;
      rationale = `มีหลักฐานที่ถูกเชื่อมโยงอย่าง explicit และระบุความสัมพันธ์ SUPPORTS จำนวน ${supportingCount} รายการ`;
    } else if (counterCount > 0 && supportingCount > 0) {
      status = 'PARTIAL';
      confidence = Math.min(suppliedConfidence, 0.50);
      rationale = `พบหลักฐานทั้งสนับสนุน (${supportingCount}) และโต้แย้ง (${counterCount}) จึงไม่สรุปเป็นข้อยืนยันเด็ดขาด`;
    } else if (counterCount > 0) {
      status = 'CONTRADICTED';
      confidence = Math.min(suppliedConfidence, 0.15);
      rationale = `พบหลักฐานที่ถูกเชื่อมโยงและระบุความสัมพันธ์ CONTRADICTS จำนวน ${counterCount} รายการ`;
    } else if (hasEvidence) {
      status = 'UNTESTED';
      confidence = Math.min(suppliedConfidence, 0.45);
      rationale = 'มีหลักฐานที่เชื่อมโยง แต่ไม่มีความสัมพันธ์ SUPPORTS/CONTRADICTS ที่ใช้ยืนยันข้อกล่าวอ้าง';
    } else {
      status = 'UNTESTED';
      confidence = Math.min(suppliedConfidence, 0.45);
      rationale = 'ไม่มีหลักฐานที่ถูกเชื่อมโยงอย่าง explicit ในบริบทนี้ จัดเป็นข้อความที่รอการพิสูจน์';
    }

    const epistemicTag = status === 'SUPPORTED'
      ? `[${claimCategory}: SUPPORTED]`
      : status === 'CONTRADICTED'
        ? `[${claimCategory}: CONTRADICTED]`
        : status === 'PARTIAL'
          ? `[${claimCategory}: PARTIAL]`
          : `[${claimCategory}: UNTESTED]`;

    return {
      claim_id: claimId,
      claim_text: claim.text,
      category: claimCategory,
      status,
      confidence_score: Number(confidence.toFixed(2)),
      supporting_evidence_count: supportingCount,
      counter_evidence_count: counterCount,
      evidence_links: evidenceLinks,
      verification_rationale: rationale,
      epistemic_tag: epistemicTag,
    };
  });

  const supportedCount = matrix.filter(m => m.status === 'SUPPORTED').length;
  const contradictedCount = matrix.filter(m => m.status === 'CONTRADICTED').length;
  const untestedCount = matrix.filter(m => m.status === 'UNTESTED').length;

  const groundingScores = matrix.flatMap(m => m.evidence_links.map(l => l.relevance_score * l.credibility_score));
  const meanGrounding = groundingScores.length > 0
    ? Number((groundingScores.reduce((sum, score) => sum + score, 0) / groundingScores.length).toFixed(2))
    : 0;

  const integrityStatus: ClaimEvidenceMatrixResult['integrity_status'] =
    matrix.length === 0 || groundingScores.length === 0
      ? 'EPISTEMIC_DEFICIT'
      : meanGrounding >= 0.80 && untestedCount === 0
        ? 'RIGOROUSLY_GROUNDED'
        : 'PARTIALLY_GROUNDED';

  return {
    matrix,
    total_claims: matrix.length,
    supported_claims_count: supportedCount,
    contradicted_claims_count: contradictedCount,
    untested_claims_count: untestedCount,
    // "verified" is intentionally conservative: SUPPORTS is not equivalent to
    // independent verification, so only explicitly verified pipelines should
    // increment this field. This matrix itself does not manufacture verification.
    verified_count: 0,
    unverified_count: matrix.length,
    mean_grounding_score: meanGrounding,
    integrity_status: integrityStatus,
    summary: `ประเมินข้อความ ${matrix.length} รายการ: สนับสนุน ${supportedCount}, โต้แย้ง ${contradictedCount}, รอการพิสูจน์ ${untestedCount}; grounding เฉลี่ย ${(meanGrounding * 100).toFixed(0)}%`
  };
}
