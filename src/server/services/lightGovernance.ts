/** Provider-neutral, deterministic light governance for Normal chat. No extra LLM calls. */
import { isExplicitConsequentialDecision } from '../../utils/governanceHandoff';
export type LightGovernanceFlag = 'EMPTY_RESPONSE' | 'POTENTIAL_SECRET_EXPOSURE' | 'REVIEW_RECOMMENDED';
export interface LightGovernanceReport {
  mode: 'light';
  provider: string;
  model: string;
  flags: LightGovernanceFlag[];
  /** Deterministic disposition applied before Normal Mode publishes its response. */
  action: 'ALLOW' | 'REVIEW' | 'BLOCK';
  recommendGovernance: boolean;
}
const secretPattern = /\b(?:api[_ -]?key|secret|password|token)\b\s*[:=]\s*["']?[A-Za-z0-9_./+\-=]{12,}/i;
export function evaluateLightGovernance(input: {
  question: string; response: string; provider: string; model: string;
}): LightGovernanceReport {
  const flags: LightGovernanceFlag[] = [];
  if (!input.response.trim()) flags.push('EMPTY_RESPONSE');
  if (secretPattern.test(input.response)) flags.push('POTENTIAL_SECRET_EXPOSURE');
  if (isExplicitConsequentialDecision(input.question)) flags.push('REVIEW_RECOMMENDED');
  const block = flags.includes('EMPTY_RESPONSE') || flags.includes('POTENTIAL_SECRET_EXPOSURE');
  const recommendGovernance = flags.includes('REVIEW_RECOMMENDED');
  return {
    mode: 'light',
    provider: input.provider,
    model: input.model,
    flags,
    action: block ? 'BLOCK' : recommendGovernance ? 'REVIEW' : 'ALLOW',
    recommendGovernance,
  };
}
