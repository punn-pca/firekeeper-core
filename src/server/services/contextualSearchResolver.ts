/**
 * FIRE KEEPER — Contextual Search Resolver
 *
 * Ensures that web searches reflect the user's intended meaning in context,
 * not merely the literal wording of the latest message.
 *
 * Implements 10 Invariant Rules:
 * 1. Always consider active conversation context before generating a search query.
 * 2. Resolve pronouns & implicit references (เขา, เธอ, มัน, คนนี้, บริษัทนี้, ที่นี่, เรื่องนี้, แล้วล่ะ, ล่าสุด, ตอนนี้, etc.).
 * 3. Rewrite context-dependent queries into self-contained search queries.
 * 4. Never send ambiguous contextual phrases directly to the search engine.
 * 5. Preserve user intent without introducing unsupported facts.
 * 6. Mark as ambiguous when multiple entities match rather than guessing.
 * 7. Explicitly preserve temporal intent (ปัจจุบัน, ล่าสุด, วันนี้, ปีนี้, ณ เวลานี้).
 * 8. Search query must contain the necessary entity/topic needed for accurate retrieval.
 * 9. Do not blindly append full history; extract only necessary context.
 * 10. Distinguish USER_QUERY vs RESOLVED_QUERY vs SEARCH_QUERY.
 */

export interface HistoryTurn {
  role: string;
  content?: string;
  text?: string;
}

export interface ContextualSearchResolution {
  user_query: string;
  resolved_query: string;
  search_required: boolean;
  context_used: string[];
  search_query: string;
  ambiguity: boolean;
}

export interface ExtractedEntity {
  name: string;
  type: 'person' | 'organization' | 'topic' | 'place' | 'product' | 'general';
  turnIndex: number;
  source: 'user' | 'assistant';
}

// ─────────────────────────────────────────────────────────────────────────────
// REFERENCE AND PRONOUN PATTERNS
// ─────────────────────────────────────────────────────────────────────────────

const PRONOUN_PATTERNS = {
  person: [
    /(?:เขา|เธอ|ท่าน|คนนี้|บุคคลนั้น|บุคคลนี้|ท่านนี้|ท่านนั้น)/i,
    /\b(?:he|she|him|her)\b/i
  ],
  organization: [
    /(?:บริษัทนี้|บริษัทนั้น|องค์กรนี้|องค์กรนั้น|หน่วยงานนี้|หน่วยงานนั้น|แบรนด์นี้|สถาบันนี้|ค่ายนี้|ร้านนี้|ธนาคารนี้)/i,
    /\b(?:this\s+company|that\s+company|this\s+organization|the\s+firm)\b/i
  ],
  place: [
    /(?:ที่นี่|ที่นั่น|ที่โน่น|ประเทศนี้|เมืองนี้|จังหวัดนี้)/i,
    /\b(?:here|there|this\s+place|this\s+country)\b/i
  ],
  topic: [
    /(?:เรื่องนี้|เรื่องนั้น|ประเด็นนี้|ประเด็นนั้น|คดีนี้|เหตุการณ์นี้|ข่าวนี้|โปรเจกต์นี้|โครงการนี้)/i,
    /\b(?:this\s+matter|this\s+issue|this\s+case|this\s+topic|this\s+event)\b/i
  ],
  generic_it: [
    /(?:มัน|สิ่งนี้|สิ่งนั้น|อันนี้|อันนั้น)/i,
    /\b(?:it|this|that)\b/i
  ]
};

// Elliptical follow-up connectors
const ELLIPTICAL_FOLLOWUP_REGEX = /^(?:แล้ว|แล้วก็|และ|ส่วน|ด้าน)\s*(.+?)(?:\s*(?:ล่ะ|ละ|ล่ะครับ|ล่ะค่ะ|ครับ|ค่ะ|\?))?$/i;
const QUESTION_PARTICLE_CLEANUP = /(?:ล่ะ|ละ|ล่ะครับ|ล่ะค่ะ|นะ|ครับ|ค่ะ|\?|？)$/g;

// Temporal intent keywords to explicitly preserve
const TEMPORAL_MARKERS = [
  { keyword: 'ปัจจุบัน', regex: /(?:ปัจจุบัน|ณ\s*เวลานี้|ณ\s*ตอนนี้|ขณะนี้|as\s*of\s*now|currently)/i, searchToken: 'ปัจจุบัน' },
  { keyword: 'ล่าสุด', regex: /(?:ล่าสุด|ล่าสุดนี้|อัปเดตล่าสุด|latest|recent)/i, searchToken: 'ล่าสุด' },
  { keyword: 'ตอนนี้', regex: /(?:ตอนนี้|now|right\s*now)/i, searchToken: 'ปัจจุบัน ตอนนี้' },
  { keyword: 'วันนี้', regex: /(?:วันนี้|today)/i, searchToken: 'วันนี้' },
  { keyword: 'ปีนี้', regex: /(?:ปีนี้|this\s*year)/i, searchToken: 'ปีนี้ 2026' }
];

// Conversational / Non-search indicators
const NON_SEARCH_PATTERNS = [
  // Greetings & pleasantries
  /^(?:สวัสดี(?:ครับ|ค่ะ)?|หวัดดี|hello|hi|hey|good\s*(?:morning|afternoon|evening))(?:\s*(?:ครับ|ค่ะ|สบายดีไหม|เป็นไงบ้าง|เป็นอย่างไรบ้าง))?$/i,
  /^(?:สบายดีไหม|เป็นอย่างไรบ้าง|เป็นไงบ้าง)(?:ครับ|ค่ะ)?$/i,
  // Gratitude / Acknowledgment
  /^(?:ขอบคุณ(?:ครับ|ค่ะ)?|ขอบใจ|thanks|thank\s*you|ok|โอเค|รับทราบ|เข้าใจแล้ว)$/i,
  // Internal Persona questions (handled by Canonical Persona, no external web needed)
  /^(?:punn\s*คือใคร|ปุญญ์\s*คือใคร|punn\s*ย่อมาจากอะไร|punn\s*กับ\s*firekeeper\s*ต่างกันอย่างไร|firekeeper\s*คืออะไร)$/i,
  // Pure Math
  /^(?:[\d\s\+\-\*\/\(\)\^\.\=\%]+|\d+\s*(?:บวก|ลบ|คูณ|หาร)\s*\d+)\s*(?:เท่ากับเท่าไหร่|ได้เท่าไหร่)?$/i
];

// ─────────────────────────────────────────────────────────────────────────────
// ENTITY EXTRACTION HELPER
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Extracts candidate entities from a conversation turn
 */
export function extractEntitiesFromText(text: string, turnIndex: number, role: 'user' | 'assistant'): ExtractedEntity[] {
  if (!text || typeof text !== 'string') return [];
  const entities: ExtractedEntity[] = [];
  const clean = text.trim();

  // Known High-Frequency Organizations & Companies in Thai business/tech context
  const orgMatches = clean.match(/(?:ปตท\.?|PTT|กสิกรไทย|KBANK|ไทยพาณิชย์|SCB|กรุงเทพ|BBL|กรุงไทย|KTB|ซีพี|CP|CPALL|ทรู|TRUE|เอไอเอส|AIS|แอดวานซ์|กัลฟ์|GULF|บีทีเอส|BTS|บีอีเอ็ม|BEM|แอร์เอเชีย|การบินไทย|Apple|Microsoft|Google|Alphabet|Amazon|Meta|Tesla|Nvidia|OpenAI|DeepSeek|ก\.ล\.ต\.|ธปท\.|ธนาคารแห่งประเทศไทย|อย\.|สตช\.|ดีเอสไอ|DSI|ศาลรัฐธรรมนูญ|กกต\.)/g);
  if (orgMatches) {
    for (const m of orgMatches) {
      if (!entities.some(e => e.name === m)) {
        entities.push({ name: m, type: 'organization', turnIndex, source: role });
      }
    }
  }

  // Legal / Topic Concepts
  const topicMatches = clean.match(/(?:คดี\s*(?:Forex-3D|The\s*Icon|ดิไอคอน|[a-zA-Z0-9\-]+|[ก-๙]{2,12})|Forex-3D|The\s*Icon|ดิไอคอน|หุ้น\s*[a-zA-Z0-9ก-๙]{2,8}|ดิจิทัลวอลเล็ต|Digital\s*Wallet|PDPA|ISO\s*42001|AI\s*Act)/gi);
  if (topicMatches) {
    for (const m of topicMatches) {
      const trimmed = m.trim();
      // Skip generic descriptive fragments
      if (/^คดี(?:แชร์ลูกโซ่|ทั่วไป|ความ|แพ่ง|อาญา|การเมือง|ฉ้อโกง|ฟ้องร้อง)/i.test(trimmed)) continue;
      
      const existingIdx = entities.findIndex(e => e.name.toLowerCase() === trimmed.toLowerCase() || e.name.includes(trimmed) || trimmed.includes(e.name));
      if (existingIdx >= 0) {
        // Keep the more descriptive/longer canonical name (e.g. "คดี Forex-3D" over "Forex-3D")
        if (trimmed.length > entities[existingIdx].name.length) {
          entities[existingIdx].name = trimmed;
        }
      } else {
        entities.push({ name: trimmed, type: 'topic', turnIndex, source: role });
      }
    }
  }

  // People / Political Figures / Executives
  const peopleMatches = clean.match(/(?:นายกฯ\s*[\wก-๙]+|นายกรัฐมนตรี\s*[\wก-๙]+|ทักษิณ|พิธา|เศรษฐา|แพทองธาร|ประยุทธ์|อนุทิน|ทิม\s*คุก|Tim\s*Cook|อีลอน\s*มัสก์|Elon\s*Musk|แซม\s*อัลต์แมน|Sam\s*Altman|เจนเซ่น\s*หวง|Jensen\s*Huang|สี\s*จิ้นผิง|โจ\s*ไบเดน|โดนัลด์\s*ทรัมป์)/gi);
  if (peopleMatches) {
    for (const m of peopleMatches) {
      if (!entities.some(e => e.name === m)) {
        entities.push({ name: m, type: 'person', turnIndex, source: role });
      }
    }
  }

  // Fallback: If turn begins with a salient subject phrase before a verb
  // e.g. "บริษัท ปตท. จำกัด", "โครงการแลนด์บริดจ์"
  const subjectIntroMatch = clean.match(/^(?:บริษัท|องค์กร|โครงการ|กรณี|เรื่อง|ระบบ)\s+([ก-๙a-zA-Z0-9\.\-]+)/);
  if (subjectIntroMatch && subjectIntroMatch[1]) {
    const candidate = subjectIntroMatch[0];
    if (!entities.some(e => e.name === candidate)) {
      entities.push({ name: candidate, type: candidate.startsWith('โครงการ') ? 'topic' : 'organization', turnIndex, source: role });
    }
  }

  return entities;
}

// ─────────────────────────────────────────────────────────────────────────────
// CONTEXTUAL SEARCH RESOLVER
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Resolves an incoming user query against the conversation context according to the 10 Rules.
 */
export function resolveContextualSearch(
  userQuery: string,
  history: HistoryTurn[] = []
): ContextualSearchResolution {
  const rawQuery = (userQuery || '').trim();
  const contextUsed: string[] = [];

  // Default output structure
  let resolvedQuery = rawQuery;
  let searchQuery = rawQuery;
  let searchRequired = true;
  let ambiguity = false;

  // RULE: Check if search is actually needed
  for (const nonSearchPattern of NON_SEARCH_PATTERNS) {
    if (nonSearchPattern.test(rawQuery)) {
      searchRequired = false;
      contextUsed.push('ข้อความจัดเป็นคำทักทาย การขอบคุณ การคำนวณเชิงตรรกะ หรือข้อมูลอัตลักษณ์ภายในระบบ ซึ่งไม่จำเป็นต้องสืบค้นเว็บภายนอก');
      return {
        user_query: rawQuery,
        resolved_query: rawQuery,
        search_required: false,
        context_used: contextUsed,
        search_query: '',
        ambiguity: false
      };
    }
  }

  // 1. Extract context entities from history (most recent first)
  const allEntities: ExtractedEntity[] = [];
  if (Array.isArray(history) && history.length > 0) {
    // Process from most recent turn backwards
    for (let i = history.length - 1; i >= 0; i--) {
      const turn = history[i];
      const text = turn.content || turn.text || '';
      const role = (turn.role === 'assistant' || turn.role === 'model') ? 'assistant' : 'user';
      const ents = extractEntitiesFromText(text, i, role);
      for (const ent of ents) {
        const existingIdx = allEntities.findIndex(
          e => e.type === ent.type && (e.name.toLowerCase() === ent.name.toLowerCase() || e.name.includes(ent.name) || ent.name.includes(e.name))
        );
        if (existingIdx >= 0) {
          if (ent.name.length > allEntities[existingIdx].name.length) {
            allEntities[existingIdx].name = ent.name;
          }
        } else {
          allEntities.push(ent);
        }
      }
    }
  }

  // 2. Identify implicit references & pronouns in user query
  let hasPersonRef = PRONOUN_PATTERNS.person.some(r => r.test(rawQuery));
  let hasOrgRef = PRONOUN_PATTERNS.organization.some(r => r.test(rawQuery));
  let hasPlaceRef = PRONOUN_PATTERNS.place.some(r => r.test(rawQuery));
  let hasTopicRef = PRONOUN_PATTERNS.topic.some(r => r.test(rawQuery));
  let hasGenericItRef = PRONOUN_PATTERNS.generic_it.some(r => r.test(rawQuery));

  // Check for elliptical follow-up ("แล้ว...ล่ะ", "แล้วซีอีโอของเขาล่ะ", "แล้วกำไรล่ะ")
  const ellipticalMatch = rawQuery.match(ELLIPTICAL_FOLLOWUP_REGEX);
  const isElliptical = !!ellipticalMatch;

  // Check for missing subject questions (e.g. "ตอนนี้ราคาเท่าไหร่", "ซีอีโอคือใคร", "จัดที่ไหน")
  const isSubjectlessQuery = /^(?:แล้ว\s*)?(?:ซีอีโอคือใคร|ceo\s*คือใคร|ราคาเท่าไหร่|ราคาตอนนี้เท่าไหร่|มีผลงานอะไรบ้าง|จัดขึ้นเมื่อไหร่|อยู่ที่ไหน|ผลประกอบการเป็นยังไง)\b/i.test(rawQuery);

  const needsContextualResolution = hasPersonRef || hasOrgRef || hasPlaceRef || hasTopicRef || hasGenericItRef || isElliptical || isSubjectlessQuery;

  // 3. Resolve References If Needed
  if (needsContextualResolution && allEntities.length > 0) {
    // Determine which entity category is requested
    let targetType: ExtractedEntity['type'] | null = null;
    let matchedPronoun: string = '';

    if (hasOrgRef) {
      targetType = 'organization';
      matchedPronoun = 'บริษัทนี้/องค์กรนั้น';
    } else if (hasTopicRef) {
      targetType = 'topic';
      matchedPronoun = 'เรื่องนี้/คดีนี้';
    } else if (hasPlaceRef) {
      targetType = 'place';
      matchedPronoun = 'ที่นี่/ที่นั่น';
    } else if (hasPersonRef) {
      // "เขา" could refer to a person or person-like organization (e.g. "ซีอีโอของเขา")
      if (/ซีอีโอ|ceo|กำไร|หุ้น|ผลประกอบการ|บริษัท/i.test(rawQuery)) {
        targetType = 'organization';
        matchedPronoun = 'เขา (ในบริบทองค์กร)';
      } else {
        targetType = 'person';
        matchedPronoun = 'เขา/เธอ';
      }
    } else if (isElliptical || isSubjectlessQuery) {
      // Elliptical follow-up inherit the most recent salient entity
      targetType = allEntities[0]?.type || 'general';
      matchedPronoun = 'คำถามต่อเนื่องแบบละประธาน';
    }

    // Filter candidate entities
    const candidateEntities = allEntities.filter(e => !targetType || e.type === targetType || targetType === 'general');

    // RULE 6: Ambiguity Check
    // If there are multiple recent entities of the exact same category in the immediate context
    const immediateCandidates = candidateEntities.filter(e => e.turnIndex >= history.length - 2);
    if (immediateCandidates.length > 1) {
      ambiguity = true;
      contextUsed.push(
        `พบเอนทิตีที่อาจอ้างอิงถึงได้มากกว่า 1 รายการในบริบทล่าสุด: ${immediateCandidates.map(c => c.name).join(', ')}`
      );
      contextUsed.push('ไม่สามารถระบุได้แน่ชัดว่าอ้างถึงรายการใดโดยไม่คาดเดา จึงระบุสถานะเป็นกำกวม (Ambiguous)');

      // Formulate safe multi-candidate query
      resolvedQuery = `[บริบทกำกวมระหว่าง: ${immediateCandidates.map(c => c.name).join(' หรือ ')}] ${rawQuery}`;
      searchQuery = `${immediateCandidates.map(c => c.name).join(' ')} ${rawQuery.replace(/[?？!！]/g, '')}`.trim();
    } else if (candidateEntities.length > 0) {
      // Exactly one salient entity resolved!
      const boundEntity = candidateEntities[0];
      contextUsed.push(`เอนทิตีอ้างอิง: "${boundEntity.name}" (ประเภท: ${boundEntity.type}) จากบทสนทนาก่อนหน้า (Turn ${boundEntity.turnIndex + 1})`);
      contextUsed.push(`แก้ไขการอ้างอิง "${matchedPronoun}" ให้ชี้ตรงไปยัง "${boundEntity.name}"`);

      // Rewrite resolved query
      let rewritten = rawQuery;

      // 1. Strip elliptical conversational prefix: "แล้ว", "และ", "ส่วน"
      rewritten = rewritten.replace(/^(?:แล้ว(?:ก็)?|และ|ส่วน|ด้าน)\s*/i, '').trim();

      // 2. Remove question particles: "ล่ะ", "ละ", "ล่ะครับ", "ล่ะค่ะ"
      rewritten = rewritten.replace(/\s*(?:ล่ะ|ละ)(?:ครับ|ค่ะ)?(?=\s|$|\?|คือ|เป็น)/g, '').trim();

      // 3. Precise Pronoun & Reference Substitution
      // Possessive references first: "ของเขา", "ของเธอ", "ของมัน", "ของบริษัทนี้", "ขององค์กรนั้น"
      rewritten = rewritten.replace(/(?:ของ\s*(?:เขา|เธอ|ท่าน|มัน|บริษัทนี้|บริษัทนั้น|องค์กรนี้|องค์กรนั้น|หน่วยงานนี้|ที่นี่|เรื่องนี้))/g, `ของ ${boundEntity.name}`);

      // Direct pronouns
      if (hasPersonRef) {
        rewritten = rewritten.replace(/(?:เขา|เธอ|ท่าน|คนนี้|บุคคลนั้น|บุคคลนี้|ท่านนี้|ท่านนั้น)/g, boundEntity.name);
      }
      if (hasOrgRef) {
        rewritten = rewritten.replace(/(?:บริษัทนี้|บริษัทนั้น|องค์กรนี้|องค์กรนั้น|หน่วยงานนี้|หน่วยงานนั้น|แบรนด์นี้|สถาบันนี้|ค่ายนี้|ร้านนี้|ธนาคารนี้)/g, boundEntity.name);
      }
      if (hasTopicRef) {
        rewritten = rewritten.replace(/(?:เรื่องนี้|เรื่องนั้น|ประเด็นนี้|ประเด็นนั้น|คดีนี้|เหตุการณ์นี้|ข่าวนี้|โปรเจกต์นี้|โครงการนี้)/g, boundEntity.name);
      }
      if (hasPlaceRef) {
        rewritten = rewritten.replace(/(?:ที่นี่|ที่นั่น|ที่โน่น|ประเทศนี้|เมืองนี้|จังหวัดนี้)/g, boundEntity.name);
      }
      if (hasGenericItRef) {
        rewritten = rewritten.replace(/(?:มัน|สิ่งนี้|สิ่งนั้น|อันนี้|อันนั้น)/g, boundEntity.name);
      }

      // 4. If entity is still not mentioned (e.g. user asked "แล้วซีอีโอล่ะ" or "แล้วกำไรเท่าไหร่")
      if (!rewritten.includes(boundEntity.name)) {
        if (/^(?:ซีอีโอ|ceo|ประธาน|ผู้บริหาร|กำไร|รายได้|ราคาหุ้น|ผลประกอบการ|สถานะ)/i.test(rewritten)) {
          rewritten = `${rewritten} ของ ${boundEntity.name}`;
        } else {
          rewritten = `${boundEntity.name} ${rewritten}`;
        }
      }

      // Ensure clean phrasing
      resolvedQuery = rewritten.replace(/\s+/g, ' ').trim();

      // RULE 8 & 9: Build concise, targeted search query (NOT entire conversation)
      // Extract keywords from resolved query
      let cleanKeywords = resolvedQuery
        .replace(/[?？!！]/g, '')
        .replace(/(?:คือใคร|เป็นใคร|ช่วยหาข้อมูล|ขอทราบ|อยากรู้|เท่าไหร่|เป็นอย่างไร|หรือยัง|ของ)/g, ' ')
        .split(boundEntity.name).join(' ')
        .replace(/\s+/g, ' ')
        .trim();

      searchQuery = `${boundEntity.name} ${cleanKeywords}`.replace(/\s+/g, ' ').trim();
    }
  } else if (needsContextualResolution && allEntities.length === 0) {
    // Needs resolution but no context available
    ambiguity = true;
    contextUsed.push('คำถามมีการอ้างอิงสรรพนามหรือประเด็นต่อเนื่อง แต่ไม่พบบริบทหรือเอนทิตีตั้งต้นในประวัติการสนทนา');
    resolvedQuery = rawQuery;
    searchQuery = rawQuery;
  } else {
    // Standalone query without pronouns
    contextUsed.push('คำถามมีใจความสมบูรณ์ในตัวเอง (Self-contained query) ไม่มีการใช้สรรพนามอ้างอิงบริบทเดิม');
    resolvedQuery = rawQuery;
    searchQuery = rawQuery
      .replace(/[?？!！]/g, '')
      .replace(/(?:ช่วยบอกหน่อย|ขอทราบ|อยากรู้ว่า|ช่วยตรวจสอบ)/g, '')
      .trim();
  }

  // 4. RULE 7: Explicitly preserve temporal intent
  const detectedTemporalTokens: string[] = [];
  for (const t of TEMPORAL_MARKERS) {
    if (t.regex.test(rawQuery) || t.regex.test(resolvedQuery)) {
      detectedTemporalTokens.push(t.searchToken);
      contextUsed.push(`รักษาเจตนาเชิงเวลา (Temporal Intent): "${t.keyword}" -> เพิ่มคำค้นหา "${t.searchToken}"`);
    }
  }

  if (detectedTemporalTokens.length > 0) {
    // Append temporal tokens to search query if not already present
    for (const token of detectedTemporalTokens) {
      if (!searchQuery.includes(token)) {
        searchQuery = `${searchQuery} ${token}`.trim();
      }
    }
  }

  // Normalize spaces
  searchQuery = searchQuery.replace(/\s+/g, ' ').trim();

  return {
    user_query: rawQuery,
    resolved_query: resolvedQuery,
    search_required: searchRequired,
    context_used: contextUsed,
    search_query: searchQuery,
    ambiguity: ambiguity
  };
}

/**
 * Async resolver combining deterministic NLP resolution with optional LLM reasoning
 */
export async function resolveContextualSearchAsync(
  userQuery: string,
  history: HistoryTurn[] = [],
  options?: { apiKey?: string; model?: string; searchEnabled?: boolean }
): Promise<ContextualSearchResolution> {
  const searchEnabled = options?.searchEnabled ?? true;

  if (!searchEnabled) {
    return {
      user_query: userQuery,
      resolved_query: userQuery,
      search_required: false,
      context_used: ['Search Mode ปิดอยู่: ข้ามการประเมินบริบทเพื่อสืบค้นเว็บตามคำสั่งผู้ใช้'],
      search_query: '',
      ambiguity: false
    };
  }

  // 1. First run fast deterministic resolver
  const deterministicRes = resolveContextualSearch(userQuery, history);

  // If search is not required, or no API key, or resolution has high confidence without ambiguity
  const apiKey = options?.apiKey || process.env.DEEPSEEK_API_KEY;
  if (!apiKey || !deterministicRes.search_required || !deterministicRes.ambiguity) {
    return deterministicRes;
  }

  // 2. If ambiguous and LLM API is available, query LLM with exact Contextual Search Resolver Prompt
  try {
    const systemPrompt = `You are the Contextual Search Resolver for FIRE KEEPER.

Your primary responsibility is to ensure that web searches reflect the user’s intended meaning, not merely the literal wording of the latest user message.

RULES:
1. Always consider the active conversation context before generating a search query.
2. Resolve pronouns and implicit references such as:
    * เขา / เธอ / มัน
    * คนนี้ / บุคคลนั้น
    * บริษัทนี้ / องค์กรนั้น
    * ที่นี่ / ที่นั่น
    * เรื่องนี้ / เรื่องนั้น
    * แล้วล่ะ / แล้วเรื่อง…
    * ล่าสุด / ตอนนี้ / เมื่อไหร่ / เท่าไหร่
3. If the latest user message depends on previous context, rewrite it into a self-contained search query.
4. Never send an ambiguous contextual phrase directly to the search engine when the intended entity can be resolved from conversation context.
5. Preserve the user’s original intent. Do not introduce facts that are not supported by the conversation.
6. If multiple entities could reasonably match the reference, mark the query as ambiguous rather than guessing.
7. For time-sensitive questions, explicitly preserve the temporal intent:
    * ปัจจุบัน
    * ล่าสุด
    * วันนี้
    * ปีนี้
    * ณ เวลานี้
8. The search query must contain the necessary entity/topic needed for accurate retrieval.
9. Do not blindly append the entire conversation history to the search query. Extract only the context necessary to resolve the current request.
10. Distinguish between:
    USER_QUERY = exactly what the user asked
    RESOLVED_QUERY = the user’s question with contextual references resolved
    SEARCH_QUERY = optimized query intended for web retrieval

OUTPUT FORMAT:
Return ONLY valid JSON matching this exact structure:
{
  "user_query": "...",
  "resolved_query": "...",
  "search_required": true,
  "context_used": ["..."],
  "search_query": "...",
  "ambiguity": false
}

If no web search is necessary, set:
"search_required": false
and explain why in the context_used field.`;

    const recentHistoryFormatted = history.slice(-6).map((h, i) => `[Turn ${i + 1}] ${h.role}: ${h.content || h.text || ''}`).join('\n');
    const userPrompt = `CONVERSATION CONTEXT:\n${recentHistoryFormatted}\n\nCURRENT USER MESSAGE:\n${userQuery}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: options?.model || 'deepseek-chat',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.1,
        response_format: { type: 'json_object' }
      }),
      signal: controller.signal
    });
    clearTimeout(timeout);

    if (response.ok) {
      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      if (content) {
        const parsed = JSON.parse(content);
        if (parsed.user_query && parsed.resolved_query && typeof parsed.search_required === 'boolean') {
          return {
            user_query: parsed.user_query,
            resolved_query: parsed.resolved_query,
            search_required: parsed.search_required,
            context_used: Array.isArray(parsed.context_used) ? parsed.context_used : [parsed.context_used || ''],
            search_query: parsed.search_query || '',
            ambiguity: Boolean(parsed.ambiguity)
          };
        }
      }
    }
  } catch (err) {
    console.warn('[ContextualSearchResolver] LLM resolution fallback triggered:', err);
  }

  return deterministicRes;
}
