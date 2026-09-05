/**
 * FIRE KEEPER AI Runtime Service
 * Supports:
 *  - DeepSeek API (deepseek-chat, deepseek-reasoner)
 *  - Local Ollama Runtime (qwen3:4b, qwen2.5:3b, local models via http://127.0.0.1:11434)
 * Strict model identity: the requested model is the model used for that request.
 */

import './governedPromptBootstrap';
export * from './ollama';

export interface DeepSeekStreamResult {
  text: string;
  modelUsed: string;
  reasoningContent?: string;
}

export interface DeepSeekContentResult {
  text: string;
  modelUsed: string;
  reasoningContent?: string;
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
  systemInstruction?: string
): Array<{ role: 'system' | 'user' | 'assistant'; content: string }> {
  const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [];

  if (systemInstruction) messages.push({ role: 'system', content: systemInstruction });

  if (typeof contentsPayload === 'string') {
    messages.push({ role: 'user', content: contentsPayload });
  } else if (Array.isArray(contentsPayload)) {
    for (const item of contentsPayload) {
      if (typeof item === 'string') {
        messages.push({ role: 'user', content: item });
      } else if (item && item.role && item.parts) {
        const role = item.role === 'model' || item.role === 'assistant' ? 'assistant' : 'user';
        const textPart = item.parts.map((p: any) => p.text || '').join('\n');
        messages.push({ role, content: textPart });
      } else if (item && item.role && item.content) {
        const role = item.role === 'model' || item.role === 'assistant' ? 'assistant' : 'user';
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
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
  stream = false
) {
  return {
    model,
    messages,
    stream,
    ...(model === 'deepseek-chat' ? { temperature: 0.6 } : {}),
  };
}

export async function callDeepSeekContentWithRetry(
  contentsPayload: any,
  modelName: string = 'deepseek-chat',
  systemInstruction?: string,
  customApiKey?: string
): Promise<DeepSeekContentResult> {
  const apiKey = customApiKey || process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    throw new Error(
      'DEEPSEEK_API_KEY is not configured. DeepSeek is the exclusive runtime engine for FIRE KEEPER. Please provide a valid DeepSeek API Key in settings or environment.'
    );
  }

  const targetModel = normalizeDeepSeekModel(modelName);
  const messages = buildDeepSeekMessages(contentsPayload, systemInstruction);
  let lastError: any = null;

  // Retry the SAME model only. Never silently switch the model identity.
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      console.log(`[DEEPSEEK_ONLY Content] Requesting ${targetModel} - Attempt ${attempt}/2`);
      const response = await fetch('https://api.deepseek.com/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify(buildRequestBody(targetModel, messages)),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`DeepSeek API error (${response.status}): ${errText}`);
      }

      const data = await response.json();
      const reasoning = data.choices?.[0]?.message?.reasoning_content || '';
      const content = data.choices?.[0]?.message?.content || '';

      if (content.trim().length > 0) {
        return { text: content, modelUsed: targetModel, reasoningContent: reasoning };
      }

      throw new Error(`DeepSeek returned an empty final answer for ${targetModel}.`);
    } catch (err: any) {
      lastError = err;
      console.warn(`[DEEPSEEK_ONLY Content Attempt ${attempt} (${targetModel}) failed]:`, err?.message || err);
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
      console.warn(`[DEEPSEEK_ONLY Stream Attempt ${attempt} (${targetModel}) failed]:`, err?.message || err);
      if (attempt === 1) await new Promise((r) => setTimeout(r, 600));
    }
  }

  throw lastError || new Error(`DeepSeek model ${targetModel} stream failed after retries.`);
}
