/** Character-based chunking that preserves paragraph boundaries where possible.
 * Overlap is measured in Unicode code points, not model tokens.
 */
export interface TextChunkRange { content: string; startOffset: number; endOffset: number }

export function chunkTextWithOverlap(text: string, chunkSize: number, overlap: number): TextChunkRange[] {
  const chars = Array.from(text);
  if (!chars.length) return [];
  const size = Math.max(1, Math.floor(chunkSize));
  const shared = Math.max(0, Math.min(Math.floor(overlap), size - 1));
  const chunks: TextChunkRange[] = [];
  let start = 0;
  while (start < chars.length) {
    let end = Math.min(chars.length, start + size);
    if (end < chars.length) {
      const floor = start + Math.floor(size * 0.6);
      let boundary = -1;
      for (let i = end - 1; i >= floor; i--) {
        if (chars[i] === '\n') { boundary = i + 1; break; }
      }
      if (boundary < 0) {
        for (let i = end - 1; i >= floor; i--) {
          if (/\s/u.test(chars[i])) { boundary = i + 1; break; }
        }
      }
      if (boundary > start) end = boundary;
    }
    const content = chars.slice(start, end).join('').trim();
    if (content) chunks.push({ content, startOffset: start, endOffset: end });
    if (end >= chars.length) break;
    start = Math.max(start + 1, end - shared);
  }
  return chunks;
}
