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

/**
 * Keep broad X search useful without treating API retrieval as verification.
 * For AI-news queries, remove posts with no recognizable AI/technology topic
 * signal before they enter the evidence pipeline. Other query domains remain
 * untouched, and matching posts still enter as UNVERIFIED.
 */
export function isRelevantXPost(query: string, postText: string): boolean {
  const normalizedQuery = String(query || '').toLowerCase()
    .replace(/ปัญญาประดิษฐ์|เอไอ/g, ' ai ')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
  const isAiNewsQuery =
    /\bai\b/.test(normalizedQuery) ||
    /artificial intelligence|machine learning|deep learning|\bllm\b|ข่าวเอไอ|ข่าว AI/i.test(query);
  if (!isAiNewsQuery) return true;

  const normalizedPost = String(postText || '').toLowerCase()
    .replace(/ปัญญาประดิษฐ์|เอไอ/g, ' ai ')
    .replace(/[^\p{L}\p{N}]+/gu, ' ');
  const aiTopicSignal = /\bai\b|artificial intelligence|machine learning|deep learning|\bllm\b|openai|anthropic|deepseek|gemini|chatgpt|copilot|nvidia|google deepmind|generative ai|โมเดลภาษา|ปัญญาประดิษฐ์|เอไอ/i;
  return aiTopicSignal.test(normalizedPost);
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
      // X may return loosely related posts for broad trend queries. Filter only
      // obvious topic mismatches for AI-news searches; never mark matches VERIFIED.
      .filter((tweet) => isRelevantXPost(searchQuery, String(tweet.text)))
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
          // Retrieval proves provenance, not credibility/reliability/relevance.
          // Leave epistemic measurements absent until a verifier measures them.
          type: 'Empirical',
          sourceUrl,
          locator: sourceUrl,
          citationQuote: String(tweet.text).slice(0, 280),
          publishedAt: tweet.created_at,
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


export type XConnectionStatus =
  | 'CONNECTED'
  | 'DISABLED'
  | 'NOT_CONFIGURED'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'RATE_LIMITED'
  | 'ERROR';

export interface XConnectionTestResult {
  status: XConnectionStatus;
  ok: boolean;
  enabled: boolean;
  httpStatus?: number;
  message: string;
}

/**
 * Performs a minimal live request to X without returning or logging credentials.
 * Uses recent-search because that is the exact capability Firekeeper needs.
 */
export async function testXConnection(): Promise<XConnectionTestResult> {
  const enabled = process.env.X_EVIDENCE_ENABLED === 'true';
  const bearerToken = process.env.X_BEARER_TOKEN;

  if (!enabled) {
    return { status: 'DISABLED', ok: false, enabled: false, message: 'X evidence provider is disabled' };
  }
  if (!bearerToken) {
    return { status: 'NOT_CONFIGURED', ok: false, enabled: true, message: 'X bearer token is not configured' };
  }

  const params = new URLSearchParams({
    query: 'OpenAI',
    max_results: '10',
    'tweet.fields': 'id',
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

    if (response.ok) {
      return {
        status: 'CONNECTED',
        ok: true,
        enabled: true,
        httpStatus: response.status,
        message: 'X API recent search is reachable and authorized',
      };
    }

    const statusMap: Record<number, { status: XConnectionStatus; message: string }> = {
      401: { status: 'UNAUTHORIZED', message: 'X bearer token was rejected' },
      403: { status: 'FORBIDDEN', message: 'X API access is forbidden for this app or plan' },
      429: { status: 'RATE_LIMITED', message: 'X API rate limit or quota was reached' },
    };
    const mapped = statusMap[response.status] || {
      status: 'ERROR' as const,
      message: `X API returned HTTP ${response.status}`,
    };

    return {
      ...mapped,
      ok: false,
      enabled: true,
      httpStatus: response.status,
    };
  } catch {
    return {
      status: 'ERROR',
      ok: false,
      enabled: true,
      message: 'X API could not be reached',
    };
  }
}
