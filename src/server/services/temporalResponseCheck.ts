export interface TemporalResponseCheck {
  text: string;
  changed: boolean;
  findings: string[];
}

/**
 * Narrow deterministic guard for an observed temporal hallucination.
 * Avoid broad rewriting: quotations, questions and code blocks must not be changed.
 */
export function checkTemporalResponse(text: string, now: Date = new Date()): TemporalResponseCheck {
  if (!Number.isFinite(now.getTime())) throw new Error('Invalid runtime date');
  const currentYear = now.getUTCFullYear();
  const findings: string[] = [];
  const lines = text.split('\n');
  let fenced = false;
  const updated = lines.map((line) => {
    if (/^\s*```/.test(line)) { fenced = !fenced; return line; }
    if (fenced || /^\s*>/.test(line) || /[?？]/.test(line)) return line;
    const pattern = /(?:ปี\s*|year\s*)(20\d{2})\s*(?:ยังไม่ถึง|ยังมาไม่ถึง|has not arrived|is in the future)/gi;
    return line.replace(pattern, (matched, yearText: string) => {
      if (Number(yearText) >= currentYear) return matched;
      findings.push(`PAST_YEAR_DESCRIBED_AS_FUTURE:${yearText}`);
      return `ปี ${yearText} ผ่านมาแล้ว (ปีปัจจุบัน ${currentYear})`;
    });
  });
  return { text: updated.join('\n'), changed: findings.length > 0, findings };
}
