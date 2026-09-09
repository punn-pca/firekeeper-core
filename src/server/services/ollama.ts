/**
 * FIRE KEEPER Ollama Local Runtime Service
 * Connects to local Ollama instance (e.g. http://127.0.0.1:11434)
 * Supports Qwen models (qwen3:4b, qwen2.5:3b, etc.) and custom local models.
 */

import { injectLanguagePolicyToSystemPrompt } from './languagePolicy';

export interface OllamaContentResult {
  text: string;
  modelUsed: string;
}

export interface OllamaStreamResult {
  text: string;
  modelUsed: string;
}

export interface OllamaStatusResult {
  online: boolean;
  baseUrl: string;
  models: string[];
  error?: string;
}

export function getOllamaBaseUrl(customUrl?: string): string {
  const url = customUrl || process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434';
  return url.replace(/\/+$/, '');
}

export function normalizeOllamaModel(modelName?: string): string {
  if (!modelName) {
    return process.env.OLLAMA_MODEL || 'qwen3:4b';
  }
  const clean = modelName.trim();
  if (clean.startsWith('ollama:')) {
    const stripped = clean.replace(/^ollama:/i, '').trim();
    return stripped || process.env.OLLAMA_MODEL || 'qwen3:4b';
  }
  return clean;
}

export function isOllamaModel(modelName?: string): boolean {
  if (!modelName) return false;
  const lower = modelName.toLowerCase().trim();
  return (
    lower.startsWith('ollama:') ||
    lower.includes('qwen') ||
    lower.includes('llama') ||
    lower.includes('mistral') ||
    lower.includes('local')
  );
}

export function buildOllamaMessages(
  contentsPayload: any,
  systemInstruction?: string
): Array<{ role: 'system' | 'user' | 'assistant'; content: string }> {
  const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [];

  const effectiveSystemInstruction = injectLanguagePolicyToSystemPrompt(systemInstruction || '');
  if (effectiveSystemInstruction.trim()) {
    messages.push({ role: 'system', content: effectiveSystemInstruction });
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
 * Check if local Ollama daemon is reachable and list downloaded models
 */
export async function checkOllamaStatus(customBaseUrl?: string): Promise<OllamaStatusResult> {
  const baseUrl = getOllamaBaseUrl(customBaseUrl);
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2500);

    const res = await fetch(`${baseUrl}/api/tags`, {
      method: 'GET',
      signal: controller.signal
    });
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      const models = Array.isArray(data.models) ? data.models.map((m: any) => m.name || m.model) : [];
      return {
        online: true,
        baseUrl,
        models
      };
    }
    return {
      online: false,
      baseUrl,
      models: [],
      error: `Ollama returned status ${res.status}`
    };
  } catch (err: any) {
    return {
      online: false,
      baseUrl,
      models: [],
      error: err?.message || 'Could not connect to local Ollama server'
    };
  }
}

/**
 * Call local Ollama chat API with retry
 */
export async function callOllamaContentWithRetry(
  contentsPayload: any,
  modelName: string = 'qwen3:4b',
  systemInstruction?: string,
  customBaseUrl?: string
): Promise<OllamaContentResult> {
  const baseUrl = getOllamaBaseUrl(customBaseUrl);
  const targetModel = normalizeOllamaModel(modelName);
  const messages = buildOllamaMessages(contentsPayload, systemInstruction);

  let lastError: any = null;

  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      console.log(`[Ollama Content] Requesting ${targetModel} at ${baseUrl} - Attempt ${attempt}/2`);

      // Try native Ollama /api/chat endpoint first
      const response = await fetch(`${baseUrl}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: targetModel,
          messages,
          stream: false,
          options: {
            temperature: 0.6
          }
        }),
      });

      if (!response.ok) {
        // Fallback to /v1/chat/completions if /api/chat fails
        const errText = await response.text();
        console.warn(`[Ollama /api/chat error (${response.status})]: ${errText}. Trying /v1/chat/completions fallback...`);

        const v1Response = await fetch(`${baseUrl}/v1/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: targetModel,
            messages,
            stream: false,
            temperature: 0.6
          }),
        });

        if (!v1Response.ok) {
          const v1Err = await v1Response.text();
          throw new Error(`Ollama API error (${response.status}): ${errText || v1Err}`);
        }

        const v1Data = await v1Response.json();
        const content = v1Data.choices?.[0]?.message?.content || '';
        if (content.trim().length > 0) {
          return { text: content, modelUsed: targetModel };
        }
      } else {
        const data = await response.json();
        const content = data.message?.content || '';
        if (content.trim().length > 0) {
          return { text: content, modelUsed: targetModel };
        }
      }

      throw new Error(`Ollama returned an empty response for model "${targetModel}". Please ensure model is pulled: "ollama run ${targetModel}"`);
    } catch (err: any) {
      lastError = err;
      console.warn(`[Ollama Attempt ${attempt} (${targetModel}) failed]:`, err?.message || err);
      if (attempt === 1) await new Promise((r) => setTimeout(r, 600));
    }
  }

  throw (
    lastError ||
    new Error(
      `[FIRE KEEPER OLLAMA SERVICE ALERT] Connection to local Ollama runtime failed for model "${targetModel}". Please ensure Ollama is active (run "ollama serve" in your terminal) and the model "${targetModel}" is pulled.`
    )
  );
}

/**
 * Call local Ollama streaming chat API
 */
export async function callOllamaStreamWithRetry(
  contentsPayload: any,
  onChunk: (text: string) => void,
  modelName: string = 'qwen3:4b',
  systemInstruction?: string,
  customBaseUrl?: string
): Promise<OllamaStreamResult> {
  const baseUrl = getOllamaBaseUrl(customBaseUrl);
  const targetModel = normalizeOllamaModel(modelName);
  const messages = buildOllamaMessages(contentsPayload, systemInstruction);

  let accumulatedText = '';

  try {
    console.log(`[Ollama Stream] Requesting ${targetModel} at ${baseUrl}/api/chat`);
    const response = await fetch(`${baseUrl}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: targetModel,
        messages,
        stream: true,
        options: {
          temperature: 0.6
        }
      }),
    });

    if (!response.ok || !response.body) {
      const errText = await response.text().catch(() => '');
      throw new Error(`Ollama stream error (${response.status}): ${errText}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        try {
          const parsed = JSON.parse(trimmed);
          const chunk = parsed.message?.content || '';
          if (chunk) {
            accumulatedText += chunk;
            onChunk(chunk);
          }
        } catch {
          // Ignore partial or non-json lines
        }
      }
    }

    if (accumulatedText.trim().length > 0) {
      return { text: accumulatedText, modelUsed: targetModel };
    }

    // If stream was empty, fall back to non-streaming content call
    return await callOllamaContentWithRetry(contentsPayload, targetModel, systemInstruction, customBaseUrl);
  } catch (err: any) {
    console.warn('[Ollama Stream failed, falling back to content call]:', err?.message || err);
    return await callOllamaContentWithRetry(contentsPayload, targetModel, systemInstruction, customBaseUrl);
  }
}
