import { performWebSearch } from './webSearch';
import { sanitizeErrorForLog } from '../security/sanitizeError';
import { ConversationTurn, EvidenceItem, ConflictRecord } from '../../types';
import { calculateGovernedContextAuditMetrics } from './contextAuditGovernance';
import { assessClaimEvidence } from './evidenceGovernanceCore';
import { evidenceStrengthFromScore, normalizeEvidenceScore } from '../../utils/evidenceScoreNormalization';
import { evaluateDecisionRelevance, performCounterfactualAudit, detectConflicts } from './pcaEpistemicAnalysis';
import { ControlActivationPlan } from '../../types';
import { searchXEvidence } from './xEvidenceProvider';

/** Detect the dominant user language without depending on the legacy PCA implementation. */
export function detectLanguage(text: string): 'th' | 'en' {
  const thaiMatches = text.match(/[\u0E00-\u0E7F]/g) || [];
  const englishMatches = text.match(/[a-zA-Z]/g) || [];
  if (thaiMatches.length === 0) return 'en';

  const totalLetters = thaiMatches.length + englishMatches.length;
  if (totalLetters > 50) {
    const enRatio = englishMatches.length / totalLetters;
    if (enRatio > 0.8) return 'en';
    const techTokens = text.match(/\b(trace|runtime|logic|bayesian|system|id|hash|metadata|pipeline|intent)\b/gi);
    if (techTokens && techTokens.length > 3 && enRatio > 0.5) return 'en';
  }
  return 'th';
}

export function routeKnowledge(query: string, attachments: any[]): {
  route: 'General' | 'Personal Context' | 'Current' | 'Specialized' | 'Mixed';
  justification: string;
  decisionFlow: string[];
} {
  const queryLower = (query || '').toLowerCase().trim();
  const isTemporal = /(นายก|รัฐมนตรี|ราคา|หุ้น|สภาพอากาศ|สถิติ|ล่าสุด|ปัจจุบัน|ข่าว|เหตุการณ์|today|current|now|latest|price|weather|stock|news|president|pm|ใครดำรงตำแหน่ง|คนปัจจุบัน)/i.test(queryLower);
  const isPersonal = /(ฉัน|ผม|ประวัติ|ของฉัน|คุย|สนทนา|my|me|personal|history|ความทรงจำ)/i.test(queryLower);
  const isSpecialized = /(กฎหมาย|พ\.ร\.บ\.|iso|nist|พระราชบัญญัติ|ระเบียบ|มาตรฐาน|law|act|regulation|compliance|standard|42001)/i.test(queryLower);
  const flow = [
    `Analyzing User Query: "${query.slice(0, 50)}..."`,
    `Step 1: Check Temporal Sensitivity Signal: ${isTemporal ? 'DETECTED' : 'NOT DETECTED'}`,
    `Step 2: Check Domain Specialization (ISO/Legal/NIST) Signal: ${isSpecialized ? 'DETECTED' : 'NOT DETECTED'}`,
    `Step 3: Check Personal Context / Continuity Signal: ${isPersonal ? 'DETECTED' : 'NOT DETECTED'}`,
  ];
  if (isTemporal) { flow.push('Decision: Route to [CURRENT] and activate External Retrieval Engine.'); return { route: 'Current', justification: 'พบสัญญาณความอ่อนไหวเชิงเวลา (Temporal Sensitivity) เช่น การถามตำแหน่ง ข่าวสาร ราคา สถิติ หรือสภาวะปัจจุบัน จึงนำทางเข้าสู่ชั้นประมวลผลข้อมูลภายนอก (External Retrieval Layer)', decisionFlow: flow }; }
  if (isSpecialized) { flow.push('Decision: Route to [SPECIALIZED] and activate Authoritative Databases.'); return { route: 'Specialized', justification: 'พบสัญญาณหัวข้อเชิงเทคนิคหรือข้อกำหนดมาตรฐานระดับสากล (ISO/NIST/PDPA) จึงนำทางเข้าสู่ฐานความรู้อ้างอิงที่เป็นทางการ (Authoritative Databases)', decisionFlow: flow }; }
  if (isPersonal) { flow.push('Decision: Route to [PERSONAL CONTEXT] and load Long-Term Memory.'); return { route: 'Personal Context', justification: 'พบสัญญาณอ้างอิงถึงตัวตนของผู้ใช้หรือความทรงจำที่สะสมไว้ จึงนำทางเข้าสู่ Long-Term Memory (LTM) เพื่อรักษาความต่อเนื่อง', decisionFlow: flow }; }
  if (attachments && attachments.length > 0) { flow.push('Decision: Route to [MIXED] as attachments are provided.'); return { route: 'Mixed', justification: 'ตรวจพบเอกสารหรือไฟล์แนบร่วมกับการวิเคราะห์ จึงประมวลผลแบบผสมผสานหลายแหล่งข้อมูล (Mixed Multi-source Layer)', decisionFlow: flow }; }
  flow.push('Decision: Route to [GENERAL] as no specific signal was detected.');
  return { route: 'General', justification: 'เป็นคำถามทั่วไปที่ไม่มีคุณสมบัติเฉพาะตัวเป็นพิเศษ จึงใช้ความรู้ดั้งเดิมร่วมกับ Cognitive Engine ทั่วไป', decisionFlow: flow };
}

export function classifyInputDocument(inputText: string, attachments: any[]): {
  isReportOrReference: boolean;
  documentType: string;
  detectedHeadings: string[];
  skipRedundantAssessment: boolean;
} {
  const text = (inputText || '') + ' ' + (attachments || []).map((a) => a.textContent || a.name || '').join(' ');
  const length = text.trim().length;
  const hasStructuralHeadings = /Executive Summary|สรุปผู้บริหาร|Introduction|บทนำ|Conclusion|บทสรุป|Section|Chapter|#\s+รายงาน|#\s+Report|สารบัญ|Table of Contents/i.test(text);
  const isLongReport = length > 2500 && hasStructuralHeadings;
  if (isLongReport || (attachments && attachments.some((a) => a.type === 'application/pdf' || (a.textContent && a.textContent.length > 2000)))) {
    const headings: string[] = [];
    if (/Executive Summary|สรุปผู้บริหาร/i.test(text)) headings.push('Executive Summary');
    if (/Introduction|บทนำ/i.test(text)) headings.push('Introduction');
    if (/Conclusion|บทสรุป/i.test(text)) headings.push('Conclusion');
    if (/Section|Chapter/i.test(text)) headings.push('Structured Sections');
    return { isReportOrReference: true, documentType: length > 5000 ? 'Executive Report' : 'Technical Document', detectedHeadings: headings, skipRedundantAssessment: true };
  }
  return { isReportOrReference: false, documentType: 'Standard Question', detectedHeadings: [], skipRedundantAssessment: false };
}

export function rankAndRetrieveMemories(query: string, bank: MemoryRecord[]) {
  if (!bank || bank.length === 0) return [];
  const queryTerms = (query || '').toLowerCase()
    .replace(/[.,\\/#!$%\\^&\\*;:{}=\\-_\`~()?"']/g, ' ')
    .split(/\\s+/)
    .filter((term) => term.length > 1);
  const matched = bank.map((memory) => {
    let score = 0.05;
    const contentLower = (memory.content || '').toLowerCase();
    queryTerms.forEach((term) => { if (contentLower.includes(term)) score += 0.25; });
    if (memory.layer === 'Constraint' || memory.layer === 'System') score += 0.15;
    const relevanceScore = Number(Math.min(0.99, score).toFixed(2));
    return {
      ...memory,
      relevanceScore,
      decision: relevanceScore >= 0.12 ? 'ACCEPT' as const : 'ISOLATE' as const,
      is_isolated: relevanceScore < 0.12,
      isolation_reason: relevanceScore < 0.12 ? 'Relevance score below the isolation threshold (0.12)' : undefined,
    };
  });
  return matched.sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));
}

// Compatibility exports are intentionally explicit. Production callers should
// import through this canonical module rather than binding to pcaEngineLegacy.
export {
  runStage,
  parseAttachmentSingle,
  rerankAndFilterEvidence,
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
