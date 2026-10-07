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


function extractJsonObject(text: string): unknown {
  const raw = String(text || '').trim();
  const unfenced = raw.replace(/^\`\`\`(?:json)?\s*/i, '').replace(/\s*\`\`\`$/i, '').trim();
  const start = unfenced.indexOf('{');
  const end = unfenced.lastIndexOf('}');
  if (start < 0 || end <= start) throw new Error('ADVERSARIAL_VERIFIER_INVALID_JSON');
  return JSON.parse(unfenced.slice(start, end + 1));
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

export function parseAdversarialVerifierResult(text: string, validEvidenceIds: Set<string>): AdversarialVerifierResult {
  const value = extractJsonObject(text) as any;
  const verdicts = new Set<AdversarialOverallVerdict>(['ENTAILED', 'PARTIALLY_ENTAILED', 'CONTRADICTED', 'NEUTRAL']);
  const overallVerdict = value?.reasoning?.overallVerdict;
  if (!verdicts.has(overallVerdict)) throw new Error('ADVERSARIAL_VERIFIER_INVALID_VERDICT');

  const mapEvidenceItems = (items: unknown) => (Array.isArray(items) ? items : []).map((item: any) => ({
    subclaim: String(item?.subclaim || '').trim(),
    evidenceIds: stringArray(item?.evidenceIds).filter((id) => validEvidenceIds.has(id)),
    explanation: String(item?.explanation || '').trim(),
  })).filter((item) => item.subclaim && item.explanation);

  return {
    entailment: mapEvidenceItems(value?.entailment),
    contradiction: mapEvidenceItems(value?.contradiction),
    silence: (Array.isArray(value?.silence) ? value.silence : []).map((item: any) => ({
      subclaim: String(item?.subclaim || '').trim(),
      missingInformation: String(item?.missingInformation || item?.missing_information || '').trim(),
      explanation: String(item?.explanation || '').trim(),
    })).filter((item: any) => item.subclaim && item.explanation),
    paraphrase_failures: (Array.isArray(value?.paraphrase_failures) ? value.paraphrase_failures : []).map((item: any) => ({
      claimText: String(item?.claimText || item?.claim_text || '').trim(),
      unsupportedAddition: String(item?.unsupportedAddition || item?.unsupported_addition || '').trim(),
      explanation: String(item?.explanation || '').trim(),
    })).filter((item: any) => item.claimText && item.unsupportedAddition && item.explanation),
    reasoning: {
      supportedComponents: stringArray(value?.reasoning?.supportedComponents || value?.reasoning?.supported_components),
      unsupportedComponents: stringArray(value?.reasoning?.unsupportedComponents || value?.reasoning?.unsupported_components),
      contradictedComponents: stringArray(value?.reasoning?.contradictedComponents || value?.reasoning?.contradicted_components),
      overallVerdict,
    },
  };
}

export interface AdversarialVerifierEvidence {
  id: string;
  source?: string;
  content: string;
  sourceUrl?: string;
  locator?: string;
  documentId?: string;
}

export interface AdversarialVerifierLlmOptions {
  provider?: string;
  model?: string;
  apiKey?: string;
  baseUrl?: string;
  ollamaBaseUrl?: string;
  signal?: AbortSignal;
}

/**
 * Production semantic verification boundary. Provider errors and malformed output
 * fail closed by returning no semantic relations; callers must keep the claim
 * UNVERIFIED rather than guessing from lexical overlap.
 */
export async function verifyClaimAgainstEvidence(
  claim: string,
  evidence: AdversarialVerifierEvidence[],
  llmOptions: AdversarialVerifierLlmOptions,
  invoke?: (prompt: string, options: any) => Promise<{ text: string }>
): Promise<{ result: AdversarialVerifierResult; relations: Array<{ evidenceId: string; relation: 'SUPPORTS' | 'CONTRADICTS' }> } | null> {
  const usableEvidence = (Array.isArray(evidence) ? evidence : []).filter((item) => item?.id && item?.content);
  if (!String(claim || '').trim() || usableEvidence.length === 0) return null;

  try {
    const call = invoke || (await import('./unifiedLlm')).callUnifiedLlmContent;
    const prompt = JSON.stringify({
      claim: String(claim).trim(),
      evidence: usableEvidence.map((item) => ({
        id: item.id,
        source: item.source || '',
        content: item.content,
        sourceUrl: item.sourceUrl || undefined,
        locator: item.locator || undefined,
        documentId: item.documentId || undefined,
      })),
      task: 'Decompose the claim into atomic propositions and test entailment, contradiction, silence, and unsupported paraphrase. Cite evidence only by the supplied evidence id.'
    });
    const response = await call(prompt, {
      ...llmOptions,
      systemInstruction: ADVERSARIAL_VERIFIER_SYSTEM_PROMPT,
      temperature: 0,
      maxOutputTokens: 1800,
    });
    const validEvidenceIds = new Set(usableEvidence.map((item) => item.id));
    const result = parseAdversarialVerifierResult(response.text, validEvidenceIds);
    return { result, relations: adversarialResultToRelations(result, validEvidenceIds) };
  } catch {
    return null;
  }
}
