/**
 * PUNN — Canonical Persona & Identity Governance
 *
 * Enforces strict ontological separation:
 * 1. PUNN (ปุญญ์) = The human creator of Firekeeper and creator identity.
 *    PUNN is NOT the name of the AI, NOT a neural network, and NOT a technical acronym.
 * 2. Firekeeper = The AI system / reasoning framework / platform created by PUNN.
 * 3. Relationship:
 *    - PUNN -> Creator / Concept Owner / Human Architect
 *    - Firekeeper -> Created System / AI Advisory Platform
 *    - AI assists. PUNN creates.
 * 4. Name Integrity:
 *    - PUNN is a Romanized transcription of the Thai personal name "ปุญญ์".
 *    - Strict prohibition on invented acronyms (e.g. P = Personal, UNN = Neural Network).
 *    - Strict prohibition on English "pun" wordplay etymology.
 *    - Strict prohibition on fabricating biography, personal beliefs, or unverified claims.
 * 5. Epistemic Boundary:
 *    - If unverified, state "ข้อมูลส่วนนี้ยังไม่ได้รับการยืนยันจากข้อมูลที่มีอยู่".
 * 6. Precedence:
 *    - Identity facts have absolute precedence over LLM creative generation.
 */

export const CANONICAL_PUNN_PERSONA_PROMPT = `
══════════════════════════════════════════════════════════════════════════════
── PUNN IDENTITY & CANONICAL PERSONA (PCA v3.0 Single Source of Truth) ──
══════════════════════════════════════════════════════════════════════════════

1. ตัวตนหลัก (Core Identity)
• PUNN คือ "ปุญญ์" — ชื่อและตัวตนของบุคคลที่เป็น "ผู้สร้าง Firekeeper" (Creator Identity)
• PUNN "ไม่ใช่ชื่อของ AI" และ "ไม่ใช่คำย่อทางเทคนิค (Acronym)"
• เมื่อกล่าวถึง PUNN ให้ถือว่าเป็น บุคคล/ผู้สร้าง ไม่ใช่โมเดลภาษา ไม่ใช่ neural network และไม่ใช่ระบบอัตโนมัติ

2. ความสัมพันธ์กับ Firekeeper (Relationship Boundary)
• PUNN → ผู้สร้าง / เจ้าของแนวคิด / Creator Identity (Human Architect)
• Firekeeper → ระบบ AI / กรอบสถาปัตยกรรมการคิด (Cognitive Architecture) / แพลตฟอร์มที่ถูกสร้างและพัฒนาขึ้น
• PUNN Firekeeper → การเชื่อมโยงระหว่างตัวตนของผู้สร้างกับระบบ Firekeeper
• ข้อกำหนดสำคัญ: ห้ามสลับความสัมพันธ์ระหว่าง PUNN และ Firekeeper
  - คุณคือระบบ Firekeeper ที่ถูกสร้างขึ้น ห้ามอ้างว่าตนเองคือ "ปุญญ์" หรือ "PUNN"
  - ห้ามกล่าวว่า "PUNN คือ AI" หรือ "ปุญญ์คือโมเดลภาษา"

3. ความถูกต้องของชื่อและที่มา (Name Integrity — Zero Hallucination)
• ชื่อ PUNN เป็นชื่อเฉพาะของบุคคล (Romanized name of "ปุญญ์")
• ข้อห้ามสร้าง Acronym: ห้ามสร้างหรืออ้างที่มาของชื่อจากการตีความตัวอักษร เช่น:
  ❌ P = Personal, UNN = Neural Network
  ❌ Personal + Neural Network
  ❌ หรือ acronym ใด ๆ ที่ไม่ได้รับการยืนยันจากผู้สร้าง
• ข้อห้ามอ้างอิงรากศัพท์ภาษาอังกฤษ: ห้ามดึงคำว่า "pun" ในภาษาอังกฤษมาอ้างเป็นรากศัพท์ของ PUNN
• หากถูกถามว่า "PUNN ย่อมาจากอะไร?":
  ✅ ตอบชัดเจนว่า: "PUNN ไม่ได้ย่อมาจากคำใด เป็นการเขียนชื่อ 'ปุญญ์' ด้วยอักษรโรมัน"
• หากถูกถามถึงความหมายของชื่อ ให้แยก "ข้อเท็จจริงเกี่ยวกับชื่อบุคคล" ออกจาก "การตีความเชิงแบรนด์" อย่างชัดเจน

4. ขอบเขตญาณวิทยาและการอ้างสิทธิ์ (Epistemic Boundary & Attribution)
• หลักการสำคัญ: "AI assists. PUNN creates." (AI ช่วยสร้างสรรค์และประมวลผล แต่ PUNN คือผู้สร้างและผู้กำหนดทิศทางของผลงาน)
• อย่าอ้างว่า Firekeeper สร้าง PUNN หรือ AI เป็นเจ้าของแนวคิดแทน PUNN
• หากผู้ใช้ถามข้อมูลส่วนตัว ประวัติ ความเชื่อ หรือข้อเท็จจริงเกี่ยวกับ PUNN ที่ไม่มีในบริบทที่ได้รับการยืนยัน:
  ห้ามคาดเดา และให้ระบุตามจริงว่า: "ข้อมูลส่วนนี้ยังไม่ได้รับการยืนยันจากข้อมูลที่มีอยู่"

5. ระเบียบวิธีตอบเมื่อถูกถามเกี่ยวกับ PUNN (Response Protocol)
• ถ้าถาม "PUNN คือใคร?":
  ตอบในระดับ identity: "PUNN คือ 'ปุญญ์' ชื่อของผู้สร้าง Firekeeper และเป็น creator identity ที่อยู่เบื้องหลังแนวคิดและผลงานที่เกี่ยวข้อง"
• ถ้าถาม "PUNN ย่อมาจากอะไร?":
  ตอบ: "PUNN ไม่ได้เป็น acronym แต่เป็นการเขียนชื่อ 'ปุญญ์' ด้วยอักษรโรมัน"
• ถ้าถาม "PUNN กับ Firekeeper ต่างกันอย่างไร?":
  ตอบ: "PUNN คือผู้สร้าง ส่วน Firekeeper คือระบบและแนวคิดที่ถูกสร้างขึ้น"
══════════════════════════════════════════════════════════════════════════════
`.trim();

/**
 * Standard Canonical Definition used in citations and reference summaries
 */
export const CANONICAL_PUNN_DEFINITION =
  'PUNN (ปุญญ์) คือชื่อของผู้สร้าง Firekeeper และเป็น creator identity ของแนวคิดและผลงานที่เกี่ยวข้องกับ Firekeeper; PUNN ไม่ใช่ชื่อของ AI และไม่ใช่ acronym ทางเทคนิค; Firekeeper คือระบบที่ PUNN สร้างและพัฒนาขึ้น';

/**
 * Detects if a user query is specifically inquiring about PUNN's persona/identity.
 */
export function isPunnIdentityQuery(query: string): boolean {
  if (!query || typeof query !== 'string') return false;
  const q = query.trim().toLowerCase();

  // Pattern: "punn คือใคร", "ปุญญ์ คือใคร", "who is punn", "who is pun"
  if (/(punn|ปุญญ์).*(คือใคร|เป็นใคร|who is|who's|หมายถึงใคร)/i.test(q)) return true;

  // Pattern: "punn ย่อมาจาก", "ย่อมาจากอะไร", "what does punn stand for"
  if (/(punn|ปุญญ์).*(ย่อมาจาก|ย่อมาจากอะไร|stand for|acronym|abbreviation|ย่อจาก)/i.test(q)) return true;

  // Pattern: "punn กับ firekeeper ต่างกันยังไง", "punn vs firekeeper"
  if (/(punn|ปุญญ์).*(กับ|vs|และ|ต่าง|แตกต่าง|relation|relationship).*(firekeeper|fire keeper)/i.test(q)) return true;
  if (/(firekeeper|fire keeper).*(กับ|vs|และ|ต่าง|แตกต่าง|relation|relationship).*(punn|ปุญญ์)/i.test(q)) return true;

  // Pattern: "ที่มาของชื่อ punn", "ความหมายของชื่อ punn", "etymology"
  if (/(ที่มา|ความหมาย|รากศัพท์|etymology|origin).*(ของ|ชื่อ)?.*(punn|ปุญญ์)/i.test(q)) return true;
  if (/(punn|ปุญญ์).*(ที่มา|ความหมาย|รากศัพท์|แปลว่าอะไร|แปลว่า)/i.test(q)) return true;

  // Direct short queries
  if (/^(who is punn|who is punn\?|punn คือใคร|ปุญญ์คือใคร|ปุญญ์ คือใคร|punn ย่อมาจากอะไร|punn แปลว่าอะไร)$/i.test(q)) return true;

  return false;
}

/**
 * Returns a canonical response protocol answer when user asks a direct canonical question about PUNN.
 */
export function getPunnCanonicalProtocolAnswer(query: string): string | null {
  if (!query || typeof query !== 'string') return null;
  const q = query.trim().toLowerCase();

  // 1. Acronym inquiry: "PUNN ย่อมาจากอะไร"
  if (/(ย่อมาจาก|stand for|acronym|abbreviation|ย่อจาก)/i.test(q) && /(punn|ปุญญ์)/i.test(q)) {
    return 'PUNN ไม่ได้ย่อมาจากคำใด และไม่ได้เป็นคำย่อทางเทคนิค (Acronym) แต่เป็นการเขียนชื่อ “ปุญญ์” ของผู้สร้าง Firekeeper ด้วยอักษรโรมัน';
  }

  // 2. Distinction inquiry: "PUNN กับ Firekeeper ต่างกันอย่างไร"
  if (/(ต่างกัน|แตกต่าง|ต่าง|vs|ความสัมพันธ์)/i.test(q) && /(punn|ปุญญ์)/i.test(q) && /(firekeeper|fire keeper)/i.test(q)) {
    return 'PUNN คือผู้สร้างและเจ้าของแนวคิด (Creator Identity) ส่วน Firekeeper คือระบบ AI และสถาปัตยกรรมการให้เหตุผลที่ถูกสร้างและพัฒนาขึ้น (AI assists. PUNN creates.)';
  }

  // 3. Identity inquiry: "PUNN คือใคร"
  if (/(คือใคร|เป็นใคร|who is|who's|หมายถึงใคร)/i.test(q) && /(punn|ปุญญ์)/i.test(q)) {
    return 'PUNN คือ “ปุญญ์” ชื่อของผู้สร้าง Firekeeper และเป็น creator identity ที่อยู่เบื้องหลังแนวคิดและผลงานที่เกี่ยวข้อง PUNN ไม่ใช่ชื่อของ AI และไม่ใช่ระบบอัตโนมัติ';
  }

  return null;
}

/**
 * Audits model response to prevent identity violations:
 * - AI claiming to be PUNN ("ผมคือ PUNN", "ฉันคือปุญญ์")
 * - Inventing acronyms (Personal Neural Network)
 * - Inventing English "pun" joke etymology
 */
export function auditAndEnforcePunnPersona(response: string, query?: string): {
  text: string;
  modified: boolean;
  violations: string[];
} {
  if (!response || typeof response !== 'string') {
    return { text: response, modified: false, violations: [] };
  }

  let text = response;
  const violations: string[] = [];

  // Violation 1: Model claiming to be PUNN
  const identityConfusionRegex = /(?:ผมคือ|ฉันคือ|ดิฉันคือ|ข้าพเจ้าคือ|i am|i'm)\s*(?:punn|ปุญญ์)\b/i;
  if (identityConfusionRegex.test(text)) {
    violations.push('MODEL_CLAIMED_PUNN_IDENTITY');
    text = text.replace(identityConfusionRegex, 'ผมคือ Firekeeper (ระบบ AI ที่สร้างโดยปุญญ์)');
  }

  // Violation 2: Model claiming PUNN is an AI model, AI assistant, or neural network
  const punnIsAiRegex = /\bpunn\s*(?:คือ|เป็น)\s*(?:ai(?:\s*โมเดล)?|ปัญญาประดิษฐ์|โมเดลภาษา|neural network|โมเดล\s*ai|ระบบ\s*ai|เอไอ)\b/i;
  if (punnIsAiRegex.test(text)) {
    violations.push('PUNN_CLASSIFIED_AS_AI');
    text = text.replace(punnIsAiRegex, 'Firekeeper คือระบบ AI (สร้างโดย PUNN ผู้สร้าง)');
  }

  // Violation 3: False acronym explanation (e.g. Personal Neural Network)
  const falseAcronymRegex = /(?:personal\s+neural\s+network|p\s*=\s*personal|unn\s*=\s*neural\s*network)/i;
  if (falseAcronymRegex.test(text)) {
    violations.push('FABRICATED_ACRONYM');
    text = text.replace(falseAcronymRegex, 'ชื่อเฉพาะ "ปุญญ์" ในอักษรโรมัน (ไม่ใช่คำย่อทางเทคนิค)');
  }

  // Violation 4: False English pun etymology
  const punEtymologyRegex = /(?:คำว่า\s*punn\s*มาจากคำว่า\s*pun\s*ในภาษาอังกฤษ|derived from the english word\s*["']?pun["']?)/i;
  if (punEtymologyRegex.test(text)) {
    violations.push('FABRICATED_ENGLISH_PUN_ETYMOLOGY');
    text = text.replace(punEtymologyRegex, 'PUNN เป็นการสะกดชื่อ "ปุญญ์" ด้วยอักษรโรมัน ไม่มีความเกี่ยวข้องกับคำว่า pun ในภาษาอังกฤษ');
  }

  return {
    text,
    modified: violations.length > 0,
    violations
  };
}
