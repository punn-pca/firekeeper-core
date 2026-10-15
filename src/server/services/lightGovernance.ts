/** Provider-neutral, deterministic light governance for Normal chat. No extra LLM calls. */
export type LightGovernanceFlag = 'EMPTY_RESPONSE' | 'POTENTIAL_SECRET_EXPOSURE' | 'REVIEW_RECOMMENDED';
export interface LightGovernanceReport {
  mode: 'light';
  provider: string;
  model: string;
  flags: LightGovernanceFlag[];
  recommendGovernance: boolean;
}
const secretPattern = /\b(?:api[_ -]?key|secret|password|token)\b\s*[:=]\s*["']?[A-Za-z0-9_./+\-=]{12,}/i;
const decisionPattern = /(?:ควรลงทุน|วินิจฉัย|รักษาโรค|ข้อกฎหมาย|ตัดสินใจลงทุน|should I invest|medical diagnosis|legal advice)/i;
export function evaluateLightGovernance(input: {
  question: string; response: string; provider: string; model: string;
}): LightGovernanceReport {
  const flags: LightGovernanceFlag[] = [];
  if (!input.response.trim()) flags.push('EMPTY_RESPONSE');
  if (secretPattern.test(input.response)) flags.push('POTENTIAL_SECRET_EXPOSURE');
  if (decisionPattern.test(input.question)) flags.push('REVIEW_RECOMMENDED');
  return {
    mode: 'light', provider: input.provider, model: input.model, flags,
    recommendGovernance: flags.includes('REVIEW_RECOMMENDED'),
  };
}
