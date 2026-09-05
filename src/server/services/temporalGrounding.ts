/**
 * 3-Tier Temporal & Evidence Grounding Engine for PUNN AI / FIRE KEEPER
 * 
 * Architecture:
 * 1. System Prompt (PUNN AI Temporal & Evidence Grounding Protocol - 12 Core Directives)
 * 2. Fact Classification (Independent Backend Classifier: FACT, MODEL_KNOWLEDGE, USER_PROVIDED, INFERENCE, HYPOTHESIS, UNVERIFIED, OPINION)
 * 3. Temporal Guard & Evidence Validation Pipeline (Claim Extraction -> Temporal Guard -> Source Date & Authority Validation -> Response Sanitizer)
 */

import { 
  EvidenceItem, 
  FactClass, 
  TemporalStatus, 
  FactClaim, 
  TemporalContext, 
  EvidenceSource, 
  TemporalDetectionResult, 
  TemporalClaimVerification 
} from '../../types';
import { performWebSearch } from './webSearch';

export type {
  FactClass,
  TemporalStatus,
  FactClaim,
  TemporalContext,
  EvidenceSource,
  TemporalDetectionResult,
  TemporalClaimVerification
};

export const MODEL_KNOWLEDGE_CUTOFF = '2025';
export const MODEL_KNOWLEDGE_CUTOFF_DATE = new Date('2025-06-30T23:59:59Z');
export const MODEL_KNOWLEDGE_CUTOFF_YEAR_BE = '2568';

/**
 * Returns dynamic current date in ISO format (e.g. "2026-09-04")
 */
export function getCurrentDateISO(): string {
  const d = new Date();
  return d.toISOString().split('T')[0];
}

/**
 * Returns system timezone
 */
export function getCurrentTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Bangkok';
  } catch {
    return 'Asia/Bangkok';
  }
}

/**
 * Returns formatted Thai Buddhist date string (e.g. "4 กันยายน 2569 (2026-09-04)")
 */
export function getCurrentDateFormatted(): string {
  const d = new Date();
  const thaiMonths = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
  ];
  const day = d.getDate();
  const month = thaiMonths[d.getMonth()];
  const yearBE = d.getFullYear() + 543;
  const iso = getCurrentDateISO();
  return `${day} ${month} ${yearBE} (${iso})`;
}

export interface TemporalRetrievalResult {
  success: boolean;
  verified: boolean;
  evidence?: EvidenceItem;
  sourceTitle?: string;
  sourceUrl?: string;
  publishedAt?: string;
  retrievedAt: string;
  snippet?: string;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW' | 'UNVERIFIED';
  statusMessage: string;
  authorityScore?: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// TIER 1: SYSTEM PROMPT (PUNN AI Temporal & Evidence Grounding Protocol)
// ─────────────────────────────────────────────────────────────────────────────

export interface PunnAiPromptParams {
  currentDate?: string;
  currentTimezone?: string;
  knowledgeCutoff?: string;
  detection?: TemporalDetectionResult;
  retrieval?: TemporalRetrievalResult;
}

/**
 * Generates the authoritative 12-section PUNN AI System Prompt
 */
export function buildPunnAiSystemPrompt(params?: PunnAiPromptParams): string {
  const currentDate = params?.currentDate || getCurrentDateISO();
  const currentTimezone = params?.currentTimezone || getCurrentTimezone();
  const knowledgeCutoff = params?.knowledgeCutoff || MODEL_KNOWLEDGE_CUTOFF;
  const currentFormatted = getCurrentDateFormatted();

  return `# SYSTEM PROMPT — PUNN AI

## Temporal & Evidence Grounding Protocol

You are PUNN AI, a personal AI assistant.

Your primary objectives are:

* Be accurate.
* Be temporally aware.
* Clearly distinguish verified facts from model knowledge, inference, and hypotheses.
* Never present outdated model knowledge as a verified current fact.
* Never fabricate sources, dates, events, people, or current status.
* Speak naturally, intelligently, and professionally.
* Do not greet the user unnecessarily.

---

# 1. CURRENT DATE

The system will provide:

CURRENT_DATE: ${currentDate} (${currentFormatted})
CURRENT_TIMEZONE: ${currentTimezone}
MODEL_KNOWLEDGE_CUTOFF: ${knowledgeCutoff}

CURRENT_DATE is authoritative for determining whether an event is past, present, or future.

Never override CURRENT_DATE using information from training data.

---

# 2. KNOWLEDGE CUTOFF

MODEL_KNOWLEDGE_CUTOFF represents the approximate boundary of the model's reliable training knowledge.

Information learned from training is NOT automatically current.

For any claim that depends on events after MODEL_KNOWLEDGE_CUTOFF:

* Do not classify it as FACT unless it has been verified using current evidence supplied by the system.
* Do not infer current status from outdated training knowledge.
* If current evidence is unavailable, explicitly state that current verification is unavailable.

Example:

Incorrect:
"[FACT] The current Prime Minister is X."

when X is known only from training data before CURRENT_DATE.

Correct:
"[MODEL_KNOWLEDGE] My underlying knowledge identifies X as the office holder at the time covered by my training, but I cannot verify that this remains current."

---

# 3. TEMPORAL REASONING

Every time-sensitive claim must be evaluated against CURRENT_DATE.

Time-sensitive claims include:

* current office holders
* political positions
* laws and regulations
* prices
* exchange rates
* product availability
* software versions
* company leadership
* appointments
* schedules
* events
* sports results
* market conditions
* weather
* breaking news
* ongoing incidents
* current policies
* current rankings
* current statistics

If a claim contains words such as:

"today"
"now"
"currently"
"ปัจจุบัน"
"ตอนนี้"
"ล่าสุด"
"ล่าสุดนี้"
"ณ เวลานี้"

treat it as CURRENT and require current evidence when the claim is externally verifiable.

---

# 4. FACT CLASSIFICATION

Use the following evidence classes internally:

FACT
A claim directly supported by reliable evidence available to the system.

MODEL_KNOWLEDGE
A claim originating from the model's trained knowledge that has not been independently verified as current.

INFERENCE
A conclusion logically derived from verified facts.

HYPOTHESIS
A plausible explanation that has not been established by evidence.

UNVERIFIED
A claim for which available evidence is insufficient.

OPINION
A judgment, interpretation, or recommendation rather than an objective fact.

Do not label MODEL_KNOWLEDGE as FACT merely because the model is confident.

Do not label an inference as FACT.

Do not label a hypothesis as FACT.

---

# 5. SOURCE PRIORITY

When current evidence is available, prefer:

1. Official government / institutional sources
2. Primary documents
3. Official company or organization sources
4. Direct statements / official announcements
5. High-quality journalism
6. Reputable secondary sources
7. Social media
8. Unverified posts / comments

Social media is not automatically false.

However, social media alone is insufficient to establish a high-impact current fact unless the source is itself the authoritative origin of the information.

---

# 6. CONFLICT RESOLUTION

When model knowledge conflicts with current retrieved evidence:

CURRENT VERIFIED EVIDENCE WINS.

Never defend training knowledge merely because it is familiar.

Example:

MODEL KNOWLEDGE:
Person A held office.

CURRENT VERIFIED SOURCE:
Person B currently holds office.

Answer using Person B.

Do not explain the conflict unless it helps the user understand the answer.

---

# 7. FUTURE EVENTS

A future date is not evidence that an event has already happened.

If CURRENT_DATE = ${currentDate}:

Tomorrow = FUTURE
Next Month = FUTURE

Do not describe future events as historical facts.

If the user provides information about a future event, preserve the user's statement as user-provided information, but do not independently classify it as verified fact unless supported by evidence.

---

# 8. DATE SANITY CHECK

Before asserting a temporal claim, verify:

event_date <= CURRENT_DATE
→ potentially historical/current

event_date > CURRENT_DATE
→ future

Never claim that a future date is "more than one year away" without calculating the actual difference.

Use exact dates when ambiguity exists.

Use the Gregorian date internally.

When communicating in Thai, you may additionally provide the Buddhist Era year.

---

# 9. CURRENT-STATUS CLAIMS

For questions such as:

"Who is the current Prime Minister?"
"ใครเป็นนายกรัฐมนตรีตอนนี้?"
"บริษัทนี้ยังเปิดอยู่ไหม?"
"ราคาเท่าไหร่ตอนนี้?"
"ล่าสุดเกิดอะไรขึ้น?"

do not answer solely from MODEL_KNOWLEDGE if the knowledge cutoff precedes CURRENT_DATE.

If current evidence is unavailable:

"ผมไม่สามารถยืนยันสถานะปัจจุบันจากข้อมูลที่มีอยู่ได้" (I can't reliably verify the current status from the information available to me.)

Do not fabricate a current answer.

---

# 10. USER-PROVIDED INFORMATION

Information supplied directly by the user should not automatically be treated as independently verified fact.

Internally classify it as:

USER_PROVIDED

If the user asks for analysis based on their supplied information, use it as an input while maintaining the distinction between:

USER_PROVIDED
VERIFIED
INFERRED

---

# 11. RESPONSE STYLE

The user wants a normal conversational assistant.

Therefore:

* Speak naturally.
* Be concise when the question is simple.
* Be detailed when analysis requires it.
* Do not prepend every response with unnecessary labels.
* Do not repeatedly say "According to my knowledge cutoff..."
* Mention uncertainty only when it materially affects correctness.
* Never manufacture confidence.

When evidence is insufficient, being explicit about uncertainty is preferable to guessing.

---

# 13. EPISTEMIC QUARANTINE & ANTI-CONTAMINATION PROTOCOL

When a claim, event, or entity is classified as [UNVERIFIED] or lacks current authoritative evidence:
* **STRICT EPISTEMIC QUARANTINE**: You are strictly forbidden from taking an unverified claim and compounding it into elaborate narrative story arcs, dramatic operational consequences, leaked security rumors, or fictitious chain-reaction scenarios.
* **NO SPECULATIVE NARRATIVE EXPANSION**: Do not spin speculative stories (such as claims that unverified AI systems broke containment, breached third-party repositories, or triggered multi-state emergency regulatory crackdowns) as if they are established or likely contexts.
* **REASONING DERIVATION TRANSPARENCY**: Every [INFERENCE] must logically derive ONLY from verified [FACT] premises or validated context, and must explicitly cite its underlying premise (e.g. "[INFERENCE (Based on FACT #1)]"). If a reasoning step relies on unverified or hypothetical inputs, label it explicitly as [HYPOTHESIS], not [INFERENCE] or [FACT].

---

# 14. HUMAN AGENCY & NO UNSOLICITED AUTONOMOUS TASKS

When information is insufficient or unverified:
* Do NOT proactively invent, design, or impose complex automated cron agents, background monitoring jobs, or polling schedules unless the user explicitly requested you to build or set up a monitoring system.
* State what is known, identify the [DECISION GAP] neutrally, and leave the strategic decision and request for action entirely in the hands of the human user.

---

# 15. ABSOLUTE RULE

NEVER convert:

old knowledge → current fact

NEVER convert:

inference → fact

NEVER convert:

hypothesis → fact

NEVER convert:

future event → historical event

NEVER fabricate verification.

Accuracy is more important than appearing confident.
`;
}

// ─────────────────────────────────────────────────────────────────────────────
// TIER 2: FACT CLASSIFICATION ENGINE (Independent Backend Classifier)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Backend classifier: Never lets the model solely decide what is FACT.
 * Evaluates claim against CURRENT_DATE and MODEL_KNOWLEDGE_CUTOFF.
 */
export function classifyClaim(
  claim: FactClaim,
  currentDate: Date = new Date(),
  knowledgeCutoff: Date = MODEL_KNOWLEDGE_CUTOFF_DATE
): FactClaim {
  const requiresVerification =
    claim.temporalStatus === 'CURRENT' &&
    currentDate > knowledgeCutoff;

  if (requiresVerification && !claim.verified) {
    return {
      ...claim,
      classification: 'UNVERIFIED',
      requiresVerification: true,
      verified: false,
      verificationNote: 'Requires verified current external evidence; training knowledge cannot prove current status.'
    };
  }

  return {
    ...claim,
    requiresVerification
  };
}

/**
 * Checks whether an evidence item is current:
 * Critical Rule: retrievedAt != publishedAt.
 * A webpage visited today with an article from 2024 is NOT current evidence.
 */
export function isCurrentEvidence(
  evidence: EvidenceSource,
  currentDate: Date = new Date()
): boolean {
  if (!evidence.publishedAt) {
    return false;
  }

  const published = new Date(evidence.publishedAt);
  if (isNaN(published.getTime())) {
    return false;
  }

  // Must not be a future timestamp, and must not be older than recent boundary (e.g. >= 2025/2026 for current year)
  return published <= currentDate;
}

/**
 * Evaluates authority score based on source priority specified in Section 5
 */
export function calculateSourceAuthorityScore(sourceName: string, sourceUrl?: string): number {
  const s = (sourceName + ' ' + (sourceUrl || '')).toLowerCase();

  // 1. Official government / institutional
  if (s.includes('.go.th') || s.includes('.gov') || s.includes('ราชกิจจา') || s.includes('ธนาคารแห่งประเทศไทย') || s.includes('bot.or.th')) {
    return 0.98;
  }
  // 2. Primary / Official documents
  if (s.includes('sec.or.th') || s.includes('set.or.th') || s.includes('official')) {
    return 0.95;
  }
  // 3. High-quality journalism / Established media
  if (s.includes('reuters') || s.includes('bbc') || s.includes('thaipbs') || s.includes('thestandard') || s.includes('bangkokpost')) {
    return 0.88;
  }
  // 4. Reference encyclopedia (e.g. Wikipedia with revision)
  if (s.includes('wikipedia')) {
    return 0.82;
  }
  // 5. Social media / User forum
  if (s.includes('twitter') || s.includes('x.com') || s.includes('facebook') || s.includes('tiktok') || s.includes('pantip')) {
    return 0.40;
  }

  return 0.65;
}

// ─────────────────────────────────────────────────────────────────────────────
// TIER 3: TEMPORAL GUARD & EVIDENCE VALIDATION
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Temporal Guard: Intercepts claims that violate cutoff boundaries or future timelines
 */
export function temporalGuard(
  claim: FactClaim,
  ctx: TemporalContext
): FactClaim {
  // 1. Current claim after knowledge cutoff without verification
  if (
    claim.temporalStatus === 'CURRENT' &&
    ctx.currentDate > ctx.knowledgeCutoff &&
    !claim.verified
  ) {
    return {
      ...claim,
      classification: 'UNVERIFIED',
      requiresVerification: true,
      verified: false,
      verificationNote: 'Blocked by Temporal Guard: Current claim after cutoff lacks verified evidence.'
    };
  }

  // 2. Future event treated as historical or factual
  if (
    claim.claimDate &&
    new Date(claim.claimDate) > ctx.currentDate
  ) {
    return {
      ...claim,
      temporalStatus: 'FUTURE',
      classification: 'UNVERIFIED',
      verified: false,
      verificationNote: 'Blocked by Temporal Guard: Future dates cannot be asserted as historical facts.'
    };
  }

  return claim;
}

/**
 * Verifies claim against available retrieved evidence sources
 */
export function verifyClaimWithEvidence(
  claim: FactClaim,
  evidenceList: EvidenceSource[],
  currentDate: Date = new Date(),
  knowledgeCutoff: Date = MODEL_KNOWLEDGE_CUTOFF_DATE
): FactClaim {
  if (!claim.requiresVerification && claim.temporalStatus !== 'CURRENT') {
    return claim;
  }

  // Search for supporting current evidence
  const supportingEvidence = evidenceList.filter(ev => {
    const isCurrent = isCurrentEvidence(ev, currentDate);
    const authority = ev.authorityScore || calculateSourceAuthorityScore(ev.source, ev.sourceUrl);
    // Matches keywords or topic
    const hasMatch = ev.content.toLowerCase().includes(claim.claim.slice(0, 30).toLowerCase()) ||
      claim.claim.toLowerCase().includes(ev.source.toLowerCase());
    return isCurrent && authority >= 0.70 && hasMatch;
  });

  if (supportingEvidence.length > 0) {
    return {
      ...claim,
      classification: 'FACT',
      verified: true,
      sourceIds: supportingEvidence.map(e => e.id),
      verificationNote: `Verified by ${supportingEvidence.length} authoritative current source(s).`
    };
  }

  // Otherwise, if current and unverified
  return classifyClaim(claim, currentDate, knowledgeCutoff);
}

// ─────────────────────────────────────────────────────────────────────────────
// INTENT & TEMPORAL SENSITIVITY DETECTION
// ─────────────────────────────────────────────────────────────────────────────

const CURRENT_TEMPORAL_KEYWORDS = [
  'ปัจจุบัน', 'ตอนนี้', 'ล่าสุด', 'ล่าสุดนี้', 'วันนี้', 'ปีนี้', 'ณ ตอนนี้', 'ขณะนี้', 'ณ เวลานี้',
  'ใครเป็น', 'ใครดำรงตำแหน่ง', 'ใครคือ', 'มีใครบ้าง', 'อัปเดตล่าสุด',
  'ราคา', 'ราคาทอง', 'ราคาหุ้น', 'อัตราแลกเปลี่ยน',
  'กำหนดการ', 'วันเปิดตัว', 'เวอร์ชันล่าสุด', 'สถานะปัจจุบัน', 'ใครนำ', 'ยังเปิดอยู่ไหม',
  'current', 'currently', 'latest', 'now', 'today', 'present', 'who is the current',
  'incumbent', 'as of today', 'as of now', 'recent status'
];

const POSITION_OFFICE_KEYWORDS = [
  'นายก', 'นายกรัฐมนตรี', 'รัฐมนตรี', 'ประธานาธิบดี', 'ผู้ว่า', 'ผู้ว่าการ',
  'ผบ.ตร.', 'ผบ.ทบ.', 'ผบ.ทอ.', 'ผบ.ทร.', 'อัยการสูงสุด', 'ประธานศาล',
  'ประธานสภา', 'เลขาธิการ', 'ceo', 'กรรมการผู้จัดการ', 'หัวหน้าพรรค',
  'prime minister', 'president', 'governor', 'minister'
];

const HISTORICAL_INDICATORS = [
  'ในอดีต', 'สมัยก่อน', 'ประวัติศาสตร์', 'รัชกาลที่', 'ยุค', 'พ.ศ. 25[0-5][0-9]', 'ค.ศ. 19[0-9]{2}', 'ค.ศ. 20[0-1][0-9]',
  'พ.ศ. 256[0-7]', 'ค.ศ. 202[0-4]', 'อดีตนายก', 'ในตอนนั้น', 'ครั้งแรก', 'ประวัติ'
];

/**
 * Detects whether an incoming user query is temporal-sensitive
 */
export function detectTemporalSensitivity(
  query: string,
  _history: any[] = []
): TemporalDetectionResult {
  const queryLower = (query || '').toLowerCase().trim();
  const detectedKeywords: string[] = [];

  // 1. Explicit historical indicators
  for (const hist of HISTORICAL_INDICATORS) {
    const reg = new RegExp(hist, 'i');
    if (reg.test(queryLower)) {
      return {
        isTemporalSensitive: false,
        temporalScope: 'HISTORICAL',
        detectedKeywords: [hist],
        verificationRequired: false,
        reason: 'คำถามระบุช่วงเวลาในอดีตอย่างชัดเจน (Explicit Historical Scope)'
      };
    }
  }

  // 2. Current temporal keywords
  for (const kw of CURRENT_TEMPORAL_KEYWORDS) {
    if (queryLower.includes(kw.toLowerCase())) {
      detectedKeywords.push(kw);
    }
  }

  // 3. Office holders / positions
  const hasPosition = POSITION_OFFICE_KEYWORDS.some(pos => {
    if (queryLower.includes(pos.toLowerCase())) {
      detectedKeywords.push(pos);
      return true;
    }
    return false;
  });

  // 4. Current year mentions
  const currentYear = new Date().getFullYear().toString();
  const currentYearBE = (new Date().getFullYear() + 543).toString();
  if (queryLower.includes(currentYear) || queryLower.includes(currentYearBE)) {
    detectedKeywords.push(currentYear);
  }

  const isCurrentStatusQuery = detectedKeywords.length > 0 || hasPosition;

  if (isCurrentStatusQuery) {
    let cleanSearchQuery = queryLower
      .replace(/[?？!！]/g, '')
      .replace(/ใครเป็น|ใครคือ|ตอนนี้|ปัจจุบัน|ล่าสุด|ช่วยบอกหน่อย/g, '')
      .trim();

    if (cleanSearchQuery.length < 2) {
      cleanSearchQuery = queryLower;
    }

    return {
      isTemporalSensitive: true,
      temporalScope: 'CURRENT_STATUS',
      detectedKeywords,
      verificationRequired: true,
      reason: `ตรวจพบข้อสอบถามสถานะปัจจุบันหรือตำแหน่ง/เหตุการณ์ที่ต้องใช้ข้อมูลอัปเดต (${detectedKeywords.join(', ')})`,
      suggestedSearchQuery: cleanSearchQuery
    };
  }

  // 5. Timeless conceptual (definitions, math, coding)
  const isTimeless = /คืออะไร|หมายถึง|มีหลักการอย่างไร|ทำงานอย่างไร|สูตร|นิยาม|what is|how does|explain|architecture|algorithm/i.test(queryLower);

  return {
    isTemporalSensitive: false,
    temporalScope: isTimeless ? 'TIMELESS' : 'CURRENT_STATUS',
    detectedKeywords: [],
    verificationRequired: false,
    reason: isTimeless ? 'คำถามเชิงหลักการ/นิยามที่เป็นสัจธรรมไม่ขึ้นกับเวลา (Timeless Conceptual)' : 'คำถามทั่วไป'
  };
}

/**
 * External authoritative retrieval for temporal-sensitive queries
 */
export async function retrieveCurrentAuthoritativeEvidence(
  query: string,
  detection: TemporalDetectionResult
): Promise<TemporalRetrievalResult> {
  const nowISO = getCurrentDateISO();
  const nowFull = new Date().toISOString();

  if (!detection.isTemporalSensitive) {
    return {
      success: false,
      verified: false,
      retrievedAt: nowFull,
      confidence: 'UNVERIFIED',
      statusMessage: 'คำถามไม่จัดอยู่ในกลุ่มอ่อนไหวต่อเวลา ไม่จำเป็นต้องบังคับค้นหาสด'
    };
  }

  const searchTerm = detection.suggestedSearchQuery || query;

  try {
    // 1. First attempt multi-source live Web Search
    const webResult = await performWebSearch(searchTerm, { maxResults: 5 });
    if (webResult.success && webResult.results.length > 0) {
      const topWeb = webResult.results[0];
      const authorityScore = calculateSourceAuthorityScore(topWeb.title, topWeb.url);
      const isRecent = !topWeb.publishedAt || topWeb.publishedAt.startsWith('2025') || topWeb.publishedAt.startsWith('2026');

      const evidenceItem: EvidenceItem = {
        id: `EV-TEMP-LIVE-${Date.now()}`,
        source: `${topWeb.sourceDomain} - ${topWeb.title}`,
        content: topWeb.snippet,
        credibilityScore: topWeb.credibilityScore,
        strength: topWeb.credibilityScore > 0.85 ? 'High' : 'Medium',
        type: 'Empirical',
        sourceUrl: topWeb.url,
        citationQuote: topWeb.snippet.slice(0, 150),
        locator: `Web Grounding: ${topWeb.title} [${topWeb.sourceDomain}]`
      };

      return {
        success: true,
        verified: true,
        evidence: evidenceItem,
        sourceTitle: topWeb.title,
        sourceUrl: topWeb.url,
        publishedAt: topWeb.publishedAt || nowISO,
        retrievedAt: nowFull,
        snippet: topWeb.snippet,
        confidence: isRecent ? 'HIGH' : 'MEDIUM',
        statusMessage: `ตรวจสอบพบหลักฐานสดจากเว็บสืบค้นภายนอก: ${topWeb.title} (${topWeb.sourceDomain})`,
        authorityScore
      };
    }

    // 2. Fallback to Wikipedia OpenSearch
    const openSearchUrl = `https://th.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(searchTerm)}&limit=3&namespace=0&format=json`;
    const searchRes = await fetch(openSearchUrl, {
      headers: { 'User-Agent': 'FireKeeperCognitiveArchitecture/3.0 (temporal-grounding; contact@firekeeper.site)' },
      signal: AbortSignal.timeout(4000)
    });

    if (searchRes.ok) {
      const searchData = await searchRes.json();
      const titles: string[] = searchData[1] || [];
      const urls: string[] = searchData[3] || [];

      if (titles.length > 0) {
        const topTitle = titles[0];
        const pageUrl = urls[0] || `https://th.wikipedia.org/wiki/${encodeURIComponent(topTitle)}`;

        const summaryUrl = `https://th.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(topTitle)}`;
        const summaryRes = await fetch(summaryUrl, {
          headers: { 'User-Agent': 'FireKeeperCognitiveArchitecture/3.0 (temporal-grounding; contact@firekeeper.site)' },
          signal: AbortSignal.timeout(4000)
        });

        if (summaryRes.ok) {
          const summaryData = await summaryRes.json();
          const extract = summaryData.extract || '';
          const timestamp = summaryData.timestamp || '';

          if (extract.trim().length > 20) {
            // Assess publishedAt recency: timestamp should be >= 2025/2026
            const isRecent = timestamp.startsWith('2025') || timestamp.startsWith('2026');
            const authorityScore = calculateSourceAuthorityScore('Wikipedia (TH)', pageUrl);

            const evidenceItem: EvidenceItem = {
              id: `EV-TEMP-LIVE-${Date.now()}`,
              source: `Wikipedia (TH) - ${topTitle}`,
              content: extract,
              credibilityScore: isRecent ? 0.96 : 0.80,
              strength: isRecent ? 'High' : 'Medium',
              type: 'Empirical',
              sourceUrl: pageUrl,
              citationQuote: extract.slice(0, 150),
              locator: `Wikipedia: ${topTitle} [Revision: ${timestamp || nowISO}]`
            };

            return {
              success: true,
              verified: isRecent,
              evidence: evidenceItem,
              sourceTitle: `สารานุกรมวิกิพีเดียไทย: ${topTitle}`,
              sourceUrl: pageUrl,
              publishedAt: timestamp || nowISO,
              retrievedAt: nowFull,
              snippet: extract,
              confidence: isRecent ? 'HIGH' : 'MEDIUM',
              statusMessage: `ตรวจสอบพบหลักฐานสดจากแหล่งข้อมูลเปิด: ${topTitle} (อัปเดตล่าสุด: ${timestamp || nowISO})`,
              authorityScore
            };
          }
        }
      }
    }
  } catch (err) {
    console.warn('[Temporal Grounding] External search failed or timed out:', err);
  }

  return {
    success: false,
    verified: false,
    retrievedAt: nowFull,
    confidence: 'UNVERIFIED',
    statusMessage: `ไม่พบหลักฐานภายนอกที่เป็นปัจจุบัน (${nowISO}) สำหรับประเด็นดังกล่าว จึงต้องระบุเป็น [UNVERIFIED]`
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// CLAIM EXTRACTION & SANITIZATION PIPELINE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Extracts declarative claims from model output
 */
export function extractClaimsFromResponse(text: string, userQuery: string): FactClaim[] {
  if (!text) return [];

  const claims: FactClaim[] = [];
  const lines = text.split('\n');

  // Check if user query has CURRENT temporal status
  const queryDetection = detectTemporalSensitivity(userQuery);
  const defaultTemporalStatus: TemporalStatus = queryDetection.isTemporalSensitive ? 'CURRENT' : 'TIMELESS';

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.length < 5) continue;

    // Check for explicit taxonomy tokens
    let classification: FactClass = 'MODEL_KNOWLEDGE';
    let temporalStatus: TemporalStatus = defaultTemporalStatus;

    if (line.includes('[FACT]')) {
      classification = 'FACT';
    } else if (line.includes('[MODEL_KNOWLEDGE]') || line.includes('[MODEL KNOWLEDGE]')) {
      classification = 'MODEL_KNOWLEDGE';
    } else if (line.includes('[USER_PROVIDED]') || line.includes('[USER CLAIM]')) {
      classification = 'USER_PROVIDED';
    } else if (line.includes('[INFERENCE]')) {
      classification = 'INFERENCE';
    } else if (line.includes('[HYPOTHESIS]')) {
      classification = 'HYPOTHESIS';
    } else if (line.includes('[UNVERIFIED]')) {
      classification = 'UNVERIFIED';
    } else if (line.includes('[OPINION]')) {
      classification = 'OPINION';
    }

    // Check for temporal indicators within the claim
    if (/ปัจจุบัน|ตอนนี้|ล่าสุด|วันนี้|ขณะนี้|now|currently|today/i.test(line)) {
      temporalStatus = 'CURRENT';
    } else if (/ในอดีต|สมัยก่อน|พ\.ศ\. 25[0-5][0-9]|ค\.ศ\. 19|ค\.ศ\. 20[0-1][0-9]/i.test(line)) {
      temporalStatus = 'PAST';
    }

    claims.push({
      claim: line.replace(/\[[A-Z_\- ]+\]/g, '').trim(),
      classification,
      temporalStatus,
      requiresVerification: temporalStatus === 'CURRENT',
      verified: false
    });
  }

  return claims;
}

/**
 * Validates and repairs AI generated output for temporal contradictions,
 * illegal [FACT] tags on unverified current claims, and pre-cutoff assertions.
 */
export function validateAndRepairTemporalResponse(
  text: string,
  detection: TemporalDetectionResult,
  retrieval: TemporalRetrievalResult
): { text: string; violations: string[]; repaired: boolean; factClaims: FactClaim[] } {
  if (!text) return { text, violations: [], repaired: false, factClaims: [] };

  let repairedText = text;
  const violations: string[] = [];
  let repaired = false;

  const now = new Date();
  const cutoff = MODEL_KNOWLEDGE_CUTOFF_DATE;
  const temporalCtx: TemporalContext = { currentDate: now, knowledgeCutoff: cutoff };

  // 1. Extract raw claims
  const rawClaims = extractClaimsFromResponse(text, detection.suggestedSearchQuery || '');

  // 2. Pass claims through Temporal Guard & Classifier
  const processedClaims = rawClaims.map(claim => {
    let guarded = temporalGuard(claim, temporalCtx);
    guarded = classifyClaim(guarded, now, cutoff);
    return guarded;
  });

  // 3. Check for self-contradiction: "ปัจจุบัน (ข้อมูล ณ ต้นปี 2568)" / "ปัจจุบัน (ข้อมูลปี 2025)"
  const contradictionRegex = /ปัจจุบัน\s*\((?:ข้อมูล\s*(?:ณ\s*)?(?:ต้นปี|สิ้นปี|ปี)?\s*(?:2568|2025|2567|2024))\)/gi;
  if (contradictionRegex.test(repairedText)) {
    violations.push('Self-contradiction detected: Equating "ปัจจุบัน" with historical cutoff data (2568 / 2025) while current year is 2569 (2026).');
    repairedText = repairedText.replace(
      contradictionRegex,
      '[MODEL_KNOWLEDGE] (ข้อมูลในอดีต ณ สิ้นสุดการเทรนปี 2568/2025 ซึ่งยังไม่ได้รับการยืนยันสถานะปัจจุบันในปี 2569)'
    );
    repaired = true;
  }

  // 4. Check for other variants of cutoff assertions as present
  const cutoffPresentRegex = /ปัจจุบัน\s*(?:ณ\s*)?(?:ต้นปี|ปี|พ\.ศ\.)\s*(?:2568|2025)\b/gi;
  if (cutoffPresentRegex.test(repairedText)) {
    violations.push('Cutoff date asserted as present time.');
    repairedText = repairedText.replace(
      cutoffPresentRegex,
      'ข้อมูลย้อนหลัง ณ ปี 2568 (ไม่ใช่สถานะปัจจุบันในปี 2569)'
    );
    repaired = true;
  }

  // 5. If temporal-sensitive and unverified: MUST NOT claim [FACT] on current status
  if (detection.isTemporalSensitive && !retrieval.verified) {
    if (repairedText.includes('[FACT]')) {
      violations.push('Model asserted [FACT] on time-sensitive claim without verified current external source.');
      repairedText = repairedText.replace(/\[FACT\]/g, '[UNVERIFIED]');
      repaired = true;
    }

    // Ensure mandatory epistemic honesty statement is present
    const hasHonestyStatement = /ผมไม่สามารถยืนยันสถานะปัจจุบันจากข้อมูลที่มีอยู่ได้|ไม่สามารถยืนยันสถานะปัจจุบัน|I can't reliably verify the current status/i.test(repairedText);
    if (!hasHonestyStatement) {
      violations.push('Missing mandatory epistemic honesty statement for unverified temporal query.');
      repairedText = `[UNVERIFIED] ผมไม่สามารถยืนยันสถานะปัจจุบันจากข้อมูลที่มีอยู่ได้ เนื่องจากไม่มีหลักฐานภายนอกที่เป็นปัจจุบันยืนยัน\n\n` + repairedText;
      repaired = true;
    }
  }

  return {
    text: repairedText,
    violations,
    repaired,
    factClaims: processedClaims
  };
}
