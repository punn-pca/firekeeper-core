/**
 * HTTP Fetcher Layer
 * 
 * Executes robust, secure HTTP requests with redirect handling,
 * content-type filtering, timeouts, and modern browser headers.
 */

import { secureOutboundFetch } from '../../security/outboundUrlPolicy';

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

async function fetchWithSafeRedirects(
  url: string,
  init: RequestInit,
  fieldName: string,
  maxRedirects = 3
): Promise<{ response: Response; finalUrl: string }> {
  let currentUrl = url;

  for (let redirectCount = 0; redirectCount <= maxRedirects; redirectCount++) {
    const response = await secureOutboundFetch(currentUrl, {
      ...init,
      // Redirects are handled manually so every destination is validated.
      redirect: 'error',
    }, fieldName);

    const location = response.headers.get('location');
    const isRedirect = [301, 302, 303, 307, 308].includes(response.status);

    if (!isRedirect || !location) {
      return { response, finalUrl: currentUrl };
    }

    if (redirectCount >= maxRedirects) {
      throw new Error(`Too many redirects (maximum ${maxRedirects})`);
    }

    currentUrl = new URL(location, currentUrl).toString();
  }

  throw new Error('Redirect resolution failed');
}

export async function fetchHttpPage(url: string, options?: { timeoutMs?: number; userAgent?: string }): Promise<HttpFetchResponse> {
  const startMs = Date.now();
  const timeoutMs = options?.timeoutMs || DEFAULT_TIMEOUT_MS;
  const userAgent = options?.userAgent || DEFAULT_USER_AGENT;
  let activeTimer: ReturnType<typeof setTimeout> | undefined;

  try {
    const controller = new AbortController();
    activeTimer = setTimeout(() => controller.abort(), timeoutMs);

    const { response, finalUrl: resolvedFinalUrl } = await fetchWithSafeRedirects(url, {
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
      signal: controller.signal,
    }, 'webRetrievalUrl');

    const latencyMs = Date.now() - startMs;
    const finalUrl = resolvedFinalUrl || response.url || url;
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

    // Reject declared oversized bodies before allocating them in memory.
    const declaredLength = Number(response.headers.get('content-length') || 0);
    if (declaredLength > MAX_BODY_SIZE_BYTES) {
      await response.body?.cancel();
      return {
        ok: false,
        status: response.status,
        finalUrl,
        html: '',
        contentType,
        error: `Response body exceeds ${MAX_BODY_SIZE_BYTES} byte limit`,
        latencyMs: Date.now() - startMs,
      };
    }

    // Stream and cap the body when Content-Length is absent or untrusted.
    if (!response.body) throw new Error('Response body is unavailable');
    const reader = response.body.getReader();
    const chunks: Uint8Array[] = [];
    let totalBytes = 0;
    let truncated = false;
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = value instanceof Uint8Array ? value : new Uint8Array(value);
        const remaining = MAX_BODY_SIZE_BYTES - totalBytes;
        if (chunk.byteLength > remaining) {
          if (remaining > 0) chunks.push(chunk.slice(0, remaining));
          totalBytes = MAX_BODY_SIZE_BYTES;
          truncated = true;
          await reader.cancel('body size limit exceeded');
          break;
        }
        chunks.push(chunk);
        totalBytes += chunk.byteLength;
      }
    } finally {
      reader.releaseLock();
    }

    const bodyBytes = new Uint8Array(totalBytes);
    let offset = 0;
    for (const chunk of chunks) {
      bodyBytes.set(chunk, offset);
      offset += chunk.byteLength;
    }
    const text = new TextDecoder().decode(bodyBytes);
    return {
      ok: true,
      status: response.status,
      finalUrl,
      html: text,
      contentType,
      ...(truncated ? { error: `Response body truncated at ${MAX_BODY_SIZE_BYTES} bytes` } : {}),
      latencyMs: Date.now() - startMs,
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
  } finally {
    // The timer remains active while status checks and body streaming run.
    // It is cleared here on every success and failure path.
    if (activeTimer) clearTimeout(activeTimer);
  }
}
