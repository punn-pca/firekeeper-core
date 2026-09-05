import * as legacy from './pcaEngineLegacy';

export * from './pcaEngineLegacy';

/**
 * Production evidence retrieval boundary.
 *
 * Legacy retrieval may contain heuristic fallbacks. Those fallbacks are not
 * admissible as source-backed evidence: if no actual evidence list was
 * retrieved, expose the result as unavailable/unverified instead of inventing
 * provenance, publication time, or confidence.
 */
export async function retrieveExternalEvidenceAsync(
  query: string,
  route: string
) {
  const result = await legacy.retrieveExternalEvidenceAsync(query, route);
  const evidenceList = Array.isArray((result as any)?.evidenceList)
    ? (result as any).evidenceList
    : [];

  if (evidenceList.length === 0) {
    return {
      ...result,
      source: 'UNAVAILABLE',
      sourceType: 'unavailable',
      provenance: '',
      retrievedAt: (result as any)?.retrievedAt || new Date().toISOString(),
      publishedAt: '',
      verificationStatus: 'UNVERIFIED',
      confidence: 'LOW',
      crossCheckResults: 'ไม่สามารถยืนยันจากแหล่งข้อมูลภายนอกได้',
      content: 'ไม่สามารถดึงหลักฐานจากแหล่งข้อมูลภายนอกได้',
      searchQueries: [query],
      evidenceList: [],
      isUnavailable: true
    };
  }

  return result;
}
