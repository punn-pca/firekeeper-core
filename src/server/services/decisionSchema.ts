import { z } from 'zod';

// Zod Schema for Structured Decision Object
export const DecisionObjectSchema = z.object({
  options: z.array(z.object({
    id: z.string(),
    text: z.string(),
    rationale: z.string(),
    isRecommended: z.boolean(),
  })),
  risks: z.array(z.object({
    id: z.string(),
    text: z.string(),
    severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
    relatedOptionIds: z.array(z.string()).optional(),
  })),
  uncertainties: z.array(z.object({
    id: z.string(),
    text: z.string(),
    importance: z.enum(['LOW', 'MEDIUM', 'HIGH']),
  })),
  consequences: z.array(z.object({
    id: z.string(),
    text: z.string(),
    timeframe: z.string().optional(),
  })),
  evidence: z.array(z.object({
    id: z.string(),
    text: z.string(),
    sourceId: z.string(), // Must be traceable to source
  })),
  assumptions: z.array(z.string()),
  recommendation: z.object({
    optionId: z.string(),
    rationale: z.string(),
  }).optional(),
  confidence: z.object({
    score: z.number(), // 0-1
    label: z.enum(['LOW', 'MEDIUM', 'HIGH']),
    breakdown: z.record(z.string(), z.number()),
  }),
  applicable_policies: z.array(z.object({
    id: z.string(),
    name: z.string(),
  })),
  policy_conflicts: z.array(z.object({
    policyId1: z.string(),
    policyId2: z.string(),
    severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
    rationale: z.string(),
  })),
  escalation_required: z.boolean(),
  controlLevel: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
});

export type DecisionObject = z.infer<typeof DecisionObjectSchema>;
