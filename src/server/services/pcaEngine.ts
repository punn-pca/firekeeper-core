import { performWebSearch } from './webSearch';
import { sanitizeErrorForLog } from '../security/sanitizeError';
import { ConversationTurn, EvidenceItem, ConflictRecord } from '../../types';
import { calculateGovernedContextAuditMetrics } from './contextAuditGovernance';
import { assessClaimEvidence } from './evidenceGovernanceCore';
import { evidenceStrengthFromScore, normalizeEvidenceScore } from '../../utils/evidenceScoreNormalization';
import { evaluateDecisionRelevance, performCounterfactualAudit, detectConflicts } from './pcaEpistemicAnalysis';
import { ControlActivationPlan } from '../../types';
import { searchXEvidence } from './xEvidenceProvider';

// Compatibility exports are intentionally explicit. Production callers should
// import through this canonical module rather than binding to pcaEngineLegacy.
export {
  detectLanguage,
  runStage,
  parseAttachmentSingle,
  rerankAndFilterEvidence,
  routeKnowledge,
  classifyInputDocument,
  rankAndRetrieveMemories,
  recordStageTrace,
} from './pcaEngineLegacy';

export type {
  MemoryRecord,
  PCAStateInternal,
} from './pcaEngineLegacy';

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
  const nowStr = new Date().toISOString();
  let result: any;

  if (options?.searchEnabled === false) {
    result = {
      source: 'OFFLINE_MODE',
      sourceType: 'none',
      provenance: '',
      retrievedAt: nowStr,
      publishedAt: '',
      verificationStatus: 'UNVERIFIED',
      confidence: 'LOW',
      crossCheckResults: 'Search Mode ปิดอยู่: ระบบข้ามการสืบค้นและดึงข้อมูลภายนอกทั้งหมดตามคำสั่งผู้ใช้',
      content: 'ไม่ได้ดึงข้อมูลภายนอกเนื่องจากโหมดการค้นหาถูกปิดใช้งาน',
      isUnavailable: true,
      evidenceList: []
    };
  } else {
    try {
      const searchRes = await performWebSearch(query, { maxResults: 6 });
      if (searchRes.success && searchRes.results.length > 0) {
        const topResult = searchRes.results[0];
        const evidenceList: EvidenceItem[] = searchRes.results.map((item, index) => ({
          id: `web-ev-${index + 1}`,
          source: item.sourceDomain,
          content: `[${item.title}] ${item.snippet}`,
          sourceUrl: item.url,
          credibilityScore: Math.round(item.credibilityScore * 100),
          reliabilityScore: Math.round(item.credibilityScore * 100),
          strength: item.credibilityScore >= 0.85 ? 'High' : (item.credibilityScore >= 0.65 ? 'Medium' : 'Low'),
          type: 'Empirical' as const,
          citationQuote: item.snippet
        }));
        result = {
          source: `${topResult.sourceDomain} - ${topResult.title}`,
          sourceType: topResult.sourceType,
          provenance: topResult.url,
          retrievedAt: nowStr,
          publishedAt: topResult.publishedAt || '',
          verificationStatus: 'UNVERIFIED',
          confidence: 'LOW',
          crossCheckResults: `ดึงผลการสืบค้นจากเว็บ ${searchRes.results.length} แหล่ง; รอการประเมิน claim-evidence`,
          content: searchRes.results.map((item, index) => `[${index + 1}] ${item.title} (${item.sourceDomain}): ${item.snippet}`).join('\n\n'),
          searchQueries: searchRes.searchQueries,
          evidenceList
        };
      }
    } catch (err) {
      console.warn('[PCA Engine] performWebSearch failed:', sanitizeErrorForLog(err));
    }

    result ||= {
      source: 'UNAVAILABLE',
      sourceType: 'unavailable',
      provenance: '',
      retrievedAt: nowStr,
      publishedAt: '',
      verificationStatus: 'UNVERIFIED',
      confidence: 'LOW',
      crossCheckResults: 'ไม่พบหลักฐานภายนอกที่ตรวจสอบได้จากการสืบค้นครั้งนี้',
      content: 'ไม่สามารถดึงหลักฐานจากแหล่งข้อมูลภายนอกที่ตรวจสอบได้',
      searchQueries: [String(query || '').toLowerCase().trim()],
      isUnavailable: true,
      evidenceList: []
    };
  }
  const rawEvidence = Array.isArray((result as any)?.evidenceList)
    ? (result as any).evidenceList
    : [];

  // X is a selective external evidence source: only call it when the user
  // explicitly asks about X/social discourse or when the query is freshness-sensitive.
  // This avoids spending X API quota on timeless questions.
  const shouldSearchX = (() => {
    if (options?.searchEnabled === false) return false;
    const normalizedQuery = String(query || '').toLowerCase();
    const signals = [
      /(^|\\s)x(\\s|$)/,
      /twitter/,
      /ทวิต(?:เตอร์)?/,
      /โซเชียล/,
      /social\\s+media/,
      /กระแส/,
      /คนพูดถึง/,
      /พูดถึงอะไร/,
      /ล่าสุด/,
      /ข่าวล่าสุด/,
      /วันนี้/,
      /ตอนนี้/,
      /current/,
      /latest/,
      /breaking/,
      /trending/,
    ];
    return signals.some((signal) => signal.test(normalizedQuery));
  })();

  const xResult = shouldSearchX
    ? await searchXEvidence(query)
    : { enabled: false, evidenceList: [], searchQuery: query };

  const combinedEvidence = [
    ...rawEvidence,
    ...xResult.evidenceList.filter((xItem) =>
      !rawEvidence.some((item: EvidenceItem) => item.sourceUrl && item.sourceUrl === xItem.sourceUrl)
    ),
  ];

  const { items: evidenceList, conflicts } = normalizeAndAnalyzeEvidenceList(query, combinedEvidence, options?.activationPlan);

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

  const assessment = assessClaimEvidence({
    claim: query,
    evidence: evidenceList.map((item) => ({
      id: item.id,
      source: item.source,
      content: item.content
    }))
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
    claimEvidenceLinks: assessment.links,
    claimEvidenceLinkScores: assessment.linkScores,
    claimEvidenceLinkMethod: assessment.linkMethod,
    verificationStatus: conflicts.length > 0 ? 'CONFLICTING' : assessment.verificationStatus,
    confidence: confidenceFromVerification(conflicts.length > 0 ? 'CONFLICTING' : assessment.verificationStatus),
    evidenceQuality,
    crossCheckResults: [
      `Evidence retrieval: ${evidenceList.length} source(s) retrieved`,
      `distinct source labels: ${distinctSources}`,
      `conflicts detected: ${conflicts.length}`,
      `Claim verification: ${assessment.verificationStatus} — ${assessment.verificationReason}`,
      `Linker: ${assessment.linkMethod}`
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

/** Canonical context compression with governed audit metrics. */
export function generateCompressedContext(history: ConversationTurn[], existingCompressed?: any) {
  const turns = Array.isArray(history) ? history : [];
  const auditMetrics = calculateGovernedContextAuditMetrics(turns);

  if (turns.length === 0) {
    return {
      goal: 'ยังไม่มีบริบทประวัติการสนทนาในเซสชันนี้',
      facts: [],
      constraints: ['คุ้มครองเสรีภาพการตัดสินใจของผู้ใช้ (Preserve Human Agency)'],
      evidence: [],
      decision: [],
      openQuestions: [],
      auditMetrics,
      metrics: {
        originalEstimatedTokens: 0,
        compressedTokens: 0,
        reductionPercentage: 0,
        turnsCompressed: 0,
        lastCompressedAt: new Date().toISOString(),
      },
    };
  }

  const rawChars = turns.reduce((sum, turn) => sum + (turn.content || '').length, 0);
  const originalEstimatedTokens = Math.max(120, Math.round(rawChars * 0.75));
  const noiseRegex = /^(สวัสดี|สวัสดีครับ|สวัสดีค่ะ|หวัดดี|ขอบคุณ|ขอบคุณครับ|ขอบคุณค่ะ|hello|hi|thanks|thank you|ok|โอเค|กระผม|ดิฉัน)\b/i;
  const filteredTurns = turns.filter((turn) => {
    const text = (turn.content || '').trim();
    return !(text.length < 15 && noiseRegex.test(text));
  });
  const userTurns = filteredTurns.filter((turn) => turn.role === 'user');

  let goal = existingCompressed?.goal || '';
  if (userTurns.length > 0) {
    const firstUserQuery = userTurns[0].content.replace(noiseRegex, '').trim();
    const latestUserQuery = userTurns[userTurns.length - 1].content.replace(noiseRegex, '').trim();
    goal = firstUserQuery === latestUserQuery || userTurns.length === 1
      ? `วิเคราะห์เชิงลึกและเสนอแนะยุทธศาสตร์สำหรับโจทย์: "${firstUserQuery.slice(0, 150)}"`
      : `ประมวลผลยุทธศาสตร์หลัก: "${firstUserQuery.slice(0, 120)}" พร้อมประเด็นติดตาม: "${latestUserQuery.slice(0, 120)}"`;
  }

  const factsSet = new Set<string>(existingCompressed?.facts || []);
  filteredTurns.forEach((turn) => {
    const content = turn.content || '';
    const factMatches = content.match(/\[ข้อเท็จจริง\][^\n]+/g) || content.match(/Fact:[^\n]+/g);
    factMatches?.forEach((fact) => factsSet.add(fact.replace(/\[ข้อเท็จจริง\]|Fact:/, '').trim()));
  });

  const compressedTokens = Math.max(40, Math.round(originalEstimatedTokens * 0.35));
  return {
    goal,
    facts: Array.from(factsSet).slice(0, 8),
    constraints: ['รักษา Human Agency ของผู้ใช้เสมอ ห้ามตัดสินใจแทนมนุษย์อย่างเด็ดขาด'],
    evidence: [],
    decision: [],
    openQuestions: [],
    auditMetrics,
    metrics: {
      originalEstimatedTokens,
      compressedTokens,
      reductionPercentage: Number((((originalEstimatedTokens - compressedTokens) / originalEstimatedTokens) * 100).toFixed(1)) || 0,
      turnsCompressed: turns.length,
      lastCompressedAt: new Date().toISOString(),
    },
  };
}
