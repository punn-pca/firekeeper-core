/**
 * Article Resolver & Escalation Pipeline
 * 
 * Implements 6-step escalation:
 * Attempt 1: HTTP GET
 * Attempt 2: Canonical URL
 * Attempt 3: Alternate / AMP URL
 * Attempt 4: Dynamic JS & Hydration Rendering
 * Attempt 5: RSS / Structured metadata
 * Attempt 6: Link Follower (if index/category)
 */

import { ResolvedArticle, EvidenceState, RetrievalTraceStep } from './types';
import { fetchHttpPage } from './httpFetcher';
import { extractPageContent, ExtractedPageData } from './contentExtractor';
import { detectDynamicJsPage, extractFromHydrationState, attemptAlternateSourceFetch } from './browserFetcher';
import { followIndexLinks } from './linkFollower';
import { verifyArticleDateMatch } from './dateResolver';
import { extractDomain, identifyPublisher } from './urlResolver';

export interface ResolveArticleOptions {
  targetDateISO?: string;
  queryKeywords?: string[];
  allowLinkFollowing?: boolean;
}

export async function resolveArticleFromUrl(
  inputUrl: string,
  options?: ResolveArticleOptions,
  onTrace?: (step: RetrievalTraceStep) => void
): Promise<ResolvedArticle> {
  const timestamp = new Date().toISOString();
  const domain = extractDomain(inputUrl);
  const publisher = identifyPublisher(domain);
  const articleId = `art-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

  onTrace?.({
    stage: 'URL_OPEN',
    timestamp,
    detail: `Opening URL: ${inputUrl} [Publisher: ${publisher}]`,
    url: inputUrl,
    status: 'INFO',
  });

  // ── ATTEMPT 1: Direct HTTP GET ──
  const httpResp = await fetchHttpPage(inputUrl);

  if (httpResp.isAccessRestricted) {
    onTrace?.({
      stage: 'HTTP_FETCH',
      timestamp: new Date().toISOString(),
      detail: `Access restricted by publisher: ${httpResp.error}`,
      url: inputUrl,
      status: 'WARNING',
    });
    return buildFailedArticle(articleId, inputUrl, publisher, domain, 'ACCESS_RESTRICTED', 'HTTP_GET');
  }

  if (!httpResp.ok) {
    onTrace?.({
      stage: 'HTTP_FETCH',
      timestamp: new Date().toISOString(),
      detail: `HTTP fetch failed: ${httpResp.error}`,
      url: inputUrl,
      status: 'FAILED',
    });
    return buildFailedArticle(articleId, inputUrl, publisher, domain, 'EXTRACTION_FAILED', 'HTTP_GET');
  }

  onTrace?.({
    stage: 'HTTP_FETCH',
    timestamp: new Date().toISOString(),
    detail: `HTTP fetch succeeded (${httpResp.latencyMs}ms, ${httpResp.html.length} bytes)`,
    url: inputUrl,
    status: 'SUCCESS',
  });

  // Extract content from fetched HTML
  let extracted: ExtractedPageData = extractPageContent(httpResp.html, httpResp.finalUrl || inputUrl);
  let method: ResolvedArticle['retrieval_method'] = 'HTTP_GET';

  // ── ATTEMPT 2: Canonical URL Escalation ──
  if ((!extracted.isUsable || extracted.contentType === 'category') && extracted.canonicalUrl && extracted.canonicalUrl !== inputUrl) {
    onTrace?.({
      stage: 'URL_OPEN',
      timestamp: new Date().toISOString(),
      detail: `Escalating to canonical URL: ${extracted.canonicalUrl}`,
      url: extracted.canonicalUrl,
      status: 'INFO',
    });
    try {
      const canonResp = await fetchHttpPage(extracted.canonicalUrl);
      if (canonResp.ok) {
        const canonExtracted = extractPageContent(canonResp.html, canonResp.finalUrl || extracted.canonicalUrl);
        if (canonExtracted.isUsable) {
          extracted = canonExtracted;
          method = 'CANONICAL_RESOLVED';
        }
      }
    } catch {}
  }

  // ── ATTEMPT 3 & 4: Dynamic JS & SPA Fallback ──
  if (!extracted.isUsable) {
    const dynamicCheck = detectDynamicJsPage(httpResp.html);
    if (dynamicCheck.isDynamicJsPage) {
      onTrace?.({
        stage: 'BROWSER_FALLBACK',
        timestamp: new Date().toISOString(),
        detail: `Detected ${dynamicCheck.framework || 'SPA'} dynamic page. Initiating fallback rendering.`,
        url: inputUrl,
        status: 'INFO',
      });

      const hydrationData = extractFromHydrationState(httpResp.html, inputUrl);
      if (hydrationData && hydrationData.isUsable) {
        extracted = hydrationData;
        method = 'JS_RENDER_FALLBACK';
        onTrace?.({
          stage: 'JS_RENDER',
          timestamp: new Date().toISOString(),
          detail: 'Hydration state successfully extracted article body and metadata.',
          url: inputUrl,
          status: 'SUCCESS',
        });
      }
    }
  }

  // ── ATTEMPT 5: Alternate / RSS / AMP Fallback ──
  if (!extracted.isUsable && (extracted.ampUrl || extracted.rssUrl)) {
    const altData = await attemptAlternateSourceFetch(inputUrl, extracted.ampUrl, extracted.rssUrl);
    if (altData && altData.isUsable) {
      extracted = altData;
      method = 'RSS_FALLBACK';
      onTrace?.({
        stage: 'JS_RENDER',
        timestamp: new Date().toISOString(),
        detail: 'Extracted content via AMP/RSS feed fallback.',
        url: inputUrl,
        status: 'SUCCESS',
      });
    }
  }

  // ── ATTEMPT 6: Category / Index Page Link Following ──
  if (
    options?.allowLinkFollowing !== false &&
    (!extracted.isUsable || extracted.contentType === 'category' || extracted.contentType === 'index') &&
    extracted.extractedLinks.length > 0
  ) {
    onTrace?.({
      stage: 'URL_OPEN',
      timestamp: new Date().toISOString(),
      detail: `Page is ${extracted.contentType}. Following candidate article links (${extracted.extractedLinks.length} found)...`,
      url: inputUrl,
      status: 'INFO',
    });

    const followed = await followIndexLinks(
      inputUrl,
      extracted.extractedLinks,
      options?.queryKeywords || [],
      2
    );

    if (followed.length > 0 && followed[0].articleData.isUsable) {
      extracted = followed[0].articleData;
      method = 'LINK_FOLLOWED';
      onTrace?.({
        stage: 'CONTENT_EXTRACT',
        timestamp: new Date().toISOString(),
        detail: `Successfully followed link to article: "${extracted.title}" (${followed[0].articleUrl})`,
        url: followed[0].articleUrl,
        status: 'SUCCESS',
      });
    }
  }

  // Evaluate Content Extraction Result
  onTrace?.({
    stage: 'CONTENT_EXTRACT',
    timestamp: new Date().toISOString(),
    detail: `Extracted ${extracted.charCount} chars, quality: ${(extracted.contentQuality * 100).toFixed(0)}%, type: ${extracted.contentType}`,
    url: extracted.canonicalUrl || inputUrl,
    status: extracted.isUsable ? 'SUCCESS' : 'FAILED',
  });

  // Date Verification
  const dateCheck = verifyArticleDateMatch(extracted.publishedAt, options?.targetDateISO);
  const isDateVerified = dateCheck.isMatch;

  onTrace?.({
    stage: 'DATE_VERIFY',
    timestamp: new Date().toISOString(),
    detail: `Published: ${extracted.publishedAt || 'Unknown'} | Target: ${options?.targetDateISO || 'None'} -> ${dateCheck.reason}`,
    url: extracted.canonicalUrl || inputUrl,
    status: isDateVerified ? 'SUCCESS' : (options?.targetDateISO ? 'WARNING' : 'INFO'),
  });

  // Determine final Evidence State
  let evidenceState: EvidenceState = 'IDENTIFIED';
  let summaryEligible = false;

  if (!extracted.isUsable) {
    evidenceState = extracted.charCount > 0 ? 'EXTRACTION_FAILED' : 'TITLE_ONLY';
  } else if (options?.targetDateISO && !isDateVerified) {
    evidenceState = 'DATE_MISMATCH';
  } else {
    evidenceState = 'CONTENT_EXTRACTED';
    summaryEligible = true;
  }

  return {
    id: articleId,
    original_url: inputUrl,
    canonical_url: extracted.canonicalUrl || inputUrl,
    title: extracted.title,
    author: extracted.author,
    publisher: extracted.publisher || publisher,
    source_domain: domain,
    published_at: extracted.publishedAt,
    updated_at: extracted.updatedAt,
    raw_date_string: extracted.rawDateString,
    body: extracted.body,
    snippet: extracted.snippet,
    language: extracted.language,
    content_type: extracted.contentType,
    content_quality: extracted.contentQuality,
    word_count: extracted.wordCount,
    char_count: extracted.charCount,
    evidence_state: evidenceState,
    summary_eligible: summaryEligible,
    retrieval_method: method,
    retrieval_timestamp: new Date().toISOString(),
    extracted_links: extracted.extractedLinks,
    is_date_verified: isDateVerified,
    is_source_verified: true,
    security_sanitized: true,
  };
}

function buildFailedArticle(
  id: string,
  url: string,
  publisher: string,
  domain: string,
  state: EvidenceState,
  method: ResolvedArticle['retrieval_method']
): ResolvedArticle {
  return {
    id,
    original_url: url,
    canonical_url: url,
    title: `Source: ${publisher}`,
    publisher,
    source_domain: domain,
    body: '',
    snippet: '',
    language: 'th',
    content_type: 'general',
    content_quality: 0,
    word_count: 0,
    char_count: 0,
    evidence_state: state,
    summary_eligible: false,
    retrieval_method: method,
    retrieval_timestamp: new Date().toISOString(),
    is_date_verified: false,
    is_source_verified: false,
    security_sanitized: true,
  };
}
