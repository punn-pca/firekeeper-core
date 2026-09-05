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
  id?: string;
  role: 'user' | 'assistant';
  content: string;
  attachments?: AttachedFile[];
  pcaState?: PCAState;
  tokensUsed?: number;
  isTokenEstimated?: boolean;
  timestamp?: string;
  durationMs?: number;
  userSentTimestamp?: string;
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

export type AnalysisSourceCategory = 'User Input' | 'External Source' | 'System Specification' | 'Model Knowledge';

export interface AnalysisSourceItem {
  id: string;
  category: AnalysisSourceCategory;
  name: string;
  description: string;
  details?: string;
  locator?: string;
  sourceUrl?: string;
  citationQuote?: string;
  isExternal: boolean;
  isEvidence: boolean; // TRUE only for real verified empirical external evidence; FALSE for Model Knowledge and System Specification
}

export interface HumanAgencyAuditResult {
  status: 'ENFORCED' | 'ADVISORY_CONFIRMED' | 'ESCALATED';
  decision_authority: string; // e.g. "Human Exclusive (Human-in-the-Loop)"
  role: string; // e.g. "Advisory Only"
  coercion_free: boolean;
  summary: string;
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

export type FactClass =
  | 'FACT'
  | 'MODEL_KNOWLEDGE'
  | 'USER_PROVIDED'
  | 'INFERENCE'
  | 'HYPOTHESIS'
  | 'UNVERIFIED'
  | 'OPINION';

export type TemporalStatus =
  | 'PAST'
  | 'CURRENT'
  | 'FUTURE'
  | 'TIMELESS'
  | 'UNKNOWN';

export interface FactClaim {
  claim: string;
  classification: FactClass;
  temporalStatus: TemporalStatus;
  claimDate?: string;
  requiresVerification: boolean;
  verified: boolean;
  sourceIds?: string[];
  verificationNote?: string;
}

export interface TemporalContext {
  currentDate: Date;
  knowledgeCutoff: Date;
}

export interface EvidenceSource {
  id: string;
  source: string;
  title?: string;
  publishedAt?: string;
  retrievedAt: string;
  authorityScore: number;
  content: string;
  sourceUrl?: string;
}

export interface TemporalDetectionResult {
  isTemporalSensitive: boolean;
  temporalScope: 'CURRENT_STATUS' | 'HISTORICAL' | 'TIMELESS';
  detectedKeywords: string[];
  verificationRequired: boolean;
  reason: string;
  suggestedSearchQuery?: string;
}

export interface TemporalClaimVerification {
  claim: string;
  claim_time: 'current' | 'historical' | 'timeless';
  knowledge_cutoff: string;
  current_date: string;
  verification_required: boolean;
  verified: boolean;
  source_id?: string;
  source_url?: string;
  source_published_at?: string;
  classification: 'FACT' | 'MODEL_KNOWLEDGE' | 'INFERENCE' | 'HYPOTHESIS' | 'UNVERIFIED';
  status_message?: string;
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
  verification_status: 'EXECUTED_IN_RUNTIME' | 'AUDITED_AND_VERIFIED' | 'TAMPERED' | 'FAILED';
  tamperCheckPassed: boolean;
}

export type ExecutionStepStageKey =
  | 'INPUT'
  | 'CONTEXT'
  | 'EVIDENCE_RETRIEVAL'
  | 'EVIDENCE_VALIDATION'
  | 'HYPOTHESIS'
  | 'REASONING'
  | 'RISK'
  | 'DECISION'
  | 'GOVERNANCE'
  | 'OUTPUT';

export interface EvidenceLineageItem {
  evidence_id: string; // e.g. "E-001"
  source: string; // e.g. "พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562 (PDPA)"
  source_type: 'official' | 'institutional' | 'primary' | 'news' | 'general' | 'attachment' | 'database';
  document_url_or_locator: string;
  retrieved_at: string;
  content_hash: string; // SHA-256 of text snippet
  evidence_status: 'VERIFIED' | 'PARTIALLY_VERIFIED' | 'UNVERIFIED' | 'CONFLICTING';
  credibility_score: number; // 0.0 - 1.0
  content_snippet: string;
  verification_method: string;
  used_by: {
    hypotheses: string[]; // e.g. ["H-001", "H-002"]
    risks: string[]; // e.g. ["R-001"]
    decision_refs: string[]; // e.g. ["DEC-2026-000184"]
  };
}

export interface DecisionLineageRiskNode {
  risk_id: string; // e.g. "R-001"
  description: string;
  probability: string;
  impact: string;
  mitigation: string;
  residual_risk: string;
  linked_evidence_refs: string[];
}

export interface DecisionLineageHypothesisNode {
  hypothesis_id: string; // e.g. "H-001"
  claim: string;
  prior: number;
  likelihood: number;
  posterior: number;
  status: string;
  rationale: string;
  linked_evidence_refs: string[];
}

export interface DecisionLineageTree {
  decision_id: string;
  verdict_summary: string;
  formed_at: string;
  decision_rationale: string;
  human_agency_safeguard: string;
  risks: DecisionLineageRiskNode[];
  hypotheses: DecisionLineageHypothesisNode[];
  context_refs: Array<{
    context_id: string;
    layer: string;
    description: string;
  }>;
}

export interface ExecutionVersionManifest {
  punn_pca_version: string; // "PUNN-PCA-v3.0-TRACE"
  model_version: string; // "deepseek-chat / deepseek-reasoner"
  prompt_policy_version: string; // "GOV-POL-2026.09.1"
  knowledge_memory_version: string; // "LTM-v2.4-ACTIVE"
  evidence_version: string; // "EVD-CHAIN-v3.0"
  governance_rule_version: string; // "ISO-42001:2023 / NIST-AI-RMF-v1.0"
  execution_version: string; // "EXEC-RUN-2026.09.02"
}

export interface ExecutionIntegrityReport {
  overall_integrity: 'VERIFIED' | 'INTEGRITY_WARNING' | 'FAILED';
  event_chain_status: 'VALID' | 'BROKEN';
  evidence_links_status: 'VALID' | 'UNRESOLVED_LINKS';
  checksum_status: 'VALID' | 'MISMATCH';
  schema_compliance: 'PUNN-PCA-v3.0';
  execution_status: 'COMPLETE' | 'PARTIAL' | 'FAILED';
  integrity_notes: string[];
  tamper_detected: boolean;
  warnings: string[];
}

export interface TraceVerificationResult {
  overall_verified: boolean;
  tamper_detected: boolean;
  status: 'VERIFIED' | 'TAMPERED' | 'NOT_VERIFIED';
  checks: {
    event_hashes_valid: boolean;
    previous_hash_linkage_valid: boolean;
    ordering_valid: boolean;
    execution_id_consistent: boolean;
    merkle_root_valid: boolean;
    canonical_trace_hash_valid: boolean;
    input_hash_valid: boolean;
    output_checksum_valid: boolean;
    evidence_refs_valid: boolean;
  };
  details: string[];
  tampered_step_indices: number[];
  computed_merkle_root?: string;
  expected_merkle_root?: string;
  computed_canonical_hash?: string;
  expected_canonical_hash?: string;
}

export interface ExecutionStepRecord {
  event_id: string; // e.g. "event_001_input", "event_002_context", ...
  step_number: number; // 1 to 10
  stage_key: ExecutionStepStageKey;
  stage_label_th: string;
  stage_label_en: string;
  status_badge: string; // "INPUT_RECEIVED" | "CONTEXT_BUILT" | "EVIDENCE_RETRIEVED" | "EVIDENCE_VALIDATED" | "HYPOTHESES_GENERATED" | "REASONING_COMPLETED" | "RISK_ASSESSED" | "DECISION_FORMED" | "GOVERNANCE_CHECKED" | "OUTPUT_GENERATED"
  started_at: string;
  completed_at: string;
  duration_ms: number;
  input_ref: string; // e.g. "user_request" or "event_002_context"
  output_ref: string; // e.g. "event_004_validation" or "final_response"
  evidence_refs: string[]; // e.g. ["E-001", "E-002"]
  rule_refs: string[]; // e.g. ["RULE-ANTI-FABRICATION-v2.1", "ISO-42001-A.6.2"]
  model_ref: string;
  schema_version: 'PUNN-PCA-v3.0';
  event_hash: string;
  previous_event_hash: string;
  summary: string;
  status: 'COMPLETED' | 'IN_PROGRESS' | 'WARNING' | 'SKIPPED';
  execution_type?: 'LLM_GENERATION' | 'SEMANTIC_RERANKER' | 'BAYESIAN_COMPUTATION' | 'HEURISTIC_EVAL' | 'RULE_CHECK' | 'AUDIT_LOGIC';
  input_payload: Record<string, any>;
  output_payload: Record<string, any>;
  data: {
    title?: string;
    details?: string;
    items?: Array<{ label: string; value: any; highlight?: boolean }>;
    raw_payload?: Record<string, any>;
    evidence_count?: number;
    reliability?: string;
    hypotheses_count?: number;
    risk_level?: string;
    policy_checks?: string[];
    governance_verdict?: string;
    human_approval_required?: boolean;
    approval_status?: string;
    actor?: string;
    canonical_version?: string;
    hash?: string;
    [key: string]: any;
  };
}

export interface DecisionExecutionTrace {
  execution_id: string; // e.g. "DEC-2026-000184"
  request_id: string;
  schema_version: 'PUNN-PCA-v3.0-TRACE';
  created_at: string;
  completed_at: string;
  total_duration_ms: number;
  user_query: string;
  user_role: string;
  model_name: string;
  overall_status: 'COMPLETED' | 'GOVERNED_ADVISORY' | 'WARNING' | 'FAILED';
  overall_confidence: string;
  governance_status: 'ENFORCED' | 'ADVISORY_CONFIRMED' | 'ESCALATED';
  human_agency_level: string;
  steps: ExecutionStepRecord[];
  evidence_lineage: EvidenceLineageItem[];
  decision_lineage: DecisionLineageTree;
  claim_evidence_matrix?: any[];
  bayesian_proof?: any;
  version_manifest: ExecutionVersionManifest;
  integrity_report: ExecutionIntegrityReport;
  provenance_hashes: {
    input_sha256: string;
    output_sha256: string;
    trace_canonical_sha256: string;
    merkle_root_sha256: string;
  };
  summary_metrics: {
    sources_count: number;
    unique_sources_count?: number;
    evidence_count: number;
    evidence_objects_count?: number;
    source_references_count?: number;
    hypotheses_count: number;
    risks_evaluated: number;
    policy_checks_passed: number;
    tokens_used: number;
    claims_evaluated_count?: number;
    verified_claims_count?: number;
    unverified_claims_count?: number;
  };
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
  scorePercent: number | null;
  label: 'สูง' | 'ปานกลาง' | 'ต่ำ' | 'ไม่สามารถประเมินได้';
  formula: string;
  evidenceStrength?: number | null;
  evidenceCompleteness?: number | null;
  evidenceCoverage?: number | null;
  sourceReliability?: number | null;
  evidenceQuality?: number | null;
  retrievalScoreWeight?: number;
  crossEncoderScore?: number;
  llmSelfEvalScore?: number;
  ensembleConfidence?: number;
  conflictPenalty: number;
  missingInfoPenalty: number;
  bayesianPosterior?: number | null;
  empiricalCalibrationNote?: string;
  validationBenchmark?: string;
  priorJustification?: string;
  selfEvalMethodology?: string;
  eceScore?: number | null;
  brierScore?: number | null;
  calibrationStatus?: 'NOT_VERIFIED' | 'STRICT_GOVERNED' | 'EMPIRICAL_VERIFIED' | string;
  verificationStatus?: 'VERIFIED' | 'PARTIALLY_VERIFIED' | 'SOURCE_CHECKED' | 'SOURCE_FOUND' | 'STALE' | 'CONFLICTED' | 'UNVERIFIED' | string;
  verificationState?: 'USER_CLAIM' | 'MODEL_KNOWLEDGE' | 'UNVERIFIED' | 'SOURCE_FOUND' | 'SOURCE_CHECKED' | 'PARTIALLY_VERIFIED' | 'VERIFIED' | 'STALE' | 'CONFLICTED' | string;
  mathematicalProof?: string;
  epistemicQuarantineActive?: boolean;
  quarantineReason?: string;
  evidence_confidence?: number | null | string;
  inference_confidence?: number | null | string;
  prediction_confidence?: number | null | string;
  decision_robustness?: number | null | string;
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
  sources_used?: AnalysisSourceItem[];
  has_external_evidence?: boolean;
  web_search_enabled?: boolean;
  web_search_results?: any;
  human_agency_audit?: HumanAgencyAuditResult;
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
  temporal_detection?: TemporalDetectionResult;
  temporal_claim_verification?: TemporalClaimVerification;
  fact_claims?: FactClaim[];
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
  evidence_confidence?: number | null | 'UNKNOWN' | 'NOT_CALIBRATED' | 'INSUFFICIENT_EVIDENCE';
  inference_confidence?: number | null | 'UNKNOWN' | 'NOT_CALIBRATED' | 'INSUFFICIENT_EVIDENCE';
  prediction_confidence?: number | null | 'UNKNOWN' | 'NOT_CALIBRATED' | 'INSUFFICIENT_EVIDENCE';
  decision_robustness?: number | null | 'UNKNOWN' | 'NOT_CALIBRATED' | 'INSUFFICIENT_EVIDENCE';
  internal_consistency_warnings?: InternalConsistencyWarning[];
  missing_information_registry?: MissingInformationRegistryItem[];
  risk_architecture?: RiskArchitectureItem[];
  decision_alternatives_v3?: DecisionAlternativeOption[];
  pca_stage_contracts?: PCAStageContract[];
  report_status?: 'GREEN' | 'AMBER' | 'RED';
  signature_status?: 'VERIFIED' | 'FAILED' | 'NOT_SIGNED';
  evidence_validity_status?: 'FULLY_VALID' | 'PARTIALLY_VALID' | 'UNSUPPORTED';
  decision_validation_status?: 'VALIDATED_BY_GOVERNANCE' | 'CONDITIONAL' | 'FAILED_CONSISTENCY';
  execution_trace?: DecisionExecutionTrace;
}

export interface EpistemicClaim {
  claim_id: string;
  claim: string;
  epistemic_type: 'FACT' | 'INFERENCE' | 'HYPOTHESIS' | 'ESTIMATE' | 'UNKNOWN' | 'PREFERENCE' | 'CONSTRAINT' | 'SYNTHETIC' | 'FICTIONAL';
  supporting_evidence: Array<{
    evidence_id: string;
    content: string;
    source: string;
    source_reliability: 'HIGH' | 'MODERATE' | 'LOW' | 'UNKNOWN';
    evidence_relevance: 'HIGH' | 'MODERATE' | 'LOW' | 'UNKNOWN';
    evidence_strength: 'STRONG' | 'MODERATE' | 'WEAK';
    claim_support_strength: 'STRONG' | 'MODERATE' | 'WEAK';
    source_timestamp?: string;
    source_type: 'SYSTEM_EVIDENCE' | 'DECISION_EVIDENCE';
    evidence_confidence: number | null;
    corroboration_status: 'CORROBORATED' | 'UNCORROBORATED' | 'CONFLICTING';
  }>;
  source: string;
  source_timestamp?: string;
  source_type: 'SYSTEM_EVIDENCE' | 'DECISION_EVIDENCE';
  evidence_strength: 'STRONG' | 'MODERATE' | 'WEAK';
  evidence_confidence: number | null;
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
  { id: 'INTENT_DEFINITION', stageNumber: 1, label: '01. Intent Definition', thLabel: 'การระบุเจตนาและความต้องการ', icon: 'Eye', description: 'การรับและจำแนกสัญญาณอินพุต ถอดรหัสเจตนาและความต้องการที่แท้จริงของผู้ใช้' },
  { id: 'CONTEXT_UNDERSTANDING', stageNumber: 2, label: '02. Context Understanding', thLabel: 'การทำความเข้าใจบริบทและข้อจำกัด', icon: 'Brain', description: 'การสกัดความหมายเชิงลึก ประเมินบริบทแวดล้อม เงื่อนไข และข้อจำกัด' },
  { id: 'PURPOSE_SCOPE', stageNumber: 3, label: '03. Purpose & Scope', thLabel: 'การกำหนดวัตถุประสงค์และขอบเขต', icon: 'Target', description: 'การกำหนดเป้าหมายเชิงยุทธศาสตร์ ขอบเขตการวิเคราะห์ และนโยบาย Governance' },
  { id: 'DATA_STRUCTURING', stageNumber: 4, label: '04. Data Structuring', thLabel: 'การจัดโครงสร้างข้อมูลและการดึงความจำ', icon: 'Database', description: 'การจัดหมวดหมู่ข้อมูล สกัด Taxonomy และค้นหาบริบทจากคลังความจำ LTM ผ่าน Hard Relevance Gate' },
  { id: 'RELATIONSHIP_MODELING', stageNumber: 5, label: '05. Relationship Modeling', thLabel: 'การสร้างแบบจำลองความสัมพันธ์เชิงตรรกะ', icon: 'Network', description: 'การสร้าง Directed Acyclic Graph (DAG) และแบบจำลองความสัมพันธ์เชิงเหตุและผล (Causal Dependencies)' },
  { id: 'HYPOTHESIS_FORMATION', stageNumber: 6, label: '06. Hypothesis Formation', thLabel: 'การสร้างสมมติฐานทางเลือกคู่ขนาน (ACH)', icon: 'Sparkles', description: 'การกำหนดชุดสมมติฐานทางเลือกคู่ขนาน (Analysis of Competing Hypotheses) และคำนวณ Bayesian Prior' },
  { id: 'EVIDENCE_EVALUATION', stageNumber: 7, label: '07. Evidence Evaluation', thLabel: 'การประเมินและจำแนกหลักฐานเชิงประจักษ์', icon: 'ShieldCheck', description: 'การตรวจสอบความน่าเชื่อถือ ถ่วงน้ำหนักหลักฐานสนับสนุน/หักล้าง และจำแนกตาม Evidence Taxonomy' },
  { id: 'RISK_CRITIQUE_ANALYSIS', stageNumber: 8, label: '08. Risk & Critique Analysis', thLabel: 'การวิเคราะห์ความเสี่ยงและจุดวิพากษ์', icon: 'AlertTriangle', description: 'การทดสอบความเปราะบาง (Vulnerability Critique) วิเคราะห์ความเสี่ยง ตรวจจับความขัดแย้ง และประเมินความไม่แน่นอน' },
  { id: 'STRATEGIC_OPTIONS', stageNumber: 9, label: '09. Strategic Options', thLabel: 'การสังเคราะห์ทางเลือกเชิงยุทธศาสตร์', icon: 'Compass', description: 'การเปรียบเทียบทางเลือกเชิงยุทธศาสตร์ (Option A/B/C) วิเคราะห์ Trade-offs และคำนวณ Calibrated Confidence' },
  { id: 'ANALYSIS_COMMUNICATION', stageNumber: 10, label: '10. Analysis Communication', thLabel: 'การสื่อสารบทวิเคราะห์และการสร้างคำตอบ', icon: 'MessageSquare', description: 'การสังเคราะห์และสร้างบทวิเคราะห์ระดับ Executive Decision Intelligence พร้อม Real-time Stream' },
  { id: 'REVIEW_VERIFICATION', stageNumber: 11, label: '11. Review & Verification', thLabel: 'การทบทวนและตรวจสอบความสอดคล้อง', icon: 'RotateCcw', description: 'การทบทวนกระบวนการคิด (Meta-Reflection) ตรวจสอบความถูกต้องตามกฎ Anti-Fabrication และ ISO/NIST' },
  { id: 'CONTINUOUS_IMPROVEMENT', stageNumber: 12, label: '12. Continuous Improvement', thLabel: 'การปรับปรุงอย่างต่อเนื่องและเคารพ Human Agency', icon: 'GraduationCap', description: 'การบันทึกบทเรียนเพื่อการเรียนรู้ระยะยาวและคุ้มครองอำนาจการตัดสินใจของมนุษย์ (Inviolable Human Gate)' },
] as const;
