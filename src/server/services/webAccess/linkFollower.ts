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

  // Index/category pages are discovery pages, not evidence. Only follow a link
  // when the destination itself has a meaningful lexical match to the user's
  // query. The old implementation accepted nearly every candidate (score > -3),
  // which could turn a relevant search result into an unrelated article.
  const stopwords = new Set([
    'ช่วย', 'อยาก', 'ทราบ', 'รู้', 'ขอ', 'หน่อย', 'บอก', 'สรุป', 'อธิบาย',
    'เกี่ยวกับ', 'อะไร', 'อย่างไร', 'คือ', 'ของ', 'ที่', 'ใน', 'และ', 'หรือ', 'ข่าว', 'ข่าวสาร',
    'มี', 'ไหม', 'ครับ', 'ค่ะ', 'please', 'about', 'what', 'latest', 'news'
  ]);

  const keywords = Array.from(new Set(
    targetQueryKeywords
      .flatMap((raw) => raw.toLowerCase().split(/[^\\p{L}\\p{N}]+/u))
      .map((token) => token.trim())
      .filter((token) => token.length >= 2 && !stopwords.has(token))
  ));

  if (keywords.length === 0) return [];

  const ranked = candidateLinks
    .map((link) => {
      const lowerTitle = link.title.toLowerCase();
      const lowerUrl = link.url.toLowerCase();
      let titleHits = 0;
      let urlHits = 0;
      let anchorHits = 0;

      for (const kw of keywords) {
        const inTitle = lowerTitle.includes(kw);
        const inUrl = lowerUrl.includes(kw);
        if (inTitle) titleHits++;
        if (inUrl) urlHits++;
        if (inTitle || inUrl) anchorHits++;
      }

      // Require at least one query anchor. A generic index link is not a
      // valid substitute for a topic-matching article.
      const matchScore = titleHits * 3 + urlHits;

      // Penalize generic category/tag/author/search pages.
      const isIndexLike = /(\\/category\\/|\\/tag\\/|\\/author\\/|\\/page\\/\\d+|\\/search\\?)/i.test(lowerUrl);
      const adjustedScore = matchScore + (isIndexLike ? -10 : 0);

      // Boost specific article slug patterns only after topical relevance exists.
      const isArticleLike =
        /\\/(20\\d{2})[\\/\\-_]\\d{1,2}[\\/\\-_]\\d{1,2}\\//.test(lowerUrl) ||
        /\\/\\d{5,}\\/?$/.test(lowerUrl);
      const finalScore = adjustedScore + (matchScore > 0 && isArticleLike ? 2 : 0);

      const requiredAnchorHits = keywords.length >= 3 ? 2 : 1;
      return { link, matchScore: finalScore, topicalMatch: anchorHits >= requiredAnchorHits };
    })
    .filter((item) => item.topicalMatch && item.matchScore >= 3)
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
