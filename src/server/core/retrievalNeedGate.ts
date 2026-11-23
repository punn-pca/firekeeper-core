export type RetrievalNeed = 'NONE' | 'CURRENT' | 'USER_REQUESTED';

export type RetrievalDecision = {
  need: RetrievalNeed;
  shouldRetrieve: boolean;
  reason: string;
};

const CURRENT_PATTERNS = [
  /ล่าสุด/i,
  /ปัจจุบัน/i,
  /ตอนนี้/i,
  /วันนี้/i,
  /วันนี้มี/i,
  /ล่าสุดเมื่อ/i,
  /recent/i,
  /current/i,
  /latest/i,
  /today/i,
  /now/i,
  /recently/i,
  /news/i,
  /ข่าว/i,
];

const EXPLICIT_SEARCH_PATTERNS = [
  /ค้นหา/i,
  /สืบค้น/i,
  /หาข้อมูล/i,
  /ช่วยหา/i,
  /ช่วยค้น/i,
  /ค้นให้/i,
  /หาแหล่งข้อมูล/i,
  /หาแหล่งอ้างอิง/i,
  /ขอแหล่งข้อมูล/i,
  /ขอแหล่งอ้างอิง/i,
  /อ้างอิงจากเว็บ/i,
  /จากเว็บ/i,
  /จากอินเทอร์เน็ต/i,
  /จากงานวิจัย/i,
  /งานวิจัย/i,
  /source(?:s)?/i,
  /reference(?:s)?/i,
  /search/i,
  /look\s*up/i,
  /find\s+(?:sources|research|information)/i,
];

const NEGATED_SEARCH_PATTERNS = [
  /ไม่ต้องค้น/i,
  /ไม่ต้องหา/i,
  /ไม่ต้องอ้างอิง/i,
  /ไม่ต้องใช้เว็บ/i,
  /without\s+(?:web|search)/i,
];

export function assessRetrievalNeed(question: string, webSearchEnabled = true): RetrievalDecision {
  const q = String(question || '').trim();
  if (!q) return { need: 'NONE', shouldRetrieve: false, reason: 'empty_question' };
  if (!webSearchEnabled) return { need: 'NONE', shouldRetrieve: false, reason: 'web_search_disabled' };

  if (NEGATED_SEARCH_PATTERNS.some((pattern) => pattern.test(q))) {
    return { need: 'NONE', shouldRetrieve: false, reason: 'user_disabled_retrieval' };
  }

  if (CURRENT_PATTERNS.some((pattern) => pattern.test(q))) {
    return { need: 'CURRENT', shouldRetrieve: true, reason: 'current_or_news_information_requested' };
  }

  if (EXPLICIT_SEARCH_PATTERNS.some((pattern) => pattern.test(q))) {
    return { need: 'USER_REQUESTED', shouldRetrieve: true, reason: 'external_sources_explicitly_requested' };
  }

  // General explanation, definition, causal explanation, brainstorming, and
  // ordinary analysis stay model-native. Governed mode alone is never a reason
  // to call the web.
  return { need: 'NONE', shouldRetrieve: false, reason: 'general_answer_does_not_require_external_retrieval' };
}
