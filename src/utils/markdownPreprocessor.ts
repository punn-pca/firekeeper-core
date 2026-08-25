/**
 * Markdown Preprocessor for FIRE KEEPER
 * Normalizes code blocks, LaTeX formulas, bullet artifacts, tables, and spacing.
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
  processed = processed.replace(/\$\$([\s\S]*?)\$\$/g, (match, formula) => {
    return `\n$$\n${formula.trim()}\n$$\n`;
  });

  // 6. Ensure bold markdown is preserved for rich chat rendering


  return processed.trim();
}
