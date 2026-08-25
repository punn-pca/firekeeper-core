import { ConversationTurn, MemoryItem, PCAState, TraceEntry, EvidenceItem, GovernancePolicy, AlternativeTradeOffOption } from '../types';

export interface ReportMetadata {
  reportId: string;
  title: string;
  creator: string;
  timestamp: string;
  domain: string;
  systemVersion: string;
  schemaVersion: string;
}

export interface ReportExecutiveSummary {
  verdict: string;
  verdictThai: string;
  confidenceScore: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  evidenceQuality: 'HIGH' | 'MEDIUM' | 'LOW';
  unknownsCount: number;
  biasLevel: 'MINIMAL' | 'LOW' | 'CONTROLLED' | string;
  recommendations: string[];
}

export interface ReportFinding {
  id: string;
  topic: string;
  observation: string;
  significance: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface ReportDecision {
  goal: string;
  purpose: string;
  conclusion: string;
  rationale: string;
  understanding: string;
}

export interface ReportAlternative {
  id: string;
  title: string;
  recommendationLevel: string;
  badgeColor: 'emerald' | 'sky' | 'amber' | 'rose' | string;
  expectedOutcome: string;
  pros: string[];
  cons: string[];
  riskScore: number;
  costEffort: string;
  confidenceScore: number;
  selectionRationale: string;
}

export interface ReportEvidence {
  id: string;
  source: string;
  content: string;
  credibilityScore: number;
  reliabilityScore: number;
  citationQuote?: string;
  type: string;
  locator?: string;
}

export interface ReportRisk {
  id: string;
  description: string;
  impactLevel: 'Low' | 'Moderate' | 'Critical Guardrail' | string;
  mitigationStrategy: string;
}

export interface ReportGovernance {
  policiesEnforced: Array<{
    id: string;
    name: string;
    category: string;
    status: 'PASSED' | 'GUARDED' | 'OVERRIDDEN' | string;
    description: string;
    ruleEnforced: string;
  }>;
  selfCorrectionNotes: string[];
  hallucinationRisk: 'Low' | 'Medium' | 'High' | string;
  factCheckPassed: boolean;
}

export interface ReportHumanAgency {
  level: number;
  levelName: string;
  isBlocked: boolean;
  blockReason?: string;
  requiresHumanToken: boolean;
  tokenApproved?: boolean;
  approvedBy?: string;
  overrideActionTaken?: string;
}

export interface ReportUncertainty {
  uncertaintyIndex: number;
  drivers: string[];
  mitigationStrategy: string;
  missingInfo: string[];
}

export interface ReportTrace {
  stage: string;
  stageNumber?: number;
  durationMs: number;
  executionType: string;
  outputSummary: string;
}

export interface ReportProvenance {
  id: string;
  content: string;
  layer: string;
  storeType: string;
  source: string;
  authority: string;
  confidence: number;
}

export interface ReportIntegrity {
  sourceIntegrityHash: string;
  contentFingerprint: string;
  cryptographicSignature?: string;
  algorithmName?: string;
}

export interface ReportModel {
  id: string;
  metadata: ReportMetadata;
  summary: ReportExecutiveSummary;
  findings: ReportFinding[];
  decision: ReportDecision;
  alternatives: ReportAlternative[];
  evidence: ReportEvidence[];
  risks: ReportRisk[];
  governance: ReportGovernance;
  humanAgency: ReportHumanAgency;
  uncertainty: ReportUncertainty;
  trace: ReportTrace[];
  provenance: ReportProvenance[];
  integrity: ReportIntegrity;
}

// ────────────────────────────────────────────────────────────────────────
// Dynamic Section Engine
// ────────────────────────────────────────────────────────────────────────
export type SectionType =
  | 'EXECUTIVE'
  | 'DECISION'
  | 'FINDINGS'
  | 'EVIDENCE'
  | 'ALTERNATIVES'
  | 'RISK'
  | 'GOVERNANCE'
  | 'HUMAN_AGENCY'
  | 'UNCERTAINTY'
  | 'TRACE'
  | 'PROVENANCE'
  | 'APPENDIX';

export interface ReportSection {
  id: SectionType;
  title: string;
  status: 'SUPPORTED' | 'PARTIALLY SUPPORTED' | 'LIMITED' | 'INSUFFICIENT' | 'UNASSESSED' | 'STABLE' | 'WARNING' | 'INCOMPLETE' | 'OK' | 'ERROR';
  available: boolean;
  priority: number;
  renderable: boolean;
  data: any;
}

// ────────────────────────────────────────────────────────────────────────
// Report Validator Types
// ────────────────────────────────────────────────────────────────────────
export interface ValidationError {
  field: string;
  message: string;
  severity: 'CRITICAL' | 'WARNING';
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
  sectionStatus: Record<SectionType, 'VALID' | 'WARNING' | 'EMPTY'>;
}

// ────────────────────────────────────────────────────────────────────────
// Export Manifest & Profiles
// ────────────────────────────────────────────────────────────────────────
export type ExportProfile = 'decision_brief' | 'full_intelligence';
export type ExportFormat = 'html' | 'json' | 'zip' | 'csv';

export interface ExportManifest {
  exportId: string;
  reportId: string;
  profile: ExportProfile;
  format: ExportFormat;
  createdAt: string;
  systemVersion: string;
  schemaVersion: string;
  contentHash: string;
  files: string[];
  validation: {
    valid: boolean;
    warnings: string[];
  };
}

export interface ExportResult {
  manifest: ExportManifest;
  filename: string;
  fileContent: any; // Blob, String, or ZIP payload depending on format
}
