/**
 * Cheerio-Powered Main Content & Article Extractor
 * 
 * Accurately extracts article bodies while discarding navigation,
 * advertisements, footers, related stories, comments, and cookie notices.
 */

import * as cheerio from 'cheerio';
import { ContentType, ResolvedArticle, EvidenceState } from './types';
import { extractDomain, identifyPublisher, resolveAbsoluteUrl } from './urlResolver';
import { extractDateFromMetadata } from './dateResolver';
import { sanitizeWebContent } from './securityBoundary';

export interface ExtractedPageData {
  title: string;
  canonicalUrl: string;
  author?: string;
  publisher: string;
  publishedAt?: string;
  updatedAt?: string;
  rawDateString?: string;
  body: string;
  snippet: string;
  language: string;
  contentType: ContentType;
  contentQuality: number;
  wordCount: number;
  charCount: number;
  extractedLinks: Array<{ url: string; title: string }>;
  isUsable: boolean;
  ampUrl?: string;
  rssUrl?: string;
  hasStructuredData: boolean;
}

const BOILERPLATE_SELECTORS = [
  'nav',
  'header',
  'footer',
  'aside',
  'script',
  'style',
  'noscript',
  'iframe',
  'form',
  'svg',
  'button',
  'dialog',
  '[role="navigation"]',
  '[role="banner"]',
  '[role="contentinfo"]',
  '[aria-hidden="true"]',
  '.nav',
  '.navbar',
  '.menu',
  '.navigation',
  '.site-header',
  '.site-footer',
  '.footer',
  '.ad',
  '.ads',
  '.advertisement',
  '.ad-banner',
  '.ad-container',
  '.sponsor',
  '.social-share',
  '.share-buttons',
  '.share-bar',
  '.comments',
  '.comment-section',
  '.disqus_thread',
  '.related-posts',
  '.related-articles',
  '.recommended-stories',
  '.trending-news',
  '.cookie-banner',
  '.cookie-consent',
  '.popup',
  '.modal',
  '.newsletter-signup',
  '.sidebar',
  '.widget',
  '.author-bio-footer',
];

const ARTICLE_BODY_SELECTORS = [
  'article [itemprop="articleBody"]',
  '[itemprop="articleBody"]',
  'article .article-body',
  'article .entry-content',
  'article .post-content',
  '.article-body',
  '.article__body',
  '.article-content',
  '.entry-content',
  '.post-content',
  '.story-body',
  '.story__content',
  '.content-body',
  '.news-content',
  '.news-detail-content',
  '.detail-content',
  'article',
  'main article',
  '[role="main"] article',
  'main',
  '#main-content',
  '#content',
];

/**
 * Extracts clean, structured article data from raw HTML.
 */
export function extractPageContent(rawHtml: string, url: string): ExtractedPageData {
  const domain = extractDomain(url);
  if (!rawHtml || rawHtml.trim().length === 0) {
    return createEmptyExtractedData(url, domain);
  }

  const $ = cheerio.load(rawHtml);

  // 1. Extract Meta Tags
  const metaTags: Record<string, string> = {};
  $('meta').each((_, el) => {
    const name = $(el).attr('name') || $(el).attr('property') || $(el).attr('itemprop') || $(el).attr('http-equiv');
    const content = $(el).attr('content');
    if (name && content) {
      metaTags[name.toLowerCase()] = content.trim();
    }
  });

  // 2. Extract JSON-LD structured metadata
  let jsonLdHeadline: string | undefined;
  let jsonLdAuthor: string | undefined;
  let jsonLdPublisher: string | undefined;
  let jsonLdDatePublished: string | undefined;
  let jsonLdDateModified: string | undefined;
  let jsonLdArticleBody: string | undefined;
  let hasStructuredData = false;

  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const rawText = $(el).html();
      if (!rawText) return;
      const data = JSON.parse(rawText);
      const items = Array.isArray(data) ? data : (data['@graph'] ? data['@graph'] : [data]);

      for (const item of items) {
        if (!item || typeof item !== 'object') continue;
        const type = (item['@type'] || '').toLowerCase();
        if (type.includes('article') || type.includes('news') || type.includes('posting') || type.includes('report')) {
          hasStructuredData = true;
          jsonLdHeadline = jsonLdHeadline || item.headline || item.name;
          jsonLdAuthor = jsonLdAuthor || (typeof item.author === 'string' ? item.author : item.author?.name);
          jsonLdPublisher = jsonLdPublisher || (typeof item.publisher === 'string' ? item.publisher : item.publisher?.name);
          jsonLdDatePublished = jsonLdDatePublished || item.datePublished;
          jsonLdDateModified = jsonLdDateModified || item.dateModified;
          jsonLdArticleBody = jsonLdArticleBody || item.articleBody;
        }
      }
    } catch {}
  });

  // 3. Extract Canonical URL, Alternate Links, and Language
  const canonicalUrl = $('link[rel="canonical"]').attr('href') || metaTags['og:url'] || metaTags['twitter:url'] || url;
  const ampUrl = $('link[rel="amphtml"]').attr('href');
  const rssUrl = $('link[type="application/rss+xml"]').attr('href') || $('link[type="application/atom+xml"]').attr('href');
  const language = $('html').attr('lang') || metaTags['content-language'] || metaTags['og:locale'] || 'th';

  // 4. Extract Title
  const title = (
    jsonLdHeadline ||
    metaTags['og:title'] ||
    metaTags['twitter:title'] ||
    $('h1').first().text().trim() ||
    $('title').text().trim() ||
    'Untitled Web Document'
  ).replace(/\s+/g, ' ').trim();

  // 5. Extract Publisher & Author
  const ogSiteName = metaTags['og:site_name'] || jsonLdPublisher;
  const publisher = identifyPublisher(domain, ogSiteName);
  const author = jsonLdAuthor || metaTags['author'] || metaTags['article:author'] || $('[rel="author"]').first().text().trim() || undefined;

  // 6. Extract Internal Links (for category/index traversal)
  const extractedLinks: Array<{ url: string; title: string }> = [];
  const seenUrls = new Set<string>();

  $('a[href]').each((_, el) => {
    const href = $(el).attr('href');
    const linkText = $(el).text().trim().replace(/\s+/g, ' ');
    if (!href || href.startsWith('#') || href.startsWith('javascript:') || href.startsWith('mailto:')) return;
    const absUrl = resolveAbsoluteUrl(href, url);
    const linkDomain = extractDomain(absUrl);

    // Only collect same-domain or major news links with meaningful text
    if (linkDomain === domain && linkText.length >= 10 && !seenUrls.has(absUrl)) {
      seenUrls.add(absUrl);
      extractedLinks.push({ url: absUrl, title: linkText });
    }
  });

  // 7. Strip Boilerplate Elements from DOM before body extraction
  for (const selector of BOILERPLATE_SELECTORS) {
    $(selector).remove();
  }

  // 8. Extract Body Text using selector cascade
  let bodyText = '';

  // Try JSON-LD articleBody first if clean and substantive
  if (jsonLdArticleBody && jsonLdArticleBody.length >= 200) {
    bodyText = jsonLdArticleBody;
  }

  // Otherwise try high-precision DOM article selectors
  if (!bodyText) {
    for (const selector of ARTICLE_BODY_SELECTORS) {
      const container = $(selector).first();
      if (container.length > 0) {
        const paragraphs: string[] = [];
        container.find('p, h2, h3, blockquote, li').each((_, el) => {
          const pText = $(el).text().trim().replace(/\s+/g, ' ');
          if (pText.length >= 25) {
            paragraphs.push(pText);
          }
        });

        if (paragraphs.length >= 2) {
          bodyText = paragraphs.join('\n\n');
          break;
        }
      }
    }
  }

  // Fallback: Density-based paragraph extraction across the whole document
  if (!bodyText) {
    const allParagraphs: string[] = [];
    $('p').each((_, el) => {
      const pText = $(el).text().trim().replace(/\s+/g, ' ');
      if (pText.length >= 35) {
        allParagraphs.push(pText);
      }
    });
    if (allParagraphs.length > 0) {
      bodyText = allParagraphs.join('\n\n');
    }
  }

  // Final fallback: body text if substantial
  if (!bodyText) {
    const rawBody = $('body').text().trim().replace(/\s+/g, ' ');
    if (rawBody.length >= 150) {
      bodyText = rawBody;
    }
  }

  // Sanitize web content against prompt injection
  const { sanitized: cleanBody } = sanitizeWebContent(bodyText);

  // 9. Extract Published & Updated Dates
  if (jsonLdDatePublished) {
    metaTags['datepublished'] = jsonLdDatePublished;
  }
  if (jsonLdDateModified) {
    metaTags['datemodified'] = jsonLdDateModified;
  }

  const dateResult = extractDateFromMetadata(metaTags, url, cleanBody);
  const publishedAt = dateResult.publishedAt;
  const rawDateString = dateResult.rawDateString;

  // 10. Classify Content Type & Compute Quality Score
  const charCount = cleanBody.length;
  const wordCount = cleanBody.split(/\s+/).filter(Boolean).length;
  
  let contentType: ContentType = 'general';
  if (extractedLinks.length >= 8 && charCount < 300) {
    contentType = 'category';
  } else if (charCount >= 200 || hasStructuredData) {
    contentType = 'article';
  } else if (extractedLinks.length >= 5) {
    contentType = 'index';
  }

  // Content Quality calculation:
  // Factors: text length, presence of title, presence of published date, author, publisher
  let quality = 0.0;
  if (charCount >= 150) quality += 0.40;
  if (charCount >= 500) quality += 0.20;
  if (publishedAt) quality += 0.20;
  if (author) quality += 0.10;
  if (title && title.length >= 10) quality += 0.10;
  quality = Math.min(1.0, Math.max(0.0, quality));

  const isUsable = charCount >= 150 && quality >= 0.40;
  const snippet = cleanBody.slice(0, 300).trim() + (cleanBody.length > 300 ? '...' : '');

  return {
    title,
    canonicalUrl: resolveAbsoluteUrl(canonicalUrl, url),
    author,
    publisher,
    publishedAt,
    rawDateString,
    body: cleanBody,
    snippet,
    language,
    contentType,
    contentQuality: quality,
    wordCount,
    charCount,
    extractedLinks: extractedLinks.slice(0, 15),
    isUsable,
    ampUrl: ampUrl ? resolveAbsoluteUrl(ampUrl, url) : undefined,
    rssUrl: rssUrl ? resolveAbsoluteUrl(rssUrl, url) : undefined,
    hasStructuredData,
  };
}

function createEmptyExtractedData(url: string, domain: string): ExtractedPageData {
  return {
    title: 'Empty Web Response',
    canonicalUrl: url,
    publisher: identifyPublisher(domain),
    body: '',
    snippet: '',
    language: 'th',
    contentType: 'general',
    contentQuality: 0,
    wordCount: 0,
    charCount: 0,
    extractedLinks: [],
    isUsable: false,
    hasStructuredData: false,
  };
}
