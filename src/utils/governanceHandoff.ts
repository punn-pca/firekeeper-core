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
  return /(?:\b(?:should i|help me decide|decide whether|recommend whether|approve|proceed with)\b)|(?:(?:ควร|ช่วย(?:ผม|ฉัน|เรา)?|อยากให้ช่วย|ตัดสินใจ|เลือก)(?:จะ)?(?:ลงทุน|กู้เงิน|ก่อหนี้|ซื้อกิจการ|อนุมัติ|ผ่าตัด|รักษา|ฟ้อง|ดำเนินคดี|ขายทรัพย์สิน|ซื้อบ้าน))/i.test(q)
    || /(?:ลงทุนอะไรดี|ควรลงทุนไหม|ควรผ่าตัดไหม|ควรฟ้องหรือไม่)/i.test(q);
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
  return { recommended: reasons.some((reason) => reason !== 'COMPLEX_ALTERNATIVES'), reasons,
    message: reasons.length ? 'เรื่องนี้อาจต้องตรวจสอบหลักฐานและความเสี่ยงเพิ่มเติม ต้องการวิเคราะห์เชิงลึกด้วย Governance Mode หรือคุยต่อแบบปกติ?' : '' };
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
