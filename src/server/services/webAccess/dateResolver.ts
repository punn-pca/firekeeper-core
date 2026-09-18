/**
 * Date-Aware Retrieval & Temporal Resolver
 * 
 * Handles multi-format date extraction, Thai Buddhist Era (BE) normalization,
 * Asia/Bangkok timezone alignment, and deterministic date verification for articles.
 */

import { DateResolutionContext } from './types';

const THAI_MONTH_MAP: Record<string, number> = {
  'มกราคม': 1, 'ม.ค.': 1, 'มค': 1, 'january': 1, 'jan': 1,
  'กุมภาพันธ์': 2, 'ก.พ.': 2, 'กพ': 2, 'february': 2, 'feb': 2,
  'มีนาคม': 3, 'มี.ค.': 3, 'มีค': 3, 'march': 3, 'mar': 3,
  'เมษายน': 4, 'เม.ย.': 4, 'เมย': 4, 'april': 4, 'apr': 4,
  'พฤษภาคม': 5, 'พ.ค.': 5, 'พค': 5, 'may': 5,
  'มิถุนายน': 6, 'มิ.ย.': 6, 'มิย': 6, 'june': 6, 'jun': 6,
  'กรกฎาคม': 7, 'ก.ค.': 7, 'กค': 7, 'july': 7, 'jul': 7,
  'สิงหาคม': 8, 'ส.ค.': 8, 'สค': 8, 'august': 8, 'aug': 8,
  'กันยายน': 9, 'ก.ย.': 9, 'กย': 9, 'september': 9, 'sep': 9, 'sept': 9,
  'ตุลาคม': 10, 'ต.ค.': 10, 'ตค': 10, 'october': 10, 'oct': 10,
  'พฤศจิกายน': 11, 'พ.ย.': 11, 'พย': 11, 'november': 11, 'nov': 11,
  'ธันวาคม': 12, 'ธ.ค.': 12, 'ธค': 12, 'december': 12, 'dec': 12,
};

/**
 * Resolves target date from user query with Asia/Bangkok timezone awareness.
 * E.g. "ข่าววันที่ 15/9/2026" -> 2026-09-15
 * "สรุปข่าว 15 กันยายน 2569" -> 2026-09-15
 */
export function resolveTargetDateFromQuery(query: string, referenceDate?: Date): DateResolutionContext {
  const ref = referenceDate || new Date();
  const timezone = 'Asia/Bangkok';

  let targetYear: number | undefined;
  let targetMonth: number | undefined;
  let targetDay: number | undefined;
  let isDateSpecific = false;
  let temporalScope: DateResolutionContext['temporalScope'] = 'TIMELESS';

  // 1. Check numeric formats: DD/MM/YYYY, DD-MM-YYYY, YYYY-MM-DD
  const slashPattern = /(?:วันที่\s*)?(\b\d{1,2})[\/\.-](\d{1,2})[\/\.-](\d{4}|\d{2})\b/;
  const slashMatch = query.match(slashPattern);

  if (slashMatch) {
    let d = parseInt(slashMatch[1], 10);
    let m = parseInt(slashMatch[2], 10);
    let y = parseInt(slashMatch[3], 10);

    // If 2 digits year
    if (y < 100) {
      y += 2000;
    }
    // Thai Buddhist Era conversion: e.g. 2569 -> 2026
    if (y > 2400) {
      y -= 543;
    }

    if (m >= 1 && m <= 12 && d >= 1 && d <= 31) {
      targetYear = y;
      targetMonth = m;
      targetDay = d;
      isDateSpecific = true;
      temporalScope = isCurrentOrPast(y, m, d, ref) ? 'CURRENT_STATUS' : 'FUTURE_PREDICTION';
    }
  }

  // 2. Check text month patterns: "15 กันยายน 2569", "15 September 2026", "15 ก.ย. 2026"
  if (!isDateSpecific) {
    const monthNamesRegex = Object.keys(THAI_MONTH_MAP).sort((a, b) => b.length - a.length).join('|');
    const textPattern = new RegExp(`(?:วันที่\\s*)?(\\b\\d{1,2})\\s+(${monthNamesRegex})\\s+(\\d{4})\\b`, 'i');
    const textMatch = query.match(textPattern);

    if (textMatch) {
      const d = parseInt(textMatch[1], 10);
      const mStr = textMatch[2].toLowerCase();
      let y = parseInt(textMatch[3], 10);
      const m = THAI_MONTH_MAP[mStr];

      if (y > 2400) {
        y -= 543;
      }

      if (m && d >= 1 && d <= 31) {
        targetYear = y;
        targetMonth = m;
        targetDay = d;
        isDateSpecific = true;
        temporalScope = isCurrentOrPast(y, m, d, ref) ? 'CURRENT_STATUS' : 'FUTURE_PREDICTION';
      }
    }
  }

  // 3. Check keywords: "วันนี้", "เมื่อวาน", "today", "yesterday", "latest", "ล่าสุด"
  if (!isDateSpecific) {
    if (/\b(วันนี้|today|ปัจจุบัน|current)\b/i.test(query)) {
      targetYear = ref.getFullYear();
      targetMonth = ref.getMonth() + 1;
      targetDay = ref.getDate();
      isDateSpecific = true;
      temporalScope = 'CURRENT_STATUS';
    } else if (/\b(เมื่อวาน|yesterday)\b/i.test(query)) {
      const yesterday = new Date(ref.getTime() - 86400000);
      targetYear = yesterday.getFullYear();
      targetMonth = yesterday.getMonth() + 1;
      targetDay = yesterday.getDate();
      isDateSpecific = true;
      temporalScope = 'CURRENT_STATUS';
    } else if (/\b(ล่าสุด|เกาะติด|สดๆ|live|breaking)\b/i.test(query)) {
      temporalScope = 'CURRENT_STATUS';
    }
  }

  let targetDateISO: string | undefined;
  let targetDateFormatted: string | undefined;

  if (targetYear && targetMonth && targetDay) {
    const mm = String(targetMonth).padStart(2, '0');
    const dd = String(targetDay).padStart(2, '0');
    targetDateISO = `${targetYear}-${mm}-${dd}`;
    targetDateFormatted = `${dd}/${mm}/${targetYear}`;
  }

  return {
    targetDateISO,
    targetDateFormatted,
    targetYear,
    targetMonth,
    targetDay,
    isDateSpecificQuery: isDateSpecific,
    timezone,
    temporalScope
  };
}

function isCurrentOrPast(year: number, month: number, day: number, ref: Date): boolean {
  const target = new Date(year, month - 1, day);
  const now = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate());
  return target.getTime() <= now.getTime();
}

/**
 * Extracts published date from HTML metadata or raw text.
 */
export function extractDateFromMetadata(
  metaTags: Record<string, string>,
  url: string,
  rawText: string
): { publishedAt?: string; rawDateString?: string; isConfident: boolean } {
  // 1. Standard metadata fields
  const candidates = [
    metaTags['article:published_time'],
    metaTags['published_time'],
    metaTags['og:published_time'],
    metaTags['publication_date'],
    metaTags['date'],
    metaTags['dc.date'],
    metaTags['dc.date.issued'],
    metaTags['article:modified_time'],
    metaTags['og:updated_time'],
    metaTags['dateModified'],
  ].filter(Boolean);

  for (const cand of candidates) {
    const iso = tryParseISO(cand);
    if (iso) {
      return { publishedAt: iso, rawDateString: cand, isConfident: true };
    }
  }

  // 2. Check URL structure (e.g., /2026/09/15/title or /20260915/ or /2026-09-15/)
  const urlDateMatch = url.match(/(?:^|[\/_.-])(20\d{2})[\/_.-](0[1-9]|1[0-2])[\/_.-](0[1-9]|[12]\d|3[01])(?:[\/_.-]|$)/);
  if (urlDateMatch) {
    const y = urlDateMatch[1];
    const m = urlDateMatch[2];
    const d = urlDateMatch[3];
    return { publishedAt: `${y}-${m}-${d}`, rawDateString: `${y}/${m}/${d}`, isConfident: true };
  }

  // 3. Scan first 1000 characters of text for date stamps
  const headerSnippet = rawText.slice(0, 1500);
  const res = resolveTargetDateFromQuery(headerSnippet);
  if (res.targetDateISO) {
    return { publishedAt: res.targetDateISO, rawDateString: res.targetDateFormatted, isConfident: false };
  }

  return { isConfident: false };
}

function tryParseISO(str: string): string | null {
  if (!str) return null;
  const parsed = Date.parse(str);
  if (Number.isFinite(parsed)) {
    const d = new Date(parsed);
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, '0');
    const day = String(d.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
  return null;
}

/**
 * Validates if the article's publication date satisfies the target date query.
 */
export function verifyArticleDateMatch(
  articlePublishedAt?: string,
  targetDateISO?: string
): { isMatch: boolean; reason: string } {
  if (!targetDateISO) {
    return { isMatch: true, reason: 'No specific date constraint in query' };
  }

  if (!articlePublishedAt) {
    return { isMatch: false, reason: 'Article lacks verified publication date' };
  }

  const articleISO = articlePublishedAt.slice(0, 10);
  const targetISO = targetDateISO.slice(0, 10);

  if (articleISO === targetISO) {
    return { isMatch: true, reason: `Exact date match (${articleISO})` };
  }

  // Allow 1 day boundary for timezone shifts (+/- 1 day)
  const artTime = Date.parse(articleISO);
  const tarTime = Date.parse(targetISO);
  if (Number.isFinite(artTime) && Number.isFinite(tarTime)) {
    const diffHours = Math.abs(artTime - tarTime) / (1000 * 60 * 60);
    if (diffHours <= 36) {
      return { isMatch: true, reason: `Timezone-adjacent date match (${articleISO} ~ ${targetISO})` };
    }
  }

  return { isMatch: false, reason: `Date mismatch: article (${articleISO}) vs requested (${targetISO})` };
}
