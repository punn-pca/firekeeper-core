import { DecisionObject, DecisionObjectSchema } from './decisionSchema';

export type ValidatorResult = {
  status: 'PASS' | 'REPAIR_REQUIRED' | 'ESCALATE';
  errors: string[];
  metadata: {
    timestamp: string;
    checkedFields: string[];
  };
};

/**
 * Deterministic Validator for DecisionObject
 */
export function validateDecisionObject(decision: any): ValidatorResult {
  const result = DecisionObjectSchema.safeParse(decision);
  const errors: string[] = [];

  if (!result.success) {
    result.error.issues.forEach((issue) => {
      errors.push(`${issue.path.join('.')}: ${issue.message}`);
    });
    return {
      status: 'REPAIR_REQUIRED',
      errors,
      metadata: { timestamp: new Date().toISOString(), checkedFields: [] },
    };
  }

  const data = result.data;

  // Additional Deterministic Checks
  
  // 1. Check if recommendation refers to existing option
  if (data.recommendation) {
    const exists = data.options.some((o) => o.id === data.recommendation!.optionId);
    if (!exists) {
      errors.push('Recommendation refers to non-existent option');
    }
  }

  // 2. Check if policy conflicts are resolved
  if (data.policy_conflicts.some(c => c.severity === 'CRITICAL')) {
      return {
          status: 'ESCALATE',
          errors: ['Critical policy conflict detected'],
          metadata: { timestamp: new Date().toISOString(), checkedFields: ['policy_conflicts'] },
      }
  }

  if (errors.length > 0) {
    return {
      status: 'REPAIR_REQUIRED',
      errors,
      metadata: { timestamp: new Date().toISOString(), checkedFields: [] },
    };
  }

  return {
    status: 'PASS',
    errors: [],
    metadata: { timestamp: new Date().toISOString(), checkedFields: Object.keys(data) },
  };
}
