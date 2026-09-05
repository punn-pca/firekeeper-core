import * as legacy from './pcaEngineLegacy';
import { ConversationTurn, EvidenceItem } from '../../types';
import { calculateGovernedContextAuditMetrics } from './contextAuditGovernance';
import { governClaimVerification } from './claimVerificationGovernance';
import { linkClaimEvidence } from '../../utils/claimEvidenceLinker';
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

/** Map verification state to claim confidence without leaking source credibility into epistemic confidence. */
function confidenceFromVerification(
  status: 'VERIFIED' | 'PARTIALLY_VERIFIED' | 'UNVERIFIED' | 'CONFLICTING'
): 'HIGH' | 'MEDIUM' | 'LOW' {
  switch (status) {
    case 'VERIFIED': return 'HIGH';
    case 'PARTIALLY_VERIFIED': return 'MEDIUM';
    case 'UNVERIFIED':
    case 'CONFLICTING':
    default: return 'LOW';
  }
}

/**
 * Production evidence retrieval boundary.
 *
 * Legacy retrieval may contain heuristic fallbacks. Those fallbacks are not
 * admissible as source-backed evidence: if no actual evidence list was
 * retrieved, expose the result as unavailable/unverified instead of inventing
 * provenance, publication time, or confidence.
 *
 * Retrieval acquires evidence; the linker proposes relations; the verification
 * gate decides whether those relations are sufficient for a verification state.
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
      evidenceQuality: 'NONE',
      claimEvidenceLinks: [],
      crossCheckResults: 'ไม่สามารถยืนยันจากแหล่งข้อมูลภายนอกได้',
      content: 'ไม่สามารถดึงหลักฐานจากแหล่งข้อมูลภายนอกได้',
      searchQueries: [query],
      evidenceList: [],
      isUnavailable: true
    };
  }

  const linking = linkClaimEvidence(query, evidenceList.map((item) => ({
    id: item.id,
    source: item.source,
    content: item.content
  })));

  const verification = governClaimVerification({
    claim: query,
    evidence: evidenceList.map((item) => ({
      id: item.id,
      source: item.source,
      content: item.content
    })),
    links: linking.links
  });

  const distinctSources = new Set(
    evidenceList.map((item) => String(item.source || '').trim()).filter(Boolean)
  ).size;
  const evidenceQuality = evidenceList.length > 0
    ? (evidenceList.some((item) => (item.credibilityScore || 0) >= 85) ? 'HIGH' : 'MEDIUM')
    : 'NONE';

  return {
    ...result,
    evidenceList,
    claimEvidenceLinks: linking.links,
    claimEvidenceLinkScores: linking.scores,
    claimEvidenceLinkMethod: linking.method,
    verificationStatus: verification.status,
    confidence: confidenceFromVerification(verification.status),
    evidenceQuality,
    crossCheckResults: [
      `Evidence retrieval: ${evidenceList.length} source(s) retrieved`,
      `distinct source labels: ${distinctSources}`,
      'independent corroboration: NOT_ESTABLISHED',
      `Claim verification: ${verification.status} — ${verification.reason}`,
      `Linker: ${linking.method}`
    ].join(' | ')
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
