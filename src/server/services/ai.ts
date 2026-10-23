import { sanitizeErrorForLog } from '../security/sanitizeError';
/**
 * FIRE KEEPER AI Runtime Service
 * Supports:
 *  - DeepSeek API (deepseek-chat, deepseek-reasoner)
 *  - Ollama Runtime (qwen3:4b, qwen2.5:3b, models via https://ollama.firekeeper.site)
 * Strict model identity: the requested model is the model used for that request.
 */

import './governedPromptBootstrap';
import { injectLanguagePolicyToSystemPrompt } from './languagePolicy';
export * from './ollama';
export * from './deepseekVision';
export * from './visionRouter';
export * from './llmProvider';

export interface DeepSeekStreamResult {
  text: string;
  modelUsed: string;
  reasoningContent?: string;
  toolCalls?: any[];
}

export interface DeepSeekContentResult {
  text: string;
  modelUsed: string;
  reasoningContent?: string;
  toolCalls?: any[];
}

export function normalizeDeepSeekModel(modelName?: string): 'deepseek-chat' | 'deepseek-reasoner' {
  if (!modelName) return 'deepseek-chat';
  const lower = modelName.toLowerCase().trim();
  if (lower.includes('reasoner') || lower.includes('r1') || lower.includes('reasoning')) {
    return 'deepseek-reasoner';
  }
  return 'deepseek-chat';
}

export function buildDeepSeekMessages(
  contentsPayload: any,
  systemInstruction?: string,
  skipSystemPrompt = false
): Array<{ role: 'system' | 'user' | 'assistant' | 'tool'; content: any; tool_call_id?: string; tool_calls?: any[] }> {
  const messages: Array<{ role: 'system' | 'user' | 'assistant' | 'tool'; content: any; tool_call_id?: string; tool_calls?: any[] }> = [];

  const effectiveSystemInstruction = skipSystemPrompt ? '' : injectLanguagePolicyToSystemPrompt(systemInstruction || '');
  if (effectiveSystemInstruction.trim()) {
    messages.push({ role: 'system', content: effectiveSystemInstruction });
  }

  if (typeof contentsPayload === 'string') {
    messages.push({ role: 'user', content: contentsPayload });
  } else if (Array.isArray(contentsPayload)) {
    for (const item of contentsPayload) {
      if (typeof item === 'string') {
        messages.push({ role: 'user', content: item });
      } else if (item && item.role === 'tool') {
        messages.push({
          role: 'tool',
          tool_call_id: item.tool_call_id || item.toolCallId || 'call_0',
          content: typeof item.content === 'string' ? item.content : JSON.stringify(item.content),
        });
      } else if (item && (item.role === 'assistant' || item.role === 'model') && item.tool_calls) {
        messages.push({
          role: 'assistant',
          content: item.content || null,
          tool_calls: item.tool_calls,
        });
      } else if (item && item.role && item.parts) {
        const role = item.role === 'model' || item.role === 'assistant' ? 'assistant' : 'user';
        const textPart = item.parts.map((p: any) => p.text || '').join('\n');
        messages.push({ role, content: textPart });
      } else if (item && item.role && item.content !== undefined) {
        const role = item.role === 'model' || item.role === 'assistant' ? 'assistant' : (item.role === 'system' ? 'system' : 'user');
        messages.push({ role, content: item.content });
      }
    }
  } else if (contentsPayload) {
    messages.push({ role: 'user', content: JSON.stringify(contentsPayload) });
  }

  return messages;
}

function buildRequestBody(
  model: 'deepseek-chat' | 'deepseek-reasoner',
  messages: Array<any>,
  stream = false,
  options?: { tools?: any[]; tool_choice?: any }
) {
  const body: any = {
    model,
    messages,
    stream,
    ...(model === 'deepseek-chat' ? { temperature: 0.6 } : {}),
  };

  if (Array.isArray(options?.tools) && options.tools.length > 0) {
    body.tools = options.tools;
    if (options.tool_choice) {
      body.tool_choice = options.tool_choice;
    }
  }

  return body;
}

export async function callDeepSeekContentWithRetry(
  contentsPayload: any,
  modelName: string = 'deepseek-chat',
  systemInstruction?: string,
  customApiKey?: string,
  signal?: AbortSignal,
  skipSystemPrompt = false,
  toolsOptions?: { tools?: any[]; tool_choice?: any }
): Promise<DeepSeekContentResult> {
  const apiKey = customApiKey || process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    throw new Error(
      'DEEPSEEK_API_KEY is not configured. DeepSeek is the exclusive runtime engine for FIRE KEEPER. Please provide a valid DeepSeek API Key in settings or environment.'
    );
  }

  const targetModel = normalizeDeepSeekModel(modelName);
  const messages = buildDeepSeekMessages(contentsPayload, systemInstruction, skipSystemPrompt);
  let lastError: any = null;

  // Retry the SAME model only. Never silently switch the model identity.
  for (let attempt = 1; attempt <= 2; attempt++) {
    signal?.throwIfAborted();
    try {
      console.log(`[DEEPSEEK_ONLY Content] Requesting ${targetModel} - Attempt ${attempt}/2`);
      const response = await fetch('https://api.deepseek.com/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify(buildRequestBody(targetModel, messages, false, toolsOptions)),
        signal,
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`DeepSeek API error (${response.status}): ${errText}`);
      }

      const data = await response.json();
      const choice = data.choices?.[0];
      const reasoning = choice?.message?.reasoning_content || '';
      const content = choice?.message?.content || '';
      const toolCalls = choice?.message?.tool_calls;

      if ((Array.isArray(toolCalls) && toolCalls.length > 0) || content.trim().length > 0) {
        return {
          text: content,
          modelUsed: targetModel,
          reasoningContent: reasoning,
          toolCalls: toolCalls && toolCalls.length > 0 ? toolCalls : undefined,
        };
      }

      throw new Error(`DeepSeek returned an empty final answer for ${targetModel}.`);
    } catch (err: any) {
      if (signal?.aborted) throw err;
      lastError = err;
      console.warn(`[DEEPSEEK_ONLY Content Attempt ${attempt} (${targetModel}) failed]:`, sanitizeErrorForLog(err));
      if (attempt === 1) await new Promise((r) => setTimeout(r, 600));
    }
  }

  throw lastError || new Error(`DeepSeek model ${targetModel} failed after retries.`);
}

export async function callDeepSeekStreamWithRetry(
  contentsPayload: any,
  onChunk: (text: string) => void,
  modelName: string = 'deepseek-chat',
  systemInstruction?: string,
  customApiKey?: string
): Promise<DeepSeekStreamResult> {
  const apiKey = customApiKey || process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    throw new Error(
      'DEEPSEEK_API_KEY is not configured. DeepSeek is the exclusive runtime engine for FIRE KEEPER. Please provide a valid DeepSeek API Key in settings or environment.'
    );
  }

  const targetModel = normalizeDeepSeekModel(modelName);
  const messages = buildDeepSeekMessages(contentsPayload, systemInstruction);
  let lastError: any = null;

  // Retry the SAME model only. Reasoning is collected for telemetry but is NEVER sent to onChunk().
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      console.log(`[DEEPSEEK_ONLY Stream] Requesting ${targetModel} - Attempt ${attempt}/2`);
      let fullText = '';
      let reasoningAccumulated = '';

      const response = await fetch('https://api.deepseek.com/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify(buildRequestBody(targetModel, messages, true)),
      });

      if (!response.ok || !response.body) {
        const errText = await response.text();
        throw new Error(`DeepSeek Stream error (${response.status}): ${errText}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';
      let isDone = false;

      try {
        while (!isDone) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith('data:')) continue;
            const dataStr = trimmed.replace(/^data:\s*/, '');
            if (dataStr === '[DONE]') {
              isDone = true;
              break;
            }

            try {
              const parsed = JSON.parse(dataStr);
              const reasoningDelta = parsed.choices?.[0]?.delta?.reasoning_content || '';
              const deltaText = parsed.choices?.[0]?.delta?.content || '';

              if (reasoningDelta) reasoningAccumulated += reasoningDelta;
              if (deltaText) {
                fullText += deltaText;
                // Only final answer content reaches the UI.
                onChunk(deltaText);
              }
            } catch {
              // Ignore malformed/non-JSON SSE lines.
            }
          }
        }
      } finally {
        try {
          await reader.cancel();
        } catch {}
      }

      if (fullText.trim().length > 0) {
        return {
          text: fullText,
          modelUsed: targetModel,
          reasoningContent: reasoningAccumulated,
        };
      }

      throw new Error(`DeepSeek returned no final answer for ${targetModel}.`);
    } catch (err: any) {
      lastError = err;
      console.warn(`[DEEPSEEK_ONLY Stream Attempt ${attempt} (${targetModel}) failed]:`, sanitizeErrorForLog(err));
      if (attempt === 1) await new Promise((r) => setTimeout(r, 600));
    }
  }

  throw lastError || new Error(`DeepSeek model ${targetModel} stream failed after retries.`);
}
