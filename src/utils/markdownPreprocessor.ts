import { replaceTaxonomyTagsInMarkdown } from './taxonomyTokens';

/**
 * Markdown Preprocessor for FIRE KEEPER
 * Normalizes code blocks, LaTeX formulas, bullet artifacts, tables, spacing,
 * and formats Information Taxonomy tags with shared taxonomy design tokens.
 */
export function preprocessMarkdown(content: string): string {
  if (!content) return '';

  let processed = content;

  // 1. Normalize line endings
  processed = processed.replace(/\r/g, '');

  // 2. Collapse excessive newlines (3 or more) to 2
  processed = processed.replace(/\n{3,}/g, '\n\n');

  // 3. Normalize ''' to ```
  processed = processed.replace(/'''/g, '```');

  // 4. Clean up stray artifacts, malformed bullet lines (* --, --, ****, ***, ###)
  processed = processed.replace(/^\s*\*\s*--\s*$/gm, '');
  processed = processed.replace(/^\s*--\s*$/gm, '');
  processed = processed.replace(/^\s*\*\*\*\*\s*$/gm, '');
  processed = processed.replace(/^\s*\*\*\*\s*$/gm, '---');
  processed = processed.replace(/^\s*###\s*$/gm, '');
  processed = processed.replace(/\*{4,}/g, '');

  // 5. Normalize display math $$ ... $$ spacing
  processed = processed.replace(/\$\$([\s\S]*?)\$\$/g, (_match, formula) => {
    return `\n$$\n${formula.trim()}\n$$\n`;
  });

  // 6. Protect code blocks from tag replacement
  const codeBlocks: string[] = [];
  processed = processed.replace(/(```[\s\S]*?```|`[^`\n]+`)/g, (match) => {
    const placeholder = `__PROTECTED_CODE_${codeBlocks.length}__`;
    codeBlocks.push(match);
    return placeholder;
  });

  // 7. Normalize HTML line breaks without corrupting GFM pipe tables.
  // A hard newline inside a pipe-table row terminates the row before the GFM
  // parser sees it. Keep table cells on one physical line by replacing <br>
  // with a readable separator; outside tables, retain a Markdown hard break.
  const lines = processed.split('\n');
  const isPipeRow = (line: string) => line.includes('|') && line.split('|').length >= 3;
  const isTableDelimiter = (line: string) =>
    isPipeRow(line) && /^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*$/.test(line);
  const normalizedLines: string[] = [];
  for (let i = 0; i < lines.length; i++) {
    const startsTable = isPipeRow(lines[i]) && i + 1 < lines.length && isTableDelimiter(lines[i + 1]);
    if (startsTable) {
      normalizedLines.push(lines[i].replace(/<br\s*\/?\s*>/gi, ' / '));
      normalizedLines.push(lines[++i]);
      while (i + 1 < lines.length && isPipeRow(lines[i + 1])) {
        normalizedLines.push(lines[++i].replace(/<br\s*\/?\s*>/gi, ' / '));
      }
      continue;
    }
    normalizedLines.push(lines[i].replace(/<br\s*\/?\s*>/gi, '  \n'));
  }
  processed = normalizedLines.join('\n');

  // 8. Autolink bare HTTP(S) URLs emitted by providers/LLMs.
  // Do not rewrite URLs that are already Markdown link destinations, e.g.
  // [source](https://example.com). Wrapping those URLs again corrupts Markdown
  // and causes the label and URL to render as plain text instead of a link.
  processed = processed.replace(
    /(^|[\s(\[{>])((?:https?:\/\/)[^\s<>()\]}`]+)(?=$|[\s)\]}>.,!?;:])/gim,
    (match, prefix: string, url: string, offset: number, source: string) => {
      const urlStart = offset + prefix.length;
      if (source.slice(0, urlStart).endsWith('](')) return match;
      return `${prefix}[${url}](${url})`;
    }
  );

  // 9. Apply shared Information Taxonomy tag styling
  processed = replaceTaxonomyTagsInMarkdown(processed);

  // 10. Restore protected code blocks
  for (let i = 0; i < codeBlocks.length; i++) {
    processed = processed.replace(`__PROTECTED_CODE_${i}__`, codeBlocks[i]);
  }

  return processed.trim();
}
