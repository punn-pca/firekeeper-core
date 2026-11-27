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
const unique = (items: string[], max: number) => [...new Set(items.map(x => x.trim()).filter(Boolean))].slice(0, max).map(x => x.slice(0, 400));
export function assessGovernanceHandoff(input: {
  highImpact?: boolean; evidenceConflict?: boolean; insufficientEvidence?: boolean;
  multipleAlternatives?: boolean; auditRequested?: boolean; explicitlyRequested?: boolean;
}): HandoffAssessment {
  const reasons: HandoffReason[] = [];
  if (input.highImpact) reasons.push('HIGH_IMPACT');
  if (input.evidenceConflict || input.insufficientEvidence) reasons.push('UNCERTAIN_EVIDENCE');
  if (input.multipleAlternatives) reasons.push('COMPLEX_ALTERNATIVES');
  if (input.auditRequested) reasons.push('AUDIT_REQUEST');
  if (input.explicitlyRequested) reasons.push('USER_REQUEST');
  return { recommended: reasons.length > 0, reasons,
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
