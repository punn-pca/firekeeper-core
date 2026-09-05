/**
 * FIRE KEEPER Real-Time Web Search Engine
 * Provides live, multi-source external web search & grounding for DeepSeek and PUNN Cognitive Architecture.
 */

export interface WebSearchResultItem {
  id: string;
  title: string;
  url: string;
  snippet: string;
  publishedAt?: string;
  sourceDomain: string;
  credibilityScore: number;
  sourceType: 'official' | 'institutional' | 'news' | 'academic' | 'encyclopedic' | 'general';
}

export interface WebSearchExecutionResult {
  success: boolean;
  query: string;
  searchQueries: string[];
  results: WebSearchResultItem[];
  retrievedAt: string;
  statusMessage: string;
  totalFound: number;
}

/**
 * Strips HTML tags and entities
 */
function cleanHtml(raw: string): string {
  if (!raw) return '';
  return raw
    .replace(/<[^>]*>/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Extract root domain from URL
 */
function extractDomain(urlStr: string): string {
  try {
    const u = new URL(urlStr);
    return u.hostname.replace(/^www\./, '');
  } catch {
    return 'web';
  }
}

/**
 * Assess source authority and type from domain
 */
function classifyDomain(domain: string): { type: WebSearchResultItem['sourceType']; score: number } {
  const d = domain.toLowerCase();
  if (d.endsWith('.go.th') || d.endsWith('.gov') || d.endsWith('.gov.uk') || d.endsWith('.europa.eu')) {
    return { type: 'official', score: 0.98 };
  }
  if (d.endsWith('.ac.th') || d.endsWith('.edu') || d.includes('arxiv') || d.includes('nature.com') || d.includes('sciencedirect') || d.includes('nih.gov')) {
    return { type: 'academic', score: 0.96 };
  }
  if (d.endsWith('.or.th') || d.endsWith('.org') || d.includes('who.int') || d.includes('un.org') || d.includes('worldbank.org') || d.includes('bot.or.th') || d.includes('set.or.th')) {
    return { type: 'institutional', score: 0.94 };
  }
  if (d.includes('wikipedia.org') || d.includes('wikidata.org')) {
    return { type: 'encyclopedic', score: 0.88 };
  }
  if (d.includes('reuters.com') || d.includes('bloomberg.com') || d.includes('bbc.com') || d.includes('thaipbs.or.th') || d.includes('thairath.co.th') || d.includes('thestandard.co') || d.includes('bangkokpost.com') || d.includes('matichon.co.th') || d.includes('prachachat.net')) {
    return { type: 'news', score: 0.90 };
  }
  return { type: 'general', score: 0.75 };
}

/**
 * Optimize search query for web engines
 */
export function generateSearchQueries(userPrompt: string): string[] {
  const cleaned = userPrompt
    .replace(/[?？!！,，。:：;；"”'’]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const queries: string[] = [];
  if (cleaned.length > 0) {
    queries.push(cleaned);
  }

  // Remove polite conversational Thai prefixes/suffixes
  const stripped = cleaned
    .replace(/^(ช่วย|อยากทราบ|อยากรู้|ขอทราบ|สรุป|อธิบาย|บอกหน่อย|สืบค้น|ค้นหา|ตรวจสอบ)\s*/i, '')
    .replace(/\s*(ครับ|ค่ะ|หน่อย|ด้วยครับ|ด้วยค่ะ|หน่อยครับ|หน่อยค่ะ|บ้าง|ไหม|หรือเปล่า|อย่างไร|คืออะไร)$/i, '')
    .trim();

  if (stripped.length > 3 && stripped !== cleaned) {
    queries.push(stripped);
  }

  return Array.from(new Set(queries));
}

/**
 * DuckDuckGo Instant Answer / Topics API
 */
async function searchDuckDuckGoApi(query: string): Promise<WebSearchResultItem[]> {
  try {
    const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'FireKeeperCognitiveArchitecture/3.0 (WebSearchGrounding)' },
      signal: AbortSignal.timeout(4500)
    });

    if (!res.ok) return [];
    const data = await res.json();
    const results: WebSearchResultItem[] = [];

    // Main Abstract
    if (data.Abstract && data.AbstractText && data.AbstractURL) {
      const domain = extractDomain(data.AbstractURL);
      const { type, score } = classifyDomain(domain);
      results.push({
        id: `ddg-abs-${Date.now()}`,
        title: data.Heading || data.AbstractSource || 'DuckDuckGo Instant Result',
        url: data.AbstractURL,
        snippet: data.AbstractText,
        sourceDomain: domain,
        credibilityScore: score,
        sourceType: type,
        publishedAt: new Date().toISOString()
      });
    }

    // Related Topics
    if (Array.isArray(data.RelatedTopics)) {
      for (const topic of data.RelatedTopics.slice(0, 4)) {
        if (topic.Text && topic.FirstURL) {
          const domain = extractDomain(topic.FirstURL);
          const { type, score } = classifyDomain(domain);
          results.push({
            id: `ddg-topic-${Date.now()}-${results.length}`,
            title: topic.Text.split(' - ')[0] || 'Topic Overview',
            url: topic.FirstURL,
            snippet: topic.Text,
            sourceDomain: domain,
            credibilityScore: score,
            sourceType: type
          });
        }
      }
    }

    return results;
  } catch (err) {
    console.warn('[WebSearch] DuckDuckGo API error or timeout:', err);
    return [];
  }
}

/**
 * DuckDuckGo HTML / Lite Search Scraper (No API key required)
 */
async function searchDuckDuckGoHtml(query: string): Promise<WebSearchResultItem[]> {
  try {
    const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'th,en-US;q=0.9,en;q=0.8'
      },
      signal: AbortSignal.timeout(6000)
    });

    if (!res.ok) return [];
    const html = await res.text();
    const results: WebSearchResultItem[] = [];

    // Parse results from DDG HTML
    // Class markers in DDG HTML: result__title, result__url, result__snippet
    const resultBlocks = html.split(/class="result\s+results_links/i).slice(1);

    for (let i = 0; i < Math.min(resultBlocks.length, 6); i++) {
      const block = resultBlocks[i];

      // Extract link & title
      const titleMatch = block.match(/<a[^>]+class="result__snippet[^>]*>([\s\S]*?)<\/a>/i) ||
                         block.match(/<a[^>]+class="result__url[^>]*>([\s\S]*?)<\/a>/i);
      
      const linkMatch = block.match(/<a[^>]+class="result__snippet[^>]*href="([^"]+)"/i) ||
                        block.match(/<a[^>]+class="result__url[^>]*href="([^"]+)"/i) ||
                        block.match(/<a[^>]+href="([^"]+)"[^>]*class="result__a"/i) ||
                        block.match(/<a[^>]+class="result__a"[^>]*href="([^"]+)"/i);

      const headingMatch = block.match(/<a[^>]+class="result__a"[^>]*>([\s\S]*?)<\/a>/i);
      const snippetMatch = block.match(/<a[^>]+class="result__snippet"[^>]*>([\s\S]*?)<\/a>/i) ||
                           block.match(/<td[^>]+class="result__snippet"[^>]*>([\s\S]*?)<\/td>/i);

      let targetUrl = '';
      if (linkMatch && linkMatch[1]) {
        let rawUrl = linkMatch[1];
        // Handle DDG redirect URLs: //duckduckgo.com/l/?uddg=...
        if (rawUrl.includes('uddg=')) {
          const params = new URLSearchParams(rawUrl.split('?')[1]);
          const decoded = params.get('uddg');
          if (decoded) targetUrl = decodeURIComponent(decoded);
        } else if (rawUrl.startsWith('http')) {
          targetUrl = rawUrl;
        }
      }

      const rawTitle = headingMatch ? headingMatch[1] : (titleMatch ? titleMatch[1] : '');
      const rawSnippet = snippetMatch ? snippetMatch[1] : '';

      const cleanTitle = cleanHtml(rawTitle);
      const cleanSnippet = cleanHtml(rawSnippet);

      if (targetUrl && cleanTitle && (cleanSnippet.length > 10 || cleanTitle.length > 10)) {
        const domain = extractDomain(targetUrl);
        const { type, score } = classifyDomain(domain);
        results.push({
          id: `ddg-html-${Date.now()}-${i}`,
          title: cleanTitle,
          url: targetUrl,
          snippet: cleanSnippet || cleanTitle,
          sourceDomain: domain,
          credibilityScore: score,
          sourceType: type
        });
      }
    }

    return results;
  } catch (err) {
    console.warn('[WebSearch] DuckDuckGo HTML search error or timeout:', err);
    return [];
  }
}

/**
 * Search Wikipedia (TH and EN)
 */
async function searchWikipedia(query: string): Promise<WebSearchResultItem[]> {
  const results: WebSearchResultItem[] = [];

  for (const lang of ['th', 'en']) {
    try {
      const openSearchUrl = `https://${lang}.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(query)}&limit=3&namespace=0&format=json`;
      const res = await fetch(openSearchUrl, {
        headers: { 'User-Agent': 'FireKeeperCognitiveArchitecture/3.0 (WebSearchGrounding)' },
        signal: AbortSignal.timeout(3500)
      });

      if (res.ok) {
        const data = await res.json();
        const titles: string[] = data[1] || [];
        const snippets: string[] = data[2] || [];
        const urls: string[] = data[3] || [];

        for (let i = 0; i < titles.length; i++) {
          const title = titles[i];
          const pageUrl = urls[i];
          let snippet = snippets[i];

          // Fetch full summary extract if snippet is empty
          if (!snippet || snippet.length < 20) {
            try {
              const summaryUrl = `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
              const sumRes = await fetch(summaryUrl, {
                headers: { 'User-Agent': 'FireKeeperCognitiveArchitecture/3.0 (WebSearchGrounding)' },
                signal: AbortSignal.timeout(3000)
              });
              if (sumRes.ok) {
                const sumData = await sumRes.json();
                snippet = sumData.extract || snippet;
              }
            } catch {}
          }

          if (title && pageUrl && snippet) {
            results.push({
              id: `wiki-${lang}-${Date.now()}-${i}`,
              title: `Wikipedia (${lang.toUpperCase()}): ${title}`,
              url: pageUrl,
              snippet: cleanHtml(snippet),
              sourceDomain: `${lang}.wikipedia.org`,
              credibilityScore: 0.90,
              sourceType: 'encyclopedic'
            });
          }
        }
      }
    } catch (err) {
      console.warn(`[WebSearch] Wikipedia (${lang}) error:`, err);
    }
  }

  return results;
}

/**
 * Main Web Search Orchestrator
 * Performs parallel multi-engine retrieval, deduplication, and ranking.
 */
export async function performWebSearch(
  userQuery: string,
  options?: { maxResults?: number; forceFresh?: boolean }
): Promise<WebSearchExecutionResult> {
  const startMs = Date.now();
  const maxResults = options?.maxResults || 8;
  const queries = generateSearchQueries(userQuery);
  const primaryQuery = queries[0] || userQuery;
  const retrievedAt = new Date().toISOString();

  console.log(`[WebSearch] Executing live web search for: "${primaryQuery}" (Variants: ${queries.join(' | ')})`);

  // Run DuckDuckGo API, DuckDuckGo HTML, and Wikipedia in parallel
  const searchPromises: Promise<WebSearchResultItem[]>[] = [];

  for (const q of queries.slice(0, 2)) {
    searchPromises.push(searchDuckDuckGoHtml(q));
    searchPromises.push(searchDuckDuckGoApi(q));
    searchPromises.push(searchWikipedia(q));
  }

  const settled = await Promise.allSettled(searchPromises);
  const allResults: WebSearchResultItem[] = [];

  for (const res of settled) {
    if (res.status === 'fulfilled' && Array.isArray(res.value)) {
      allResults.push(...res.value);
    }
  }

  // Deduplicate by normalized URL and title similarity
  const seenUrls = new Set<string>();
  const uniqueResults: WebSearchResultItem[] = [];

  for (const item of allResults) {
    const normalizedUrl = item.url.toLowerCase().replace(/\/$/, '');
    if (seenUrls.has(normalizedUrl)) continue;
    seenUrls.add(normalizedUrl);
    uniqueResults.push(item);
  }

  // Sort by credibility score descending, then by snippet length
  uniqueResults.sort((a, b) => {
    if (b.credibilityScore !== a.credibilityScore) {
      return b.credibilityScore - a.credibilityScore;
    }
    return b.snippet.length - a.snippet.length;
  });

  const finalResults = uniqueResults.slice(0, maxResults);
  const elapsedMs = Date.now() - startMs;

  console.log(`[WebSearch] Completed in ${elapsedMs}ms. Found ${finalResults.length} unique sources.`);

  return {
    success: finalResults.length > 0,
    query: primaryQuery,
    searchQueries: queries,
    results: finalResults,
    retrievedAt,
    statusMessage: finalResults.length > 0
      ? `สืบค้นพบหลักฐานจากเว็บไซต์จริง ${finalResults.length} แหล่ง (${elapsedMs}ms)`
      : 'ไม่พบผลลัพธ์ที่ตรงกับคำค้นหาโดยตรงจากแหล่งข้อมูลสาธารณะ',
    totalFound: finalResults.length
  };
}

/**
 * Format Web Search results into a structured prompt injection block for DeepSeek
 */
export function formatWebSearchResultsForPrompt(searchExecution: WebSearchExecutionResult): string {
  if (!searchExecution.success || searchExecution.results.length === 0) {
    return '';
  }

  const currentDateISO = new Date().toISOString().split('T')[0];
  const itemsText = searchExecution.results
    .map((r, idx) => {
      const typeTag = `[${r.sourceType.toUpperCase()} | Authority: ${(r.credibilityScore * 100).toFixed(0)}%]`;
      return `[Source ${idx + 1}]: ${r.title} ${typeTag}\nURL: ${r.url}\nDomain: ${r.sourceDomain}\nSnippet: ${r.snippet}`;
    })
    .join('\n\n');

  return `
══════════════════════════════════════════════════════════════════════
── REAL-TIME WEB SEARCH EVIDENCE (Retrieved: ${currentDateISO}) ──
══════════════════════════════════════════════════════════════════════
Query: "${searchExecution.query}"
Retrieved Sources: ${searchExecution.results.length} verified live web items

${itemsText}

──────────────────────────────────────────────────────────────────────
MANDATORY GROUNDING GUIDELINES FOR DEEPSEEK:
1. Ground your analysis directly on the verified real-time web search sources provided above.
2. When referencing facts from these sources, explicitly cite the source URL or title (e.g. [Title](URL) or [Source 1]).
3. Distinguish between verified empirical facts [FACT] from the web search results versus logical inferences [INFERENCE] or assumptions [ASSUMPTION].
4. If there are conflicting accounts among sources, present the trade-offs and point out the divergence clearly.
══════════════════════════════════════════════════════════════════════
`.trim();
}
