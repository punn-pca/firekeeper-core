import { z } from 'zod';

export const Severity = z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']);
export const ControlLevel = Severity;

export const EvidenceSchema = z.object({
  id: z.string(),
  text: z.string(),
  sourceId: z.string(),
});

export const DecisionObjectSchema = z.object({
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
  recommendation: z.object({ optionId: z.string(), rationale: z.string() }).optional(),
  confidence: z.object({
    score: z.number().nullable(), label: z.enum(['LOW', 'MEDIUM', 'HIGH']), breakdown: z.record(z.string(), z.number()),
  }),
  applicable_policies: z.array(z.object({ id: z.string(), name: z.string() })),
  policy_conflicts: z.array(z.object({
    policyId1: z.string(), policyId2: z.string(), severity: Severity, rationale: z.string(),
  })),
  escalation_required: z.boolean(),
  controlLevel: ControlLevel,
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
