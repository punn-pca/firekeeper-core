import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

/** Historical synthesis is CONTEXT_ONLY, never VERIFIED evidence. */
export type InstitutionalChunk = {
  id: string;
  documentId: string;
  sourcePath: string;
  section: string;
  content: string;
  startOffset: number;
  endOffset: number;
  hash: string;
  epistemicStatus: 'CONTEXT_ONLY';
  sourceType: 'INSTITUTIONAL_ARCHIVE';
  score?: number;
};

export const INSTITUTIONAL_ARCHIVE_PATH = 'knowledge/institutional/FIREKEEPER_Master_Knowledge_Archive.md';
const MAX_CHUNK = 1900;
const hash = (s: string) => crypto.createHash('sha256').update(s).digest('hex');

export function hasInstitutionalKnowledgeIntent(query: string): boolean {
  const q = query.normalize('NFKC').toLowerCase();
  const named = /fire\s*keeper|ไฟร์คีปเปอร์|punn.pca|ปุญญ์/i.test(q);
  const archival = /institutional|knowledge archive|master knowledge|founder cognitive|decision history|architecture decision|\badr\b|prompt evolution|failure register|ประวัติการพัฒนา|ประวัติการตัดสินใจ|คลังความรู้|องค์ความรู้|แนวคิดผู้ก่อตั้ง|บทเรียน(?:ที่ล้มเหลว)?|ความรู้สะสม/i.test(q);
  return named && archival;
}

export function chunkInstitutionalMarkdown(text: string): InstitutionalChunk[] {
  const chunks: InstitutionalChunk[] = [];
  const matches = [...text.matchAll(/^#{1,5}\s+(.+)$/gm)];
  const boundaries = matches.length ? matches : [{ index: 0, 0: '', 1: 'Overview' } as unknown as RegExpMatchArray];
  for (let i = 0; i < boundaries.length; i++) {
    const start = boundaries[i].index ?? 0;
    const end = i + 1 < boundaries.length ? (boundaries[i + 1].index ?? text.length) : text.length;
    const section = String(boundaries[i][1] || 'Overview').trim();
    let offset = start;
    while (offset < end) {
      let finish = Math.min(end, offset + MAX_CHUNK);
      if (finish < end) {
        const lastBreak = text.lastIndexOf('\n', finish);
        if (lastBreak > offset + MAX_CHUNK / 2) finish = lastBreak + 1;
      }
      const content = text.slice(offset, finish).trim();
      if (content) {
        chunks.push({
          id: 'inst-' + hash(section + ':' + offset + ':' + content).slice(0, 16),
          documentId: 'FK-KA-001', sourcePath: INSTITUTIONAL_ARCHIVE_PATH,
          section, content, startOffset: offset, endOffset: finish,
          hash: hash(content), epistemicStatus: 'CONTEXT_ONLY',
          sourceType: 'INSTITUTIONAL_ARCHIVE'
        });
      }
      offset = finish;
    }
  }
  return chunks;
}

let cache: InstitutionalChunk[] | null = null;
export function loadInstitutionalKnowledge(): InstitutionalChunk[] {
  if (cache) return cache;
  const file = path.resolve(process.cwd(), INSTITUTIONAL_ARCHIVE_PATH);
  if (!fs.existsSync(file)) return [];
  cache = chunkInstitutionalMarkdown(fs.readFileSync(file, 'utf8'));
  return cache;
}

function terms(s: string): string[] {
  return [...new Set(s.normalize('NFKC').toLowerCase().split(/[^\p{L}\p{N}]+/u).filter(t => t.length > 2))];
}

export function retrieveInstitutionalKnowledge(query: string, limit = 5): InstitutionalChunk[] {
  if (!hasInstitutionalKnowledgeIntent(query)) return [];
  const corpus = loadInstitutionalKnowledge();
  const queryTerms = terms(query).filter(t => !['firekeeper', 'punn'].includes(t));
  if (!queryTerms.length) return corpus.slice(0, Math.min(limit, 5));
  return corpus.map(c => {
    const heading = c.section.toLowerCase();
    const body = c.content.toLowerCase();
    const score = queryTerms.reduce((n, t) => n + (heading.includes(t) ? 5 : 0) + (body.includes(t) ? 1 : 0), 0);
    return { ...c, score };
  }).filter(c => (c.score ?? 0) > 0)
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
    .slice(0, Math.max(0, Math.min(limit, 8)));
}

export function formatInstitutionalContext(chunks: InstitutionalChunk[]): string {
  return chunks.map(c => '[INSTITUTIONAL_ARCHIVE ' + c.id + ' | ' + c.section + ' | sha256:' + c.hash + ']\n' + c.content).join('\n\n');
}

/**
 * Hybrid semantic retrieval. Gemini embeddings are used only when an existing
 * server-side key is configured; lexical search remains the safe fallback.
 * The in-process index is shared between requests, never per-user content.
 */
type SemanticIndex = { corpusHash: string; chunks: InstitutionalChunk[]; vectors: number[][] };
let semanticIndexPromise: Promise<SemanticIndex | null> | null = null;

function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || !a.length) return 0;
  let dot = 0, aa = 0, bb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i]; aa += a[i] * a[i]; bb += b[i] * b[i];
  }
  return aa && bb ? dot / Math.sqrt(aa * bb) : 0;
}

function embeddingSettings(): { key: string; model: string } | null {
  const key = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!key) return null;
  return { key, model: process.env.FIREKEEPER_EMBEDDING_MODEL || 'gemini-embedding-001' };
}

async function embeddingRequest(
  texts: string[], taskType: 'RETRIEVAL_DOCUMENT' | 'RETRIEVAL_QUERY'
): Promise<number[][] | null> {
  const settings = embeddingSettings();
  if (!settings || !texts.length) return null;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  try {
    const url = 'https://generativelanguage.googleapis.com/v1beta/models/'
      + encodeURIComponent(settings.model) + ':batchEmbedContents?key=' + encodeURIComponent(settings.key);
    const res = await fetch(url, {
      method: 'POST', signal: controller.signal,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        requests: texts.map(text => ({
          model: 'models/' + settings.model,
          content: { parts: [{ text }] },
          taskType
        }))
      })
    });
    if (!res.ok) return null;
    const data: { embeddings?: Array<{ values?: number[] }> } = await res.json();
    const vectors = (data.embeddings || []).map(e => e.values || []);
    return vectors.length === texts.length && vectors.every(v => v.length > 0) ? vectors : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

async function getSemanticIndex(): Promise<SemanticIndex | null> {
  if (!embeddingSettings()) return null;
  if (semanticIndexPromise) return semanticIndexPromise;
  semanticIndexPromise = (async () => {
    const chunks = loadInstitutionalKnowledge();
    if (!chunks.length) return null;
    const vectors: number[][] = [];
    for (let i = 0; i < chunks.length; i += 16) {
      const batch = chunks.slice(i, i + 16).map(c => c.section + '\\n' + c.content);
      const result = await embeddingRequest(batch, 'RETRIEVAL_DOCUMENT');
      if (!result) return null;
      vectors.push(...result);
    }
    return { corpusHash: hash(chunks.map(c => c.hash).join(':')), chunks, vectors };
  })();
  const result = await semanticIndexPromise;
  if (!result) semanticIndexPromise = null;
  return result;
}

export async function retrieveInstitutionalKnowledgeHybrid(query: string, limit = 5): Promise<InstitutionalChunk[]> {
  if (!hasInstitutionalKnowledgeIntent(query)) return [];
  const lexical = retrieveInstitutionalKnowledge(query, Math.max(8, limit * 3));
  const index = await getSemanticIndex();
  if (!index) return lexical.slice(0, limit);
  const queryVector = await embeddingRequest([query], 'RETRIEVAL_QUERY');
  if (!queryVector) return lexical.slice(0, limit);
  const lexicalScores = new Map(lexical.map(c => [c.id, c.score || 0]));
  const maxLexical = Math.max(1, ...lexicalScores.values());
  return index.chunks.map((c, i) => {
    const semantic = Math.max(0, cosineSimilarity(queryVector[0], index.vectors[i]));
    const lexicalScore = (lexicalScores.get(c.id) || 0) / maxLexical;
    return { ...c, score: 0.75 * semantic + 0.25 * lexicalScore };
  }).filter(c => (c.score || 0) >= 0.20)
    .sort((a, b) => (b.score || 0) - (a.score || 0))
    .slice(0, Math.max(0, Math.min(limit, 8)));
}
