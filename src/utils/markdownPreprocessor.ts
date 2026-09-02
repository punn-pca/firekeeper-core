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

  // 7. Apply shared Information Taxonomy tag styling
  processed = replaceTaxonomyTagsInMarkdown(processed);

  // 8. Restore protected code blocks
  for (let i = 0; i < codeBlocks.length; i++) {
    processed = processed.replace(`__PROTECTED_CODE_${i}__`, codeBlocks[i]);
  }

  return processed.trim();
}
