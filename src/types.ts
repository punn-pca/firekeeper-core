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
  layer: 'Context' | 'Fact' | 'Preference' | 'Constraint' | 'System' | 'Observation' | 'Session State';
  storeType?: 'Episodic' | 'Semantic' | 'Working' | 'Preference' | 'Knowledge';
  source: string;
  authority?: 'System' | 'User' | 'Session' | 'External' | 'Derived';
  mutability?: 'Immutable' | 'Mutable' | 'Protected';
  status?: 'Active' | 'Archived' | 'Deprecated';
  confidence: number;
  elevatedToFact?: boolean;
  created_at?: string;
  provenanceId?: string;
  sourceUrl?: string;
  topicDomain?: 'Universal_Governance' | 'Firearms_Legal' | 'Health_Mental' | 'Early_Warning' | 'Business_Strategy' | 'Engineering_Tech' | 'General';
  decision?: 'ACCEPT' | 'ISOLATE' | 'REJECT';
  is_isolated?: boolean;
  isolation_reason?: string;
  elevated_to_fact?: boolean;
  relevanceScore?: number;
}

export interface MemoryCandidate {
  id: string;
  content: string;
  layer: 'Context' | 'Fact' | 'Preference' | 'Constraint' | 'System' | 'Observation' | 'Session State';
  source: string;
  authority: 'System' | 'User' | 'Session' | 'External' | 'Derived';
  mutability: 'Immutable' | 'Mutable' | 'Protected';
  confidence: number;
  status: 'PENDING' | 'APPROVED' | 'DISMISSED';
  created_at: string;
  evidence: string;
  existingMatchId?: string;
  updateSuggested?: boolean;
}

export interface MemoryAuditRecord {
  id: string;
  timestamp: string;
  memory_id: string;
  source: string;
  action: 'MEMORY_CANDIDATE_CREATED' | 'MEMORY_CANDIDATE_APPROVED' | 'MEMORY_CANDIDATE_DISMISSED' | 'MEMORY_UPDATED' | 'MEMORY_DUPLICATE_DETECTED';
  previous_value?: string;
  new_value?: string;
  actor: string;
  reason: string;
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

export interface User {
  id: string;
  name: string;
  email: string;
  isGuest: boolean;
  token?: string;
  preferences?: {
    toneMode?: ToneMode;
    autoSaveMemories?: boolean;
    language?: 'th' | 'en';
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
  elevatedToFact?: boolean;
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
  auditMetrics?: {
    retrieved_count: number;
    relevant_count: number;
    contextually_relevant_count: number;
    isolated_count: number;
    excluded_count: number;
    relevance_mean: number;
    contamination_rate: number;
    cross_topic_risk: string;
    reported_context_coverage: string;
    coverage_status: string;
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

export interface EvidenceQualityBreakdown {
  authenticity: number; // 0 - 100
  directness: number; // 0 - 100
  freshness: number; // 0 - 100
  verifiability: number; // 0 - 100
  compositeScore: number; // 0 - 100
}

export interface SourceReliabilityItem {
  id: string; // e.g. 'E1', 'E2'
  source: string;
  reliabilityGrade: 'A' | 'B' | 'C' | 'D' | 'E' | 'F'; // Admiralty Intelligence Standard (A=Completely Reliable, B=Usually Reliable, C=Fairly Reliable, D=Not Usually Reliable)
  reliabilityLabel: string; // e.g. 'Grade A: Completely Reliable (Primary Official Document)'
  credibilityScore: number; // 0 - 100
  sourceType: 'Primary Source' | 'Verified Memory' | 'Empirical Fact' | 'Heuristic Inference';
  content: string;
  qualityBreakdown?: EvidenceQualityBreakdown;
  verifiableReference?: string; // Document ID, Timestamp, Locator
  standardAlignment?: string; // e.g. 'ISO/IEC 42001:2023 Cl. 8.2 & NIST AI RMF MAP 1.1'
}

export interface AlternativeTradeOffOption {
  id: string; // e.g. 'OPT-A', 'OPT-B', 'OPT-C'
  title: string;
  recommendationLevel: 'RECOMMENDED' | 'VIABLE ALTERNATIVE' | 'CONSERVATIVE' | 'REJECTED';
  badgeColor: 'emerald' | 'sky' | 'amber' | 'rose';
  expectedOutcome: string;
  pros: string[];
  cons: string[];
  tradeOffs: {
    riskScore: number; // 0 - 100
    velocityDays: string; // e.g. 'Immediate (24-48 ชม.)'
    costEffort: 'Low' | 'Medium' | 'High';
    governanceBurden: 'Low' | 'Medium' | 'High';
    confidenceScore: number; // 0 - 100
  };
  selectionRationale: string;
}

export interface CounterEvidenceItem {
  id: string; // e.g. 'CE1', 'CE2'
  claim: string;
  counterArgument: string;
  sourceOrScenario: string;
  mitigationStrategy: string;
  impactLevel: 'Low' | 'Moderate' | 'Critical Guardrail';
}

export interface DecisionTreeStep {
  id: string;
  step: 'Question' | 'Fact' | 'Unknown' | 'Hypothesis' | 'Risk' | 'Recommendation' | 'Decision';
  label: string;
  thaiLabel: string;
  summary: string;
  details: string[];
  status: 'Verified' | 'Gapped' | 'Mitigated' | 'Approved' | 'Active';
}

export interface DecomposedConfidence {
  evidenceConfidence: number; // 0 - 100
  reasoningConfidence: number; // 0 - 100
  predictionConfidence: number; // 0 - 100
  recommendationConfidence: number; // 0 - 100
  overallScore: number;
  thresholdScore: number;
  gateStatus: 'APPROVED' | 'PROCEED_WITH_CONTROLS' | 'HOLD_FOR_REVIEW';
  gateExplanation: string;
}

export interface ActionPriorityItem {
  id: string;
  action: string;
  impact: 'HIGH' | 'MEDIUM' | 'LOW';
  urgency: 'P1 - Immediate' | 'P2 - Near Term' | 'P3 - Strategic';
  costEffort: 'Low' | 'Medium' | 'High';
  owner: string;
  kpiIndicator: string;
}

export interface ExecutiveDecisionSummary {
  verdict: 'APPROVE' | 'PROCEED_WITH_CONTROLS' | 'CONDITIONAL' | 'HOLD';
  verdictThai: string;
  confidenceScore: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  evidenceQuality: 'HIGH' | 'MEDIUM' | 'LOW';
  unknownsCount: number;
  biasLevel: 'MINIMAL' | 'LOW' | 'CONTROLLED';
  decisionDeltaSummary?: string;
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
  evidence_confidence?: number | string;
  inference_confidence?: number | string;
  prediction_confidence?: number | string;
  decision_robustness?: number | string;
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
  telemetry?: {
    runId?: string;
    model?: string;
    timestamp?: string;
    inputTokens?: number | null;
    outputTokens?: number | null;
    totalTokens?: number | null;
    userInputTokens?: number;
    systemPromptTokens?: number;
    corePromptTokens?: number;
    conditionalContextTokens?: number;
    activeConditionalModules?: string[];
    baselinePromptTokens?: number;
    baselineTotalTokens?: number;
    promptOptimizationSavingsPercent?: string;
    contextMemoryTokens?: number;
    toolsSchemaTokens?: number;
    providerReportedInputTokens?: number;
    isProviderSourceOfTruth?: boolean;
    breakdownType?: string;
    thoughtTokens?: number;
    cachedTokens?: number;
    inputCostUSD?: number | null;
    outputCostUSD?: number | null;
    totalCostUSD?: number | null;
    exchangeRate?: number;
    exchangeRateSource?: string;
    exchangeRateTimestamp?: string;
    totalCostTHB?: number | null;
    formattedTHB?: string;
    formattedUSD?: string;
    reasoningLatencySec?: string | number;
    generationLatencySec?: string | number;
    auditLatencySec?: string | number;
    sumLatencySec?: string | number;
    totalLatencySec?: string | number;
    totalLatencyMs?: number;
    reasoningMs?: number;
    generationMs?: number;
    auditMs?: number;
    sumMs?: number;
    compressionRatio?: string;
    auditAligned?: string;
    coercionDetectionSource?: string;
  };
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

  // ── PCA v2.2 Evidence & Routing Layer Upgrades ──
  knowledge_router?: {
    route: 'General' | 'Personal Context' | 'Current' | 'Specialized' | 'Mixed';
    justification: string;
    decisionFlow: string[];
  };
  evidence_verification_matrix?: Array<{
    source: string;
    sourceType: string;
    provenance: string;
    retrievedAt: string;
    publishedAt: string;
    verificationStatus: 'VERIFIED' | 'CURRENT' | 'HISTORICAL' | 'UNVERIFIED' | 'CONFLICTING' | 'UNKNOWN';
    confidence: 'HIGH' | 'MEDIUM' | 'LOW';
    crossCheckResults: string;
    content: string;
  }>;
  audit_trail_flow?: Array<{
    step: string;
    description: string;
    status: 'COMPLETED' | 'PENDING' | 'SKIPPED';
    timestamp: string;
  }>;

  // ── PCA v2.1 Executive Grade Additions ──
  claim_registry?: Array<{
    id: string;
    conclusion: string;
    supports: string[];
    confidence: number;
  elevatedToFact?: boolean;
    dependsOn: string[];
    biasCheckPassed: boolean;
    promptVersion: string;
  }>;
  evidence_graph?: {
    nodes: Array<{ id: string; label: string; type: 'evidence' | 'inference' | 'claim' }>;
    edges: Array<{ from: string; to: string; label: string }>;
  };
  contradiction_detector?: Array<{
    evidenceId: string;
    contradictsClaimId: string;
    description: string;
    confidenceDelta: number;
    status: 'Active' | 'Resolved';
  }>;
  living_assessment?: Array<{
    version: string;
    timestamp: string;
    whatChanged: string;
    reason: string;
    impact: string;
    confidenceDelta: string;
  }>;

  // ── PCA v3.0 Roadmap Pillars ──
  reasoning_profile?: ReasoningProfile;
  audit_chain?: AuditBlock[];
  human_agency_enforcement?: HumanAgencyEnforcement;
  empirical_benchmark?: EmpiricalBenchmarkResult;

  // ── Executive Decision Intelligence Suite ──
  source_reliability_matrix?: SourceReliabilityItem[];
  counter_evidence?: CounterEvidenceItem[];
  decision_tree_flow?: DecisionTreeStep[];
  decomposed_confidence?: DecomposedConfidence;
  action_priority_matrix?: ActionPriorityItem[];
  executive_decision_dashboard?: ExecutiveDecisionSummary;
  decision_delta?: string;
  alternative_tradeoffs?: AlternativeTradeOffOption[];
  decision_graph_chain?: Array<{
    evidenceId: string;
    evidenceText: string;
    hypothesisId: string;
    hypothesisClaim: string;
    riskId: string;
    riskDetail: string;
    recommendationId: string;
    recommendationText: string;
    linkageConfidence: number;
  }>;

  // ── PCA v3.0 Extended Epistemic Integrity & Decision Governance ──
  evidence_claim_mapping?: EpistemicClaim[];
  evidence_confidence?: number | 'UNKNOWN' | 'NOT_CALIBRATED' | 'INSUFFICIENT_EVIDENCE';
  inference_confidence?: number | 'UNKNOWN' | 'NOT_CALIBRATED' | 'INSUFFICIENT_EVIDENCE';
  prediction_confidence?: number | 'UNKNOWN' | 'NOT_CALIBRATED' | 'INSUFFICIENT_EVIDENCE';
  decision_robustness?: number | 'UNKNOWN' | 'NOT_CALIBRATED' | 'INSUFFICIENT_EVIDENCE';
  internal_consistency_warnings?: InternalConsistencyWarning[];
  missing_information_registry?: MissingInformationRegistryItem[];
  risk_architecture?: RiskArchitectureItem[];
  decision_alternatives_v3?: DecisionAlternativeOption[];
  pca_stage_contracts?: PCAStageContract[];
  report_status?: 'GREEN' | 'AMBER' | 'RED';
  signature_status?: 'VERIFIED' | 'FAILED' | 'NOT_SIGNED';
  evidence_validity_status?: 'FULLY_VALID' | 'PARTIALLY_VALID' | 'UNSUPPORTED';
  decision_validation_status?: 'VALIDATED_BY_GOVERNANCE' | 'CONDITIONAL' | 'FAILED_CONSISTENCY';
}

export interface EpistemicClaim {
  claim_id: string;
  claim: string;
  epistemic_type: 'FACT' | 'INFERENCE' | 'HYPOTHESIS' | 'ESTIMATE' | 'UNKNOWN' | 'PREFERENCE' | 'CONSTRAINT' | 'SYNTHETIC' | 'FICTIONAL';
  supporting_evidence: Array<{
    evidence_id: string;
    content: string;
    source: string;
    source_reliability: 'HIGH' | 'MODERATE' | 'LOW';
    evidence_relevance: 'HIGH' | 'MODERATE' | 'LOW';
    evidence_strength: 'STRONG' | 'MODERATE' | 'WEAK';
    claim_support_strength: 'STRONG' | 'MODERATE' | 'WEAK';
    source_timestamp?: string;
    source_type: 'SYSTEM_EVIDENCE' | 'DECISION_EVIDENCE';
    evidence_confidence: number;
    corroboration_status: 'CORROBORATED' | 'UNCORROBORATED' | 'CONFLICTING';
  }>;
  source: string;
  source_timestamp?: string;
  source_type: 'SYSTEM_EVIDENCE' | 'DECISION_EVIDENCE';
  evidence_strength: 'STRONG' | 'MODERATE' | 'WEAK';
  evidence_confidence: number;
  corroboration_status: 'CORROBORATED' | 'UNCORROBORATED' | 'CONFLICTING';
}

export interface InternalConsistencyWarning {
  conflict_id: string;
  conflicting_fields: string[];
  explanation: string;
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  required_review: string;
  resolution_status: 'UNRESOLVED_CONTRADICTION' | 'RESOLVED' | 'UNDER_REVIEW';
}

export interface MissingInformationRegistryItem {
  missing_id: string;
  missing_information: string;
  why_needed: string;
  decision_impact: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'PENDING_COLLECTION' | 'PARTIALLY_COLLECTED' | 'UNRESOLVABLE';
}

export interface RiskArchitectureItem {
  risk_id: string;
  risk_type: 'System Risk' | 'Data Risk' | 'Evidence Risk' | 'Inference Risk' | 'Decision Risk' | 'Operational Risk';
  probability: 'High' | 'Medium' | 'Low';
  impact: 'High' | 'Medium' | 'Low';
  evidence_basis: string;
  uncertainty: string;
  mitigation: string;
  owner_reviewer?: string;
  trigger_condition?: string;
}

export interface DecisionAlternativeOption {
  option_id: string;
  title: string;
  description: string;
  evidence_strength: 'STRONG' | 'MODERATE' | 'WEAK';
  inference_confidence: number | string;
  risk_level: 'HIGH' | 'MEDIUM' | 'LOW';
  decision_robustness: number | string;
  trade_offs: string;
  unknowns: string[];
  reversibility: 'HIGHLY_REVERSIBLE' | 'PARTIALLY_REVERSIBLE' | 'IRREVERSIBLE';
  cost_of_being_wrong: 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'RECOMMENDED' | 'CONDITIONAL_OPTION' | 'INSUFFICIENT_EVIDENCE' | 'BACKUP_OPTION';
}

export interface PCAStageContract {
  stage_id: string;
  input: string;
  output: string;
  epistemic_state: 'FACT_VERIFIED' | 'INFERENCE_FORMULATED' | 'HYPOTHESIS_GENERATED' | 'RISK_EVALUATED' | 'GOVERNED_DECISION' | 'REFLECTED' | 'UNCERTAIN';
  confidence_delta: number;
  evidence_delta: number;
  risk_delta: number;
  validation_status: 'VALID' | 'WARNING' | 'FAILED';
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
