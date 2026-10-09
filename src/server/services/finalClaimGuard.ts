export interface FinalClaimGuardResult {
  findings: string[];
  requiresReview: boolean;
}

/**
 * High-precision red flags, not a universal fact checker.
 * A flag never establishes that all other claims are correct.
 */
export function checkFinalClaimRedFlags(answer: string): FinalClaimGuardResult {
  const findings: string[] = [];
  const text = String(answer || '').replace(/```[\s\S]*?```/g, '');
  const lines = text.split('\n').filter(line => !/^\s*>/.test(line));
  for (const line of lines) {
    if (/[?？]/.test(line)) continue;
    const assertsAiNobel = /(?:รางวัลโนเบล(?:สาขา)?\s*(?:ปัญญาประดิษฐ์|เอไอ|AI)|Nobel\s+Prize\s+(?:in|for)\s+(?:Artificial\s+Intelligence|AI))/i.test(line);
    const negated = /(?:ไม่มี|ไม่เคยมี|ไม่ใช่|ไม่ได้มี|不存在|does\s+not\s+exist|no\s+such|not\s+an?\s+official)/i.test(line);
    const awardAssertion = /(?:ได้รับ|ได้รางวัล|มอบรางวัล|ประกาศรางวัล|awarded|won|received|presented)/i.test(line);
    const hypothetical = /(?:สมมติ|ถ้า|หาก|suppose|hypothetically|if\s+)/i.test(line);
    if (assertsAiNobel && awardAssertion && !negated && !hypothetical) findings.push('NONEXISTENT_NOBEL_AI_CATEGORY_ASSERTION');
  }
  return { findings: [...new Set(findings)], requiresReview: findings.length > 0 };
}
