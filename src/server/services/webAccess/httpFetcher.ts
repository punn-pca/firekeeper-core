/**
 * HTTP Fetcher Layer
 * 
 * Executes robust, secure HTTP requests with redirect handling,
 * content-type filtering, timeouts, and modern browser headers.
 */

export interface HttpFetchResponse {
  ok: boolean;
  status: number;
  finalUrl: string;
  html: string;
  contentType: string;
  isAccessRestricted?: boolean;
  error?: string;
  latencyMs: number;
}

const DEFAULT_USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 (compatible; FireKeeperPCA/3.0; +https://firekeeper.site/bot)';

const DEFAULT_TIMEOUT_MS = 9000;
const MAX_BODY_SIZE_BYTES = 8 * 1024 * 1024; // 8 MB

export async function fetchHttpPage(url: string, options?: { timeoutMs?: number; userAgent?: string }): Promise<HttpFetchResponse> {
  const startMs = Date.now();
  const timeoutMs = options?.timeoutMs || DEFAULT_TIMEOUT_MS;
  const userAgent = options?.userAgent || DEFAULT_USER_AGENT;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': userAgent,
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'th,en-US;q=0.9,en;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'Cache-Control': 'no-cache',
        Pragma: 'no-cache',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Upgrade-Insecure-Requests': '1',
      },
      redirect: 'follow',
      signal: controller.signal,
    });

    clearTimeout(timer);
    const latencyMs = Date.now() - startMs;
    const finalUrl = response.url || url;
    const contentType = response.headers.get('content-type') || '';

    // Check HTTP status
    if (response.status === 401 || response.status === 403) {
      return {
        ok: false,
        status: response.status,
        finalUrl,
        html: '',
        contentType,
        isAccessRestricted: true,
        error: `Access restricted (HTTP ${response.status})`,
        latencyMs,
      };
    }

    if (!response.ok) {
      return {
        ok: false,
        status: response.status,
        finalUrl,
        html: '',
        contentType,
        error: `HTTP error ${response.status} ${response.statusText}`,
        latencyMs,
      };
    }

    // Only accept HTML / XML / text / JSON
    if (
      !contentType.includes('text/html') &&
      !contentType.includes('application/xhtml+xml') &&
      !contentType.includes('application/xml') &&
      !contentType.includes('text/plain') &&
      !contentType.includes('application/json')
    ) {
      return {
        ok: false,
        status: response.status,
        finalUrl,
        html: '',
        contentType,
        error: `Unsupported content-type: ${contentType}`,
        latencyMs,
      };
    }

    const text = await response.text();

    if (text.length > MAX_BODY_SIZE_BYTES) {
      return {
        ok: true,
        status: response.status,
        finalUrl,
        html: text.slice(0, MAX_BODY_SIZE_BYTES),
        contentType,
        latencyMs,
      };
    }

    return {
      ok: true,
      status: response.status,
      finalUrl,
      html: text,
      contentType,
      latencyMs,
    };
  } catch (err: any) {
    const latencyMs = Date.now() - startMs;
    const isTimeout = err?.name === 'AbortError' || err?.message?.includes('timeout') || err?.message?.includes('aborted');
    return {
      ok: false,
      status: isTimeout ? 408 : 0,
      finalUrl: url,
      html: '',
      contentType: '',
      error: isTimeout ? `Request timed out after ${timeoutMs}ms` : (err?.message || 'Network fetch error'),
      latencyMs,
    };
  }
}
