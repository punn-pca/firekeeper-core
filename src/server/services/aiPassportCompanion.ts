import { buildGovernedPromptPackage, GovernedPromptEvidence } from './governedPrompt';

export type AIPassportProvider =
  | 'chatgpt'
  | 'claude'
  | 'gemini'
  | 'perplexity'
  | 'deepseek'
  | 'mistral'
  | 'llama'
  | 'qwen'
  | 'other';

export type AIPassportCompanionPackage = ReturnType<typeof buildAIPassportCompanionPackage>;

/**
 * Creates a provider-neutral package for use with AI services accessed through
 * TH-AI Passport/AiPASS or directly. This module does NOT call or automate AiPASS.
 */
export function buildAIPassportCompanionPackage(input: {
  question: string;
  provider?: AIPassportProvider | string;
  evidence?: GovernedPromptEvidence[];
  objective?: string;
}) {
  const provider = input.provider || 'other';
  const governed = buildGovernedPromptPackage({
    question: input.question,
    evidence: input.evidence,
    objective: input.objective || 'Generate a useful answer that can be independently verified by Firekeeper after generation.'
  });

  return {
    mode: 'AI_PASSPORT_COMPANION' as const,
    integration: 'USER_MEDIATED' as const,
    provider,
    governed_prompt: governed.external_ai_prompt,
    governed_package: governed,
    workflow: [
      'GENERATE_PROMPT',
      'USER_SUBMITS_TO_AI_PROVIDER',
      'USER_PASTES_RESPONSE',
      'FIREKEEPER_VERIFIES',
      'HUMAN_DECIDES'
    ] as const,
    constraints: {
      no_aipass_api_access: true as const,
      no_aipass_automation: true as const,
      provider_neutral: true as const,
      preserve_human_agency: true as const,
      verify_before_decision: true as const,
    },
    verification_input: {
      original_question: input.question,
      provider,
      response: '',
      expected_action: 'Paste the provider response here and run Firekeeper verification.'
    }
  };
}

export function buildProviderPrompt(question: string, provider?: string) {
  return buildAIPassportCompanionPackage({ question, provider }).governed_prompt;
}
