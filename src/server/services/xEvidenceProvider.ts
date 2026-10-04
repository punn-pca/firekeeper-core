import { EvidenceItem } from '../../types';

export interface XEvidenceSearchResult {
  enabled: boolean;
  evidenceList: EvidenceItem[];
  searchQuery: string;
  error?: string;
}

type XApiTweet = {
  id?: string;
  text?: string;
  author_id?: string;
  created_at?: string;
};

type XApiUser = {
  id?: string;
  name?: string;
  username?: string;
  verified?: boolean;
};

const X_API_BASE_URL = 'https://api.x.com/2';

function normalizeQuery(query: string): string {
  return String(query || '').replace(/\s+/g, ' ').trim().slice(0, 400);
}

function publicPostUrl(username: string | undefined, tweetId: string): string {
  return username
    ? `https://x.com/${encodeURIComponent(username)}/status/${encodeURIComponent(tweetId)}`
    : `https://x.com/i/web/status/${encodeURIComponent(tweetId)}`;
}

/**
 * Optional X evidence provider.
 *
 * Governance boundary:
 * - X posts enter PCA as UNVERIFIED external evidence, never as FACT.
 * - The bearer token stays server-side.
 * - Each item preserves a canonical public post URL for Claim -> Evidence -> Source lineage.
 * - Provider is disabled unless X_EVIDENCE_ENABLED=true and X_BEARER_TOKEN is configured.
 */
export async function searchXEvidence(query: string, maxResults = 10): Promise<XEvidenceSearchResult> {
  const searchQuery = normalizeQuery(query);
  const enabled = process.env.X_EVIDENCE_ENABLED === 'true';
  const bearerToken = process.env.X_BEARER_TOKEN;

  if (!enabled || !bearerToken || !searchQuery) {
    return { enabled, evidenceList: [], searchQuery };
  }

  const boundedMaxResults = Math.max(10, Math.min(100, Math.floor(maxResults || 10)));
  const params = new URLSearchParams({
    query: searchQuery,
    max_results: String(boundedMaxResults),
    'tweet.fields': 'id,text,author_id,created_at',
    expansions: 'author_id',
    'user.fields': 'id,name,username,verified',
  });

  try {
    const response = await fetch(`${X_API_BASE_URL}/tweets/search/recent?${params.toString()}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${bearerToken}`,
        Accept: 'application/json',
      },
      signal: AbortSignal.timeout(8000),
    });

    if (!response.ok) {
      // Never surface the bearer token or raw provider body into logs/audit state.
      return {
        enabled: true,
        evidenceList: [],
        searchQuery,
        error: `X_API_HTTP_${response.status}`,
      };
    }

    const payload = await response.json() as {
      data?: XApiTweet[];
      includes?: { users?: XApiUser[] };
    };
    const users = new Map(
      (payload.includes?.users || [])
        .filter((user) => user?.id)
        .map((user) => [String(user.id), user])
    );

    const evidenceList: EvidenceItem[] = (payload.data || [])
      .filter((tweet) => tweet?.id && tweet?.text)
      .map((tweet) => {
        const user = users.get(String(tweet.author_id || ''));
        const username = user?.username;
        const sourceLabel = username ? `X @${username}` : 'X post';
        const sourceUrl = publicPostUrl(username, String(tweet.id));

        return {
          id: `x-${tweet.id}`,
          source: sourceLabel,
          content: String(tweet.text),
          evidence_status: 'UNVERIFIED',
          verificationMethod: 'X API retrieval; independent verification required',
          credibilityScore: 0,
          reliabilityScore: 0,
          relevanceScore: 50,
          strength: 'Low',
          type: 'Empirical',
          sourceUrl,
          locator: sourceUrl,
          citationQuote: String(tweet.text).slice(0, 280),
        };
      });

    return { enabled: true, evidenceList, searchQuery };
  } catch {
    return {
      enabled: true,
      evidenceList: [],
      searchQuery,
      error: 'X_API_UNAVAILABLE',
    };
  }
}
