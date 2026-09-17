export interface GovernanceResult {
  calibratedConfidence: number; // 0.0 – 1.0
  verificationState: 'VERIFIED' | 'EMPIRICAL_VERIFIED' | 'IMPLEMENTED' | 'NOT_VERIFIED' | 'INSUFFICIENT_EVIDENCE' | 'THEORETICAL' | string;
  evidenceSources: string[];
  hallucination_risk: 'LOW' | 'MEDIUM' | 'HIGH';
  pca_stages_completed: number; // 1–12
  temporal_grounding?: boolean;
  ach_hypotheses?: ACHHypothesis[];
  epistemic_limitations?: string[];
}

export interface ACHHypothesis {
  hypothesis: string;
  probability: number;
  supporting_evidence: string[];
  contradicting_evidence: string[];
}

export interface ConfidenceCalibration {
  scorePercent: number | null;
  label: 'สูง' | 'ปานกลาง' | 'ต่ำ' | 'ไม่สามารถประเมินได้' | string;
  formula?: string;
  evidenceStrength?: number | null;
  evidenceCompleteness?: number | null;
  evidenceCoverage?: number | null;
  sourceReliability?: number | null;
  evidenceQuality?: number | null;
  conflictPenalty?: number | null;
  missingInfoPenalty?: number | null;
  mathematicalProof?: string;
  epistemicQuarantineActive?: boolean;
  quarantineReason?: string;
  empiricalCalibrationNote?: string;
  calibrationStatus?: string;
  verificationStatus?: string;
  verificationState?: string;
}

export interface ExecutionStepItem {
  stage: string;
  stageName: string;
  status: 'COMPLETED' | 'IN_PROGRESS' | 'PENDING' | 'SKIPPED';
  durationMs?: number;
  summary?: string;
  details?: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  governance?: GovernanceResult;
  confidenceCalibration?: ConfidenceCalibration;
  pcaState?: any;
  executionTrace?: any;
  model?: string;
}

export interface PCAStreamChunk {
  type: 'stage' | 'token' | 'governance' | 'done' | 'error';
  stage?: number;
  stage_name?: string;
  token?: string;
  governance?: GovernanceResult;
  error?: string;
  full_response?: string;
}

export interface AttachmentItem {
  name: string;
  type: string;
  size?: number;
  base64?: string;
  textContent?: string;
  uri?: string;
}

export interface StreamChatRequest {
  conversationId?: string;
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
  model?: string;
  language?: string;
  tone?: string;
  deepReasoning?: boolean;
  webSearch?: boolean;
  reasoningProfile?: string;
  ollamaBaseUrl?: string;
  attachments?: AttachmentItem[];
  useLtm?: boolean;
  ltm?: boolean;
}

export type VerificationState = GovernanceResult['verificationState'];

export const VERIFICATION_COLORS: Record<string, string> = {
  VERIFIED: '#22c55e',
  EMPIRICAL_VERIFIED: '#16a34a',
  IMPLEMENTED: '#f59e0b',
  NOT_VERIFIED: '#f97316',
  INSUFFICIENT_EVIDENCE: '#ef4444',
  THEORETICAL: '#6366f1',
};

export const VERIFICATION_LABELS: Record<string, string> = {
  VERIFIED: 'Verified',
  EMPIRICAL_VERIFIED: 'Empirically Verified',
  IMPLEMENTED: 'Implemented (Pending)',
  NOT_VERIFIED: 'Not Verified',
  INSUFFICIENT_EVIDENCE: 'Insufficient Evidence',
  THEORETICAL: 'Theoretical',
};
