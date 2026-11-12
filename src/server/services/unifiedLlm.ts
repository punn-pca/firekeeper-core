/**
 * FIRE KEEPER Unified Multi-Provider LLM Runtime Engine
 * 
 * Supports:
 * - Default built-in providers: DeepSeek, Ollama (Local & Remote)
 * - Cloud providers: OpenAI, Anthropic Claude, Google Gemini, Groq, OpenRouter, Mistral, Perplexity
 * - Custom Provider: Any user-defined OpenAI-compatible API Endpoint (vLLM, LM Studio, Together AI, etc.)
 * 
 * Complies with PUNN Predictive Cognitive Architecture (PCA v3.0)
 */

import { injectLanguagePolicyToSystemPrompt } from './languagePolicy';
import { FIREKEEPER_RESPONSE_CONTRACT } from './responseContract';
import { GLOBAL_LLM_INPUT_TOKEN_BUDGET, estimateBudgetTokens, fitMessagesToGlobalBudget } from './tokenBudget';
export { GLOBAL_LLM_INPUT_TOKEN_BUDGET, fitMessagesToGlobalBudget } from './tokenBudget';
import { secureOutboundFetch } from '../security/outboundUrlPolicy';
import { callDeepSeekContentWithRetry, callDeepSeekStreamWithRetry } from './ai';
import { callDeepSeekVisionContentWithRetry, callDeepSeekVisionStreamWithRetry } from './deepseekVision';
import { callOllamaContentWithRetry, callOllamaStreamWithRetry, normalizeOllamaModel } from './ollama';
import { ImageAttachment } from './llmProvider';
import { GoogleGenAI } from '@google/genai';

export interface UnifiedLlmOptions {
  provider?: string; // 'deepseek' | 'ollama' | 'openai' | 'anthropic' | 'gemini' | 'groq' | 'openrouter' | 'mistral' | 'perplexity' | 'custom'
  model?: string;
  systemInstruction?: string;
  /** Skip caller-supplied system instructions. The mandatory FIREKEEPER response contract is always injected by the unified runtime. */
  skipSystemPrompt?: boolean;
  apiKey?: string;
  baseUrl?: string;
  ollamaBaseUrl?: string;
  attachments?: any[];
  images?: ImageAttachment[];
  temperature?: number;
  /** Provider output-token ceiling selected by runtime depth. */
  maxOutputTokens?: number;
  signal?: AbortSignal;
  tools?: any[];
  toolChoice?: any;
}


export interface UnifiedLlmResult {
  text: string;
  modelUsed: string;
  providerUsed: string;
  reasoningContent?: string;
  toolCalls?: any[];
  finishReason?: string;
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
}

export const PROVIDER_DEFAULT_BASE_URLS: Record<string, string> = {
  deepseek: 'https://api.deepseek.com',
  openai: 'https://api.openai.com/v1',
  anthropic: 'https://api.anthropic.com/v1',
  gemini: 'https://generativelanguage.googleapis.com/v1beta/openai',
  groq: 'https://api.groq.com/openai/v1',
  openrouter: 'https://openrouter.ai/api/v1',
  mistral: 'https://api.mistral.ai/v1',
  perplexity: 'https://api.perplexity.ai',
  ollama: 'https://ollama.firekeeper.site',
};

export const PROVIDER_DEFAULT_MODELS: Record<string, string> = {
  deepseek: 'deepseek-chat',
  'deepseek_vision': 'deepseek-v4-flash-vision-exp',
  ollama: 'qwen3:4b',
  openai: 'gpt-4o',
  anthropic: 'claude-3-7-sonnet-20250219',
  gemini: 'gemini-3.8-flash',
  groq: 'openai/gpt-oss-120b',
  openrouter: 'anthropic/claude-3.7-sonnet',
  mistral: 'mistral-large-latest',
  perplexity: 'sonar-pro',
  custom: 'custom-model',
};

/**
 * Normalizes Gemini model names to the latest available active models (Gemini 3.8 / 3.7 / 3.1 / Flash).
 */
export function normalizeGeminiModel(rawModel?: string): string {
  const m = (rawModel || '').toLowerCase().trim();
  if (m === 'gemini-3.1-pro-preview' || m === 'gemini-3.1-pro' || m === 'gemini-pro' || m.includes('2.5-pro') || m.includes('1.5-pro')) {
    return 'gemini-3.1-pro-preview';
  }
  if (m === 'gemini-3.7-flash' || m === 'gemini-3.7') {
    return 'gemini-3.7-flash';
  }
  if (m === 'gemini-3.1-flash-lite' || m === 'gemini-flash-lite' || m === 'gemini-lite') {
    return 'gemini-3.1-flash-lite';
  }
  if (m === 'gemini-flash-latest') {
    return 'gemini-flash-latest';
  }
  if (m === 'gemini-3.8-flash' || m === 'gemini-3.8' || m === 'gemini-flash' || m.includes('2.5-flash') || m.includes('2.0-flash') || m.includes('1.5-flash') || m === 'gemini') {
    return 'gemini-3.8-flash';
  }
  return rawModel || 'gemini-3.8-flash';
}

/**
 * Normalizes input messages from various internal payload formats into standard OpenAI-compatible messages.
 */
export function buildStandardMessages(
  contentsPayload: any,
  systemInstruction?: string,
  images?: ImageAttachment[] | Array<{ mimeType: string; base64?: string; dataUrl?: string; name?: string }>,
  skipSystemPrompt = false
): Array<{ role: 'system' | 'user' | 'assistant'; content: any }> {
  const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: any }> = [];

  const effectiveSystem = skipSystemPrompt ? '' : injectLanguagePolicyToSystemPrompt(systemInstruction || '');

  if (effectiveSystem.trim()) {
    messages.push({ role: 'system', content: effectiveSystem });
  }

  const formatImageUrl = (img: any): string => {
    if (img.dataUrl && typeof img.dataUrl === 'string' && img.dataUrl.startsWith('data:')) {
      return img.dataUrl;
    }
    const b64 = img.base64 || (img.dataUrl ? img.dataUrl.split(',')[1] : '');
    return `data:${img.mimeType || 'image/jpeg'};base64,${b64}`;
  };

  if (typeof contentsPayload === 'string') {
    if (images && images.length > 0) {
      const parts: any[] = [{ type: 'text', text: contentsPayload }];
      for (const img of images) {
        parts.push({
          type: 'image_url',
          image_url: {
            url: formatImageUrl(img),
          },
        });
      }
      messages.push({ role: 'user', content: parts });
    } else {
      messages.push({ role: 'user', content: contentsPayload });
    }
  } else if (Array.isArray(contentsPayload)) {
    for (let i = 0; i < contentsPayload.length; i++) {
      const item = contentsPayload[i];
      const isLastUser = i === contentsPayload.length - 1;

      if (typeof item === 'string') {
        if (isLastUser && images && images.length > 0) {
          const parts: any[] = [{ type: 'text', text: item }];
          for (const img of images) {
            parts.push({
              type: 'image_url',
              image_url: { url: formatImageUrl(img) },
            });
          }
          messages.push({ role: 'user', content: parts });
        } else {
          messages.push({ role: 'user', content: item });
        }
      } else if (item && item.role) {
        const role = item.role === 'model' || item.role === 'assistant' ? 'assistant' : 'user';
        let textContent = '';
        if (item.parts && Array.isArray(item.parts)) {
          textContent = item.parts.map((p: any) => p.text || '').join('\n');
        } else if (typeof item.content === 'string') {
          textContent = item.content;
        } else if (Array.isArray(item.content)) {
          textContent = item.content.map((p: any) => (typeof p === 'string' ? p : p.text || '')).join('\n');
        }

        if (role === 'user' && isLastUser && images && images.length > 0) {
          const parts: any[] = [{ type: 'text', text: textContent }];
          for (const img of images) {
            parts.push({
              type: 'image_url',
              image_url: { url: formatImageUrl(img) },
            });
          }
          messages.push({ role: 'user', content: parts });
        } else {
          messages.push({ role, content: textContent });
        }
      }
    }
  }

  return messages;
}

/**
 * Calls Anthropic Claude API natively (/v1/messages)
 */
async function callAnthropicApi(
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: any }>,
  model: string,
  apiKey: string,
  baseUrl?: string,
  signal?: AbortSignal,
  maxOutputTokens: number = 8192
): Promise<UnifiedLlmResult> {
  const effectiveBaseUrl = (baseUrl || 'https://api.anthropic.com/v1').replace(/\/+$/, '');
  const url = `${effectiveBaseUrl}/messages`;

  // Compact the complete provider payload before splitting Anthropic's system field.
  // This prevents a large systemInstruction from bypassing the global budget.
  const compactMessages = fitMessagesToGlobalBudget(messages, GLOBAL_LLM_INPUT_TOKEN_BUDGET);
  let systemText = '';
  const anthropicMessages: Array<{ role: 'user' | 'assistant'; content: any }> = [];

  for (const msg of compactMessages) {
    if (msg.role === 'system') {
      systemText += (typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content)) + '\n';
    } else {
      let content = msg.content;
      if (Array.isArray(content)) {
        content = content.map((part) => {
          if (part.type === 'text') return { type: 'text', text: part.text };
          if (part.type === 'image_url' && part.image_url?.url) {
            const dataUrlMatch = part.image_url.url.match(/^data:([^;]+);base64,(.+)$/);
            if (dataUrlMatch) {
              return {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: dataUrlMatch[1],
                  data: dataUrlMatch[2]
                }
              };
            }
          }
          return { type: 'text', text: JSON.stringify(part) };
        });
      }
      anthropicMessages.push({ role: msg.role as 'user' | 'assistant', content });
    }
  }

  const response = await secureOutboundFetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      messages: anthropicMessages,
      max_tokens: Math.max(8192, maxOutputTokens),
      ...(systemText.trim() ? { system: systemText.trim() } : {}),
    }),
    signal,
  }, 'customBaseUrl');

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Anthropic API error (${response.status}): ${errText}`);
  }

  const data = await response.json();
  let text = '';
  let reasoning = '';

  if (Array.isArray(data.content)) {
    for (const block of data.content) {
      if (block.type === 'text') text += block.text;
      if (block.type === 'thinking' || block.type === 'reasoning') reasoning += block.thinking || block.text || '';
    }
  }

  return {
    text,
    modelUsed: data.model || model,
    providerUsed: 'anthropic',
    reasoningContent: reasoning || undefined,
    usage: {
      promptTokens: data.usage?.input_tokens,
      completionTokens: data.usage?.output_tokens,
      totalTokens: (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0)
    }
  };
}

/**
 * Native Google Gemini API Caller using @google/genai SDK
 */
async function callGeminiApi(
  contentsPayload: any,
  rawModel: string,
  apiKey: string,
  systemInstruction?: string,
  images?: ImageAttachment[] | Array<{ mimeType: string; base64?: string; dataUrl?: string; name?: string }>,
  temperature?: number,
  signal?: AbortSignal,
  maxOutputTokens?: number,
  skipSystemPrompt = false
): Promise<UnifiedLlmResult> {
  const model = normalizeGeminiModel(rawModel);
  const ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });

  const parts: any[] = [];
  let promptText = '';

  const compactMessages = fitMessagesToGlobalBudget(
    buildStandardMessages(contentsPayload, systemInstruction, images, skipSystemPrompt),
    GLOBAL_LLM_INPUT_TOKEN_BUDGET
  );
  const compactSystem = compactMessages
    .filter((m) => m.role === 'system')
    .map((m) => typeof m.content === 'string' ? m.content : JSON.stringify(m.content))
    .join('\n');
  promptText = compactMessages
    .filter((m) => m.role !== 'system')
    .map((m) => typeof m.content === 'string'
      ? m.content
      : Array.isArray(m.content)
        ? m.content.map((p: any) => typeof p === 'string' ? p : p?.text || '').join('\n')
        : JSON.stringify(m.content))
    .join('\n\n');

  if (images && images.length > 0) {
    for (const img of images) {
      let b64 = img.base64;
      if (!b64 && img.dataUrl && img.dataUrl.includes(',')) {
        b64 = img.dataUrl.split(',')[1];
      }
      if (b64) {
        parts.push({
          inlineData: {
            mimeType: img.mimeType || 'image/jpeg',
            data: b64,
          },
        });
      }
    }
  }

  if (promptText) {
    parts.push({ text: promptText });
  }

  const effectiveSystem = skipSystemPrompt ? '' : (compactSystem || injectLanguagePolicyToSystemPrompt(systemInstruction || ''));

  try {
    const response = await ai.models.generateContent({
      model,
      contents: parts.length > 0 ? { parts } : promptText,
      config: {
        ...(signal ? { abortSignal: signal } : {}),
        ...(effectiveSystem.trim() ? { systemInstruction: effectiveSystem } : {}),
        ...(typeof temperature === 'number' ? { temperature } : {}),
        // No FIREKEEPER output cap; Gemini applies its own model/provider maximum.
      },
    });

    const text = response.text || '';
    return {
      text,
      modelUsed: model,
      providerUsed: 'gemini',
      usage: {
        promptTokens: response.usageMetadata?.promptTokenCount,
        completionTokens: response.usageMetadata?.candidatesTokenCount,
        totalTokens: response.usageMetadata?.totalTokenCount,
      },
    };
  } catch (err: any) {
    const msg = err?.message || String(err);
    if (msg.includes('403') || msg.includes('PERMISSION_DENIED') || msg.includes('denied access')) {
      throw new Error(
        `Gemini API Error (403 PERMISSION_DENIED): โปรเจกต์ Google Cloud หรือ API Key นี้ถูกปฏิเสธสิทธิ์การเข้าถึง (Project denied access)\n` +
        `• สาเหตุ: API Key นี้ถูกจำกัดสิทธิ์ / ยังไม่ได้เปิด Generative Language API ใน Cloud Project หรือติดเงื่อนไขบัญชี\n` +
        `• วิธีแก้ไข: กรุณาสร้าง Gemini API Key ใหม่จาก Google AI Studio (https://aistudio.google.com/app/apikey) หรือสลับไปใช้ผู้ให้บริการอื่น เช่น DeepSeek / Ollama`
      );
    }
    if (msg.includes('404') || msg.includes('NOT_FOUND') || msg.includes('not found')) {
      throw new Error(
        `Gemini API Error (404 NOT_FOUND): ไม่พบโมเดล "${model}" หรือโมเดลรุ่นนี้ถูกปลดระวางแล้ว กรุณาเลือกใช้โมเดลรุ่นล่าสุด เช่น gemini-3.8-flash หรือ gemini-3.7-flash`
      );
    }
    if (msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED') || msg.includes('quota')) {
      throw new Error(
        `Gemini API Error (429 QUOTA_EXCEEDED): คุณเรียกใช้งานเกินโควตาที่กำหนดสำหรับ API Key นี้ กรุณารอสักครู่หรือเปลี่ยนไปใช้ API Key อื่น`
      );
    }
    throw err;
  }
}

/**
 * Universal OpenAI-Compatible API Caller (Used for OpenAI, Groq, OpenRouter, Mistral, Perplexity, and Custom APIs)
 */
async function callOpenAiCompatibleApi(
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: any }>,
  model: string,
  provider: string,
  apiKey: string,
  baseUrl?: string,
  temperature?: number,
  signal?: AbortSignal,
  maxOutputTokens?: number
): Promise<UnifiedLlmResult> {
  let effectiveBaseUrl = baseUrl || PROVIDER_DEFAULT_BASE_URLS[provider] || 'https://api.openai.com/v1';
  effectiveBaseUrl = effectiveBaseUrl.replace(/\/+$/, '');

  let endpoint = `${effectiveBaseUrl}/chat/completions`;
  if (effectiveBaseUrl.endsWith('/chat/completions')) {
    endpoint = effectiveBaseUrl;
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (apiKey) {
    headers['Authorization'] = `Bearer ${apiKey}`;
  }

  if (provider === 'openrouter') {
    headers['HTTP-Referer'] = 'https://firekeeper.site';
    headers['X-Title'] = 'FIRE KEEPER Decision Intelligence';
  }

  // Input/context is capped before dispatch. Do not set max_tokens here:
  // the provider/model controls its own maximum generated output.
  let requestMessages = fitMessagesToGlobalBudget(
    messages,
    GLOBAL_LLM_INPUT_TOKEN_BUDGET
  );
  const estimatedPromptTokens = estimateGroqPromptTokens(requestMessages);

  if (estimatedPromptTokens > GLOBAL_LLM_INPUT_TOKEN_BUDGET) {
    throw new Error(
      `LLM_CONTEXT_TOO_LARGE: Essential system instructions and the latest user message require an estimated ${estimatedPromptTokens} tokens; the global input budget is ${GLOBAL_LLM_INPUT_TOKEN_BUDGET}.`
    );
  }

  const requestBody: any = {
    model,
    messages: requestMessages,
    ...(typeof temperature === 'number' ? { temperature } : {}),

  };

  // Continue only when an OpenAI-compatible provider explicitly reports that
  // it stopped at its native output ceiling. Never label a length-stopped
  // partial response as complete; no application output-token cap is applied.
  const MAX_LENGTH_CONTINUATIONS = 2;
  let combinedText = '';
  let combinedReasoning = '';
  let promptTokens = 0;
  let completionTokens = 0;
  let totalTokens = 0;
  let finalFinishReason: string | undefined;
  let actualModel = model;

  for (let continuation = 0; continuation <= MAX_LENGTH_CONTINUATIONS; continuation++) {
    signal?.throwIfAborted();
    const bodyMessages = continuation === 0
      ? requestMessages
      : fitMessagesToGlobalBudget([
          ...requestMessages.filter((item: any) => item.role === 'system' || item.role === 'user'),
          { role: 'assistant', content: combinedText },
          { role: 'user', content: 'Continue the response from exactly where it stopped. Do not repeat prior text. Finish all remaining sections and provide a clear ending.' },
        ], GLOBAL_LLM_INPUT_TOKEN_BUDGET);
    const bodyEstimate = estimateGroqPromptTokens(bodyMessages);
    if (bodyEstimate > GLOBAL_LLM_INPUT_TOKEN_BUDGET) {
      throw new Error('LLM_CONTINUATION_CONTEXT_TOO_LARGE: Cannot safely continue within the input budget; refusing to publish a partial answer.');
    }

    const response = await secureOutboundFetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify({ ...requestBody, messages: bodyMessages }),
      signal,
    }, 'customBaseUrl');

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`${provider.toUpperCase()} API error (${response.status}): ${errText}`);
    }

    const data = await response.json();
    const choice = data.choices?.[0];
    const message = choice?.message;
    const deltaText = message?.content || choice?.text || '';
    const reasoning = message?.reasoning_content || message?.reasoning || '';
    const finishReason = String(choice?.finish_reason || '').toLowerCase();
    if (typeof deltaText === 'string') combinedText += deltaText;
    if (reasoning) combinedReasoning += reasoning;
    actualModel = data.model || actualModel;
    promptTokens += Number(data.usage?.prompt_tokens || 0);
    completionTokens += Number(data.usage?.completion_tokens || 0);
    totalTokens += Number(data.usage?.total_tokens || 0);
    finalFinishReason = finishReason || finalFinishReason;

    if (finishReason !== 'length' && finishReason !== 'max_tokens') {
      return {
        text: combinedText,
        modelUsed: actualModel,
        providerUsed: provider,
        reasoningContent: combinedReasoning || undefined,
        finishReason: finalFinishReason,
        usage: {
          promptTokens: promptTokens || undefined,
          completionTokens: completionTokens || undefined,
          totalTokens: totalTokens || undefined,
        },
      };
    }
    if (!String(deltaText).trim()) {
      throw new Error('LLM_OUTPUT_TRUNCATED: Provider reached its output limit without continuation text.');
    }
  }

  throw new Error(`LLM_OUTPUT_TRUNCATED: ${provider.toUpperCase()} reached its native output limit after ${MAX_LENGTH_CONTINUATIONS} continuation attempts; partial text was not accepted as complete.`);
}

/** Provider-neutral token estimator retained for compatibility. */
export function estimateGroqPromptTokens(messages: Array<{ role: string; content: any }>): number {
  return estimateBudgetTokens(messages);
}

/** Backward-compatible alias; budget is now global across providers. */
export const fitGroqMessagesToBudget = fitMessagesToGlobalBudget;

/**
 * Universal Unified LLM Content Execution
 */
export async function callUnifiedLlmContent(
  contentsPayload: any,
  options: UnifiedLlmOptions
): Promise<UnifiedLlmResult> {
  options.signal?.throwIfAborted();
  // Output length is not constrained by the shared input budget.
  // Each provider enforces only its native model/API maximum.
  // One canonical response/tag contract is injected before provider routing.
  // It applies to normal, governed, streaming and BYOK/custom model calls.
  options.systemInstruction = [
    FIREKEEPER_RESPONSE_CONTRACT,
    options.systemInstruction || ''
  ].filter(Boolean).join('\n\n');
  options.skipSystemPrompt = false;
  // Groq is the free primary runtime. Explicit provider selection is still respected for BYOK/custom runtimes.
  const provider = (options.provider || 'groq').toLowerCase().trim();
  const rawModel = options.model || PROVIDER_DEFAULT_MODELS[provider] || PROVIDER_DEFAULT_MODELS.groq;
  const customApiKey = options.apiKey;
  const customBaseUrl = options.baseUrl;

  // 1. Ollama Provider
  if (provider === 'ollama' || rawModel.startsWith('ollama:')) {
    const targetModel = normalizeOllamaModel(rawModel);
    const ollamaRes = await callOllamaContentWithRetry(
      contentsPayload,
      targetModel,
      options.systemInstruction,
      options.ollamaBaseUrl || customBaseUrl,
      options.signal,
      options.skipSystemPrompt
    );
    return {
      text: ollamaRes.text,
      modelUsed: `ollama:${targetModel}`,
      providerUsed: 'ollama'
    };
  }

  // 2. DeepSeek Vision Provider (Images attached or explicit vision)
  if (provider === 'deepseek_vision' || (options.images && options.images.length > 0 && provider === 'deepseek')) {
    const finalApiKey = customApiKey || process.env.DEEPSEEK_API_KEY;
    if (!finalApiKey) {
      throw new Error('DEEPSEEK_API_KEY is required for DeepSeek Vision.');
    }
    const visionRes = await callDeepSeekVisionContentWithRetry(
      contentsPayload,
      options.images || [],
      'deepseek-v4-flash-vision-exp',
      options.systemInstruction,
      finalApiKey,
      customBaseUrl,
      options.signal,
      options.skipSystemPrompt
    );
    return {
      text: visionRes.text,
      modelUsed: 'deepseek-v4-flash-vision-exp',
      providerUsed: 'deepseek_vision'
    };
  }

  // 3. DeepSeek Text Provider (explicitly selected only)
  if (provider === 'deepseek') {
    const finalApiKey = customApiKey || process.env.DEEPSEEK_API_KEY;
    if (!finalApiKey) {
      throw new Error('DEEPSEEK_API_KEY is not configured. Please enter your API Key or select another provider.');
    }
    const dsRes = await callDeepSeekContentWithRetry(
      contentsPayload,
      rawModel,
      options.systemInstruction,
      finalApiKey,
      options.signal,
      options.skipSystemPrompt,
      { tools: options.tools, tool_choice: options.toolChoice }
    );
    return {
      text: dsRes.text,
      modelUsed: dsRes.modelUsed,
      providerUsed: 'deepseek',
      reasoningContent: dsRes.reasoningContent,
      toolCalls: dsRes.toolCalls
    };
  }

  // 4. Anthropic Claude Provider
  if (provider === 'anthropic') {
    const finalApiKey = customApiKey || process.env.ANTHROPIC_API_KEY;
    if (!finalApiKey) {
      throw new Error('Anthropic API Key is required for Claude models.');
    }
    const messages = buildStandardMessages(contentsPayload, options.systemInstruction, options.images, options.skipSystemPrompt);
    return await callAnthropicApi(messages, rawModel, finalApiKey, customBaseUrl, options.signal, options.maxOutputTokens);
  }

  // 5. Google Gemini Provider (Native @google/genai SDK with automatic model migration)
  if (provider === 'gemini') {
    const finalApiKey = customApiKey || process.env.GEMINI_API_KEY;
    if (!finalApiKey) {
      throw new Error('Google Gemini API Key is required. Please enter your Gemini API Key in Chat Settings.');
    }
    const targetModel = normalizeGeminiModel(rawModel);

    // If user provided a custom non-Google base URL (e.g. custom proxy), use OpenAI-compatible caller
    if (customBaseUrl && customBaseUrl.trim() && !customBaseUrl.includes('googleapis.com')) {
      const messages = buildStandardMessages(contentsPayload, options.systemInstruction, options.images, options.skipSystemPrompt);
      return await callOpenAiCompatibleApi(
        messages,
        targetModel,
        'gemini',
        finalApiKey,
        customBaseUrl,
        options.temperature,
        options.signal,
        options.maxOutputTokens
      );
    }

    return await callGeminiApi(
      contentsPayload,
      targetModel,
      finalApiKey,
      options.systemInstruction,
      options.images,
      options.temperature,
      options.signal,
      options.maxOutputTokens,
      options.skipSystemPrompt
    );
  }

  // 6. OpenAI-Compatible Providers (OpenAI, Groq, OpenRouter, Mistral, Perplexity, Custom)
  const providerKeyEnvMap: Record<string, string | undefined> = {
    openai: process.env.OPENAI_API_KEY,
    gemini: process.env.GEMINI_API_KEY,
    groq: process.env.GROQ_API_KEY,
    openrouter: process.env.OPENROUTER_API_KEY,
    mistral: process.env.MISTRAL_API_KEY,
    perplexity: process.env.PERPLEXITY_API_KEY,
  };

  const finalApiKey = customApiKey || providerKeyEnvMap[provider] || '';
  const messages = fitMessagesToGlobalBudget(
    buildStandardMessages(contentsPayload, options.systemInstruction, options.images, options.skipSystemPrompt),
    GLOBAL_LLM_INPUT_TOKEN_BUDGET
  );

  // Groq is the default primary provider. Never silently switch providers;
  // provider identity and model execution must remain consistent for auditability.
  if (provider === 'groq') {
    if (!finalApiKey) {
      throw new Error('The built-in Groq service is not configured on the server. Please contact the FIREKEEPER administrator.');
    }
    return await callOpenAiCompatibleApi(
      messages, rawModel, 'groq', finalApiKey, customBaseUrl,
      options.temperature, options.signal, options.maxOutputTokens
    );
  }

  if (!finalApiKey && provider !== 'custom') {
    throw new Error(`API Key for ${provider.toUpperCase()} is required. Please add your key in Chat Settings.`);
  }

  return await callOpenAiCompatibleApi(
    messages,
    rawModel,
    provider,
    finalApiKey,
    customBaseUrl,
    options.temperature,
    options.signal,
    options.maxOutputTokens
  );
}

/**
 * Universal Connection Tester for Chat Settings Modal
 */
export async function testLlmConnection(options: {
  provider: string;
  model?: string;
  apiKey?: string;
  baseUrl?: string;
}): Promise<{ ok: boolean; message: string; modelUsed?: string; latencyMs?: number }> {
  const start = Date.now();
  try {
    const provider = (options.provider || 'groq').toLowerCase().trim();
    const testPrompt = 'Respond with exactly one word: "OK"';
    
    const result = await callUnifiedLlmContent(testPrompt, {
      provider,
      model: options.model || PROVIDER_DEFAULT_MODELS[provider],
      apiKey: options.apiKey,
      baseUrl: options.baseUrl,
      ollamaBaseUrl: options.baseUrl,
    });

    const latencyMs = Date.now() - start;
    return {
      ok: true,
      message: `เชื่อมต่อสำเร็จ (${latencyMs}ms)`,
      modelUsed: result.modelUsed,
      latencyMs
    };
  } catch (err: any) {
    const latencyMs = Date.now() - start;
    return {
      ok: false,
      message: err.message || 'ไม่สามารถเชื่อมต่อได้',
      latencyMs
    };
  }
}
