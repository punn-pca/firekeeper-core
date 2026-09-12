import { countTokens, hashText } from '../utils/text';
import { 
  buildPunnAiSystemPrompt,
  detectTemporalSensitivity, 
  TemporalDetectionResult, 
  TemporalRetrievalResult,
  getCurrentDateISO,
  MODEL_KNOWLEDGE_CUTOFF
} from './temporalGrounding';
import { CANONICAL_PUNN_PERSONA_PROMPT } from './punnPersonaGovernance';
import { getLanguagePolicySystemInstruction, DEFAULT_LANGUAGE_POLICY } from './languagePolicy';
import { IntentType } from './intentClassifier';
import { 
  buildUnifiedPcaGovernancePrompt, 
  evaluateResponseDepth,
  PCA_CORE_INVARIANTS,
  PCA_PRIORITY_HIERARCHY,
  PCA_CONFLICT_RESOLUTION
} from './pcaGovernance';

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
 * Single Source of Truth for PCA v3.0 Core Invariants, Priority Hierarchy (P0-P6),
 * Conflict Resolution, Taxonomy, and Display Policy.
 */
export const LEAN_CORE_SYSTEM_PROMPT = `${getLanguagePolicySystemInstruction(DEFAULT_LANGUAGE_POLICY)}

${buildUnifiedPcaGovernancePrompt()}

══════════════════════════════════════════════════════════════════════════════
บุคลิกภาพและการสนทนา (Core Personality & Natural Contemporary Thai)
══════════════════════════════════════════════════════════════════════════════
1. บุคลิกภาพหลัก (Personal AI Assistant):
   • บุคลิก: Calm, Intelligent, Practical, Professional, Conversational, Direct, Context-Aware
   • สุขุม นิ่ง ไม่ตื่นตระหนก ไม่ใช้คำหวือหวาเกินจริง
   • ฉลาด คิดวิเคราะห์เป็นระบบ มีตรรกะและเหตุผลรองรับชัดเจน
   • ปฏิบัติได้จริง ให้มุมมองที่นำไปใช้ได้ในโลกจริง
   • สนทนาเป็นธรรมชาติ คุยเหมือนผู้เชี่ยวชาญร่วมงานกับเพื่อนร่วมงานระดับสูง
   • ตรงไปตรงมา ตอบเข้าประเด็นทันที ไม่อ้อมค้อม ไม่เยิ่นเย้อ
   • สิ่งที่ไม่ใช่: ไม่ใช่ Chatbot คอลเซ็นเตอร์ (ห้ามสคริปต์สำเร็จรูป), ไม่ใช่ผู้ช่วยราชการ (ไม่ใช้ภาษาราชการ), ไม่ใช่เลขานุการโบราณ, ไม่ใช่ AI ที่เยินยอเห็นด้วยกับทุกอย่าง

2. ภาษาและโทน (Contemporary Natural Thai):
   • ใช้ภาษาไทยร่วมสมัยแบบคนทั่วไป เป็นธรรมชาติ อ่านง่าย ไม่แข็งทื่อ
   • ข้อห้ามทางภาษา: ห้ามใช้สำนวนโบราณหรือลิเก เช่น ข้าพเจ้า, ท่าน, กระผม, ขอรับ, เจ้าค่ะ, จัก, โปรด, ด้วยประการฉะนี้
   • ใช้สรรพนาม "คุณ" / "ผม" เท่าที่จำเป็น และละเว้นสรรพนามเมื่อรูปประโยคไม่ต้องการ
   • ไม่ต้องลงท้ายทุกประโยคด้วยคำว่า "ครับ" ซ้ำๆ จนผิดธรรมชาติ

3. นโยบายการทักทาย (Consolidated No-Greeting Rule):
   • ในบทสนทนาต่อเนื่อง ให้ตอบเข้าเรื่องทันทีโดยไม่ต้องทักทายซ้ำ
   • ทักทายเฉพาะกรณี: 1) เป็นการเริ่มบทสนทนาใหม่เอี่ยมและบริบทเหมาะสม 2) ผู้ใช้ทักทายมาก่อน เช่น "สวัสดี"

4. ความสมเหตุสมผลเชิงสัดส่วน (Response Proportionality):
   • เข้าใจคำถามก่อน แล้วตอบสิ่งที่ผู้ใช้ต้องการโดยตรงอย่างมีตรรกะ
   • ความลึกของคำตอบต้องสอดคล้องกับความซับซ้อนของปัญหา (Proportionality)
   • คำถามทั่วไป/ข้อมูลข้อเท็จจริง: ตอบตรงประเด็นและกระชับ
   • ประเด็นเชิงยุทธศาสตร์/การตัดสินใจ: จัดโครงสร้างอย่างรอบด้าน`;

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
 * Adaptive Reasoning Modules for Intent-based Prompting
 */
const ADAPTIVE_REASONING_MODULES = {
  CASUAL_GREETING: {
    name: 'Casual Greeting & Conversation Protocol',
    text: `\n[PROTOCOL: CASUAL CONVERSATION (L0)]
- ตอบกลับอย่างเป็นธรรมชาติ สุภาพ และกระชับ
- ไม่ต้องใช้โครงสร้างการวิเคราะห์หรือตารางที่ซับซ้อน
- ไม่ต้องติดแท็ก Taxonomy เช่น [FACT], [INFERENCE] หากเป็นการทักทายทั่วไป
- เน้นความเป็นผู้ช่วยส่วนตัวที่เข้าถึงง่าย`,
  },
  SIMPLE_FACTUAL: {
    name: 'Simple Factual Query Protocol',
    text: `\n[PROTOCOL: DIRECT FACTUAL QUERY (L1)]
- ตอบคำถามโดยตรงและชัดเจน กระชับ ไม่เยิ่นเย้อ
- ให้เหตุผลสั้นๆ เท่าที่จำเป็น
- หลีกเลี่ยงการสร้าง section การวิเคราะห์ที่ซับซ้อนเกินความจำเป็น`,
  },
  FULL_PCA_ANALYSIS: {
    name: 'PCA Structured Synthesis Protocol (L2/L3)',
    text: `\n[PROTOCOL: PCA STRUCTURED SYNTHESIS]
- ใช้โครงสร้างการตอบที่ได้สัดส่วนกับความซับซ้อนของประเด็น (Response Proportionality):
  1) **บทสรุปจุดยืนเชิงยุทธศาสตร์**: ตั้งชื่อหัวข้อด้วยภาษาธรรมชาติ ระบุข้อสรุปที่ชัดเจนพร้อมระดับความมั่นใจ
  2) **การจำแนกสมมติฐานทางเลือก (Analysis of Competing Hypotheses - ACH)**: เปรียบเทียบทางเลือกคู่ขนาน
  3) **การวิเคราะห์ข้อดี-ข้อเสียและความเสี่ยง (Trade-offs & Risk Critique)**: ประเมินผลกระทบและความเสี่ยง
  4) **ดุลยพินิจและเงื่อนไขของมนุษย์ (Decision Gaps & Inviolable Human Agency)**: ระบุช่องว่างข้อมูลและความไม่แน่นอน คืนอำนาจการตัดสินใจแก่มนุษย์ (Human Agency)
- หัวข้อต้องเป็นภาษาธรรมชาติ ห้ามนำแท็ก Taxonomy มาเป็นชื่อหัวข้อ
- แทรกแท็ก เช่น [INFERENCE], [HYPOTHESIS], [TRADE_OFF], [DECISION_GAP] เฉพาะจุดในเนื้อหาที่ช่วยเพิ่มความชัดเจนทางญาณวิทยา`,
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
  conversationContext?: { isOngoing: boolean; turnCount: number },
  temporalContext?: { detection: TemporalDetectionResult; retrieval: TemporalRetrievalResult },
  intent: IntentType = 'NORMAL_QUERY'
): SystemPromptBuildResult {
  const query = state?.user_input || '';
  const moduleAudits: PromptModuleAudit[] = [];
  const activeModules: string[] = [];

  // 1. Core Unified Prompt (PCA v3.0 Unified Governance)
  const corePrompt = LEAN_CORE_SYSTEM_PROMPT;
  const coreTokens = countTokens(corePrompt);
  moduleAudits.push({
    name: 'PCA v3.0 Unified Governance (Invariants, P0-P6 Hierarchy, Identity, Language & Display Policy)',
    category: 'CORE',
    tokens: coreTokens,
    isActive: true,
    reason: 'Single source of truth for PCA v3.0 invariants, priority hierarchy, identity boundary, and display policy.'
  });
  activeModules.push('PCA v3.0 Unified Governance');

  // 1.2 Temporal Grounding Directive (Knowledge Cutoff 2025 vs Current Date 2026 Separation)
  const activeDetection = temporalContext?.detection || detectTemporalSensitivity(query);
  const activeRetrieval = temporalContext?.retrieval || {
    success: false,
    verified: false,
    retrievedAt: new Date().toISOString(),
    confidence: 'UNVERIFIED' as const,
    statusMessage: 'ไม่ได้เชื่อมต่อผลการค้นหาสด'
  };
  const punnAiSystemPrompt = buildPunnAiSystemPrompt({
    currentDate: getCurrentDateISO(),
    knowledgeCutoff: MODEL_KNOWLEDGE_CUTOFF,
    detection: activeDetection,
    retrieval: activeRetrieval
  });
  const temporalTokens = countTokens(punnAiSystemPrompt);
  moduleAudits.push({
    name: 'PUNN AI Temporal & Evidence Grounding Protocol (12 Directives)',
    category: 'CORE',
    tokens: temporalTokens,
    isActive: true,
    reason: `Enforces Knowledge Cutoff (${MODEL_KNOWLEDGE_CUTOFF}) vs Current Date (${getCurrentDateISO()}) separation. Scope: ${activeDetection.temporalScope}`
  });
  activeModules.push('PUNN AI Temporal & Evidence Grounding Protocol');

  // 1.3 Adaptive Reasoning Protocol (Determined by Intent)
  let adaptiveProtocol = '';
  if (intent === 'GREETING') {
    adaptiveProtocol = ADAPTIVE_REASONING_MODULES.CASUAL_GREETING.text;
    activeModules.push(ADAPTIVE_REASONING_MODULES.CASUAL_GREETING.name);
  } else if (intent === 'SIMPLE_QUERY') {
    adaptiveProtocol = ADAPTIVE_REASONING_MODULES.SIMPLE_FACTUAL.text;
    activeModules.push(ADAPTIVE_REASONING_MODULES.SIMPLE_FACTUAL.name);
  } else if (intent === 'DECISION_SUPPORT' || intent === 'COMPLEX' || deepReasoning) {
    adaptiveProtocol = ADAPTIVE_REASONING_MODULES.FULL_PCA_ANALYSIS.text;
    activeModules.push(ADAPTIVE_REASONING_MODULES.FULL_PCA_ANALYSIS.name);
  }

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

  let deepReasoningDirective = '';
  if (deepReasoning) {
    deepReasoningDirective = `\n══════════════════════════════════════════════════════════════════════════════
[คำสั่งควบคุมการคิดเชิงลึก: PCA PROCESS DEPTH L3 (DEEP AUDIT ACTIVATED)]
• ผู้ใช้เปิดโหมด Deep Reasoning: ให้วิเคราะห์อย่างรอบด้าน เป็นระบบ และได้สัดส่วนกับความลึกของปัญหา (Proportional Deep Audit)
• ลำดับการวิเคราะห์เชิงโครงสร้าง:
  1. บทสรุปจุดยืนเชิงยุทธศาสตร์และระดับความมั่นใจที่คำนวณได้
  2. การเปรียบเทียบสมมติฐานทางเลือกคู่ขนาน (ACH Multi-Hypothesis Analysis)
  3. การวิเคราะห์ชั่งน้ำหนักข้อดี ข้อเสีย ความเสี่ยง และจุดวิพากษ์ (Risk & Vulnerability Critique)
  4. ช่องว่างข้อมูล เงื่อนไขในการนำไปใช้ และการสงวนอำนาจการตัดสินใจขั้นสูงสุดให้แก่มนุษย์ (Human Agency Gate)
• หัวข้อต้องเป็นภาษาธรรมชาติ (ห้ามนำแท็ก Taxonomy มาเป็นชื่อหัวข้อ) และแทรกแท็กกำกับเฉพาะจุดในเนื้อหา เช่น [FACT], [INFERENCE], [HYPOTHESIS], [TRADE_OFF], [DECISION_GAP]
══════════════════════════════════════════════════════════════════════════════`;
    activeModules.push('PCA Process Depth L3 Directive');
  }

  const dynamicContextTokens = countTokens(dynamicContext + toneInstruction + docDirective + dialogueDirective + deepReasoningDirective);

  // Assemble full optimized system prompt (Core already includes unified governance, persona, invariants, and language policy)
  const fullPrompt = [
    punnAiSystemPrompt,
    corePrompt,
    adaptiveProtocol,
    dialogueDirective,
    docDirective,
    deepReasoningDirective,
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

  // 1. Archaic / Likay vocabulary normalization (Thai characters do not use ASCII \b word boundaries)
  text = text.replace(/ข้าพเจ้า/g, 'ผม');
  text = text.replace(/กระผม/g, 'ผม');
  text = text.replace(/ขอรับ/g, 'ครับ');
  text = text.replace(/เจ้าค่ะ/g, 'ค่ะ');
  text = text.replace(/พระคุณท่าน/g, 'คุณ');
  text = text.replace(/ด้วยประการฉะนี้/g, '');
  text = text.replace(/โปรดทราบ/g, 'ข้อควรทราบ');
  text = text.replace(/โปรดระบุ/g, 'กรุณาระบุ');
  text = text.replace(/โปรดแจ้ง/g, 'กรุณาแจ้ง');
  text = text.replace(/โปรดตรวจสอบ/g, 'กรุณาตรวจสอบ');
  text = text.replace(/โปรด/g, 'กรุณา');
  text = text.replace(/(?<!กรรมการ|ผู้มีอำนาจ|นายก|ประธาน|ผู้พิพากษา)ท่าน/g, 'คุณ');

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
