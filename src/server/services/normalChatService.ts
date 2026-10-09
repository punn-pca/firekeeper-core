/**
 * FIRE KEEPER - Normal Chat Service (Phase 1 Dual-Mode)
 * 
 * Sends the user's prompt and conversation history to the selected provider
 * without a Firekeeper system prompt or response rewriting. Request access,
 * account policy, and provider security checks remain at the server boundary.
 */

import { callUnifiedLlmContent } from './unifiedLlm';
import { ImageAttachment } from './llmProvider';
import { detectUserRequestedLanguage, validateOutputLanguage, buildLanguagePolicyRewritePrompt, DEFAULT_LANGUAGE_POLICY } from './languagePolicy';
import { cleanAiResponseStyle } from './promptOptimizer';

export interface NormalChatRequestOptions {
  question: string;
  history?: Array<{ role: 'user' | 'assistant'; content: string }>;
  tone?: string; // Retained for request compatibility; Direct Mode does not apply a tone wrapper.
  model: string;
  provider: string;
  apiKey?: string;
  customBaseUrl?: string;
  ollamaBaseUrl?: string;
  images?: ImageAttachment[];
  maxOutputTokens?: number;
  signal?: AbortSignal;
}

export interface NormalChatResult {
  text: string;
  provider: string;
  model: string;
  totalTokens: number;
  durationMs: number;
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
}

export function buildDirectChatPayload(
  history: Array<{ role: 'user' | 'assistant'; content: string }> = [],
  question: string
): Array<{ role: 'user' | 'assistant'; content: string }> {
  return [
    ...history.slice(-8).filter((turn) => turn?.content).map((turn) => ({
      role: turn.role === 'assistant' ? 'assistant' as const : 'user' as const,
      content: turn.content,
    })),
    { role: 'user', content: question },
  ];
}

export async function executeNormalChat(
  options: NormalChatRequestOptions,
  callbacks?: {
    onToken?: (token: string) => void;
    onStage?: (stage: string, detail: string) => void;
  }
): Promise<NormalChatResult> {
  const startMs = Date.now();
  const {
    question,
    history = [],

    model,
    provider,
    apiKey,
    customBaseUrl,
    ollamaBaseUrl,
    images = [],
    maxOutputTokens = 2048,
    signal
  } = options;

  // Direct means the user's prompt and conversation history reach the selected
  // model without a Firekeeper system prompt, response rewrite, or language retry.
  callbacks?.onStage?.('DirectLLM', 'กำลังส่งคำขอตรงไปยังโมเดลที่เลือก...');

  const llmResult = await callUnifiedLlmContent(buildDirectChatPayload(history, question), {
    provider,
    model,
    skipSystemPrompt: true,
    apiKey,
    baseUrl: customBaseUrl,
    ollamaBaseUrl,
    images,
    maxOutputTokens,
    signal
  });

  const generatedText = llmResult.text || '';

  const durationMs = Date.now() - startMs;
  const totalTokens = (llmResult.usage?.totalTokens) || Math.ceil((question.length + generatedText.length) / 3.5);

  return {
    text: generatedText,
    provider,
    model: llmResult.modelUsed || model,
    totalTokens,
    durationMs,
    usage: llmResult.usage
  };
}
