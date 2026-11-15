export type EvidenceBindingStatus =
  | 'PASS'
  | 'ZERO_CITATIONS_IN_RECOMMENDATION'
  | 'HALLUCINATED_EVIDENCE_IDS'
  | 'UNSUPPORTED_CLAIM'
  | 'NO_EVIDENCE';

export interface EvidenceBindingAuditResult {
  passed: boolean;
  status: EvidenceBindingStatus;
  citedEvidenceIds: string[];
  invalidEvidenceIds: string[];
  recommendationClaimsWithoutCitation: string[];
  details: string[];
}

function normalizeEvidence(evidence: any[]): Array<{
  id: string;
  source: string;
  content: string;
  status?: string;
  sourceUrl?: string;
  url?: string;
  locator?: string;
  documentId?: string;
  verificationMethod?: string;
}> {
  const seen = new Set<string>();
  const out: Array<{ id: string; source: string; content: string; status?: string; sourceUrl?: string; url?: string; locator?: string; documentId?: string; verificationMethod?: string }> = [];

  for (const item of Array.isArray(evidence) ? evidence : []) {
    const source = String(item?.source ?? item?.sourceUrl ?? item?.url ?? item?.locator ?? '').trim();
    const sourceUrl = String(item?.sourceUrl ?? '').trim();
    const content = String(item?.citationQuote ?? item?.claim ?? item?.content ?? '').trim();
    const title = String(item?.title ?? '').trim();
    const key = `${source}::${title}::${content.slice(0, 120)}`;
    if (!content && !source) continue;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({
      id: `E${out.length + 1}`,
      source,
      content,
      status: String(item?.evidence_status ?? item?.verificationStatus ?? item?.status ?? ''),
      sourceUrl: sourceUrl || undefined,
      url: String(item?.url ?? '').trim() || undefined,
      locator: String(item?.locator ?? '').trim() || undefined,
      documentId: String(item?.documentId ?? '').trim() || undefined,
      verificationMethod: String(item?.verificationMethod ?? '').trim() || undefined,
    });
  }

  return out;
}

/**
 * Deterministic citation audit. This validates identifier integrity and
 * sentence-level citation presence. Semantic support remains a separate
 * verifier boundary; this function never treats citation syntax as proof.
 */
export function auditRecommendationCitations(
  recommendationText: string,
  evidence: any[],
): EvidenceBindingAuditResult {
  const normalized = normalizeEvidence(evidence);
  const validIds = new Set(normalized.map((item) => item.id));
  const citedEvidenceIds = [...recommendationText.matchAll(/\[(E\d+)\]/g)]
    .map((match) => match[1]);

  const uniqueCitedIds = [...new Set(citedEvidenceIds)];
  const invalidEvidenceIds = uniqueCitedIds.filter((id) => !validIds.has(id));

  if (!normalized.length) {
    return {
      passed: recommendationText.trim().length === 0,
      status: recommendationText.trim().length === 0 ? 'PASS' : 'NO_EVIDENCE',
      citedEvidenceIds: uniqueCitedIds,
      invalidEvidenceIds: [],
      recommendationClaimsWithoutCitation: recommendationText.trim() ? [recommendationText.trim()] : [],
      details: ['No governed evidence was available for recommendation binding.'],
    };
  }

  const allLines = recommendationText
    .split(/\n+/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .filter((line) => !/^#{1,6}\s+/.test(line))
    .filter((line) => !/^\[(FACT|EVIDENCE|INFERENCE|ASSUMPTION|UNCERTAINTY|UNVERIFIED|UNKNOWN)\]\s*$/i.test(line));

  const recommendationSectionMatch = recommendationText.match(
    /(?:^|\n)#{0,6}\s*(?:คำแนะนำ|recommendation|ข้อเสนอแนะ|current recommendation)\s*:?\s*\n?([\s\S]*?)(?=\n#{1,6}\s+|\n(?:คำถามต่อยอด|follow[- ]?up questions)\s*:|$)/i
  );

  // Recommendation detection must work with Thai text, where \b is not a
  // reliable word boundary and words are commonly not separated by spaces.
  // Keep the detector deterministic and conservative: use Thai intent markers
  // plus explicit imperative patterns, while avoiding false positives such as
  // "นำเสนอ" (present) when matching "เสนอ".
  const recommendationKeywordPattern =
    /(?:^|[\\s:：\\-–—•])(?:ควร|แนะนำ|ข้อเสนอ|ทางเลือกที่แนะนำ|recommend(?:ed|ation)?|should|propose)(?=$|[\\s:：\\-–—•]|[,.!?])/iu;
  const recommendationThaiVerbPattern =
    /(?:^|[\\s:：\\-–—•])(?:เสนอ|แนะนำ)(?=$|[\\s:：\\-–—•]|[,.!?])/iu;
  const recommendationImperativePattern =
    /(?:^|[\\s:：\\-–—•])ให้(?:ซื้อ|เลือก|ใช้|ทำ|ดำเนินการ|พิจารณา|ตรวจสอบ|ติดต่อ|เปรียบเทียบ|หยุด|เริ่ม|ยกเลิก)(?=$|[\\s:：\\-–—•]|[,.!?])/iu;

  const isRecommendationLine = (line: string): boolean =>
    recommendationKeywordPattern.test(line) ||
    recommendationThaiVerbPattern.test(line) ||
    recommendationImperativePattern.test(line);

  const recommendationLines = recommendationSectionMatch
    ? recommendationSectionMatch[1].split(/\n+/).map((line) => line.trim()).filter(Boolean)
    : allLines.filter(isRecommendationLine);

  const recommendationClaimsWithoutCitation = recommendationLines.filter((line) => {
    if (/^[-*•]\s*$/.test(line)) return false;
    if (/\[E\d+\]/.test(line)) return false;
    return !/^\s*(คำถามต่อยอด|question|หมายเหตุ|note)\s*:/i.test(line);
  });

  if (invalidEvidenceIds.length) {
    return {
      passed: false,
      status: 'HALLUCINATED_EVIDENCE_IDS',
      citedEvidenceIds: uniqueCitedIds,
      invalidEvidenceIds,
      recommendationClaimsWithoutCitation,
      details: [`Unknown evidence IDs: ${invalidEvidenceIds.join(', ')}`],
    };
  }

  // Distinguish the "no citations anywhere in the recommendation" case from
  // the mixed case where at least one recommendation claim is cited but another
  // claim is not. This keeps ZERO_CITATIONS_IN_RECOMMENDATION reachable.
  if (recommendationLines.length > 0 && uniqueCitedIds.length === 0) {
    return {
      passed: false,
      status: 'ZERO_CITATIONS_IN_RECOMMENDATION',
      citedEvidenceIds: [],
      invalidEvidenceIds: [],
      recommendationClaimsWithoutCitation: recommendationLines.slice(0, 10),
      details: ['Recommendation contains text but no Evidence ID citations.'],
    };
  }

  if (recommendationClaimsWithoutCitation.length) {
    return {
      passed: false,
      status: 'UNSUPPORTED_CLAIM',
      citedEvidenceIds: uniqueCitedIds,
      invalidEvidenceIds: [],
      recommendationClaimsWithoutCitation: recommendationClaimsWithoutCitation.slice(0, 10),
      details: ['Recommendation contains claim lines without an Evidence ID citation.'],
    };
  }

  return {
    passed: true,
    status: 'PASS',
    citedEvidenceIds: uniqueCitedIds,
    invalidEvidenceIds: [],
    recommendationClaimsWithoutCitation: [],
    details: ['Recommendation Evidence IDs resolve to the normalized evidence set.'],
  };
}

export function normalizeDecisionEvidence(evidence: any[]): any[] {
  return normalizeEvidence(evidence).map((item) => ({
    id: item.id,
    source: item.source,
    content: item.content,
    evidence_status: item.status || 'UNVERIFIED',
    sourceUrl: item.sourceUrl,
    url: item.url,
    locator: item.locator,
    documentId: item.documentId,
    verificationMethod: item.verificationMethod || 'SOURCE_RETRIEVAL_CHECK',
  }));
}
