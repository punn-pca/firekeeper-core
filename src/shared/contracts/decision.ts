import { z } from 'zod';

export const Severity = z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']);
export const ControlLevel = Severity;

export const EvidenceSchema = z.object({
  id: z.string(),
  text: z.string(),
  sourceId: z.string(),
  relevance: z.enum(['NON_CRITICAL', 'RELEVANT', 'CRITICAL', 'UNKNOWN']).optional(),
  counterfactualImpact: z.enum(['NO_IMPACT', 'LOW_IMPACT', 'HIGH_IMPACT', 'DECISION_CRITICAL', 'UNKNOWN']).optional(),
  isContradictory: z.boolean().optional(),
});

export const ControlStatusSchema = z.enum(['REQUIRED', 'OPTIONAL', 'NOT_REQUIRED']);
export const ControlActivationPlanSchema = z.object({
  temporalGrounding: ControlStatusSchema,
  evidenceGrounding: ControlStatusSchema,
  competingHypotheses: ControlStatusSchema,
  decisionRelevance: ControlStatusSchema,
  counterfactualAudit: ControlStatusSchema,
  deterministicValidation: ControlStatusSchema,
  epistemicLabeling: ControlStatusSchema,
  conflictDetection: ControlStatusSchema.optional(),
  reasoning: z.record(z.string(), z.any()),
});

export const EpistemicConfidenceSchema = z.enum(['HIGH', 'MEDIUM', 'LOW', 'PLAUSIBLE', 'SUPPORTED', 'WEAKLY_SUPPORTED', 'UNDERDETERMINED', 'UNKNOWN']);

export const DecisionObjectSchema = z.object({
  question: z.string(),
  context: z.array(z.string()),
  activationPlan: ControlActivationPlanSchema.optional(),
  options: z.array(z.object({
    id: z.string(), text: z.string(), rationale: z.string(), isRecommended: z.boolean(),
  })),
  risks: z.array(z.object({
    id: z.string(), text: z.string(), severity: Severity, relatedOptionIds: z.array(z.string()).optional(),
  })),
  uncertainties: z.array(z.object({
    id: z.string(), text: z.string(), importance: z.enum(['LOW', 'MEDIUM', 'HIGH']),
  })),
  consequences: z.array(z.object({ id: z.string(), text: z.string(), timeframe: z.string().optional() })),
  evidence: z.array(EvidenceSchema),
  assumptions: z.array(z.string()),
  hypotheses: z.array(z.object({
    id: z.string(), 
    claim: z.string(), 
    prior: z.number().optional(), 
    likelihood: z.number().optional(), 
    posterior: z.number().optional(),
    confidence: z.union([z.number(), EpistemicConfidenceSchema]).optional(),
    qualitativeBasis: z.string().optional(),
  })).optional(),
  recommendation: z.object({ optionId: z.string(), rationale: z.string() }).optional(),
  confidence: z.object({
    score: z.number().nullable(), 
    label: EpistemicConfidenceSchema, 
    breakdown: z.record(z.string(), z.union([z.number(), z.string()])),
  }),
  applicable_policies: z.array(z.object({ id: z.string(), name: z.string() })),
  policy_conflicts: z.array(z.object({
    policyId1: z.string(), policyId2: z.string(), severity: Severity, rationale: z.string(),
  })),
  escalation_required: z.boolean(),
  controlLevel: ControlLevel,
  human_decision: z.object({
    status: z.enum(['PENDING', 'ACCEPTED', 'MODIFIED', 'REJECTED', 'REQUEST_MORE_EVIDENCE']),
    actor: z.string().optional(),
    timestamp: z.string().optional(),
    notes: z.string().optional(),
  }).optional(),
});

export type Evidence = z.infer<typeof EvidenceSchema>;
export type DecisionObject = z.infer<typeof DecisionObjectSchema>;

export type ValidationStatus = 'PASS' | 'REPAIR_REQUIRED' | 'ESCALATE';
export type ValidatorResult = {
  status: ValidationStatus;
  errors: string[];
  metadata: { timestamp: string; checkedFields: string[] };
};

export function validateDecisionObject(decision: unknown): ValidatorResult {
  const result = DecisionObjectSchema.safeParse(decision);
  if (!result.success) {
    return {
      status: 'REPAIR_REQUIRED',
      errors: result.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`),
      metadata: { timestamp: new Date().toISOString(), checkedFields: [] },
    };
  }

  const data = result.data;
  const errors: string[] = [];
  if (data.recommendation && !data.options.some((o) => o.id === data.recommendation!.optionId)) {
    errors.push('Recommendation refers to non-existent option');
  }
  if (data.policy_conflicts.some((c) => c.severity === 'CRITICAL')) {
    return {
      status: 'ESCALATE',
      errors: ['Critical policy conflict detected'],
      metadata: { timestamp: new Date().toISOString(), checkedFields: ['policy_conflicts'] },
    };
  }
  if (data.escalation_required) {
    return {
      status: 'ESCALATE',
      errors: errors.length ? errors : ['Decision requires human review'],
      metadata: { timestamp: new Date().toISOString(), checkedFields: ['escalation_required'] },
    };
  }
  return {
    status: errors.length ? 'REPAIR_REQUIRED' : 'PASS',
    errors,
    metadata: { timestamp: new Date().toISOString(), checkedFields: Object.keys(data) },
  };
}
