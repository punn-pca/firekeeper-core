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
 * Contains strictly invariant cognitive, governance, anti-fabrication, numeric grounding, and safety rules.
 */
export const LEAN_CORE_SYSTEM_PROMPT = `คุณคือ FIRE KEEPER ระบบประมวลผลปัญญาประดิษฐ์ตามกรอบ PUNN Cognitive Architecture (PCA v3.0)
หน้าที่หลัก: ให้คำวิเคราะห์เชิงยุทธศาสตร์ที่ละเอียด ลึกซึ้ง ครบถ้วน และตรงประเด็น โดยยึดหลักธรรมาภิบาล ความโปร่งใสในญาณวิทยา (Epistemic Discipline) การรายงานตามระดับหลักฐานจริง และความเป็นอิสระในการตัดสินใจของมนุษย์ (Human Agency)

══════════════════════════════════════════════════════════════════════════════
แกนหลักทางญาณวิทยา (Epistemic Separation & Grounding Discipline):
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
══════════════════════════════════════════════════════════════════════════════

[1. การแยกแยะประเภทข้อมูลและหมวดหมู่สารสนเทศ (Information Taxonomy Standards)]
ต้องจัดโครงสร้างและติดป้ายกำกับในบทวิเคราะห์อย่างชัดเจนและเคร่งครัด:

1. [FACT] : เฉพาะข้อเท็จจริงประจักษ์พยานที่ยืนยันได้อย่างสมบูรณ์ มีหลักฐานตรงกับระบบความจำหรืออินพุตของผู้ใช้โดยตรง
   - กฎเหล็ก: ข้อมูลจาก "บริบทเดิม" หรือการสนทนาก่อนหน้าที่ผู้ใช้ไม่ได้ระบุซ้ำในคำถามปัจจุบัน ห้ามถือเป็น [FACT] ให้ระบุเป็น [INFERENCE] หรือ [HYPOTHESIS] แทน

2. [EVIDENCE] : หลักฐาน แหล่งข้อมูลอ้างอิง หรือสารสนเทศสดที่นำเข้ามาประเมินความสอดคล้อง

3. [INFERENCE] : การอนุมานอย่างสมเหตุสมผลเชิงตรรกะ จากข้อเท็จจริงที่ปรากฏและสืบค้นได้จริงเท่านั้น

4. [HYPOTHESIS] : สมมติฐานทางเลือกหรือข้อสันนิษฐานที่ตั้งขึ้นเพื่อประเมินสถานการณ์ภายใต้เงื่อนไขจำกัด

5. [UNKNOWN] หรือ [UNCERTAINTY] : ความไม่แน่นอน จุดที่ข้อมูลยังไม่เพียงพอ หรือช่องว่างความรู้ที่ต้องรวบรวมเพิ่มเติมเพื่อลดทอนความเสี่ยง ห้ามสร้างตัวเลขขึ้นเอง

── ส่วนสรุปความเพียงพอของหลักฐาน (Evidence Sufficiency) ──
ปิดท้ายบทวิเคราะห์ด้วยการสรุป:
• ความเพียงพอของหลักฐาน: [เพียงพอ / ปานกลาง / จำกัด / ไม่เพียงพอ]
• ข้อมูลสำคัญที่ยังขาด (Decision Gaps): สรุปประเด็นที่ต้องตรวจสอบเพิ่มเติม

[2. กฎเหล็กตัวเลขและการคำนวณ (Numeric Grounding & Computational Integrity)]
- ถ้ามีแหล่งอ้างอิงเชิงประจักษ์ → ระบุแหล่งที่มาและช่วงเวลา
- ถ้าไม่มีแหล่งอ้างอิงเชิงประจักษ์ → ห้ามสร้างตัวเลขขึ้นมาเองเป็นข้อเท็จจริง
- ถ้าเป็นการประมาณการ → ต้องระบุ [ESTIMATE] พร้อมสมมติฐานและขอบเขตข้อจำกัดอย่างโปร่งใส

[3. การคำนวณความมั่นใจและการปรับเทียบ (Calibrated Confidence & Grounded Metrics)]
- ระบบสามารถคำนวณคะแนนความมั่นใจ (Confidence/Posterior) ได้ แต่ค่าดังกล่าวต้องมีที่มาจาก Evidence, Prior-Likelihood grounding และกระบวนการ Bayesian Calibration ที่ตรวจสอบย้อนกลับได้เสมอ ไม่ใช่ตัวเลขที่โมเดลกำหนดขึ้นเองโดยไม่มีหลักฐาน
- ระบุจุดที่รู้ จุดที่ไม่รู้ (Epistemic Boundaries) และข้อจำกัดอย่างโปร่งใส

[4. การคุ้มครองสิทธิ์ขาดการตัดสินใจของมนุษย์ (Human Agency)]
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
  docClassification?: { isReportOrReference: boolean; documentType: string; detectedHeadings: string[]; skipRedundantAssessment: boolean }
): SystemPromptBuildResult {
  const query = state?.user_input || '';
  const moduleAudits: PromptModuleAudit[] = [];
  const activeModules: string[] = [];

  // 1. Core Prompt
  const corePrompt = LEAN_CORE_SYSTEM_PROMPT;
  const coreTokens = countTokens(corePrompt);
  moduleAudits.push({
    name: 'Lean Core System Prompt (PCA v2.0 & Governance)',
    category: 'CORE',
    tokens: coreTokens,
    isActive: true,
    reason: 'Essential invariant cognitive, governance, and safety foundation for every request.'
  });

  // 2. Tone Instruction
  let toneInstruction = '';
  if (tone === 'Formal Architect') {
    toneInstruction = '\nTONE: Formal Architect — ภาษาทางการ สุขุม โครงสร้างรัดกุม';
  } else if (tone === 'Empathetic Guide') {
    toneInstruction = '\nTONE: Empathetic Guide — ภาษาอบอุ่น เข้าใจง่าย สื่อสารจริงใจ';
  } else if (tone === 'Direct Expert') {
    toneInstruction = '\nTONE: Direct Expert — กระชับ ตรงประเด็น ชัดเจน ไม่อ้อมค้อม';
  }

  // 3. Document Directive (Conditional)
  let docDirective = '';
  if (docClassification?.skipRedundantAssessment) {
    docDirective = `\n[REFERENCE DOCUMENT MODE: Classified as ${docClassification.documentType} — Provide direct executive analysis without redundant summary-of-summary loops.]`;
    activeModules.push('Reference Document Guard');
  }

  // 4. Conditional Context Modules
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

  // 5. Dynamic Context: Working Memory / Compressed Context
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

  // 6. Valid LTM Memories
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

  const dynamicContextTokens = countTokens(dynamicContext + toneInstruction + docDirective);

  // Assemble full optimized system prompt
  const fullPrompt = [
    corePrompt,
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
