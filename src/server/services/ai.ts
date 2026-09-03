/**
 * FIRE KEEPER AI Runtime Service
 * Runtime Policy: DEEPSEEK_ONLY
 * Exclusively executes via official DeepSeek API endpoints (deepseek-chat and deepseek-reasoner).
 * No multi-provider orchestration, no OpenAI, no Gemini fallbacks.
 */

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

/**
 * Standardize model name to supported DeepSeek models
 */
export function normalizeDeepSeekModel(modelName?: string): 'deepseek-chat' | 'deepseek-reasoner' {
  if (!modelName) return 'deepseek-chat';
  const lower = modelName.toLowerCase().trim();
  if (lower.includes('reasoner') || lower.includes('r1') || lower.includes('reasoning')) {
    return 'deepseek-reasoner';
  }
  return 'deepseek-chat';
}

/**
 * Helper to normalize diverse input payloads into DeepSeek messages format
 */
export function buildDeepSeekMessages(
  contentsPayload: any,
  systemInstruction?: string
): Array<{ role: 'system' | 'user' | 'assistant'; content: string }> {
  const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [];

  if (systemInstruction) {
    messages.push({ role: 'system', content: systemInstruction });
  }

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

/**
 * Direct non-streaming call to DeepSeek API
 */
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

  const modelsToTry: Array<'deepseek-chat' | 'deepseek-reasoner'> = [
    targetModel,
    targetModel === 'deepseek-chat' ? 'deepseek-reasoner' : 'deepseek-chat',
  ];
  let lastError: any = null;

  for (const m of modelsToTry) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        console.log(`[DEEPSEEK_ONLY Content] Requesting DeepSeek API (${m}) - Attempt ${attempt}/2`);
        const response = await fetch('https://api.deepseek.com/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: m,
            messages,
            temperature: m === 'deepseek-reasoner' ? undefined : 0.6,
          }),
        });

        if (!response.ok) {
          const errText = await response.text();
          throw new Error(`DeepSeek API error (${response.status}): ${errText}`);
        }

        const data = await response.json();
        const reasoning = data.choices?.[0]?.message?.reasoning_content || '';
        const content = data.choices?.[0]?.message?.content || '';
        const fullText = (reasoning ? `[DeepSeek Reasoning:\n${reasoning}\n]\n\n` : '') + content;

        if (fullText.trim().length > 0) {
          return {
            text: fullText,
            modelUsed: m,
            reasoningContent: reasoning,
          };
        }
      } catch (err: any) {
        lastError = err;
        console.warn(`[DEEPSEEK_ONLY Content Attempt ${attempt} (${m}) failed]:`, err?.message || err);
        if (attempt === 1) {
          await new Promise((r) => setTimeout(r, 600));
        }
      }
    }
  }

  throw lastError || new Error('All DeepSeek endpoints failed.');
}

/**
 * Direct real-time streaming call to DeepSeek API
 */
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

  const modelsToTry: Array<'deepseek-chat' | 'deepseek-reasoner'> = [
    targetModel,
    targetModel === 'deepseek-chat' ? 'deepseek-reasoner' : 'deepseek-chat',
  ];
  let lastError: any = null;

  for (const m of modelsToTry) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        console.log(`[DEEPSEEK_ONLY Stream] Requesting DeepSeek API Stream (${m}) - Attempt ${attempt}/2`);
        let fullText = '';
        let reasoningAccumulated = '';

        const response = await fetch('https://api.deepseek.com/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: m,
            messages,
            stream: true,
            temperature: m === 'deepseek-reasoner' ? undefined : 0.6,
          }),
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

                if (reasoningDelta) {
                  reasoningAccumulated += reasoningDelta;
                  onChunk(reasoningDelta); 
                }
                if (deltaText) {
                  fullText += deltaText;
                  onChunk(deltaText); 
                }
              } catch {
                // skip non-JSON line
              }
            }
          }
        } finally {
          try {
            await reader.cancel();
          } catch {}
        }

        const totalOutput = fullText || reasoningAccumulated;
        if (totalOutput.trim().length > 0) {
          return {
            text: fullText,
            modelUsed: m,
            reasoningContent: reasoningAccumulated,
          };
        }
      } catch (err: any) {
        lastError = err;
        console.warn(`[DEEPSEEK_ONLY Stream Attempt ${attempt} (${m}) failed]:`, err?.message || err);
        if (attempt === 1) {
          await new Promise((r) => setTimeout(r, 600));
        }
      }
    }
  }

  throw lastError || new Error('All DeepSeek stream connections failed.');
}
