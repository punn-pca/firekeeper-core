/**
 * Optional, read-only Agent Reach bridge.
 * No subprocess, cookie, credential, or browser execution in Firekeeper.
 * A separately operated HTTPS service must expose the approved endpoint.
 */
import { secureOutboundFetch, validateOutboundBaseUrl } from '../security/outboundUrlPolicy';

export type AgentReachEvidence = {
  url: string;
  title: string;
  content: string;
  retrievedAt: string;
  source: 'agent-reach';
  verificationStatus: 'unverified';
};

export async function retrieveAgentReachEvidence(
  query: string,
  options: { enabled: boolean; endpoint?: string; signal?: AbortSignal },
): Promise<AgentReachEvidence[]> {
  if (!options.enabled || !options.endpoint) return [];
  if (typeof query !== 'string' || !query.trim() || query.length > 500) {
    throw new Error('INVALID_AGENT_REACH_QUERY');
  }
  const endpoint = await validateOutboundBaseUrl(options.endpoint, 'agentReachUrl');
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  const abort = () => controller.abort();
  options.signal?.addEventListener('abort', abort, { once: true });
  try {
    const response = await secureOutboundFetch(endpoint, {
      method: 'POST',
      redirect: 'manual',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ query: query.trim(), mode: 'read_only', limit: 5 }),
      signal: controller.signal,
    }, 'agentReachUrl');
    if (!response.ok) throw new Error('AGENT_REACH_UPSTREAM_FAILED');
    const body = await response.text();
    if (body.length > 256_000) throw new Error('AGENT_REACH_RESPONSE_TOO_LARGE');
    const parsed: unknown = JSON.parse(body);
    if (!parsed || typeof parsed !== 'object' || !('results' in parsed) || !Array.isArray(parsed.results)) {
      throw new Error('AGENT_REACH_INVALID_RESPONSE');
    }
    return parsed.results.slice(0, 5).flatMap((item: unknown) => {
      if (!item || typeof item !== 'object') return [];
      const v = item as Record<string, unknown>;
      if (typeof v.url !== 'string' || !/^https:\/\//i.test(v.url) ||
          typeof v.title !== 'string' || typeof v.content !== 'string') return [];
      return [{
        url: v.url.slice(0, 2048),
        title: v.title.slice(0, 300),
        content: v.content.slice(0, 12000),
        retrievedAt: new Date().toISOString(),
        source: 'agent-reach' as const,
        verificationStatus: 'unverified' as const,
      }];
    });
  } finally {
    clearTimeout(timer);
    options.signal?.removeEventListener('abort', abort);
  }
}
