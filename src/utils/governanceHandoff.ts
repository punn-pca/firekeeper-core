/** Advisory-only handoff: never changes the active chat mode. */
export type HandoffReason = 'HIGH_IMPACT' | 'UNCERTAIN_EVIDENCE' | 'COMPLEX_ALTERNATIVES' | 'AUDIT_REQUEST' | 'USER_REQUEST';
export interface HandoffAssessment { recommended: boolean; reasons: HandoffReason[]; message: string }
export interface HandoffContext {
  question: string;
  userFacts: string[];
  userGoals: string[];
  unknowns: string[];
  assistantSuggestions: string[];
  reason: HandoffReason[];
}

/** Only explicit requests to choose/execute a consequential action qualify. Topic words alone do not. */
export function isExplicitConsequentialDecision(query: string): boolean {
  const q = String(query || '').trim();
  const consequentialAction = '(?:ลงทุน|กู้เงิน|ก่อหนี้|ซื้อกิจการ|อนุมัติ|ผ่าตัด|รักษา|ฟ้อง|ดำเนินคดี|ขายทรัพย์สิน|ซื้อบ้าน|ลาออก|เลิกจ้าง|ไล่ออก|ลงนามสัญญา|เซ็นสัญญา|ขายหุ้น|ซื้อหุ้น|ถอนเงินก้อนใหญ่)';
  const explicitThai = new RegExp(`(?:ควร|ช่วย(?:ผม|ฉัน|เรา)?|อยากให้ช่วย|ตัดสินใจ|เลือก)(?:จะ)?${consequentialAction}|(?:ช่วย(?:ผม|ฉัน|เรา)?.{0,12}(?:เลือก|ตัดสินใจ).{0,12}${consequentialAction}|ลงทุนอะไรดี|ควรลงทุนไหม|ควรผ่าตัดไหม|ควรฟ้องหรือไม่|ควรลาออกไหม|ควรเลิกจ้างหรือไม่)`, 'i').test(q);
  const explicitEnglish = /\b(?:should i|help me decide|decide whether|recommend whether)\s+(?:to\s+)?(?:invest|borrow|take out (?:a )?loan|acquire|approve|undergo surgery|take medication|sue|sell|buy (?:a )?house|sign (?:this |the )?(?:contract|agreement|loan)|resign|terminate|fire|plead|file (?:a )?lawsuit)\b/i.test(q)
    || /\b(?:should we|help us decide)\s+(?:whether to\s+)?(?:invest|borrow|acquire|approve|sign|terminate|fire|sue|proceed with (?:the )?(?:contract|loan|investment|acquisition))\b/i.test(q);
  return explicitThai || explicitEnglish;
}

const unique = (items: string[], max: number) => [...new Set(items.map(x => x.trim()).filter(Boolean))].slice(0, max).map(x => x.slice(0, 400));
export function assessGovernanceHandoff(input: {
  highImpact?: boolean; evidenceConflict?: boolean; insufficientEvidence?: boolean;
  explicitDecisionIntent?: boolean;
  multipleAlternatives?: boolean; auditRequested?: boolean; explicitlyRequested?: boolean;
}): HandoffAssessment {
  const reasons: HandoffReason[] = [];
  // Domain keywords alone (e.g. business, investment, law) do not establish
  // that the user is asking for a consequential decision. Require explicit intent.
  if (input.highImpact && input.explicitDecisionIntent) reasons.push('HIGH_IMPACT');
  if ((input.evidenceConflict || input.insufficientEvidence) && input.explicitDecisionIntent) reasons.push('UNCERTAIN_EVIDENCE');
  if (input.multipleAlternatives) reasons.push('COMPLEX_ALTERNATIVES');
  if (input.auditRequested) reasons.push('AUDIT_REQUEST');
  if (input.explicitlyRequested) reasons.push('USER_REQUEST');
  const recommended = reasons.some((reason) => reason !== 'COMPLEX_ALTERNATIVES');
  return { recommended, reasons,
    message: recommended ? 'เรื่องนี้อาจต้องตรวจสอบหลักฐานและความเสี่ยงเพิ่มเติม ต้องการวิเคราะห์เชิงลึกด้วย Governance Mode หรือคุยต่อแบบปกติ?' : '' };
}

/** Explicit opt-in only: mentioning Governance is not consent to switch or hand off. */
export function isExplicitGovernanceRequest(query: string): boolean {
  return /\b(?:use|switch to|enter)\s+governance(?:\s+mode)?\b|(?:ใช้|สลับไปใช้|เปิด)\s*(?:โหมด\s*)?governance(?:\s*mode)?|เปิดโหมดกำกับดูแล/i.test(String(query || ''));
}

/** Request an audit action, not an explanation of what an audit/audit log is. */
export function isExplicitAuditRequest(query: string): boolean {
  return /\b(?:please\s+)?(?:audit|review|inspect)\s+(?:the\s+)?(?:audit log|audit trail|records|decision log)\b|(?:ช่วย|ขอให้|โปรด)\s*(?:ตรวจสอบ|audit)\s*(?:ย้อนหลัง|audit log|audit trail|บันทึกการตรวจสอบ)/i.test(String(query || ''));
}

/** Call only after explicit user confirmation; do not interpolate into system instructions. */
export function prepareGovernanceHandoff(context: HandoffContext, consent: boolean): HandoffContext | null {
  if (!consent) return null;
  return {
    question: context.question.trim().slice(0, 2000),
    userFacts: unique(context.userFacts, 20),
    userGoals: unique(context.userGoals, 10),
    unknowns: unique(context.unknowns, 20),
    assistantSuggestions: unique(context.assistantSuggestions, 10),
    reason: [...new Set(context.reason)].filter(x => ['HIGH_IMPACT','UNCERTAIN_EVIDENCE','COMPLEX_ALTERNATIVES','AUDIT_REQUEST','USER_REQUEST'].includes(x))
  };
}
