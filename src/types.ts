export type ToneMode = 'Formal Architect' | 'Empathetic Guide' | 'Direct Expert';

export type ReasoningProfile = 'Auto' | 'Investigation' | 'Business' | 'Medical' | 'Legal' | 'Engineering';

export interface TraceEntry {
  stage: string;
  stage_number?: number;
  stage_th_label?: string;
  timestamp: string;
  start_time_ms?: number;
  end_time_ms?: number;
  start_rel_ms?: number;
  end_rel_ms?: number;
  duration_ms: number;
  promptTokens?: number;
  completionTokens?: number;
  tokensPerSec?: number;
  executionType?: 'LLM_GENERATION' | 'SEMANTIC_RERANKER' | 'BAYESIAN_COMPUTATION' | 'HEURISTIC_EVAL' | 'RULE_CHECK';
  output: Record<string, unknown>;
}

export interface AttachedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  dataUrl?: string;
  base64?: string;
  textContent?: string;
}

export interface ConversationTurn {
  role: 'user' | 'assistant';
  content: string;
  attachments?: AttachedFile[];
  pcaState?: PCAState;
  tokensUsed?: number;
  isTokenEstimated?: boolean;
  timestamp?: string;
}

export interface MemoryItem {
  id?: string;
  content: string;
  layer: 'Fact' | 'Preference' | 'Constraint' | 'System' | 'Observation';
  storeType?: 'Episodic' | 'Semantic' | 'Working' | 'Preference' | 'Knowledge';
  source: string;
  confidence: number;
  created_at?: string;
  provenanceId?: string;
  sourceUrl?: string;
}

export interface HypothesisV2 {
  id: string;
  claim: string;
  prior: number;
  likelihood: number;
  posterior: number;
  rationale: string;
  status: 'Supported' | 'Refuted' | 'Under_Review';
}

export interface BayesianMetrics {
  priorScore: number;
  posteriorScore: number;
  priorProb: number;
  likelihoodProb: number;
  marginalProb: number;
  posteriorProb: number;
  entropy: number;
  confidenceLabel: string;
  bayesFormulaString: string;
  computationExplanation: string;
  updates: Array<{ factor: string; direction: '+' | '-'; weight: number }>;
}

export interface EvidenceItem {
  id: string;
  source: string;
  content: string;
  credibilityScore: number;
  supportScore?: number; // 0 - 100
  conflictScore?: number; // 0 - 100
  noveltyScore?: number; // 0 - 100
  reliabilityScore?: number; // 0 - 100
  normalizedWeight?: number; // 0.0 - 1.0 (Sum = 1.0)
  weightPercentage?: string; // e.g. "34.0%"
  explainableAnalysis?: string;
  strength: 'High' | 'Medium' | 'Low';
  type: 'Empirical' | 'User Context' | 'Memory' | 'Inference';
  documentId?: string;
  sourceUrl?: string;
  citationQuote?: string;
  locator?: string;
}

export interface KnowledgeNode {
  id: string;
  label: string;
  type: 'concept' | 'hypothesis' | 'memory' | 'risk' | 'query';
  weight?: number;
}

export interface KnowledgeEdge {
  source: string;
  target: string;
  label: string;
  relationship?: string;
}

export interface KnowledgeGraphData {
  nodes: KnowledgeNode[];
  edges: KnowledgeEdge[];
}

export interface ExecutiveMetrics {
  riskScore: number; // 0 - 100
  confidenceScore: number; // 0 - 100
  tokenUsage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    estCostUsd: number;
  };
  latencyMs: number;
  humanAgencyScore: number; // 0 - 100
}

export interface ReflectionEvaluation {
  hallucinationRisk: 'Low' | 'Medium' | 'High';
  factCheckPassed: boolean;
  agencyPreserved: boolean;
  toneAlignment: number; // 0 - 100
  selfCorrectionNotes: string[];
}

export interface MemoryDelta {
  added: MemoryItem[];
  updated: Array<{ id: string; oldConfidence: number; newConfidence: number; reason: string }>;
  contextEvolutionSummary: string;
}

export type MembershipTier = 'free' | 'starter' | 'pro' | 'academic' | 'enterprise';

export interface SubscriptionInfo {
  tier: MembershipTier;
  tierName: string;
  priceMonthlyThb: number;
  tokenQuotaMonthly: number;
  tokensUsedThisMonth: number;
  resetDate: string;
  status: 'active' | 'cancelling' | 'past_due' | 'expired';
  billingCycle: 'monthly' | 'yearly';
  paymentMethodLast4?: string;
  lastPaymentDate?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  role?: string;
  organization?: string;
  isGuest: boolean;
  token?: string;
  membership?: SubscriptionInfo;
  preferences?: {
    toneMode?: ToneMode;
    autoSaveMemories?: boolean;
    language?: 'th' | 'en';
    defaultReasoningProfile?: ReasoningProfile;
  };
  created_at: string;
}

export interface PromptAssemblyManifest {
  promptVersion: string;
  model: string;
  components: {
    systemPrompt: { version: string; hash: string; tokens: number };
    developerPrompt: { version: string; hash: string; tokens: number };
    retrievedMemory: Array<{ id: string; hash: string; tokens: number }>;
    retrievedDocs: Array<{ id: string; hash: string; tokens: number }>;
    conversation: { messages: number; tokens: number };
    userInput: { hash: string; tokens: number };
  };
  knowledge_sources: {
    system_prompt: boolean;
    developer_prompt: boolean;
    conversation: boolean;
    memory: boolean;
    rag: boolean;
    web: boolean;
  };
  assembly_hash: string;
  total_input_tokens: number;
}

export interface CognitivePipelineMachine {
  thinking: string;
  reasoning: string;
  decision: string;
  reflection: string;
  confidence: number;
  memory_delta: string;
  state_status: 'Thinking' | 'Reasoning' | 'Decision' | 'Reflecting' | 'Completed';
}

export interface CompressedContextSummary {
  goal: string;
  facts: string[];
  constraints: string[];
  evidence: string[];
  decision: string[];
  openQuestions: string[];
  stageSummary?: {
    lastCompletedStage?: string;
    stagesPassedCount?: number;
    topRetrievedMemories?: string[];
    bayesianPosteriorScore?: number;
  };
  metrics: {
    originalEstimatedTokens: number;
    compressedTokens: number;
    reductionPercentage: number;
    turnsCompressed: number;
    lastCompressedAt: string;
  };
}

export interface ConversationSession {
  id: string;
  userId: string;
  title: string;
  created_at: string;
  updated_at: string;
  turns: ConversationTurn[];
  compressedContext?: CompressedContextSummary;
}

export interface AuditBlock {
  index: number;
  stage_id: string;
  stage_name: string;
  timestamp_ns: number;
  iso_timestamp: string;
  prev_hash: string;
  block_hash: string;
  executionType: 'LLM_GENERATION' | 'SEMANTIC_RERANKER' | 'BAYESIAN_COMPUTATION' | 'HEURISTIC_EVAL' | 'RULE_CHECK';
  inputs_summary: string;
  outputs_summary: string;
  verification_status: 'EXECUTED_IN_RUNTIME' | 'AUDITED_AND_VERIFIED';
  tamperCheckPassed: boolean;
}

export interface HumanAgencyEnforcement {
  level: 1 | 2 | 3;
  levelName: 'Level 1: Advisory' | 'Level 2: Escalation' | 'Level 3: Hard Stop';
  riskScore: number;
  riskDomain: 'General' | 'Financial' | 'Medical' | 'Legal' | 'Safety';
  isBlocked: boolean;
  blockReason?: string;
  requiresHumanToken: boolean;
  tokenApproved?: boolean;
  approvedBy?: string;
  approvedAt?: string;
  overrideActionTaken?: string;
}

export interface EmpiricalBenchmarkResult {
  sampleSize: number;
  testDomain: string;
  groupA_directLLM: {
    hallucinationRatePercent: number;
    decisionAccuracyPercent: number;
    humanTrustScore: number;
    humanOverrideRatePercent: number;
    avgLatencyMs: number;
    avgTokensUsed: number;
  };
  groupB_pcaV3: {
    hallucinationRatePercent: number;
    decisionAccuracyPercent: number;
    humanTrustScore: number;
    humanOverrideRatePercent: number;
    avgLatencyMs: number;
    avgTokensUsed: number;
  };
  hallucinationReductionPercent: number;
  accuracyImprovementPercent: number;
  p_value: number;
  statisticallySignificant: boolean;
}

export interface GovernancePolicy {
  id: string;
  name: string;
  category: 'Agency' | 'Safety' | 'Factuality' | 'Tone';
  status: 'PASSED' | 'GUARDED' | 'OVERRIDDEN';
  description: string;
  ruleEnforced: string;
  overriddenByHuman?: boolean;
}

export interface RankedMemoryItem extends MemoryItem {
  relevanceScore: number; // 0 - 1.0
  crossEncoderScore?: number; // 0 - 1.0
  recencyWeight: number; // 0 - 1.0
  conflictStatus?: 'None' | 'Resolved' | 'Active Conflict';
  conflictNotes?: string;
}

export interface ConfidenceCalibration {
  scorePercent: number;
  label: 'สูง' | 'ปานกลาง' | 'ต่ำ' | 'ไม่สามารถประเมินได้';
  formula: string;
  evidenceStrength: number;
  retrievalScoreWeight?: number;
  crossEncoderScore?: number;
  llmSelfEvalScore?: number;
  ensembleConfidence?: number;
  conflictPenalty: number;
  missingInfoPenalty: number;
  bayesianPosterior: number;
  empiricalCalibrationNote?: string;
  validationBenchmark?: string;
  priorJustification?: string;
  selfEvalMethodology?: string;
  eceScore?: number;
  brierScore?: number;
}

export interface MetaCognitionThought {
  selfDoubtQuestion: string;
  potentialFlaw: string;
  mitigationCorrection: string;
  isCorrecting: boolean;
  confidenceDelta: number;
}

export interface DecisionGraphNode {
  id: string;
  label: string;
  stageGroup: 'Input' | 'Reasoning' | 'Evaluation' | 'Feedback' | 'Output';
  status: 'Completed' | 'Looping' | 'Guarded' | 'Refined';
  feedbackTriggered?: boolean;
}

export interface DecisionGraphEdge {
  from: string;
  to: string;
  label: string;
  type: 'linear' | 'feedback_loop' | 'guardrail';
}

export interface DecisionGraphData {
  nodes: DecisionGraphNode[];
  edges: DecisionGraphEdge[];
  hasActiveFeedbackLoop: boolean;
  loopCount: number;
}

export interface FeedbackLoopEvent {
  iteration: number;
  triggerReason: string;
  actionTaken: string;
  outcome: string;
}

export interface UncertaintyDetection {
  uncertaintyIndex: number; // 0 - 100
  drivers: string[];
  mitigationStrategy: string;
}

export interface ConflictResolutionItem {
  id: string;
  conflictDescription: string;
  sourceA: string;
  sourceB: string;
  resolutionChoice: string;
  rationale: string;
  confidenceImpact: string;
}

export interface MemoryImpactItem {
  memoryId: string;
  content: string;
  usageStatus: 'USED_IN_DECISION' | 'REJECTED_OUTDATED' | 'CONTEXT_ONLY' | 'CONFLICTED';
  impactDescription: string;
  appliedStage: string;
  appliedModule?: string;
  usageAction?: string;
  tracePath?: string;
}

export interface ContextualAwarenessLayer {
  activeDomain: 'THAI_SOCIO_LEGAL' | 'GLOBAL_GENERAL';
  confidenceBreakdown: {
    overall: number; // e.g. 96
    language: number; // e.g. 100
    intent: number; // e.g. 94
    reference: number; // e.g. 88
    cultural: number; // e.g. 98
    legalSafety: number; // e.g. 96
  };
  languageLayer: {
    segmentationStatus: string;
    ambiguityDetected: boolean;
    ambiguousTerms: string[];
    registerLevel: 'Formal / Official' | 'Consultative / Professional' | 'Casual / Colloquial';
  };
  semanticIntent: {
    primaryIntent: string;
    implicitGoal: string;
    urgencyLevel: 'Immediate Action' | 'Strategic Planning' | 'Informational Query';
  };
  culturalContext: {
    idiomsDetected: string[];
    socialNuance: string;
    culturalMetaphor: string;
  };
  honorifics: {
    markersFound: string[];
    politenessLevel: string;
    relationshipContext: 'ลูกค้า (Client)' | 'หัวหน้า (Supervisor)' | 'ผู้บริหาร (Executive)' | 'เพื่อนร่วมงาน (Colleague)' | 'ประชาชน/ผู้ใช้บริการ (Public)';
    personaMode: 'CEO Mode' | 'Developer Mode' | 'Auditor Mode' | 'Analyst Mode' | 'Teacher Mode';
  };
  temporalContext: {
    timeExpressions: string[];
    beConversionNote: string;
    timeframeScope: string;
  };
  locationContext: {
    geographicEntities: string[];
    transitNodes: string[];
    regionScope: string;
  };
  legalContext: {
    pdpaCompliance: 'COMPLIANT' | 'WARNING_PERSONAL_DATA' | 'SHIELDED';
    pdpaRiskNotes: string[];
    governingStatutes: string[];
    governmentAgencies: string[];
  };
  businessContext: {
    financialTaxNote: string;
    documentTypes: string[];
    corporateProtocol: string;
  };
  emotionSafety: {
    perceivedSentiment: 'สุภาพ/ทางการ' | 'ตรงไปตรงมา' | 'เร่งด่วน/ตึงเครียด' | 'ประชด/ตัดพ้อ' | 'ลังเล/สงสัย';
    safetyFlags: {
      hateSpeech: boolean;
      defamationRisk: boolean;
      politicalSensitivity: boolean;
      pdpaViolationRisk: boolean;
      illegalWeaponsRisk: boolean;
    };
    safetyRating: 'SAFE_FOR_PCA' | 'GUARDED_RESPONSIVE' | 'BLOCKED_POLICY';
  };
  thaiRagAdapter: {
    provider: string; // e.g. "OpenThaiRAG Adapter v2"
    retrievedSources: string[];
    citationConfidence: number;
  };
  firearmsLegalFramework: {
    statute: string;
    licensingAuthority: string;
    screeningProcess: string;
    illicitControl: string;
    governmentWeapons: string;
  };
  communityMentalHealth: {
    governingBody: string;
    grassrootsNetwork: string;
    referralPathway: string;
    deStigmatizationNote: string;
  };
  earlyWarningMechanisms: {
    emergencyHotlines: string;
    localGovernance: string;
    institutionalReporting: string;
    protocolApproach: string;
  };
  statusNote: string;
}

export interface PCAState {
  user_input: string;
  language: 'th' | 'en';
  observations: string[];
  understanding: string;
  purpose: string;
  constraints: string[];
  memories: MemoryItem[];
  hypotheses: Array<{ claim: string; confidence: number }>;
  evidence: string[];
  critique: string[];
  uncertainty: string[];
  decision: string;
  response: string;
  reflection: string[];
  learning: string[];
  agency_checks: string[];
  notes: string[];
  confidence: 'สูง' | 'ปานกลาง' | 'ต่ำ' | 'ไม่สามารถประเมินได้';
  conflicts: string[];
  missing_info: string[];
  trace: TraceEntry[];
  llm_provider: string;
  llm_model: string;
  execution_time_ms: number;
  start_time: string;
  end_time: string;

  // ── PCA v2.0 & Alpha Extended Modules ──
  version?: '2.0';
  hypotheses_v2?: HypothesisV2[];
  bayesian?: BayesianMetrics;
  evidence_explorer?: EvidenceItem[];
  knowledge_graph?: KnowledgeGraphData;
  executive_dashboard?: ExecutiveMetrics;
  executiveMetrics?: ExecutiveMetrics;
  reflection_loop?: ReflectionEvaluation;
  memory_evolution?: MemoryDelta;
  pipeline_machine?: CognitivePipelineMachine;
  assembly_manifest?: PromptAssemblyManifest;

  // ── PCA v2 Core Upgrades ──
  governance_policies?: GovernancePolicy[];
  ranked_memories?: RankedMemoryItem[];
  confidence_calibration?: ConfidenceCalibration;
  feedback_loops?: FeedbackLoopEvent[];
  alternative_decisions?: string[];
  uncertainty_detection?: UncertaintyDetection;
  meta_cognition?: MetaCognitionThought;
  decision_graph?: DecisionGraphData;
  conflict_resolutions?: ConflictResolutionItem[];
  memory_impacts?: MemoryImpactItem[];
  proactive_clarifications?: string[];

  // ── PCA v3.0 Roadmap Pillars ──
  reasoning_profile?: ReasoningProfile;
  audit_chain?: AuditBlock[];
  human_agency_enforcement?: HumanAgencyEnforcement;
  empirical_benchmark?: EmpiricalBenchmarkResult;
  contextual_awareness_layer?: ContextualAwarenessLayer;
}

export interface StressTestItem {
  id: string;
  category: string;
  scenario: string;
  promptUsed: string;
  expectedOutcome: string;
  actualOutcome: string;
  status: 'PASSED' | 'RESOLVED' | 'CALIBRATED' | 'STABLE' | 'VERIFIED' | 'FAILED';
  metrics: Record<string, string | number>;
  fmeaAssertion: string;
}

export interface StressTestSuiteResponse {
  success: boolean;
  executionTimeMs: number;
  timestamp: string;
  benchmarkVersion: string;
  overallPassRate: string;
  summary: {
    testsExecuted: number;
    passed: number;
    failed: number;
    fmeaAssertionsVerified: number;
    nonLLMAnchorsActive: boolean;
  };
  results: StressTestItem[];
}

export interface AnalyzeRequest {
  question: string;
  tone?: ToneMode;
  deepReasoning?: boolean;
  reasoningProfile?: ReasoningProfile;
  personalContext?: string;
  memories?: MemoryItem[];
  history?: ConversationTurn[];
  attachments?: AttachedFile[];
}

export interface AnalyzeResponse {
  response: string;
  pcaState: PCAState;
  error?: string;
}

export const PCA_STAGES = [
  { id: 'OBSERVATION', label: '1. Observation', thLabel: 'การสังเกตการณ์', icon: 'Eye', description: 'การรับและจำแนกสัญญาณอินพุต ตรวจจับวัตถุประสงค์เบื้องต้นของผู้ใช้' },
  { id: 'UNDERSTANDING', label: '2. Understanding', thLabel: 'การทำความเข้าใจ', icon: 'Brain', description: 'การสกัดความหมายเชิงลึก ประโยคสำคัญ และบริบททางภาษา' },
  { id: 'PURPOSE', label: '3. Purpose & Boundaries', thLabel: 'วัตถุประสงค์และขอบเขต', icon: 'Target', description: 'การกำหนดเป้าหมายการประมวลผล ข้อจำกัด และนโยบาย Governance' },
  { id: 'MEMORY', label: '4. Memory Retrieval', thLabel: 'การดึงความจำ', icon: 'Database', description: 'การค้นหาและแมตช์บริบทจากความจำระยะยาว (Fact/Constraint/Preference)' },
  { id: 'MENTAL_MODEL', label: '5. Mental Model', thLabel: 'แบบจำลองความคิด', icon: 'Network', description: 'การสร้าง Knowledge Graph เชื่อมโยงเอนทิตีและโหนดความสัมพันธ์' },
  { id: 'HYPOTHESIS', label: '6. Hypotheses', thLabel: 'การตั้งสมมติฐาน', icon: 'Sparkles', description: 'การสร้างและคำนวณน้ำหนักสมมติฐานทางเลือกในการแก้ปัญหา' },
  { id: 'EVIDENCE_EVALUATION', label: '7. Evidence Evaluation', thLabel: 'ประเมินหลักฐาน', icon: 'ShieldCheck', description: 'การตรวจสอบและให้น้ำหนักหลักฐานสนับสนุนหรือโต้แย้งแต่ละสมมติฐาน' },
  { id: 'CRITIQUE', label: '8. Critique & Risk', thLabel: 'การวิพากษ์และความเสี่ยง', icon: 'AlertTriangle', description: 'การค้นหาข้อบกพร่อง ตรวจจับความเสี่ยง และหาจุดขัดแย้งเชิงตรรกะ' },
  { id: 'DECISION', label: '9. Decision Support', thLabel: 'สนับสนุนการตัดสินใจ', icon: 'Compass', description: 'การสังเคราะห์คำตอบสุดท้าย พร้อมคำนวณ Confidence Score' },
  { id: 'COMMUNICATION', label: '10. Communication', thLabel: 'การสื่อสาร', icon: 'MessageSquare', description: 'การเรียบเรียงโครงสร้างคำตอบในระดับ Executive Decision Intelligence' },
  { id: 'REFLECTION', label: '11. Reflection', thLabel: 'การสะท้อนความคิด', icon: 'RotateCcw', description: 'การประเมินคุณภาพกระบวนการคิดและระบุบทเรียนที่ได้รับ' },
  { id: 'LEARNING', label: '12. Learning & Agency', thLabel: 'การเรียนรู้และเสรีภาพ', icon: 'GraduationCap', description: 'การอัปเดตความจำระยะยาวและรับประกัน Human-in-the-Loop Agency' },
] as const;
