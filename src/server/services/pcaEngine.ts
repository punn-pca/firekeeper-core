import * as legacy from './pcaEngineLegacy';
import { ConversationTurn, EvidenceItem } from '../../types';
import { calculateGovernedContextAuditMetrics } from './contextAuditGovernance';
import { governClaimVerification } from './claimVerificationGovernance';
import { evidenceStrengthFromScore, normalizeEvidenceScore } from '../../utils/evidenceScoreNormalization';

export * from './pcaEngineLegacy';

/** Normalize externally produced evidence scores to the canonical 0..100 unit. */
function normalizeEvidenceList(items: EvidenceItem[]): EvidenceItem[] {
  return items.map((item) => {
    const credibilityScore = normalizeEvidenceScore(item.credibilityScore);
    const reliabilityScore = item.reliabilityScore === undefined
      ? undefined
      : normalizeEvidenceScore(item.reliabilityScore);
    return {
      ...item,
      credibilityScore,
      reliabilityScore,
      strength: evidenceStrengthFromScore(credibilityScore)
    };
  });
}

/**
 * Production evidence retrieval boundary.
 *
 * Legacy retrieval may contain heuristic fallbacks. Those fallbacks are not
 * admissible as source-backed evidence: if no actual evidence list was
 * retrieved, expose the result as unavailable/unverified instead of inventing
 * provenance, publication time, or confidence.
 *
 * A successful retrieval is evidence acquisition, not claim verification.
 */
export async function retrieveExternalEvidenceAsync(query: string, route: string) {
  const result = await legacy.retrieveExternalEvidenceAsync(query, route);
  const evidenceList = Array.isArray((result as any)?.evidenceList)
    ? normalizeEvidenceList((result as any).evidenceList)
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

  const verification = governClaimVerification({
    claim: query,
    evidence: evidenceList.map((item) => ({
      id: item.id,
      source: item.source,
      content: item.content
    }))
  });

  return {
    ...result,
    evidenceList,
    verificationStatus: verification.status,
    crossCheckResults: `${result.crossCheckResults || ''} | Claim verification: ${verification.status} — ${verification.reason}`
  };
}

/** Production context-audit boundary using only explicit context signals. */
export function calculateContextAuditMetrics(rankedMemories: any[]) {
  const memories = Array.isArray(rankedMemories) ? rankedMemories : [];
  const turns: ConversationTurn[] = memories.map((memory: any) => ({
    role: 'user',
    content: String(memory?.content || '')
  } as ConversationTurn));
  return calculateGovernedContextAuditMetrics(turns);
}

/** Preserve legacy compression while replacing synthetic audit metrics. */
export function generateCompressedContext(history: ConversationTurn[], existingCompressed?: any) {
  const result = legacy.generateCompressedContext(history, existingCompressed);
  return {
    ...result,
    auditMetrics: calculateGovernedContextAuditMetrics(Array.isArray(history) ? history : [])
  };
}
