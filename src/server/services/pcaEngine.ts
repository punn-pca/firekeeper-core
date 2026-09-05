import * as legacy from './pcaEngineLegacy';
import { ConversationTurn } from '../../types';
import { calculateGovernedContextAuditMetrics } from './contextAuditGovernance';

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

/**
 * Production context-audit boundary.
 *
 * The legacy implementation contains hardcoded coverage/relevance claims.
 * Production callers receive metrics computed only from explicit context
 * signals; missing signals are not upgraded to verified relevance.
 */
export function calculateContextAuditMetrics(rankedMemories: any[]) {
  const memories = Array.isArray(rankedMemories) ? rankedMemories : [];
  const turns: ConversationTurn[] = memories.map((memory: any) => ({
    role: 'user',
    content: String(memory?.content || '')
  } as ConversationTurn));

  return calculateGovernedContextAuditMetrics(turns);
}

/**
 * Production compressed-context boundary.
 *
 * Preserve the legacy compression/content extraction algorithm while replacing
 * its synthetic audit metrics with conservative computed metrics.
 */
export function generateCompressedContext(history: ConversationTurn[], existingCompressed?: any) {
  const result = legacy.generateCompressedContext(history, existingCompressed);
  return {
    ...result,
    auditMetrics: calculateGovernedContextAuditMetrics(Array.isArray(history) ? history : [])
  };
}
