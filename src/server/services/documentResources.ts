import crypto from 'crypto';

export type DocumentResourceKind = 'POLICY' | 'MANUAL' | 'SOP' | 'REGULATION' | 'INTERNAL_FILE';

export interface DocumentResourceChunk {
  id: string;
  documentId: string;
  ownerId: string;
  filename: string;
  mimeType: string;
  kind: DocumentResourceKind;
  content: string;
  locator: string;
  chunkIndex: number;
  authorityScore: number;
  createdAt: string;
}

export interface DocumentResourceSummary {
  id: string;
  filename: string;
  mimeType: string;
  kind: DocumentResourceKind;
  authorityScore: number;
  chunkCount: number;
  createdAt: string;
}

function terms(text: string): string[] {
  return Array.from(new Set(String(text || '').toLowerCase()
    .replace(/[^\p{L}\p{N}.]+/gu, ' ')
    .split(/\s+/)
    .filter((term) => term.length > 1)));
}

export function normalizeDocumentKind(value: unknown): DocumentResourceKind {
  const kind = String(value || '').toUpperCase();
  if (kind === 'POLICY' || kind === 'MANUAL' || kind === 'SOP' || kind === 'REGULATION') return kind;
  return 'INTERNAL_FILE';
}

export function defaultAuthorityScore(kind: DocumentResourceKind): number {
  switch (kind) {
    case 'REGULATION': return 95;
    case 'POLICY': return 90;
    case 'SOP': return 85;
    case 'MANUAL': return 80;
    default: return 65;
  }
}

export function rankDocumentResourceChunks(
  chunks: DocumentResourceChunk[],
  query: string,
  maxResults = 8,
): DocumentResourceChunk[] {
  const queryTerms = terms(query);
  return chunks
    .map((chunk) => {
      const haystack = `${chunk.filename} ${chunk.kind} ${chunk.content}`.toLowerCase();
      let score = chunk.authorityScore / 100;
      for (const term of queryTerms) {
        const matches = haystack.split(term).length - 1;
        if (matches > 0) score += Math.min(matches, 5) * 2.5;
        if (chunk.filename.toLowerCase().includes(term)) score += 4;
      }
      return { chunk, score };
    })
    .filter(({ score }) => queryTerms.length === 0 || score > 1)
    .sort((a, b) => b.score - a.score || a.chunk.chunkIndex - b.chunk.chunkIndex)
    .slice(0, Math.max(1, maxResults))
    .map(({ chunk }) => chunk);
}

export async function saveDocumentResource(
  adminDb: any,
  ownerId: string,
  input: {
    filename: string;
    mimeType: string;
    kind?: unknown;
    authorityScore?: number;
    chunks: Array<{ content: string; locator: string; chunkIndex: number }>;
  },
): Promise<DocumentResourceSummary> {
  if (!adminDb) throw new Error('DOCUMENT_RESOURCE_STORAGE_UNAVAILABLE');
  const kind = normalizeDocumentKind(input.kind);
  const authorityScore = Number.isFinite(Number(input.authorityScore))
    ? Math.max(0, Math.min(100, Number(input.authorityScore)))
    : defaultAuthorityScore(kind);
  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  const ref = adminDb.collection('users').doc(ownerId).collection('document_resources').doc(id);
  const summary: DocumentResourceSummary = {
    id,
    filename: input.filename,
    mimeType: input.mimeType,
    kind,
    authorityScore,
    chunkCount: input.chunks.length,
    createdAt,
  };
  await ref.set(summary);
  const batch = adminDb.batch();
  input.chunks.forEach((chunk) => {
    const chunkId = `chunk-${String(chunk.chunkIndex + 1).padStart(4, '0')}`;
    batch.set(ref.collection('chunks').doc(chunkId), {
      id: chunkId,
      documentId: id,
      ownerId,
      filename: input.filename,
      mimeType: input.mimeType,
      kind,
      content: String(chunk.content || ''),
      locator: String(chunk.locator || `${input.filename} (Chunk ${chunk.chunkIndex + 1})`),
      chunkIndex: chunk.chunkIndex,
      authorityScore,
      createdAt,
    });
  });
  await batch.commit();
  return summary;
}

export async function listDocumentResources(adminDb: any, ownerId: string): Promise<DocumentResourceSummary[]> {
  if (!adminDb) throw new Error('DOCUMENT_RESOURCE_STORAGE_UNAVAILABLE');
  const snap = await adminDb.collection('users').doc(ownerId).collection('document_resources').orderBy('createdAt', 'desc').get();
  return snap.docs.map((doc: any) => ({ id: doc.id, ...doc.data() })) as DocumentResourceSummary[];
}

export async function deleteDocumentResource(adminDb: any, ownerId: string, documentId: string): Promise<void> {
  if (!adminDb) throw new Error('DOCUMENT_RESOURCE_STORAGE_UNAVAILABLE');
  const ref = adminDb.collection('users').doc(ownerId).collection('document_resources').doc(documentId);
  const chunks = await ref.collection('chunks').get();
  const batch = adminDb.batch();
  chunks.docs.forEach((doc: any) => batch.delete(doc.ref));
  batch.delete(ref);
  await batch.commit();
}

export async function retrieveDocumentResources(
  adminDb: any,
  ownerId: string,
  query: string,
  maxResults = 8,
): Promise<DocumentResourceChunk[]> {
  if (!adminDb) return [];
  const resources = await adminDb.collection('users').doc(ownerId).collection('document_resources').get();
  const all: DocumentResourceChunk[] = [];
  for (const resource of resources.docs) {
    const chunks = await resource.ref.collection('chunks').get();
    chunks.docs.forEach((doc: any) => all.push(doc.data() as DocumentResourceChunk));
  }
  return rankDocumentResourceChunks(all, query, maxResults);
}
