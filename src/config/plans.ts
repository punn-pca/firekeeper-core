export type PlanId = 'free' | 'byok' | 'professional' | 'team' | 'business' | 'enterprise';

export type PlanFeature =
  | 'basic_analysis' | 'byok' | 'multi_model' | 'evidence_lineage' | 'audit_log'
  | 'long_term_history' | 'advanced_export' | 'workspace' | 'approval_workflow'
  | 'admin_policy' | 'sso' | 'siem' | 'api_access';

export interface PlanDefinition {
  id: PlanId;
  name: string;
  monthlyPriceThb: number | null;
  dailyAnalysisLimit: number | null;
  maxMembers: number;
  retentionDays: number;
  features: readonly PlanFeature[];
}

const common: PlanFeature[] = ['basic_analysis', 'evidence_lineage'];

export const PLAN_DEFINITIONS: Record<PlanId, PlanDefinition> = {
  free: { id: 'free', name: 'FIREKEEPER Free', monthlyPriceThb: 0, dailyAnalysisLimit: 30, maxMembers: 1, retentionDays: 7, features: [...common, 'audit_log'] },
  byok: { id: 'byok', name: 'FIREKEEPER BYOK', monthlyPriceThb: 199, dailyAnalysisLimit: null, maxMembers: 1, retentionDays: 30, features: [...common, 'byok', 'multi_model', 'advanced_export'] },
  professional: { id: 'professional', name: 'FIREKEEPER Professional', monthlyPriceThb: 499, dailyAnalysisLimit: null, maxMembers: 1, retentionDays: 365, features: [...common, 'byok', 'multi_model', 'audit_log', 'long_term_history', 'advanced_export'] },
  team: { id: 'team', name: 'FIREKEEPER Team', monthlyPriceThb: 4900, dailyAnalysisLimit: null, maxMembers: 5, retentionDays: 90, features: [...common, 'byok', 'multi_model', 'audit_log', 'workspace', 'approval_workflow', 'advanced_export'] },
  business: { id: 'business', name: 'FIREKEEPER Business', monthlyPriceThb: 19000, dailyAnalysisLimit: null, maxMembers: 20, retentionDays: 365, features: [...common, 'byok', 'multi_model', 'audit_log', 'workspace', 'approval_workflow', 'admin_policy', 'advanced_export'] },
  enterprise: { id: 'enterprise', name: 'FIREKEEPER Enterprise', monthlyPriceThb: null, dailyAnalysisLimit: null, maxMembers: Number.MAX_SAFE_INTEGER, retentionDays: 0, features: [...common, 'byok', 'multi_model', 'audit_log', 'workspace', 'approval_workflow', 'admin_policy', 'sso', 'siem', 'api_access', 'advanced_export'] },
};

export function getPlan(planId?: string | null): PlanDefinition {
  return PLAN_DEFINITIONS[(planId || 'free') as PlanId] || PLAN_DEFINITIONS.free;
}

export function hasPlanFeature(planId: string | null | undefined, feature: PlanFeature): boolean {
  return getPlan(planId).features.includes(feature);
}
