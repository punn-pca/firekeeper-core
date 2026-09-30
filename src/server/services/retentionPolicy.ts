import type { PlanDefinition } from '../../config/plans';

export type RetainedResource = 'conversations' | 'memories' | 'auditLogs';
export function retentionDaysFor(
  plan: PlanDefinition, resource: RetainedResource,
  defaults: Record<RetainedResource, number>
): number {
  // Memory has its own lifetime. Enterprise's 0 means contract-dependent,
  // so use the finite deployment default until a contract is configured.
  return resource === 'memories' || plan.retentionDays === 0 ? defaults[resource] : plan.retentionDays;
}
