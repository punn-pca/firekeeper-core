/**
 * FIRE KEEPER - Normal Chat Service (Phase 1 Dual-Mode)
 * 
 * Provides an independent, direct conversational AI pipeline:
 * - Uses shared LLM Runtime (callUnifiedLlmContent)
 * - Skips 12-stage PCA reasoning, evidence graph, adversarial verification, and Bayesian ACH
 * - Enforces foundational security, safety, and global language policies
 * - Streams tokens and operational metadata without PCA trace
 */

import { callUnifiedLlmContent } from './unifiedLlm';
import { ImageAttachment } from './llmProvider';
import { detectUserRequestedLanguage, validateOutputLanguage, buildLanguagePolicyRewritePrompt, DEFAULT_LANGUAGE_POLICY } from './languagePolicy';
import { cleanAiResponseStyle } from './promptOptimizer';

export interface NormalChatRequestOptions {
  question: string;
  history?: Array<{ role: 'user' | 'assistant'; content: string }>;
  tone?: string;
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

export function buildNormalSystemPrompt(tone: string = 'Direct Expert'): string {
  const toneDescriptions: Record<string, string> = {
    'Formal Architect': 'ตอบอย่างเป็นทางการ สุภาพ มีโครงสร้างชัดเจน และเป็นมืออาชีพ',
    'Empathetic Guide': 'ตอบอย่างเห็นอกเห็นใจ เป็นมิตร ให้กำลังใจ และเข้าใจง่าย',
    'Direct Expert': 'ตอบอย่างตรงไปตรงมา กระชับ ชัดเจน รวดเร็ว เน้นเนื้อหาหลักและข้อเท็จจริง'
  };

  const selectedTone = toneDescriptions[tone] || toneDescriptions['Direct Expert'];

  return `คุณคือ FIRE KEEPER AI Assistant ที่ทำงานในโหมดสนทนาทั่วไป (Normal Mode)
เป้าหมายของคุณคือการให้คำตอบที่ถูกต้อง มีประโยชน์ ตรงประเด็น และรวดเร็ว
น้ำเสียงในการตอบ: ${selectedTone}

แนวทางการตอบ:
1. ตอบตรงคำถามของผู้ใช้ ไม่ต้องใส่ขั้นตอนการคิดทางธรรมาภิบาล (PCA Governance) หรือ Epistemic Tags เช่น [FACT], [UNCERTAINTY]
2. จัดรูปแบบคำตอบด้วย Markdown ให้อ่านง่าย มีหัวข้อหรือลำดับข้อตามความเหมาะสม
3. หากคำถามเป็นภาษาไทย ให้ตอบเป็นภาษาไทยที่เป็นธรรมชาติ`;
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
    tone = 'Direct Expert',
    model,
    provider,
    apiKey,
    customBaseUrl,
    ollamaBaseUrl,
    images = [],
    maxOutputTokens = 2048,
    signal
  } = options;

  callbacks?.onStage?.('NormalChat', 'กำลังเตรียมคำสั่งและบริบทการสนทนา (Direct Mode)...');

  const systemInstruction = buildNormalSystemPrompt(tone);

  // Build multi-turn context
  const contentsPayload: any[] = [];
  const recentHistory = history.slice(-8);
  for (const turn of recentHistory) {
    if (turn && turn.content) {
      contentsPayload.push({
        role: turn.role === 'assistant' ? 'assistant' : 'user',
        content: turn.content
      });
    }
  }

  // Push user turn
  contentsPayload.push({
    role: 'user',
    content: question
  });

  callbacks?.onStage?.('Generating', 'กำลังสร้างคำตอบผ่าน AI Runtime...');

  const llmResult = await callUnifiedLlmContent(contentsPayload, {
    provider,
    model,
    systemInstruction,
    apiKey,
    baseUrl: customBaseUrl,
    ollamaBaseUrl,
    images,
    maxOutputTokens,
    signal
  });

  let generatedText = llmResult.text || '';
  generatedText = cleanAiResponseStyle(generatedText, history.length > 0, question);

  // Global Language Policy Check
  const requestedLang = detectUserRequestedLanguage(question);
  let langValidation = validateOutputLanguage(generatedText, requestedLang);

  let retries = 0;
  const maxRetries = DEFAULT_LANGUAGE_POLICY.maxRewriteRetries;
  while (!langValidation.isValid && retries < maxRetries) {
    retries++;
    const rewritePrompt = buildLanguagePolicyRewritePrompt(generatedText, requestedLang);
    try {
      const rewriteResult = await callUnifiedLlmContent(rewritePrompt.userPrompt, {
        provider,
        model,
        systemInstruction: rewritePrompt.systemInstruction,
        apiKey,
        baseUrl: customBaseUrl,
        ollamaBaseUrl,
        images: [],
        maxOutputTokens,
        signal
      });

      const candidate = cleanAiResponseStyle(rewriteResult.text || '', history.length > 0, question);
      const reValidation = validateOutputLanguage(candidate, requestedLang);
      if (reValidation.isValid || reValidation.thaiRatio > langValidation.thaiRatio) {
        generatedText = candidate;
        langValidation = reValidation;
      }
    } catch {
      break;
    }
  }

  // Stream tokens to callback if provided
  if (callbacks?.onToken) {
    const chunkSize = Math.max(20, Math.ceil(generatedText.length / 30));
    for (let i = 0; i < generatedText.length; i += chunkSize) {
      if (signal?.aborted) break;
      const slice = generatedText.slice(i, i + chunkSize);
      callbacks.onToken(slice);
      await new Promise(r => setTimeout(r, 5));
    }
  }

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
