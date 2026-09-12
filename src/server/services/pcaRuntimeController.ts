/**
 * PUNN Predictive Cognitive Architecture (PCA v3.0)
 * Runtime Orchestration, Memory Router, Deterministic Validator & Observability Trace
 *
 * Implements the 3-Layer Architecture:
 * 1. Orchestration Layer (Request classification, Priority resolution, Semantic memory router, Model router, Response depth controller)
 * 2. Model Layer (Inference only - does not grade itself)
 * 3. Validation Layer (Deterministic schema, policy, language, proportionality & identity validators)
 * + Runtime Trace & Observability
 */

import { ProcessDepth } from './pcaGovernance';
import { auditAndEnforcePunnPersona } from './punnPersonaGovernance';

// ─────────────────────────────────────────────────────────────────────────────
// 1. RUNTIME TRACE CONTRACT
// ─────────────────────────────────────────────────────────────────────────────

export interface RuntimeMemoryTrace {
  retrieved: number;
  accepted: number;
  rejected: number;
  acceptedIds: string[];
  relevanceScores: Record<string, number>;
}

export interface RuntimeValidationTrace {
  schema: 'PASS' | 'FAIL' | 'SKIPPED';
  policy: 'PASS' | 'FAIL' | 'REVISED';
  language: 'PASS' | 'FAIL' | 'REVISED';
  responseProportionality: 'PASS' | 'FAIL' | 'ADJUSTED';
  identity: 'PASS' | 'FAIL' | 'REVISED';
  violations: string[];
}

export interface RuntimeTrace {
  requestId: string;
  timestamp: string;
  model: {
    requested: string;
    resolved: string;
    provider: string;
    decisionAuthority: string;
  };
  language: {
    detected: string;
    requested?: string;
    enforced: string;
  };
  classification: {
    intent: string;
    complexityScore: number;      // 0 - 10
    uncertaintyScore: number;     // 0 - 10
    decisionImpactScore: number;  // 0 - 10
    totalScore: number;
  };
  responseMode: 'DIRECT' | 'BRIEF' | 'STRUCTURED' | 'DEEP';
  processDepth: ProcessDepth;
  memory: RuntimeMemoryTrace;
  policies: string[];
  conflicts: string[];
  validation: RuntimeValidationTrace;
  metrics: {
    durationMs: number;
    inputTokensEstimated: number;
    outputTokensEstimated: number;
    wordCount: number;
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. DEFECT #1 — NUMERIC RESPONSE CONTROLLER (Score-based L0-L3)
// ─────────────────────────────────────────────────────────────────────────────

export interface RuntimeControllerScore {
  complexityScore: number;      // 0 - 3
  uncertaintyScore: number;     // 0 - 3
  decisionImpactScore: number;  // 0 - 3
  userRequestedDepthScore: number; // 0 - 3
  totalScore: number;
  mode: 'DIRECT' | 'BRIEF' | 'STRUCTURED' | 'DEEP';
  depth: ProcessDepth;
  reasoning: string;
}

/**
 * Calculates deterministic runtime complexity & response depth score
 * score 0–2 → DIRECT (L0)
 * score 3–5 → BRIEF (L1)
 * score 6–8 → STRUCTURED (L2)
 * score 9+  → DEEP (L3)
 */
export function calculateRuntimeResponseDepth(
  query: string,
  options?: {
    intent?: string;
    deepReasoning?: boolean;
    hasConflicts?: boolean;
    hasHypotheses?: boolean;
    attachmentCount?: number;
  }
): RuntimeControllerScore {
  const q = (query || '').trim().toLowerCase();
  const intent = options?.intent || '';
  const deepReasoning = Boolean(options?.deepReasoning);
  const hasConflicts = Boolean(options?.hasConflicts);

  let complexity = 0;
  let uncertainty = 0;
  let decisionImpact = 0;
  let userDepth = 0;

  // Check explicit user constraints (P2)
  const thaiBrief = /(สั้นๆ|ตอบสั้น|ขอสั้น|สรุปสั้น|คำเดียว|บรรทัดเดียว|สั้นที่สุด)/i.test(q);
  const engBrief = /\b(brief|short|concise|one line|in a sentence|summary only)\b/i.test(q);
  const isExplicitBrief = thaiBrief || engBrief;

  const thaiDeep = /(วิเคราะห์เชิงลึก|แจกแจงละเอียด|เปรียบเทียบเชิงลึก|ตรวจสอบความขัดแย้ง|ลึกซึ้งที่สุด|12 ขั้นตอน|ระดับวิกฤต|สถาปัตยกรรมการเงิน|อย่างละเอียด)/i.test(q);
  const engDeep = /\b(deep reasoning|deep analysis|analyze in detail|full deep audit|audit|counterfactual|comprehensive)\b/i.test(q);
  const isExplicitDeep = thaiDeep || engDeep;

  if (isExplicitBrief) {
    userDepth = 0;
  } else if (isExplicitDeep || deepReasoning) {
    userDepth = 4;
  }

  // Greeting check: lowest complexity
  const isGreeting = intent === 'GREETING' || /^(สวัสดี|หวัดดี|ดีครับ|ดีค่ะ|สบายดีไหม|ขอบคุณ|ขอบใจ|hello|hi|hey|good morning|thanks|thank you)\b/i.test(q);
  if (isGreeting && !isExplicitDeep) {
    return {
      complexityScore: 0,
      uncertaintyScore: 0,
      decisionImpactScore: 0,
      userRequestedDepthScore: 0,
      totalScore: 0,
      mode: 'DIRECT',
      depth: 'L0_DIRECT',
      reasoning: 'Greeting or casual exchange (Score 0: DIRECT).'
    };
  }

  // Complexity Scoring
  if (options?.attachmentCount && options.attachmentCount > 0) {
    complexity += 2;
  }
  if (/(ทำไม|อย่างไร|อธิบาย|กลไก|สถาปัตยกรรม|วิเคราะห์|ประเมิน|ออกแบบ|ช่วยวางแผน|วางแผน)/i.test(q) ||
      /\b(why|how does|explain|architecture|process|mechanism|analyze|evaluate|design)\b/i.test(q)) {
    complexity += 2;
  }
  if (intent === 'COMPLEX' || intent === 'DOCUMENT_ANALYSIS') {
    complexity += 2;
  }

  // Decision Impact Scoring
  if (/(ควร|เลือก|เปรียบเทียบ|ดีกว่า|อันไหนดี|ข้อดีข้อเสีย|ชั่งน้ำหนัก)/i.test(q) ||
      /\b(should|choose|select|recommend|which is better|trade.?off|versus|vs\.?)\b/i.test(q)) {
    decisionImpact += 3;
  }
  if (intent === 'DECISION_SUPPORT') {
    decisionImpact += 2;
  }

  // Uncertainty Scoring
  if (hasConflicts) {
    uncertainty += 3;
  }
  if (options?.hasHypotheses) {
    uncertainty += 2;
  }
  if (/(ขัดแย้ง|ไม่แน่ใจ|ไม่ชัดเจน|สงสัย|ความเสี่ยง|ความเปราะบาง)/i.test(q) ||
      /\b(conflict|contradict|uncertain|risk|vulnerability)\b/i.test(q)) {
    uncertainty += 2;
  }

  // Cap subscores at 3 for normalization (except user depth if explicit deep)
  complexity = Math.min(3, complexity);
  uncertainty = Math.min(3, uncertainty);
  decisionImpact = Math.min(3, decisionImpact);

  if (isExplicitBrief) {
    // P2 Override: user explicit brief lowers total score to direct
    return {
      complexityScore: complexity,
      uncertaintyScore: uncertainty,
      decisionImpactScore: decisionImpact,
      userRequestedDepthScore: 0,
      totalScore: 1,
      mode: 'DIRECT',
      depth: 'L0_DIRECT',
      reasoning: 'Explicit brief request via P2 (Score 1: DIRECT).'
    };
  }

  let totalScore = complexity + uncertainty + decisionImpact + userDepth;

  let mode: 'DIRECT' | 'BRIEF' | 'STRUCTURED' | 'DEEP';
  let depth: ProcessDepth;

  if (userDepth >= 4 && (complexity >= 2 || uncertainty >= 2 || totalScore >= 7)) {
    mode = 'DEEP';
    depth = 'L3_DEEP_AUDIT';
  } else if (decisionImpact >= 3 || (decisionImpact >= 2 && complexity >= 2) || totalScore >= 4) {
    if (totalScore >= 7) {
      mode = 'DEEP';
      depth = 'L3_DEEP_AUDIT';
    } else {
      mode = 'STRUCTURED';
      depth = 'L2_STRUCTURED';
    }
  } else if (complexity >= 2 || totalScore >= 2) {
    mode = 'BRIEF';
    depth = 'L1_ANALYTICAL';
  } else {
    mode = 'DIRECT';
    depth = 'L0_DIRECT';
  }

  return {
    complexityScore: complexity,
    uncertaintyScore: uncertainty,
    decisionImpactScore: decisionImpact,
    userRequestedDepthScore: userDepth,
    totalScore,
    mode,
    depth,
    reasoning: `Calculated score: ${totalScore} (Complexity: ${complexity}, Uncertainty: ${uncertainty}, DecisionImpact: ${decisionImpact}, UserDepth: ${userDepth}) -> ${mode} (${depth})`
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. DEFECT #2 — ORCHESTRATION LANGUAGE ROUTER
// ─────────────────────────────────────────────────────────────────────────────

export interface LanguageRouteResult {
  targetLanguage: string; // 'th' | 'en' | 'ja' | 'zh'
  isExplicitUserRequest: boolean;
  reason: string;
}

export function routeOrchestrationLanguage(query: string, historyLanguage?: string): LanguageRouteResult {
  const q = (query || '').trim().toLowerCase();

  // Explicit user requests (P2)
  if (/\b(answer in english|reply in english|respond in english|in english please|write in english|explain in english)\b/i.test(q) ||
      /(ตอบเป็นภาษาอังกฤษ|ขอภาษาอังกฤษ|ตอบภาษาอังกฤษ|ใช้ภาษาอังกฤษ|สรุปเป็นภาษาอังกฤษ|แปลเป็นภาษาอังกฤษ|เขียนเป็นภาษาอังกฤษ)/i.test(q)) {
    return {
      targetLanguage: 'en',
      isExplicitUserRequest: true,
      reason: 'User explicitly requested English output via P2 instruction.'
    };
  }

  if (/\b(answer in japanese|reply in japanese)\b/i.test(q) || /(ตอบเป็นภาษาญี่ปุ่น|ขอภาษาญี่ปุ่น)/i.test(q)) {
    return {
      targetLanguage: 'ja',
      isExplicitUserRequest: true,
      reason: 'User explicitly requested Japanese output via P2 instruction.'
    };
  }

  if (/\b(answer in chinese|reply in chinese)\b/i.test(q) || /(ตอบเป็นภาษาจีน|ขอภาษาจีน)/i.test(q)) {
    return {
      targetLanguage: 'zh',
      isExplicitUserRequest: true,
      reason: 'User explicitly requested Chinese output via P2 instruction.'
    };
  }

  if (/(ตอบเป็นภาษาไทย|ขอภาษาไทย|ตอบภาษาไทย|ใช้ภาษาไทย)/i.test(q)) {
    return {
      targetLanguage: 'th',
      isExplicitUserRequest: true,
      reason: 'User explicitly requested Thai output via P2 instruction.'
    };
  }

  // Script detection
  const thaiMatches = query.match(/[\u0E00-\u0E7F]/g);
  const latinMatches = query.match(/[a-zA-Z]/g);

  const thaiCount = thaiMatches ? thaiMatches.length : 0;
  const latinCount = latinMatches ? latinMatches.length : 0;

  if (thaiCount > 0) {
    return {
      targetLanguage: 'th',
      isExplicitUserRequest: false,
      reason: 'Detected Thai script in user input.'
    };
  }

  if (latinCount > 15 && thaiCount === 0) {
    return {
      targetLanguage: 'en',
      isExplicitUserRequest: false,
      reason: 'Detected dominant Latin script in user input.'
    };
  }

  // Fallback to conversation history or default 'th'
  return {
    targetLanguage: historyLanguage || 'th',
    isExplicitUserRequest: false,
    reason: historyLanguage ? `Followed conversation history language: ${historyLanguage}` : 'Default contemporary Thai language.'
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. DEFECT #3 — TAXONOMY ACTIVATION RULES
// ─────────────────────────────────────────────────────────────────────────────

export interface TaxonomyActivationPlan {
  allowedLabels: Set<string>;
  suppressAllTaxonomy: boolean;
  reason: string;
}

/**
 * Determines which taxonomy tags are activated for the current context.
 * For low-complexity or simple factual queries, taxonomy tags are suppressed.
 */
export function getTaxonomyActivationPlan(
  depth: ProcessDepth,
  hasFactEvidence: boolean,
  hasHypotheses: boolean,
  hasConflicts: boolean,
  hasConstraints: boolean
): TaxonomyActivationPlan {
  const allowed = new Set<string>();

  // In L0 (Direct) or L1 (Analytical), avoid distracting taxonomy markers
  if (depth === 'L0_DIRECT') {
    return {
      allowedLabels: allowed,
      suppressAllTaxonomy: true,
      reason: 'Taxonomy suppressed for L0_DIRECT to maintain clean natural conversation.'
    };
  }

  if (hasFactEvidence) {
    allowed.add('FACT');
  }
  allowed.add('INFERENCE'); // Allowed in L1-L3 when reasoning derived from facts

  if (hasHypotheses || depth === 'L2_STRUCTURED' || depth === 'L3_DEEP_AUDIT') {
    allowed.add('HYPOTHESIS');
    allowed.add('TRADE_OFF');
  }

  if (hasConflicts) {
    allowed.add('CONTRADICTION');
  }

  if (hasConstraints) {
    allowed.add('CONSTRAINT');
  }

  if (depth === 'L2_STRUCTURED' || depth === 'L3_DEEP_AUDIT') {
    allowed.add('DECISION GAP');
    allowed.add('UNCERTAINTY');
  }

  return {
    allowedLabels: allowed,
    suppressAllTaxonomy: false,
    reason: `Activated ${allowed.size} taxonomy labels based on runtime context.`
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. DEFECT #4 — MEMORY ISOLATION & SEMANTIC RELEVANCE FILTER
// ─────────────────────────────────────────────────────────────────────────────

export interface MemoryRecordLite {
  id?: string;
  content: string;
  layer?: string;
  confidence?: number;
  category?: string;
}

export interface FilteredMemoryResult {
  accepted: MemoryRecordLite[];
  rejected: MemoryRecordLite[];
  totalRetrieved: number;
  scores: Record<string, number>;
}

/**
 * Filter memories strictly by semantic relevance.
 * Never inject irrelevant memories into prompt.
 */
export function filterMemoriesByRelevance(
  query: string,
  memories: MemoryRecordLite[],
  threshold: number = 0.35
): FilteredMemoryResult {
  if (!memories || memories.length === 0) {
    return { accepted: [], rejected: [], totalRetrieved: 0, scores: {} };
  }

  const queryTerms = (query || '')
    .toLowerCase()
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"']/g, ' ')
    .split(/\s+/)
    .filter(t => t.length > 2);

  const scores: Record<string, number> = {};
  const accepted: MemoryRecordLite[] = [];
  const rejected: MemoryRecordLite[] = [];

  for (const mem of memories) {
    const text = (mem.content || '').toLowerCase();
    let matchCount = 0;

    for (const term of queryTerms) {
      if (text.includes(term)) {
        matchCount++;
      }
    }

    // Keyword overlap ratio
    let score = queryTerms.length > 0 ? matchCount / queryTerms.length : 0;

    // Boost if memory has hard system constraints that match domain
    if (mem.layer === 'Constraint' && matchCount > 0) {
      score += 0.2;
    }

    score = Number(Math.min(1.0, score).toFixed(2));
    const memKey = mem.id || `mem-${Math.random().toString(36).slice(2, 8)}`;
    scores[memKey] = score;

    if (score >= threshold) {
      accepted.push(mem);
    } else {
      rejected.push(mem);
    }
  }

  return {
    accepted: accepted.sort((a, b) => (scores[b.id || ''] || 0) - (scores[a.id || ''] || 0)).slice(0, 5),
    rejected,
    totalRetrieved: memories.length,
    scores
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. DEFECT #5 — DETERMINISTIC PRIORITY RESOLVER
// ─────────────────────────────────────────────────────────────────────────────

export type PriorityLevel = 'P0' | 'P1' | 'P2' | 'P3' | 'P4' | 'P5' | 'P6';

export interface RuleConstraint {
  id: string;
  name: string;
  priority: PriorityLevel;
  specific: boolean; // specific rule vs general rule
  version: number;   // newer version > older version
  description: string;
}

const PRIORITY_ORDER: Record<PriorityLevel, number> = {
  P0: 0, // Highest
  P1: 1,
  P2: 2,
  P3: 3,
  P4: 4,
  P5: 5,
  P6: 6  // Lowest
};

/**
 * Deterministically resolves conflicts between two rules:
 * 1. Higher priority wins (P0 > P1 > P2 ...)
 * 2. If equal priority: specific rule > general rule
 * 3. If still equal: newer version > older version
 */
export function resolveRuleConflict(ruleA: RuleConstraint, ruleB: RuleConstraint): {
  winner: RuleConstraint;
  loser: RuleConstraint;
  resolutionReason: string;
} {
  const rankA = PRIORITY_ORDER[ruleA.priority];
  const rankB = PRIORITY_ORDER[ruleB.priority];

  if (rankA < rankB) {
    return {
      winner: ruleA,
      loser: ruleB,
      resolutionReason: `Higher priority wins: ${ruleA.priority} (${ruleA.name}) > ${ruleB.priority} (${ruleB.name})`
    };
  }

  if (rankB < rankA) {
    return {
      winner: ruleB,
      loser: ruleA,
      resolutionReason: `Higher priority wins: ${ruleB.priority} (${ruleB.name}) > ${ruleA.priority} (${ruleA.name})`
    };
  }

  // Same priority -> specific rule > general rule
  if (ruleA.specific && !ruleB.specific) {
    return {
      winner: ruleA,
      loser: ruleB,
      resolutionReason: `Specific rule prevails over general rule at equal priority ${ruleA.priority}: ${ruleA.name}`
    };
  }

  if (ruleB.specific && !ruleA.specific) {
    return {
      winner: ruleB,
      loser: ruleA,
      resolutionReason: `Specific rule prevails over general rule at equal priority ${ruleB.priority}: ${ruleB.name}`
    };
  }

  // Same specificity -> newer version > older version
  if (ruleA.version >= ruleB.version) {
    return {
      winner: ruleA,
      loser: ruleB,
      resolutionReason: `Newer version prevails at equal priority ${ruleA.priority}: v${ruleA.version} vs v${ruleB.version}`
    };
  }

  return {
    winner: ruleB,
    loser: ruleA,
    resolutionReason: `Newer version prevails at equal priority ${ruleB.priority}: v${ruleB.version} vs v${ruleA.version}`
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. DEFECT #10 — DETERMINISTIC VALIDATOR LAYER
// ─────────────────────────────────────────────────────────────────────────────

export interface ValidationResult {
  isValid: boolean;
  violations: string[];
  repairedText?: string;
  trace: RuntimeValidationTrace;
}

export function validateModelOutput(
  rawOutput: string,
  context: {
    query: string;
    expectedDepth: ProcessDepth;
    expectedLanguage: string;
    allowedTaxonomy?: Set<string>;
    suppressTaxonomy?: boolean;
  }
): ValidationResult {
  const violations: string[] = [];
  let repairedText = rawOutput;
  const validationTrace: RuntimeValidationTrace = {
    schema: 'PASS',
    policy: 'PASS',
    language: 'PASS',
    responseProportionality: 'PASS',
    identity: 'PASS',
    violations: []
  };

  // 1. Identity Validator (PUNN persona & zero hallucination)
  const personaAudit = auditAndEnforcePunnPersona(repairedText, context.query);
  if (personaAudit.modified) {
    validationTrace.identity = 'REVISED';
    violations.push(...personaAudit.violations);
    repairedText = personaAudit.text;
  }

  // 2. Language Validation
  const expectedLang = context.expectedLanguage;
  if (expectedLang === 'en') {
    const thaiMatches = repairedText.match(/[\u0E00-\u0E7F]/g);
    // If user asked in English but model replied mostly in Thai
    if (thaiMatches && thaiMatches.length > 50) {
      violations.push('Model responded in Thai when English was explicitly requested');
      validationTrace.language = 'FAIL';
    }
  }

  // 3. Response Proportionality Validator
  const wordCount = (repairedText.match(/\S+/g) || []).length;
  if (context.expectedDepth === 'L0_DIRECT' && wordCount > 250) {
    violations.push(`Response length (${wordCount} words) exceeds L0_DIRECT budget limit`);
    validationTrace.responseProportionality = 'FAIL';
  }

  // 4. Taxonomy Suppression Validator
  if (context.suppressTaxonomy) {
    const hasTaxonomy = /\[(FACT|INFERENCE|HYPOTHESIS|TRADE_OFF|DECISION GAP|UNCERTAINTY|CONTRADICTION)\]/i.test(repairedText);
    if (hasTaxonomy) {
      // Strip taxonomy cleanly
      repairedText = repairedText.replace(/\[(FACT|INFERENCE|HYPOTHESIS|TRADE_OFF|DECISION GAP|UNCERTAINTY|CONTRADICTION)\]\s*/gi, '');
      violations.push('Taxonomy tags stripped from L0 direct response');
      validationTrace.policy = 'REVISED';
    }
  }

  // 5. Taxonomy Heading Check (Never allow taxonomy in markdown headings)
  if (/^#{1,4}\s*\[[A-Z0-9_\-\s]+\]/m.test(repairedText)) {
    violations.push('Taxonomy tag detected in markdown heading; sanitized to natural title');
    repairedText = repairedText.replace(/^(#{1,4}\s*)\[[A-Z0-9_\-\s]+\]\s*/gm, '$1');
    validationTrace.policy = 'REVISED';
  }

  validationTrace.violations = violations;
  const isValid = violations.length === 0;

  return {
    isValid,
    violations,
    repairedText,
    trace: validationTrace
  };
}
