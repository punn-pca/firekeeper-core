export type EvidenceRelevance = 'HIGH' | 'MEDIUM' | 'LOW' | 'IRRELEVANT';

export interface EvidenceRelevanceAssessment {
  relevance: EvidenceRelevance;
  score: number;
  matchedTerms: string[];
  reason: string;
}

const STOP_TERMS = [
  'ข้อมูล', 'แหล่ง', 'รายงาน', 'หน่วยงาน', 'องค์กร', 'อิสระ', 'ตรวจสอบ',
  'หลักฐาน', 'การ', 'และ', 'ที่', 'จาก', 'กับ', 'เป็น', 'มี', 'ไม่', 'หรือ',
  'ว่า', 'โดย', 'ควร', 'เชื่อ', 'ระบบ', 'คำถาม', 'ตอบ', 'วิธี', 'เก็บ',
  'เผยแพร่', 'ที่ผ่านมา', 'เดือน', 'ปี', 'ปีก่อน', 'สอง', 'ทั้ง',
  'กัน', 'อย่าง', 'เพราะ', 'อะไร', 'ใด', 'เมื่อ', 'หาก', 'ยัง', 'ได้',
  'ต้อง', 'อ้าง', 'แสดง', 'ผล', 'ระดับ', 'ความ', 'มั่นใจ', 'firekeeper',
  'pca', 'ai', 'ค้นหา', 'ล่าสุด', 'ข่าว', 'the', 'and', 'for', 'with', 'from', 'this', 'that', 'what',
  'which', 'when', 'where', 'how', 'why', 'should', 'would', 'could',
];

const ENGLISH_STOP = new Set(STOP_TERMS.filter((term) => /^[a-z]+$/i.test(term)));

function normalize(value: string): string {
  return String(value || '')
    .normalize('NFKC')
    .toLocaleLowerCase()
    .replace(/https?:\/\/\S+/g, ' ')
    .replace(/[\u200B-\u200D\uFEFF]/g, ' ')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractMeaningfulTerms(query: string): string[] {
  const normalized = normalize(query);
  if (!normalized) return [];

  const terms = new Set<string>();
  // Preserve domain-specific contradiction phrases even when they contain
  // otherwise generic words such as "ข้อมูล" or "ตัวเลข".
  const explicitPhrases = normalized.match(/(?:ไม่ตรงกัน|ขัดแย้ง|ตัวเลข|หน่วยงานรัฐ|องค์กรอิสระ|วิธีเก็บข้อมูล|ข้อสรุป|สนับสนุน)/gu) || [];
  explicitPhrases.forEach((phrase) => terms.add(phrase));
  for (const token of normalized.split(/\s+/u)) {
    if (/^[a-z0-9]+$/i.test(token)) {
      if (token.length >= 4 && !ENGLISH_STOP.has(token)) terms.add(token);
      continue;
    }
    if (!/[\u0E00-\u0E7F]/.test(token)) continue;
    // Thai has no mandatory spaces between words. Use short n-grams, but
    // exclude generic query scaffolding so words such as "ข้อมูล" or "แหล่ง"
    // cannot make unrelated articles appear relevant.
    for (const size of [5, 4, 3]) {
      for (let index = 0; index <= token.length - size; index++) {
        const gram = token.slice(index, index + size);
        if (STOP_TERMS.some((stop) => stop.includes(gram) || gram.includes(stop))) continue;
        if (/^\d+$/.test(gram)) continue;
        terms.add(gram);
      }
    }
  }
  return [...terms];
}

/**
 * Conservative lexical relevance gate. It is a retrieval filter, not a semantic
 * verifier: passing it never establishes support or verification.
 */
export function assessEvidenceRelevance(
  content: string,
  query: string,
  intentType = 'NORMAL_QUERY',
): EvidenceRelevanceAssessment {
  const normalizedContent = normalize(content);
  const normalizedQuery = normalize(query);
  if (!normalizedContent || !normalizedQuery) {
    return { relevance: 'IRRELEVANT', score: 0, matchedTerms: [], reason: 'Query or evidence content is empty.' };
  }

  if (normalizedContent.includes(normalizedQuery) && normalizedQuery.length >= 24) {
    return { relevance: 'HIGH', score: 1, matchedTerms: [normalizedQuery], reason: 'Direct normalized phrase match.' };
  }

  const terms = extractMeaningfulTerms(query);
  if (terms.length === 0) {
    return { relevance: 'IRRELEVANT', score: 0, matchedTerms: [], reason: 'No discriminative query terms were available.' };
  }

  const matchedTerms = terms.filter((term) => normalizedContent.includes(term));
  const score = matchedTerms.length / terms.length;

  // Require multiple distinct, non-generic matches. A single shared word such
  // as "AI", "report", or "evidence" must never admit an unrelated source.
  if (matchedTerms.length >= 4 && score >= 0.08) {
    return { relevance: 'HIGH', score: Number(score.toFixed(4)), matchedTerms, reason: 'Multiple discriminative query terms match the evidence.' };
  }
  if (matchedTerms.length >= 2 && score >= 0.04) {
    return { relevance: 'MEDIUM', score: Number(score.toFixed(4)), matchedTerms, reason: 'At least two discriminative query terms match the evidence.' };
  }

  const relevance: EvidenceRelevance = matchedTerms.length === 1 ? 'LOW' : 'IRRELEVANT';
  return {
    relevance,
    score: Number(score.toFixed(4)),
    matchedTerms,
    reason: matchedTerms.length === 1
      ? 'Only one discriminative term matched; insufficient to admit as evidence.'
      : `No sufficient discriminative overlap for intent ${intentType}.`,
  };
}
