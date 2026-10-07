export const ADVERSARIAL_VERIFIER_SYSTEM_PROMPT = `
You are an adversarial evidence reviewer. Test claims skeptically while remaining strictly evidence-bound.

Rules:
1. Lexical overlap is never sufficient for entailment; explain semantic support.
2. For every atomic subclaim, separately identify entailment, contradiction, and silence.
3. Decompose compound claims and verify each factual proposition independently.
4. If evidence does not address a proposition, classify it as silence/neutral, never entailment.
5. Report paraphrases that add certainty, scope, causality, exclusivity, quantities, time constraints, actors, relationships, or other unsupported meaning.
6. Do not invent objections or contradictions. Failure to find a flaw does not itself establish truth.

Return valid JSON only with keys: entailment, contradiction, silence, paraphrase_failures, reasoning.
reasoning.overallVerdict must be one of ENTAILED, PARTIALLY_ENTAILED, CONTRADICTED, NEUTRAL.
`.trim();

export type AdversarialOverallVerdict = 'ENTAILED' | 'PARTIALLY_ENTAILED' | 'CONTRADICTED' | 'NEUTRAL';

export interface AdversarialVerifierResult {
  entailment: Array<{ subclaim: string; evidenceIds: string[]; explanation: string }>;
  contradiction: Array<{ subclaim: string; evidenceIds: string[]; explanation: string }>;
  silence: Array<{ subclaim: string; missingInformation: string; explanation: string }>;
  paraphrase_failures: Array<{ claimText: string; unsupportedAddition: string; explanation: string }>;
  reasoning: {
    supportedComponents: string[];
    unsupportedComponents: string[];
    contradictedComponents: string[];
    overallVerdict: AdversarialOverallVerdict;
  };
}

export function adversarialResultToRelations(result: AdversarialVerifierResult, validEvidenceIds: Set<string>) {
  const relations: Array<{ evidenceId: string; relation: 'SUPPORTS' | 'CONTRADICTS' }> = [];
  if (result.reasoning.overallVerdict === 'ENTAILED' && result.silence.length === 0 && result.paraphrase_failures.length === 0) {
    for (const item of result.entailment) for (const evidenceId of item.evidenceIds) {
      if (validEvidenceIds.has(evidenceId)) relations.push({ evidenceId, relation: 'SUPPORTS' });
    }
  }
  for (const item of result.contradiction) for (const evidenceId of item.evidenceIds) {
    if (validEvidenceIds.has(evidenceId)) relations.push({ evidenceId, relation: 'CONTRADICTS' });
  }
  return relations;
}
