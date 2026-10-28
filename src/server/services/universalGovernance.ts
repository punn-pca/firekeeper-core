import { z } from 'zod';

/**
 * Universal, domain-agnostic governance primitives.
 *
 * These checks measure evidence properties and execution state only. They do
 * not decide whether a source's substantive claim is true; semantic verification
 * remains a separate gate.
 */
export const UniversalEvidenceInputSchema = z.object({
  id: z.string().min(1),
  claim: z.string().min(1),
  content: z.string().default(''),
  source: z.string().default(''),
  sourceUrl: z.string().url().optional(),
  locator: z.string().optional(),
  documentId: z.string().optional(),
  retrievedAt: z.string().datetime().optional(),
  publishedAt: z.string().datetime().optional(),
  temporalSensitive: z.boolean().default(false),
});

export const HypothesisStatusSchema = z.enum(['untested', 'tested', 'refuted']);
export const StructuredHypothesisSchema = z.object({
  id: z.string().min(1),
  statement: z.string().min(1),
  supporting_evidence_ids: z.array(z.string()),
  contradicting_evidence_ids: z.array(z.string()),
  status: HypothesisStatusSchema,
});
export const StructuredHypothesisOutputSchema = z.object({
  hypotheses: z.array(StructuredHypothesisSchema).min(1),
});

export const UniversalDecisionObjectSchema = z.object({
  options: z.array(z.object({
    id: z.string().min(1),
    title: z.string().min(1),
    type: z.string().min(1),
    benefits: z.array(z.string()),
    costs: z.array(z.string()),
    risks: z.array(z.string()),
    assumptions: z.array(z.string()),
    evidenceIds: z.array(z.string()),
  })).min(1),
  recommendation: z.object({
    optionId: z.string().min(1).nullable(),
    rationale: z.string(),
    conditions: z.array(z.string()),
    status: z.enum(['ADVISORY_ONLY', 'PENDING_HUMAN_APPROVAL']),
  }),
}).superRefine((decision, ctx) => {
  const ids = new Set(decision.options.map((option) => option.id));
  if (decision.options.length !== ids.size) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['options'], message: 'Option IDs must be unique' });
  }
  if (decision.recommendation.optionId !== null && !ids.has(decision.recommendation.optionId)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['recommendation', 'optionId'], message: 'Recommendation must reference an existing option or null' });
  }
  const evidenceIds = new Set(decision.options.flatMap((option) => option.evidenceIds));
  if (decision.options.some((option) => option.evidenceIds.some((id) => !id.trim()))) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['options'], message: 'Evidence IDs cannot be blank' });
  }
  void evidenceIds;
});

export type UniversalEvidenceInput = z.input<typeof UniversalEvidenceInputSchema>;
export type StructuredHypothesisOutput = z.infer<typeof StructuredHypothesisOutputSchema>;
export type UniversalDecisionObject = z.infer<typeof UniversalDecisionObjectSchema>;

export type EvidenceQualityResult = {
  id: string;
  relevance: number;
  directness: number;
  sourceReliability: number;
  recency: number | null;
  score: number;
  usable: boolean;
  reasons: string[];
};

export type EvidenceQualityGateResult = {
  has_usable_evidence: boolean;
  quarantine_required: boolean;
  acceptedEvidenceIds: string[];
  rejectedEvidenceIds: string[];
  evidence: EvidenceQualityResult[];
};

export type EvidenceGateConfig = {
  minimumScore?: number;
  minimumRelevance?: number;
  minimumDirectness?: number;
  minimumSourceReliability?: number;
  minimumRecency?: number;
  now?: Date;
  recencyHalfLifeMs?: number;
};

function normalize(value: string): string {
  return value.toLocaleLowerCase().normalize('NFKC')
    .replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
}

function tokens(value: string): string[] {
  return normalize(value).split(/\s+/u).filter((token) => token.length > 1);
}

function overlapRatio(claim: string, content: string): number {
  const claimTokens = Array.from(new Set(tokens(claim)));
  const contentTokens = new Set(tokens(content));
  if (claimTokens.length === 0 || contentTokens.size === 0) return 0;
  return claimTokens.filter((token) => contentTokens.has(token)).length / claimTokens.length;
}

function directnessScore(claim: string, content: string): number {
  const relevance = overlapRatio(claim, content);
  if (relevance === 0) return 0;
  // Generic structural measure: how much of the item is about the claim,
  // rather than an unrelated amount of surrounding text.
  const claimSet = new Set(tokens(claim));
  const contentTokens = tokens(content);
  if (contentTokens.length === 0) return 0;
  const matched = contentTokens.filter((token) => claimSet.has(token)).length;
  return Math.min(1, matched / Math.max(1, Math.sqrt(contentTokens.length * claimSet.size)));
}

function sourceReliabilityScore(item: z.infer<typeof UniversalEvidenceInputSchema>): number {
  // Traceability is measurable; traceability is not a claim that the source is true.
  if (item.sourceUrl && (item.sourceUrl.startsWith('https://') || item.sourceUrl.startsWith('http://')) && (item.source.trim() || item.locator?.trim() || item.documentId?.trim())) return 1;
  if (item.locator?.trim() || item.documentId?.trim()) return 0.7;
  if (item.source.trim()) return 0.4;
  return 0;
}

function recencyScore(item: z.infer<typeof UniversalEvidenceInputSchema>, now: Date, halfLifeMs: number): number | null {
  if (!item.temporalSensitive) return null;
  const date = item.publishedAt || item.retrievedAt;
  if (!date) return 0;
  const age = Math.max(0, now.getTime() - new Date(date).getTime());
  return Math.pow(0.5, age / Math.max(1, halfLifeMs));
}

export function evaluateUniversalEvidence(
  inputs: unknown[],
  config: EvidenceGateConfig = {},
): EvidenceQualityGateResult {
  const minimumScore = config.minimumScore ?? 0.55;
  const minimumRelevance = config.minimumRelevance ?? 0.25;
  const minimumDirectness = config.minimumDirectness ?? 0.15;
  const minimumSourceReliability = config.minimumSourceReliability ?? 0.4;
  const minimumRecency = config.minimumRecency ?? 0.1;
  const now = config.now ?? new Date();
  const halfLife = config.recencyHalfLifeMs ?? 365 * 24 * 60 * 60 * 1000;
  const evidence: EvidenceQualityResult[] = [];

  for (const raw of Array.isArray(inputs) ? inputs : []) {
    const parsed = UniversalEvidenceInputSchema.safeParse(raw);
    if (!parsed.success) {
      const id = typeof (raw as any)?.id === 'string' ? (raw as any).id : 'INVALID_EVIDENCE';
      evidence.push({ id, relevance: 0, directness: 0, sourceReliability: 0, recency: null, score: 0, usable: false, reasons: ['INVALID_EVIDENCE_SCHEMA'] });
      continue;
    }
    const item = parsed.data;
    const relevance = overlapRatio(item.claim, item.content);
    const directness = directnessScore(item.claim, item.content);
    const sourceReliability = sourceReliabilityScore(item);
    const recency = recencyScore(item, now, halfLife);
    const weightedScore = recency === null
      ? relevance * 0.45 + directness * 0.30 + sourceReliability * 0.25
      : relevance * 0.35 + directness * 0.25 + sourceReliability * 0.20 + recency * 0.20;
    const reasons: string[] = [];
    if (relevance < minimumRelevance) reasons.push('LOW_RELEVANCE');
    if (directness < minimumDirectness) reasons.push('LOW_DIRECTNESS');
    if (sourceReliability < minimumSourceReliability) reasons.push('LOW_SOURCE_TRACEABILITY');
    if (recency !== null && recency < minimumRecency) reasons.push('STALE_OR_UNDATED');
    const usable = reasons.length === 0 && weightedScore >= minimumScore;
    if (!usable && reasons.length === 0) reasons.push('BELOW_COMPOSITE_THRESHOLD');
    evidence.push({ id: item.id, relevance, directness, sourceReliability, recency, score: Number(weightedScore.toFixed(4)), usable, reasons });
  }

  const acceptedEvidenceIds = evidence.filter((item) => item.usable).map((item) => item.id);
  const rejectedEvidenceIds = evidence.filter((item) => !item.usable).map((item) => item.id);
  const has_usable_evidence = acceptedEvidenceIds.length > 0;
  return {
    has_usable_evidence,
    quarantine_required: !has_usable_evidence,
    acceptedEvidenceIds,
    rejectedEvidenceIds,
    evidence,
  };
}

export type UniversalControlInput = {
  confidence: number | null;
  epistemicQuarantineActive: boolean;
  has_usable_evidence: boolean;
  criticalDecisionGap: boolean;
  highImpact: boolean;
  highUncertainty: boolean;
  pipeline_incomplete: boolean;
};

export type UniversalControlResult = {
  controlLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  escalation_required: boolean;
  quarantine_required: boolean;
};

export function resolveUniversalControl(input: UniversalControlInput): UniversalControlResult {
  const invalidConfidence = input.confidence === null ||
    !Number.isFinite(input.confidence) || input.confidence < 0 || input.confidence > 1;
  const quarantine_required = input.epistemicQuarantineActive ||
    !input.has_usable_evidence || input.pipeline_incomplete || invalidConfidence;
  let controlLevel: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
  if (quarantine_required) controlLevel = 'MEDIUM';
  const escalation_required = input.criticalDecisionGap || (input.highImpact && input.highUncertainty);
  if (escalation_required) controlLevel = 'HIGH';
  return { controlLevel, escalation_required, quarantine_required };
}

export const REQUIRED_GOVERNANCE_STAGES = [
  'EVIDENCE_GATHERING',
  'EVIDENCE_QUALITY_GATE',
  'HYPOTHESIS_GENERATION',
  'RISK_UNCERTAINTY',
  'GOVERNANCE_GATE',
  'HUMAN_AGENCY_CHECK',
] as const;

export type PipelineCompletenessResult = {
  pipeline_incomplete: boolean;
  missing_stages: string[];
};

export function checkUniversalPipelineCompleteness(executedStages: unknown[]): PipelineCompletenessResult {
  const normalized = new Set((Array.isArray(executedStages) ? executedStages : [])
    .filter((stage): stage is string => typeof stage === 'string')
    .map((stage) => stage.trim().toUpperCase()));
  const missing_stages = REQUIRED_GOVERNANCE_STAGES.filter((stage) => !normalized.has(stage));
  return { pipeline_incomplete: missing_stages.length > 0, missing_stages: [...missing_stages] };
}
