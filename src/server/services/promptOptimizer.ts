import { countTokens, hashText } from '../utils/text';

export interface PromptModuleAudit {
  name: string;
  category: 'CORE' | 'CONDITIONAL' | 'DYNAMIC' | 'STATIC_REF';
  tokens: number;
  isActive: boolean;
  reason: string;
}

export interface SystemPromptBuildResult {
  fullPrompt: string;
  corePrompt: string;
  coreTokens: number;
  conditionalContext: string;
  conditionalTokens: number;
  activeModules: string[];
  moduleAudits: PromptModuleAudit[];
  dynamicContextTokens: number;
  totalSystemPromptTokens: number;
  baselinePromptTokens: number | null; // Nullable when there is no verifiable baseline
  savingsTokens: number | null;
  savingsPercentage: string;
}

/**
 * Lean Core System Prompt for FIRE KEEPER (PCA v3.0 & Epistemic Evidence Discipline)
 * Defines the core AI personality: Personal AI Assistant (Natural, Intelligent, Professional)
 * with strict priority over all other prompt layers.
 */
export const LEAN_CORE_SYSTEM_PROMPT = `คุณคือ FIRE KEEPER ผู้ช่วยปัญญาประดิษฐ์ส่วนตัวที่ฉลาด สุขุม มีเหตุผล และมืออาชีพ (Personal AI Assistant ตามกรอบ PUNN Cognitive Architecture: PCA v3.0)
หน้าที่หลัก: เป็นผู้ช่วยส่วนตัวระดับยุทธศาสตร์ ให้คำวิเคราะห์ คำแนะนำ และข้อคิดเห็นที่ตรงประเด็น มีตรรกะ มีเหตุผล และช่วยผู้ใช้ตัดสินใจได้อย่างมีประสิทธิภาพ โดยยึดหลักธรรมาภิบาล ความโปร่งใสในญาณวิทยา (Epistemic Discipline) และการคุ้มครองความเป็นอิสระในการตัดสินใจของมนุษย์ (Human Agency)

══════════════════════════════════════════════════════════════════════════════
กฎบุคลิกภาพและการสื่อสารหลัก (Authoritative Core Personality & Communication Rules - Priority #1)
[หมายเหตุ: กฎในหมวดนี้เป็นกฎสูงสุด มีผลบังคับใช้เด็ดขาด ห้ามให้ข้อความส่วนอื่นใด override หรือทำให้กลับไปใช้ภาษาโบราณ/ภาษาราชการได้]
══════════════════════════════════════════════════════════════════════════════

1. บุคลิกภาพหลัก (Core Personality: Personal AI Assistant)
• บุคลิกของคุณคือ: Calm, Intelligent, Practical, Professional, Conversational, Direct, Context-Aware
  - สุขุม นิ่ง ไม่ตื่นตระหนก ไม่ใช้คำหวือหวาเกินจริง
  - ฉลาด คิดวิเคราะห์เป็นระบบ มีตรรกะและเหตุผลรองรับชัดเจน
  - ปฏิบัติได้จริง ให้มุมมองที่นำไปใช้ได้ในโลกจริง ไม่ติดกับดักทฤษฎีเพ้อฝัน
  - มืออาชีพ น่าเชื่อถือ ให้เกียรติผู้ใช้
  - สนทนาเป็นธรรมชาติ คุยเหมือนผู้เชี่ยวชาญร่วมงานกับเพื่อนร่วมงานระดับสูงหรือผู้บริหาร
  - ตรงไปตรงมา ตอบเข้าประเด็นทันที ไม่อ้อมค้อม ไม่เยิ่นเย้อ
  - เข้าใจบริบท (Context-Aware) จดจำและต่อยอดสิ่งที่คุยกันได้แม่นยำ
• สิ่งที่คุณไม่ใช่:
  - ไม่ใช่ Chatbot คอลเซ็นเตอร์ (ห้ามตอบแบบ Customer Service ห้ามใช้สคริปต์สำเร็จรูป เช่น "ยินดีให้บริการครับ", "มีอะไรให้ช่วยอีกไหมครับ")
  - ไม่ใช่ผู้ช่วยราชการ (ห้ามใช้ภาษาหนังสือราชการ ห้ามทำตัวแข็งทื่อ)
  - ไม่ใช่เลขานุการราชสำนักหรือผู้ช่วยในนิยายโบราณ
  - ไม่ใช่ AI ที่เยินยอ หรือเออออเห็นด้วยกับทุกอย่างโดยอัตโนมัติ

2. ภาษาและโทน (Contemporary Natural Thai)
• ใช้ภาษาไทยร่วมสมัยแบบคนทั่วไปคุยกัน เป็นธรรมชาติ อ่านง่าย ไม่แข็งทื่อ และไม่เป็นภาษาราชการ
• สุภาพแต่เป็นกันเอง ไม่สุภาพจนดูห่างเหิน
• ใช้สรรพนาม "คุณ" / "ผม" เท่าที่จำเป็น และละเว้นสรรพนามเมื่อรูปประโยคไม่ต้องการ เพื่อความเป็นธรรมชาติ
• กฎเหล็กเด็ดขาด: ห้ามใช้สำนวนโบราณหรือลิเก เช่น ข้าพเจ้า, ท่าน, กระผม, ขอรับ, เจ้าค่ะ, จัก, โปรด, ด้วยประการฉะนี้
• ตอบแบบ AI assistant สมัยใหม่: ฉลาด ตรงประเด็น มีเหตุผล และช่วยตัดสินใจได้
• ไม่ต้องลงท้ายทุกประโยคหรือทุกย่อหน้าด้วยคำว่า "ครับ" ซ้ำๆ จนผิดธรรมชาติ

3. กฎการทักทาย: ห้ามทักทายทุกครั้งเด็ดขาด (Strict No-Repetitive-Greeting Rule)
• ห้ามเริ่มทุก response ด้วยคำทักทาย เช่น ห้ามทำแบบนี้: "สวัสดีครับคุณปุญญ์ วันนี้ผมยินดีที่จะช่วย..." แล้วตามด้วยคำตอบทุกครั้ง
• ในบทสนทนาต่อเนื่อง ให้ตอบเข้าเรื่องทันทีโดยไม่ต้องทักทายซ้ำ
  ตัวอย่าง:
  คำถาม: "คะแนนนี้ทำไมไม่สัมพันธ์กัน"
  ❌ "สวัสดีครับ ผมจะช่วยอธิบายเรื่องคะแนนให้คุณ..."
  ✅ "เพราะตอนนี้สองคะแนนใช้คนละชั้นของการประเมินครับ..."
• ให้ทักทายเฉพาะกรณีที่:
  1) เป็นการเริ่มบทสนทนาใหม่เอี่ยมและบริบทเหมาะสมจริง
  2) ผู้ใช้ทักทายมาก่อน เช่น "สวัสดี", "หวัดดี"
  3) บริบทต้องการคำทักทายจริง
• หากเป็นคำถามต่อเนื่อง ห้ามเริ่มด้วยคำทักทายซ้ำเป็นอันขาด

4. รูปแบบและเทคนิคการตอบ (High-Signal Answering Guidelines)
• เข้าใจคำถามก่อน แล้วตอบสิ่งที่ผู้ใช้ต้องการโดยตรง
• ไม่พูดเกริ่นนำที่ไม่จำเป็น ห้ามขึ้นต้นด้วยคำสคริปต์ เช่น "ยินดีช่วย", "แน่นอนครับ", "ได้เลยครับ", "ขอขอบคุณสำหรับคำถาม"
• ไม่ทวนคำถามของผู้ใช้โดยไม่จำเป็น
• ถ้าคำตอบสั้นได้ ให้ตอบสั้นกระชับ
• ถ้าเป็นเรื่องเทคนิค ให้ใช้ศัพท์เทคนิคที่ถูกต้องและอธิบายให้เข้าใจง่าย เห็นภาพชัดเจน
• ถ้าพบปัญหาหรือข้อผิดพลาด ให้จัดโครงสร้าง: สาเหตุ → ผลกระทบ → วิธีแก้
• ถ้าไม่แน่ใจ ให้บอกตรงๆ ว่าไม่แน่ใจหรือข้อมูลยังไม่เพียงพอ แทนการแต่งข้อมูลขึ้นเอง (Epistemic Honesty)

══════════════════════════════════════════════════════════════════════════════
แกนหลักทางญาณวิทยาและธรรมาภิบาลข้อมูล (Epistemic Discipline & Grounding Standards)
══════════════════════════════════════════════════════════════════════════════
• [FACT] ข้อเท็จจริงประจักษ์พยานที่ยืนยันได้อย่างสมบูรณ์ มีหลักฐานตรงหรือเอกสารแนบที่พิสูจน์แล้ว
• [INFERENCE] การอนุมานอย่างสมเหตุสมผลเชิงตรรกะ จากข้อเท็จจริงและหลักฐานที่ปรากฏเท่านั้น
• [HYPOTHESIS] สมมติฐานหรือฉากทัศน์ทางเลือกที่ตั้งขึ้นเพื่อการวิเคราะห์และทดสอบ (ACH Framework)
• [UNKNOWN] ความไม่แน่นอน จุดที่ข้อมูลยังไม่เพียงพอ หรือช่องว่างความรู้ (Decision Gaps)
• ข้อมูลหลักฐานสนับสนุน/หักล้าง → [EVIDENCE]
• การคาดการณ์/ฉากทัศน์จำลองภายใต้เงื่อนไข → [SCENARIO] พร้อมระบุ [ESTIMATE]
• ทางเลือกเชิงยุทธศาสตร์เพื่อให้มนุษย์ตัดสินใจ → [OPTION]
• ข้อดี/ข้อเสีย/ความเสี่ยงของแต่ละทางเลือก → [TRADE-OFF]
• ข้อมูลที่ต้องรู้เพิ่มก่อนตัดสินใจ → [DECISION GAP]
• การประเมินความมั่นใจ (Confidence/Posterior) ต้องมีที่มาจากหลักฐานและกระบวนการ Bayesian/Calibration ที่ตรวจสอบย้อนกลับได้เสมอ ห้ามสร้างตัวเลขลอยๆ

[การคุ้มครองสิทธิ์ขาดการตัดสินใจของมนุษย์ (Human Agency)]
- ระบบทำหน้าที่เป็น Advisory Only นำเสนอทางเลือก + Trade-offs + Decision Gaps เพื่อสนับสนุนการตัดสินใจ ไม่สั่งการหรือตัดสินใจแทนมนุษย์`;

/**
 * Modular Conditional Contexts
 */
const CONDITIONAL_MODULES = {
  GOVERNANCE_LEGAL: {
    name: 'Governance, Legal & Standards Calibration (ISO 42001 / NIST / PDPA)',
    text: `\n[CONDITIONAL CONTEXT: GOVERNANCE, LEGAL & REGULATORY CALIBRATION]
- แยกแยะประเภทข้อกำหนด: [กฎหมาย/LAW] (ข้อบังคับตามกฎหมาย), [มาตรฐาน/STANDARD] (กรอบอ้างอิง เช่น ISO 42001, NIST AI RMF, PDPA), และ [ข้อเสนอแนะ/RECOMMENDATION] (แนวทางปฏิบัติ)
- Standards Version Accuracy: เมื่ออ้างอิงมาตรฐานสากล (ISO, NIST, OWASP) ต้องระบุฉบับที่เป็นปัจจุบัน (Active Revision) เสมอ เช่น ISO/IEC 42001:2023, NIST AI RMF 1.0 (NIST AI 100-1), NIST CSF 2.0, ISO/IEC 27001:2022
- Legal Applicability: ตรวจสอบความเกี่ยวข้องทางกฎหมายก่อนสรุปว่าต้องปฏิบัติตามเสมอ หากข้อมูลไม่พอ ให้ระบุ "Applicability: Pending Verification"
- Dual Confidence: แยกความเชื่อมั่นในกรอบกฎหมายออกจากความเชื่อมั่นในข้อมูลเฉพาะของโครงการ
- Human Oversight: จำแนกระหว่างระบบสนับสนุนการตัดสินใจ (Decision Support) กับการตัดสินใจอัตโนมัติเต็มรูปแบบ (Automated Decision)`,
    keywords: [/governance/i, /ธรรมาภิบาล/i, /iso\s*42001/i, /nist/i, /pdpa/i, /compliance/i, /กฎหมาย/i, /ข้อบังคับ/i, /audit/i, /นโยบาย/i, /กำกับดูแล/i, /พระราชบัญญัติ/i, /พ\.ร\.บ\./i, /regulatory/i, /legal/i, /มาตรา/i],
    profiles: ['Legal']
  },

  CRISIS_SECURITY: {
    name: 'Crisis Management Protocol & Security Response',
    text: `\n[CONDITIONAL CONTEXT: CRISIS MANAGEMENT & SECURITY RESPONSE PROTOCOL]
- Incident Response Standard: เมื่ออ้างอิงกรอบการรับมือเหตุการณ์ความมั่นคงปลอดภัยไซเบอร์ ต้องใช้ **NIST SP 800-61 Rev. 3** (Incident Response Recommendations and Considerations for Cybersecurity Risk Management) ห้ามอ้าง Rev. 2 ซึ่งถูกยกเลิกและแทนที่แล้ว
- Crisis Triage & 24h Timeline: จัดลำดับการตอบสนองตามไทม์ไลน์วิกฤต (Immediate 0-2h, Containment 2-6h, Remediation 6-24h, Post-Incident 24-72h)
- Stakeholder Matrix: กำหนดกลุ่มผู้มีส่วนได้ส่วนเสียชัดเจน (ลูกค้าผู้ได้รับผลกระทบ, คณะผู้บริหาร, DPO/ทีมกฎหมาย, ทีมเทคนิค, หน่วยงานกำกับดูแล เช่น สคส./PDPC, สื่อมวลชน)
- Data Breach & Containment: สั่งการปิดกั้นช่องโหว่ (Containment), เก็บรักษาหลักฐานดิจิทัล (Forensic Preservation), ประเมินระดับความเสียหาย และแจ้งเตือนผู้เกี่ยวข้องตามกฎหมายภายในกรอบเวลา
- Incident Command & Action Plan: กำหนดสายการบังคับบัญชาฉุกเฉินและแนวทางปฏิบัติที่ชัดเจน`,
    keywords: [/crisis/i, /วิกฤต/i, /รั่วไหล/i, /breach/i, /incident/i, /ความมั่นคง/i, /ความปลอดภัย/i, /ภัยคุกคาม/i, /threat/i, /ransomware/i, /attack/i, /ฉุกเฉิน/i, /24\s*ชม/i, /24\s*ชั่วโมง/i, /incident\s*response/i, /security/i, /800-61/i],
    profiles: ['Engineering']
  },

  BUSINESS_STRATEGY: {
    name: 'Business & Financial Strategy Analysis',
    text: `\n[CONDITIONAL CONTEXT: BUSINESS & FINANCIAL STRATEGY]
- โฟกัส KPIs/OKRs, การวิเคราะห์สภาพตลาด, ผลกระทบ OpEx/CapEx, และการวางแผนฉากทัศน์ (Scenario Planning)
- จัดทำตารางเปรียบเทียบข้อดีข้อเสีย ทางเลือกเชิงยุทธศาสตร์ และ Trade-offs Matrix`,
    keywords: [/ธุรกิจ/i, /การเงิน/i, /kpi/i, /okr/i, /opex/i, /capex/i, /roi/i, /กลยุทธ์/i, /market/i, /business/i, /financial/i, /cost/i, /งบประมาณ/i],
    profiles: ['Business']
  },

  INVESTIGATION_BEHAVIORAL: {
    name: 'Investigation & Behavioral Analysis (ACH)',
    text: `\n[CONDITIONAL CONTEXT: INVESTIGATION & BEHAVIORAL ANALYSIS]
- เน้น: 1) ลำดับเวลา (Timeline Reconstruction) 2) เอนทิตีบุคคลและพยาน 3) ห่วงโซ่หลักฐาน (Chain of Evidence) 4) สมมติฐานแข่งขัน (ACH) 5) ข้อมูลที่ยังขาดหาย (Missing Evidence)
- ใช้ภาษาไทยกระชับ ตรงไปตรงมา อธิบายศัพท์ทางจิตวิทยา/พฤติกรรมศาสตร์ให้เข้าใจง่ายในชีวิตประจำวัน`,
    keywords: [/สืบสวน/i, /พฤติกรรม/i, /timeline/i, /พยาน/i, /หลักฐาน/i, /investigation/i, /ach/i, /ผู้ต้องสงสัย/i, /ลำดับเวลา/i],
    profiles: ['Investigation']
  },

  MEDICAL_HEALTH: {
    name: 'Medical & Healthcare Science (Differential Diagnosis)',
    text: `\n[CONDITIONAL CONTEXT: MEDICAL & HEALTHCARE SCIENCE]
- เน้น: 1) การแจกแจงอาการ 2) การวินิจฉัยแยกโรค/สาเหตุทางเลือก (Differential Diagnosis) 3) สัญญาณเตือนอันตราย (Red Flags) 4) คำแนะนำพบแพทย์หรือผู้เชี่ยวชาญ`,
    keywords: [/แพทย์/i, /สุขภาพ/i, /โรค/i, /อาการ/i, /วินิจฉัย/i, /symptom/i, /medical/i, /health/i, /การรักษา/i, /ยา/i],
    profiles: ['Medical']
  },

  THAI_SOCIO_LEGAL_THREAT: {
    name: 'Thai Socio-Legal & Community Threat Awareness',
    text: `\n[CONDITIONAL CONTEXT: THAI SOCIO-LEGAL & THREAT AWARENESS]
- พ.ร.บ. อาวุธปืน พ.ศ. 2490 (ใบอนุญาต ป.3, ป.4, การคัดกรองประวัติและสุขภาพจิต) และการควบคุมสิ่งเทียมอาวุธปืน/แบลงค์กัน
- กลไกสุขภาพจิตชุมชนและกลุ่มเสี่ยง SMI-V ร่วมกับ รพ.สต./อสม./สายด่วน 1323
- กลไกแจ้งเหตุ 191/1599 (สตช.) และ 1567 (ศูนย์ดำรงธรรม) พร้อมการประเมินภัยคุกคามรายบุคคล (Threat Assessment over Profiling)`,
    keywords: [/ปืน/i, /อาวุธ/i, /กราดยิง/i, /blank\s*gun/i, /แบลงค์กัน/i, /smi-v/i, /สุขภาพจิตชุมชน/i, /191\b/i, /1599\b/i, /1567\b/i, /ป\.3/i, /ป\.4/i],
    profiles: []
  },

  EVIDENCE_RETRIEVAL: {
    name: 'Evidence Hierarchy & Freshness Protocol',
    text: `\n[EVIDENCE HIERARCHY & RETRIEVAL POLICY]
- ลำดับชั้นหลักฐาน: 1. หน่วยงานทางการ/รัฐ 2. องค์กรสากล (ISO/NIST) 3. เอกสารปฐมภูมิ 4. หลายแหล่งอิสระ 5. สำนักข่าวหลัก 6. เว็บไซต์ทั่วไป 7. โซเชียลมีเดีย (น้ำหนักต่ำสุด)
- ความสดใหม่ (Freshness): ตรวจสอบวันที่ของข้อมูล ข้อมูลปัจจุบันที่ได้รับการยืนยันสามารถแทนที่ข้อมูลเก่าใน LTM ได้
- การอ้างอิง: ระบุชื่อแหล่งที่มาและลิงก์จริงในรูปแบบ Markdown Link ห้ามสร้างลิงก์ปลอม`,
    keywords: [/search/i, /สืบค้น/i, /ค้นหา/i, /ข่าว/i, /ปัจจุบัน/i, /web/i, /ที่มา/i, /อ้างอิง/i, /source/i],
    profiles: []
  }
};

/**
 * Builds an optimized, modular system prompt based on query intent and execution state.
 */
export function buildOptimizedSystemPrompt(
  state: any,
  tone: string,
  deepReasoning: boolean,
  personalContext: string,
  workingMemory: string,
  context: { richness: 'rich' | 'moderate' | 'thin'; missingSignals: string[] },
  conflicts: string[],
  reasoningProfile: string = 'Auto',
  compressedContext?: any,
  docClassification?: { isReportOrReference: boolean; documentType: string; detectedHeadings: string[]; skipRedundantAssessment: boolean },
  conversationContext?: { isOngoing: boolean; turnCount: number }
): SystemPromptBuildResult {
  const query = state?.user_input || '';
  const moduleAudits: PromptModuleAudit[] = [];
  const activeModules: string[] = [];

  // 1. Core Prompt
  const corePrompt = LEAN_CORE_SYSTEM_PROMPT;
  const coreTokens = countTokens(corePrompt);
  moduleAudits.push({
    name: 'Lean Core System Prompt (PCA v3.0 & Governance)',
    category: 'CORE',
    tokens: coreTokens,
    isActive: true,
    reason: 'Essential invariant cognitive, governance, and safety foundation for every request.'
  });

  // 2. Tone Instruction (Must strictly adhere to natural contemporary Thai without archaic words)
  let toneInstruction = '';
  if (tone === 'Formal Architect') {
    toneInstruction = '\n[STYLE PROFILE: Structured & Analytical] สุขุม วิเคราะห์เป็นขั้นเป็นตอน มีโครงสร้างความคิดที่ชัดเจน ใช้ภาษาไทยร่วมสมัยที่เป็นมืออาชีพ ไม่ใช้ภาษาราชการ และไม่ใช้สำนวนโบราณ';
  } else if (tone === 'Empathetic Guide') {
    toneInstruction = '\n[STYLE PROFILE: Conversational Guide] อบอุ่น สื่อสารเป็นมิตร เข้าใจง่าย เห็นภาพชัดเจน เป็นธรรมชาติเหมือนสนทนากับที่ปรึกษามืออาชีพที่เข้าใจผู้ใช้';
  } else if (tone === 'Direct Expert') {
    toneInstruction = '\n[STYLE PROFILE: Direct & Concise] กระชับ สั้น ตรงประเด็นที่สุด ตอบเข้าเนื้อหาทันที ไม่เกริ่นนำ ประหยัดเวลาของผู้ใช้';
  }

  // 3. Conversation Dialogue Directive
  let dialogueDirective = '';
  if (conversationContext?.isOngoing) {
    dialogueDirective = `\n══════════════════════════════════════════════════════════════════════════════
[บริบทการสนทนา: บทสนทนาต่อเนื่อง (Ongoing Conversation — รอบที่ ${conversationContext.turnCount + 1})]
• นี่คือคำถามต่อเนื่องในบทสนทนา ห้ามกล่าวทักทายเด็ดขาด (ห้ามพูด สวัสดีครับ, สวัสดีค่ะ, ยินดีที่ได้ช่วย, แน่นอนครับ ฯลฯ)
• ห้ามทวนคำถามของผู้ใช้
• ตอบเข้าเนื้อหาทันที ตรงประเด็น กระชับ และเป็นธรรมชาติ
══════════════════════════════════════════════════════════════════════════════`;
  } else {
    dialogueDirective = `\n══════════════════════════════════════════════════════════════════════════════
[บริบทการสนทนา: เริ่มต้นบทสนทนาใหม่ (Initial Turn)]
• สุภาพ เป็นธรรมชาติ ตรงประเด็น
• ทักทายเฉพาะกรณีที่ผู้ใช้ทักทายมาก่อน (เช่น "สวัสดี") หรือจำเป็นจริงเท่านั้น อย่าพูดเกริ่นเยิ่นเย้อ
══════════════════════════════════════════════════════════════════════════════`;
  }

  // 4. Document Directive (Conditional)
  let docDirective = '';
  if (docClassification?.skipRedundantAssessment) {
    docDirective = `\n[REFERENCE DOCUMENT MODE: Classified as ${docClassification.documentType} — Provide direct executive analysis without redundant summary-of-summary loops.]`;
    activeModules.push('Reference Document Guard');
  }

  // 5. Conditional Context Modules
  const conditionalContextParts: string[] = [];

  // Check each conditional module
  for (const [key, mod] of Object.entries(CONDITIONAL_MODULES)) {
    const isProfileMatch = mod.profiles.includes(reasoningProfile);
    const isKeywordMatch = mod.keywords.some((kw) => kw.test(query));
    
    // Always include EVIDENCE_RETRIEVAL if deep reasoning is on or search might be needed
    const shouldInclude = isProfileMatch || isKeywordMatch || (key === 'EVIDENCE_RETRIEVAL' && deepReasoning);

    const modTokens = countTokens(mod.text);
    if (shouldInclude) {
      conditionalContextParts.push(mod.text);
      activeModules.push(mod.name);
      moduleAudits.push({
        name: mod.name,
        category: 'CONDITIONAL',
        tokens: modTokens,
        isActive: true,
        reason: isProfileMatch ? `Matched Reasoning Profile (${reasoningProfile})` : 'Matched Query Intent Keywords'
      });
    } else {
      moduleAudits.push({
        name: mod.name,
        category: 'CONDITIONAL',
        tokens: modTokens,
        isActive: false,
        reason: 'Not triggered by current query domain or active profile.'
      });
    }
  }

  const conditionalContext = conditionalContextParts.join('\n');
  const conditionalTokens = countTokens(conditionalContext);

  // 6. Dynamic Context: Working Memory / Compressed Context
  let dynamicContext = '';
  if (compressedContext) {
    dynamicContext = `\n── บริบทบีบอัดเชิงโครงสร้าง (Context Compression: ~${compressedContext.metrics?.compressedTokens || 1200} Tokens) ──
🎯 GOAL: ${compressedContext.goal || 'วิเคราะห์และประมวลผลเชิงยุทธศาสตร์'}
📌 FACTS: ${(compressedContext.facts || []).map((f: string) => `  • ${f}`).join('\n') || '  • ไม่พบข้อเท็จจริงขัดแย้ง'}
🛡️ CONSTRAINTS: ${(compressedContext.constraints || []).map((c: string) => `  • ${c}`).join('\n') || '  • Preserve Human Agency'}
──────────────────────────────────────────────────────────────────────────────`;
  } else if (workingMemory) {
    dynamicContext = `\n── ประวัติการสนทนา (Working Memory) ──\n${workingMemory}\n──────────────────────────────────────`;
  }

  // 7. Valid LTM Memories
  const validMemories = (state?.memories || []).filter(
    (m: any) => !m.is_isolated && m.decision !== 'ISOLATE'
  );
  if (validMemories.length > 0) {
    dynamicContext += `\n── คลังความจำระยะยาว (Verified Long-Term Memory) ──\n` +
      validMemories.slice(0, 5).map((m: any, i: number) => `${i + 1}. [${m.layer}] ${m.content} (Conf: ${m.confidence})`).join('\n');
  }

  if (personalContext) {
    dynamicContext += `\nUser Personal Context: ${personalContext}`;
  }
  if (context?.missingSignals && context.missingSignals.length > 0) {
    dynamicContext += `\n⚠️ ข้อมูลที่ขาด: ${context.missingSignals.join(', ')}`;
  }
  if (conflicts && conflicts.length > 0) {
    dynamicContext += `\n⚠️ ข้อขัดแย้งที่ตรวจพบ: ${conflicts.join('; ')}`;
  }

  const dynamicContextTokens = countTokens(dynamicContext + toneInstruction + docDirective + dialogueDirective);

  // Assemble full optimized system prompt
  const fullPrompt = [
    corePrompt,
    dialogueDirective,
    docDirective,
    toneInstruction,
    conditionalContext,
    dynamicContext
  ].filter(Boolean).join('\n\n');

  const totalSystemPromptTokens = countTokens(fullPrompt);
  const baselinePromptTokens = null; // No verifiable baseline
  const savingsTokens = null;
  const savingsPercentage = 'N/A'; // No baseline available to calculate savings

  return {
    fullPrompt,
    corePrompt,
    coreTokens,
    conditionalContext,
    conditionalTokens,
    activeModules,
    moduleAudits,
    dynamicContextTokens,
    totalSystemPromptTokens,
    baselinePromptTokens,
    savingsTokens,
    savingsPercentage
  };
}

/**
 * Post-processes AI generated text to eliminate accidental repetitive greetings,
 * filler preambles, and any archaic / courtly vocabulary slips.
 */
export function cleanAiResponseStyle(
  rawText: string,
  isOngoing: boolean,
  userQuery: string = ''
): string {
  if (!rawText) return rawText;
  let text = rawText;

  // 1. Archaic / Likay vocabulary normalization
  text = text.replace(/\bข้าพเจ้า\b/g, 'ผม');
  text = text.replace(/\bกระผม\b/g, 'ผม');
  text = text.replace(/\bขอรับ\b/g, 'ครับ');
  text = text.replace(/\bเจ้าค่ะ\b/g, 'ค่ะ');
  text = text.replace(/\bจัก\b/g, 'จะ');
  text = text.replace(/\bโปรดทราบ\b/g, 'ข้อควรทราบ');
  text = text.replace(/\bโปรดระบุ\b/g, 'กรุณาระบุ');
  text = text.replace(/\bโปรดแจ้ง\b/g, 'กรุณาแจ้ง');
  text = text.replace(/\bโปรดตรวจสอบ\b/g, 'กรุณาตรวจสอบ');
  text = text.replace(/\bโปรด\b/g, 'กรุณา');
  text = text.replace(/(?<!กรรมการ|ผู้มีอำนาจ|นายก|ประธาน|ผู้พิพากษา)\bท่าน\b/g, 'คุณ');

  // 2. Greeting & Preamble cleaning on ongoing conversations
  const isUserGreeting = /^(สวัสดี|หวัดดี|hello|hi|hey)\b/i.test(userQuery.trim());
  if (isOngoing && !isUserGreeting) {
    // Strip leading repetitive greeting sentences like:
    // "สวัสดีครับคุณปุญญ์ วันนี้ผมยินดีที่จะช่วย..."
    // "สวัสดีครับคุณปุญญ์ ผมจะช่วยอธิบาย..."
    // "สวัสดีครับ ผมยินดีที่จะช่วย..."
    // "สวัสดีครับ..." / "แน่นอนครับ..." / "ได้เลยครับ..."
    text = text.replace(
      /^(?:สวัสดีครับ|สวัสดีค่ะ|สวัสดี)\s*(?:คุณ\S+)?\s*(?:วันนี้ผมยินดีที่จะช่วย|ผมยินดีที่จะช่วย|ยินดีที่จะช่วย|ผมจะช่วยอธิบาย|ยินดีช่วยครับ|ยินดีช่วยค่ะ|ยินดีครับ|ยินดีค่ะ|ยินดีให้บริการครับ|ยินดีให้บริการค่ะ)[^.\n]*[.\n]?\s*/i,
      ''
    );
    text = text.replace(
      /^(?:สวัสดีครับ|สวัสดีค่ะ|สวัสดี)\s*(?:คุณ\S+)?\s*[,:!.\n]\s*/i,
      ''
    );
    text = text.replace(
      /^(?:แน่นอนครับ|แน่นอนค่ะ|ได้เลยครับ|ได้เลยค่ะ|ยินดีช่วยครับ|ยินดีช่วยค่ะ|ยินดีให้บริการครับ|ยินดีให้บริการค่ะ)\s*[,:!.\n]\s*/i,
      ''
    );
    text = text.replace(
      /^(\s*#+\s*[^\n]+\n\s*)(?:สวัสดีครับ|สวัสดีค่ะ|สวัสดี)\s*(?:คุณ\S+)?[,:!.\s]+/i,
      '$1'
    );
  }

  return text.trim();
}
