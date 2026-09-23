export type PlanId = 'free' | 'byok' | 'professional' | 'team' | 'business' | 'enterprise';
export type PlanFeature = 'basic_analysis' | 'byok' | 'multi_model' | 'evidence_lineage' | 'audit_log' | 'long_term_history' | 'advanced_export' | 'workspace' | 'approval_workflow' | 'admin_policy' | 'sso' | 'siem' | 'api_access';

export interface AccountPlan {
  plan: PlanId;
  name: string;
  dailyUsed: number;
  dailyLimit: number | null;
  features: PlanFeature[];
  maxMembers: number;
  retentionDays: number;
}

export async function fetchAccountPlan(signal?: AbortSignal): Promise<AccountPlan | null> {
  try {
    const response = await fetch('/api/account/plan', { credentials: 'include', signal });
    if (!response.ok) return null;
    return await response.json() as AccountPlan;
  } catch {
    return null;
  }
}

export function canUseFeature(plan: AccountPlan | null | undefined, feature: PlanFeature): boolean {
  return Boolean(plan?.features?.includes(feature));
}
