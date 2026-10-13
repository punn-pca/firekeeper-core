/**
 * Experimental Agent Reach result normalization boundary.
 * No external commands, credentials, network calls, or production wiring.
 */
export interface AgentReachCandidate {
  url: unknown;
  title?: unknown;
  snippet?: unknown;
}
export interface AgentReachEvidence {
  sourceUrl: string;
  title: string;
  excerpt: string;
  verificationStatus: 'CONTEXTUAL_UNVERIFIED';
  sourceType: 'EXTERNAL_WEB';
}
export function normalizeAgentReachCandidate(input: AgentReachCandidate): AgentReachEvidence | null {
  if (typeof input.url !== 'string') return null;
  let url: URL;
  try { url = new URL(input.url); } catch { return null; }
  if (!['https:', 'http:'].includes(url.protocol)) return null;
  if (url.username || url.password) return null;
  const host = url.hostname.toLowerCase();
  if (!host || host === 'localhost' || host.endsWith('.localhost') ||
      host.endsWith('.local') || host.endsWith('.internal') ||
      /^(127|10|0)\./.test(host) || /^192\.168\./.test(host) ||
      /^169\.254\./.test(host) || /^172\.(1[6-9]|2\d|3[01])\./.test(host) ||
      host === '::1' || host === '[::1]') return null;
  // This is an input hygiene check, not a complete SSRF policy.
  // Network fetching must also use the existing outbound URL policy.
  return {
    sourceUrl: url.toString(),
    title: typeof input.title === 'string' ? input.title.slice(0, 300) : '',
    excerpt: typeof input.snippet === 'string' ? input.snippet.slice(0, 4000) : '',
    verificationStatus: 'CONTEXTUAL_UNVERIFIED',
    sourceType: 'EXTERNAL_WEB'
  };
}
