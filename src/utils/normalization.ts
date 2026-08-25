import { PCAState, EvidenceItem, MemoryItem, GovernancePolicy, TraceEntry } from '../types';

export enum SemanticState {
  AVAILABLE = 'AVAILABLE',
  EMPTY = 'EMPTY',
  PENDING = 'PENDING',
  ERROR = 'ERROR',
  NOT_APPLICABLE = 'NOT_APPLICABLE',
  RESTRICTED = 'RESTRICTED',
}

// Canonical Data Contracts
export interface AnalysisResultContract {
  state: SemanticState;
  conclusion: string;
  confidence: 'สูง' | 'ปานกลาง' | 'ต่ำ' | 'ไม่สามารถประเมินได้' | string;
  confidenceScore: number;
  findings: string[];
  risks: string[];
  uncertainty: string[];
  raw?: PCAState | null;
}

export interface EvidenceResultContract {
  state: SemanticState;
  items: EvidenceItem[];
  verificationMatrix?: any[];
  sourceReliability?: any[];
}

export interface DecisionResultContract {
  state: SemanticState;
  verdict: string;
  verdictThai: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | string;
  confidenceScore: number;
  tradeOffs?: any[];
  priorityActions?: any[];
}

export interface GovernanceResultContract {
  state: SemanticState;
  policies: GovernancePolicy[];
}

export interface TraceResultContract {
  state: SemanticState;
  entries: TraceEntry[];
  totalLatencyMs: number;
}

export interface MemoryResultContract {
  state: SemanticState;
  items: MemoryItem[];
  rankedItems?: any[];
  impacts?: any[];
}

// Adapters / Normalizer Layer
export function normalizeAnalysisResult(
  pcaState: PCAState | undefined | null,
  isPending = false,
  error: any = null
): AnalysisResultContract {
  if (isPending) {
    return {
      state: SemanticState.PENDING,
      conclusion: '',
      confidence: 'ไม่สามารถประเมินได้',
      confidenceScore: 0,
      findings: [],
      risks: [],
      uncertainty: [],
      raw: null,
    };
  }

  if (error) {
    return {
      state: SemanticState.ERROR,
      conclusion: '',
      confidence: 'ไม่สามารถประเมินได้',
      confidenceScore: 0,
      findings: [],
      risks: [],
      uncertainty: [],
      raw: null,
    };
  }

  if (!pcaState) {
    return {
      state: SemanticState.EMPTY,
      conclusion: '',
      confidence: 'ไม่สามารถประเมินได้',
      confidenceScore: 0,
      findings: [],
      risks: [],
      uncertainty: [],
      raw: null,
    };
  }

  // Check if actually has data
  const hasConclusion = Boolean(pcaState.response || pcaState.decision);
  const findings = pcaState.observations || [];
  const risks = pcaState.critique || [];
  const uncertainty = pcaState.uncertainty || [];

  const state = hasConclusion ? SemanticState.AVAILABLE : SemanticState.EMPTY;

  return {
    state,
    conclusion: pcaState.response || pcaState.decision || '',
    confidence: pcaState.confidence || 'ไม่สามารถประเมินได้',
    confidenceScore: pcaState.executive_dashboard?.confidenceScore || 0,
    findings,
    risks,
    uncertainty,
    raw: pcaState,
  };
}

export function normalizeEvidenceResult(
  pcaState: PCAState | undefined | null,
  isPending = false
): EvidenceResultContract {
  if (isPending) return { state: SemanticState.PENDING, items: [] };
  if (!pcaState) return { state: SemanticState.EMPTY, items: [] };

  const items = pcaState.evidence_explorer || [];
  const verificationMatrix = pcaState.evidence_verification_matrix || [];
  const sourceReliability = pcaState.source_reliability_matrix || [];

  const hasItems = items.length > 0 || verificationMatrix.length > 0 || sourceReliability.length > 0;
  const state = hasItems ? SemanticState.AVAILABLE : SemanticState.EMPTY;

  return {
    state,
    items,
    verificationMatrix,
    sourceReliability,
  };
}

export function normalizeDecisionResult(
  pcaState: PCAState | undefined | null,
  isPending = false
): DecisionResultContract {
  if (isPending) {
    return {
      state: SemanticState.PENDING,
      verdict: '',
      verdictThai: '',
      riskLevel: 'LOW',
      confidenceScore: 0,
    };
  }
  if (!pcaState) {
    return {
      state: SemanticState.EMPTY,
      verdict: '',
      verdictThai: '',
      riskLevel: 'LOW',
      confidenceScore: 0,
    };
  }

  const ex = pcaState.executive_decision_dashboard;
  const metrics = pcaState.executive_dashboard || pcaState.executiveMetrics;

  const verdict = ex?.verdict || 'HOLD';
  const verdictThai = ex?.verdictThai || 'ระงับชั่วคราว';
  const riskLevel = ex?.riskLevel || 'LOW';
  const confidenceScore = metrics?.confidenceScore || ex?.confidenceScore || 0;
  const tradeOffs = pcaState.alternative_tradeoffs || [];
  const priorityActions = pcaState.action_priority_matrix || [];

  const hasDecision = Boolean(ex || metrics);
  const state = hasDecision ? SemanticState.AVAILABLE : SemanticState.EMPTY;

  return {
    state,
    verdict,
    verdictThai,
    riskLevel,
    confidenceScore,
    tradeOffs,
    priorityActions,
  };
}

export function normalizeGovernanceResult(
  pcaState: PCAState | undefined | null,
  isPending = false
): GovernanceResultContract {
  if (isPending) return { state: SemanticState.PENDING, policies: [] };
  if (!pcaState) return { state: SemanticState.EMPTY, policies: [] };

  const policies = pcaState.governance_policies || [];
  const hasPolicies = policies.length > 0;
  const state = hasPolicies ? SemanticState.AVAILABLE : SemanticState.EMPTY;

  return {
    state,
    policies,
  };
}

export function normalizeTraceResult(
  pcaState: PCAState | undefined | null,
  isPending = false
): TraceResultContract {
  if (isPending) return { state: SemanticState.PENDING, entries: [], totalLatencyMs: 0 };
  if (!pcaState) return { state: SemanticState.EMPTY, entries: [], totalLatencyMs: 0 };

  const entries = pcaState.trace || [];
  const totalLatencyMs = pcaState.execution_time_ms || 0;

  const hasTrace = entries.length > 0;
  const state = hasTrace ? SemanticState.AVAILABLE : SemanticState.EMPTY;

  return {
    state,
    entries,
    totalLatencyMs,
  };
}

export function normalizeMemoryResult(
  pcaState: PCAState | undefined | null,
  isPending = false
): MemoryResultContract {
  if (isPending) return { state: SemanticState.PENDING, items: [] };
  if (!pcaState) return { state: SemanticState.EMPTY, items: [] };

  const items = pcaState.memories || [];
  const rankedItems = pcaState.ranked_memories || [];
  const impacts = pcaState.memory_impacts || [];

  const hasMemory = items.length > 0 || rankedItems.length > 0 || impacts.length > 0;
  const state = hasMemory ? SemanticState.AVAILABLE : SemanticState.EMPTY;

  return {
    state,
    items,
    rankedItems,
    impacts,
  };
}
