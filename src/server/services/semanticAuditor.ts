import { DecisionObject } from '../../shared/contracts/decision';

export type SemanticAuditResult = {
  isMeaningful: boolean;
  omissions: string[];
  suggestions: string[];
};

/**
 * Semantic Auditor for DecisionObject
 * Evaluates semantic aspects like risk meaningfulness and completeness.
 */
export async function auditDecisionSemantics(decision: DecisionObject): Promise<SemanticAuditResult> {
  const omissions: string[] = [];
  const suggestions: string[] = [];
  let isMeaningful = true;

  // 1. Check if uncertainties are mentioned
  if (decision.uncertainties.length === 0) {
    omissions.push('No uncertainties mentioned');
    suggestions.push('Explicitly list key uncertainties affecting the decision.');
  }

  // 2. Check if risks are associated with options
  decision.risks.forEach(risk => {
    if (!risk.relatedOptionIds || risk.relatedOptionIds.length === 0) {
      suggestions.push(`Risk "${risk.text}" should be mapped to relevant options.`);
    }
  });

  // 3. Simple meaningfulness check (e.g., placeholder text check)
  if (decision.recommendation?.rationale.length! < 10) {
    isMeaningful = false;
    suggestions.push('Recommendation rationale is too brief and lacks depth.');
  }

  return {
    isMeaningful,
    omissions,
    suggestions,
  };
}
