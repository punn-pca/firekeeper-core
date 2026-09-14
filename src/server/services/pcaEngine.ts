import * as legacy from './pcaEngineLegacy';
import { ConversationTurn, EvidenceItem, ConflictRecord } from '../../types';
import { calculateGovernedContextAuditMetrics } from './contextAuditGovernance';
import { governClaimVerification } from './claimVerificationGovernance';
import { linkClaimEvidence } from '../../utils/claimEvidenceLinker';
import { evidenceStrengthFromScore, normalizeEvidenceScore } from '../../utils/evidenceScoreNormalization';
import { evaluateDecisionRelevance, performCounterfactualAudit, detectConflicts } from './pcaEpistemicAnalysis';
import { ControlActivationPlan } from '../../types';

export * from './pcaEngineLegacy';

/** Normalize externally produced evidence scores to the canonical 0..100 unit and perform PCA v3.0 analysis. */
function normalizeAndAnalyzeEvidenceList(query: string, items: EvidenceItem[], activationPlan?: ControlActivationPlan): { items: EvidenceItem[], conflicts: ConflictRecord[] } {
  const normalized = items.map((item) => {
    const credibilityScore = normalizeEvidenceScore(item.credibilityScore);
    const reliabilityScore = item.reliabilityScore === undefined
      ? undefined
      : normalizeEvidenceScore(item.reliabilityScore);
    
    const enriched: EvidenceItem = {
      ...item,
      credibilityScore,
      reliabilityScore,
      strength: evidenceStrengthFromScore(credibilityScore)
    };

    // Adaptive PCA v3.0 Analysis
    if (activationPlan?.evidenceGrounding === 'REQUIRED') {
      enriched.relevance = evaluateDecisionRelevance(query, enriched);
    }
    
    if (activationPlan?.counterfactualAudit === 'REQUIRED') {
      enriched.counterfactualImpact = performCounterfactualAudit(enriched);
    }

    return enriched;
  });

  const conflicts: ConflictRecord[] = [];
  if (activationPlan?.conflictDetection === 'REQUIRED') {
    for (let i = 0; i < normalized.length; i++) {
      for (let j = i + 1; j < normalized.length; j++) {
        const conflict = detectConflicts(normalized[i], normalized[j]);
        if (conflict) {
          conflicts.push(conflict);
          normalized[i].isContradictory = true;
          normalized[j].isContradictory = true;
          normalized[i].conflictId = conflict.id;
          normalized[j].conflictId = conflict.id;
        }
      }
    }
  }

  return { items: normalized, conflicts };
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
 */
export async function retrieveExternalEvidenceAsync(
  query: string, 
  route: string, 
  options?: { searchEnabled?: boolean, activationPlan?: ControlActivationPlan }
) {
  const result = await legacy.retrieveExternalEvidenceAsync(query, route, options);
  const rawEvidence = Array.isArray((result as any)?.evidenceList)
    ? (result as any).evidenceList
    : [];

  const { items: evidenceList, conflicts } = normalizeAndAnalyzeEvidenceList(query, rawEvidence, options?.activationPlan);

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
      isUnavailable: true,
      conflicts: []
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
    conflicts,
    claimEvidenceLinks: linking.links,
    claimEvidenceLinkScores: linking.scores,
    claimEvidenceLinkMethod: linking.method,
    verificationStatus: conflicts.length > 0 ? 'CONFLICTING' : verification.status,
    confidence: confidenceFromVerification(conflicts.length > 0 ? 'CONFLICTING' : verification.status),
    evidenceQuality,
    crossCheckResults: [
      `Evidence retrieval: ${evidenceList.length} source(s) retrieved`,
      `distinct source labels: ${distinctSources}`,
      `conflicts detected: ${conflicts.length}`,
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
