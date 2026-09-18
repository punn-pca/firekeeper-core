/**
 * Multi-Source Research & Event Deduplicator
 * 
 * Groups articles covering the same story across multiple news outlets
 * (e.g., Reuters, AP, BBC, Thai PBS, Thai Rath) into unified Event Groups,
 * attaching cross-checked evidence sources.
 */

import { ResolvedArticle, EventGroup, EventEvidenceSource } from './types';

function tokenize(text: string): Set<string> {
  const words = text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 3);
  return new Set(words);
}

function computeSimilarity(tokensA: Set<string>, tokensB: Set<string>): number {
  if (tokensA.size === 0 || tokensB.size === 0) return 0;
  let intersection = 0;
  tokensA.forEach((token) => {
    if (tokensB.has(token)) intersection++;
  });
  const union = new Set([...tokensA, ...tokensB]).size;
  return union === 0 ? 0 : intersection / union;
}

export function deduplicateArticlesIntoEvents(articles: ResolvedArticle[]): EventGroup[] {
  const usableArticles = articles.filter((a) => a.summary_eligible && a.body.length >= 100);
  if (usableArticles.length === 0) {
    return [];
  }

  const events: EventGroup[] = [];
  const assigned = new Set<string>();

  for (let i = 0; i < usableArticles.length; i++) {
    const art = usableArticles[i];
    if (assigned.has(art.id)) continue;

    const eventId = `EVENT-${String(events.length + 1).padStart(3, '0')}`;
    const artTokens = tokenize(`${art.title} ${art.snippet}`);

    const eventSources: EventEvidenceSource[] = [
      {
        publisher: art.publisher,
        sourceDomain: art.source_domain,
        url: art.canonical_url,
        published_at: art.published_at,
        retrieval_timestamp: art.retrieval_timestamp,
        extracted_content: art.body,
        evidence_id: art.id,
        title: art.title,
        content_quality: art.content_quality,
      },
    ];
    assigned.add(art.id);

    // Look for matching stories in remaining articles
    for (let j = i + 1; j < usableArticles.length; j++) {
      const other = usableArticles[j];
      if (assigned.has(other.id)) continue;

      const otherTokens = tokenize(`${other.title} ${other.snippet}`);
      const sim = computeSimilarity(artTokens, otherTokens);

      // Same story if significant token overlap or near title similarity
      if (sim >= 0.28) {
        eventSources.push({
          publisher: other.publisher,
          sourceDomain: other.source_domain,
          url: other.canonical_url,
          published_at: other.published_at,
          retrieval_timestamp: other.retrieval_timestamp,
          extracted_content: other.body,
          evidence_id: other.id,
          title: other.title,
          content_quality: other.content_quality,
        });
        assigned.add(other.id);
      }
    }

    // Extract key facts from the leading source
    const sentences = art.body
      .split(/(?<=[.!?\n])\s+/)
      .map((s) => s.trim())
      .filter((s) => s.length >= 25 && s.length <= 250)
      .slice(0, 3);

    events.push({
      event_id: eventId,
      topic: art.title,
      sources: eventSources,
      key_facts: sentences,
      cross_checked: eventSources.length >= 2,
      primary_date: art.published_at,
    });
  }

  return events;
}
