/**
 * Link Follower Layer
 * 
 * Traverses category, index, and topic pages to discover and open
 * concrete destination article pages.
 */

import { fetchHttpPage } from './httpFetcher';
import { extractPageContent, ExtractedPageData } from './contentExtractor';
import { resolveAbsoluteUrl } from './urlResolver';

export interface FollowedArticleResult {
  sourceIndexUrl: string;
  articleUrl: string;
  articleData: ExtractedPageData;
}

/**
 * Given a category or index page with extracted candidate links,
 * selects and follows the top candidate article links to retrieve full content.
 */
export async function followIndexLinks(
  indexUrl: string,
  candidateLinks: Array<{ url: string; title: string }>,
  targetQueryKeywords: string[],
  maxToFollow = 2
): Promise<FollowedArticleResult[]> {
  if (!candidateLinks || candidateLinks.length === 0) {
    return [];
  }

  // Rank candidate links based on query keyword matches and non-index URL structure
  const ranked = candidateLinks
    .map((link) => {
      const lowerTitle = link.title.toLowerCase();
      const lowerUrl = link.url.toLowerCase();
      let matchScore = 0;

      for (const kw of targetQueryKeywords) {
        if (kw.length >= 2) {
          if (lowerTitle.includes(kw.toLowerCase())) matchScore += 3;
          if (lowerUrl.includes(kw.toLowerCase())) matchScore += 1;
        }
      }

      // Penalize generic category/tag/author pages
      if (/(\/category\/|\/tag\/|\/author\/|\/page\/\d+|\/search\?)/i.test(lowerUrl)) {
        matchScore -= 5;
      }

      // Boost specific article slug patterns (e.g., date in URL or numeric ID)
      if (/\/(20\d{2})[\/\-_]\d{1,2}[\/\-_]\d{1,2}\//.test(lowerUrl) || /\/\d{5,}\/?$/.test(lowerUrl)) {
        matchScore += 2;
      }

      return { link, matchScore };
    })
    .filter((item) => item.matchScore > -3)
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, maxToFollow);

  const results: FollowedArticleResult[] = [];

  for (const { link } of ranked) {
    try {
      const resp = await fetchHttpPage(link.url, { timeoutMs: 7000 });
      if (resp.ok && resp.html.length >= 200) {
        const articleData = extractPageContent(resp.html, resp.finalUrl || link.url);
        if (articleData.isUsable && articleData.contentType === 'article') {
          results.push({
            sourceIndexUrl: indexUrl,
            articleUrl: resp.finalUrl || link.url,
            articleData,
          });
        }
      }
    } catch {}
  }

  return results;
}
