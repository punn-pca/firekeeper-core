/**
 * Browser & Dynamic JS Fallback Renderer
 * 
 * Detects SPA shells, Client-side JavaScript pages, and executes fallback
 * extraction via embedded hydration state (__NEXT_DATA__, __INITIAL_STATE__),
 * JSON-LD graphs, AMP pages, and RSS/Atom feed mirrors.
 */

import * as cheerio from 'cheerio';
import { ExtractedPageData, extractPageContent } from './contentExtractor';
import { fetchHttpPage } from './httpFetcher';
import { extractDomain, identifyPublisher } from './urlResolver';

export interface DynamicDetectionResult {
  isDynamicJsPage: boolean;
  framework?: 'Next.js' | 'Nuxt.js' | 'React' | 'Vue' | 'Angular' | 'GenericSPA';
  hasHydrationState: boolean;
  statePayload?: any;
}

function normalizeFeedItemUrl(value: string, baseUrl: string): string | null {
  if (!value || !value.trim()) return null;
  try {
    const parsed = new URL(value.trim(), baseUrl);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null;
    parsed.hash = '';
    if (parsed.pathname.length > 1) parsed.pathname = parsed.pathname.replace(/\/+$/, '');
    return parsed.toString();
  } catch {
    return null;
  }
}

function countWords(text: string): number {
  const Segmenter = (Intl as any).Segmenter;
  if (typeof Segmenter === 'function') {
    const segmenter = new Segmenter('th', { granularity: 'word' });
    return Array.from(segmenter.segment(text)).filter((part: any) => part.isWordLike).length;
  }
  return (text.match(/[\p{L}\p{N}]+/gu) || []).length;
}

function detectContentLanguage(text: string): string {
  const letters = text.match(/[\p{L}]/gu) || [];
  if (!letters.length) return 'und';
  const thaiLetters = text.match(/[\u0E00-\u0E7F]/g) || [];
  return thaiLetters.length / letters.length >= 0.15 ? 'th' : 'und';
}

/**
 * Checks if the fetched HTML is merely an empty SPA shell or requires JS rendering.
 */
export function detectDynamicJsPage(rawHtml: string): DynamicDetectionResult {
  if (!rawHtml || rawHtml.length === 0) {
    return { isDynamicJsPage: false, hasHydrationState: false };
  }

  const hasNextData = /<script\s+id="__NEXT_DATA__"/i.test(rawHtml);
  const hasNuxtData = /window\.__NUXT__/i.test(rawHtml);
  const hasInitialState = /window\.__INITIAL_STATE__/i.test(rawHtml);
  const hasReactRoot = /<div\s+id="(root|__next|app)"[^>]*>\s*<\/div>/i.test(rawHtml);
  const hasNoscriptWarning = /enable\s+javascript\s+to\s+(view|run|use)/i.test(rawHtml) || /ต้องเปิดใช้งาน\s*javascript/i.test(rawHtml);

  if (hasNextData) {
    return { isDynamicJsPage: true, framework: 'Next.js', hasHydrationState: true };
  }
  if (hasNuxtData) {
    return { isDynamicJsPage: true, framework: 'Nuxt.js', hasHydrationState: true };
  }
  if (hasInitialState) {
    return { isDynamicJsPage: true, framework: 'React', hasHydrationState: true };
  }
  if (hasReactRoot || hasNoscriptWarning) {
    return { isDynamicJsPage: true, framework: 'GenericSPA', hasHydrationState: false };
  }

  return { isDynamicJsPage: false, hasHydrationState: false };
}

/**
 * Fallback renderer: extracts article content from Next.js, Nuxt, or JSON-LD hydration state.
 */
export function extractFromHydrationState(rawHtml: string, url: string): ExtractedPageData | null {
  try {
    const $ = cheerio.load(rawHtml);
    const domain = extractDomain(url);

    // 1. Next.js __NEXT_DATA__
    const nextScript = $('#__NEXT_DATA__').html();
    if (nextScript) {
      const parsed = JSON.parse(nextScript);
      const pageProps = parsed?.props?.pageProps;
      if (pageProps) {
        const article = pageProps.article || pageProps.post || pageProps.news || pageProps.data || pageProps.content;
        if (article) {
          const title = article.title || article.headline || $('title').text();
          const body = article.body || article.content || article.fullText || article.text || '';
          const author = article.author?.name || article.author || article.byline;
          const publishedAt = article.publishedAt || article.createdAt || article.date;
          const publisher = identifyPublisher(domain);

          if (body && typeof body === 'string' && body.length >= 100) {
            return {
              title,
              canonicalUrl: url,
              author,
              publisher,
              publishedAt,
              body,
              snippet: body.slice(0, 300),
              language: 'th',
              contentType: 'article',
              contentQuality: 0.85,
              wordCount: body.split(/\s+/).length,
              charCount: body.length,
              extractedLinks: [],
              isUsable: true,
              hasStructuredData: true,
            };
          }
        }
      }
    }
  } catch {}

  return null;
}

/**
 * Fallback to RSS/Atom feeds or AMP pages when standard HTML extraction fails.
 */
export async function attemptAlternateSourceFetch(
  url: string,
  ampUrl?: string,
  rssUrl?: string
): Promise<ExtractedPageData | null> {
  // 1. Try AMP URL if provided
  if (ampUrl && ampUrl !== url) {
    try {
      const ampRes = await fetchHttpPage(ampUrl, { timeoutMs: 5000 });
      if (ampRes.ok && ampRes.html.length >= 300) {
        const extracted = extractPageContent(ampRes.html, ampUrl);
        if (extracted.isUsable) {
          return { ...extracted, canonicalUrl: url };
        }
      }
    } catch {}
  }

  // 2. Try RSS/Atom mirror if present
  if (rssUrl) {
    try {
      const rssRes = await fetchHttpPage(rssUrl, { timeoutMs: 5000 });
      if (rssRes.ok && (rssRes.html.includes('<item') || rssRes.html.includes('<entry'))) {
        const $ = cheerio.load(rssRes.html, { xmlMode: true });
        let matchedBody = '';
        let matchedTitle = '';
        let matchedDate = '';

        const requestedItemUrl = normalizeFeedItemUrl(url, url);
        $('item, entry').each((_, el) => {
          if (matchedBody) return;
          const linkElement = $(el).find('link').first();
          const itemLink = linkElement.text().trim() || linkElement.attr('href') || '';
          const normalizedItemUrl = normalizeFeedItemUrl(itemLink, rssUrl);
          // Exact normalized URL matching prevents empty-link and prefix matches.
          if (requestedItemUrl && normalizedItemUrl === requestedItemUrl) {
            matchedTitle = $(el).find('title').first().text().trim();
            matchedBody = $(el).find('content\\:encoded, content, description').first().text();
            matchedDate = $(el).find('pubDate, published, updated').first().text().trim();
          }
        });

        if (matchedBody && matchedBody.length >= 150) {
          const domain = extractDomain(url);
          const bodyText = cheerio.load(matchedBody).text().replace(/\s+/g, ' ').trim();
          const language = detectContentLanguage(bodyText);
          const wordCount = countWords(bodyText);
          // A transparent heuristic, not a measured model-quality score.
          const contentQuality = Math.min(
            0.9,
            0.35 +
              Math.min(bodyText.length, 3000) / 10000 +
              (matchedTitle ? 0.1 : 0) +
              (matchedDate ? 0.05 : 0)
          );
          return {
            title: matchedTitle || 'RSS Article',
            canonicalUrl: url,
            publisher: identifyPublisher(domain),
            publishedAt: matchedDate,
            body: bodyText,
            snippet: bodyText.slice(0, 300),
            language,
            contentType: 'article',
            contentQuality,
            wordCount,
            charCount: bodyText.length,
            extractedLinks: [],
            isUsable: true,
            hasStructuredData: true,
          };
        }
      }
    } catch {}
  }

  return null;
}
