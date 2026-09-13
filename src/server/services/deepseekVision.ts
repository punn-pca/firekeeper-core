/**
 * FIRE KEEPER DeepSeek Vision Provider
 * Model: deepseek-v4-flash-vision-exp
 * 
 * Provides vision and multimodal capabilities via DeepSeek Vision endpoint.
 * Features:
 *  - Strict MIME & image size validation (PNG, JPEG, WEBP, GIF)
 *  - Multi-image support
 *  - Streaming & content generation with retry
 *  - Non-sensitive, safe audit logging (never logs raw image payloads)
 *  - Strict user & session context isolation
 */

import { injectLanguagePolicyToSystemPrompt } from './languagePolicy';
import { LLMMessage, LLMMessagePart, LLMRequestOptions, LLMResponse, ImageAttachment, ImageValidationResult } from './llmProvider';

export const DEEPSEEK_VISION_MODEL = 'deepseek-v4-flash-vision-exp';
export const MAX_IMAGE_SIZE_BYTES = 20 * 1024 * 1024; // 20 MB max per image

export const SUPPORTED_IMAGE_MIMES = new Set([
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
  'image/gif'
]);

export function getDeepSeekBaseUrl(customUrl?: string): string {
  const url = customUrl || process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com';
  return url.replace(/\/+$/, '');
}

/**
 * Validates an image attachment for format, size, and valid base64 payload.
 */
export function validateImageAttachment(att: any): ImageValidationResult {
  if (!att) {
    return { valid: false, error: 'Attachment object is null or undefined' };
  }

  const rawMime = String(att.type || att.mimeType || '').toLowerCase().trim();
  const filename = String(att.name || '').toLowerCase().trim();

  // Infer mime from filename if missing or generic
  let effectiveMime = rawMime;
  if (!effectiveMime || effectiveMime === 'application/octet-stream') {
    if (filename.endsWith('.png')) effectiveMime = 'image/png';
    else if (filename.endsWith('.jpg') || filename.endsWith('.jpeg')) effectiveMime = 'image/jpeg';
    else if (filename.endsWith('.webp')) effectiveMime = 'image/webp';
    else if (filename.endsWith('.gif')) effectiveMime = 'image/gif';
  }

  // Normalize image/jpg to image/jpeg
  if (effectiveMime === 'image/jpg') effectiveMime = 'image/jpeg';

  if (!SUPPORTED_IMAGE_MIMES.has(effectiveMime)) {
    return {
      valid: false,
      error: `Unsupported image format "${effectiveMime || 'unknown'}". Supported formats: PNG, JPEG, WEBP, GIF.`
    };
  }

  // Check data payload
  const dataUrl = att.dataUrl || att.base64 || '';
  if (!dataUrl || typeof dataUrl !== 'string' || dataUrl.trim().length === 0) {
    return { valid: false, error: `Image "${att.name || 'unnamed'}" contains empty or missing data payload.` };
  }

  // Extract base64 part
  const base64Data = dataUrl.replace(/^data:[^;]+;base64,/, '').trim();
  if (base64Data.length === 0) {
    return { valid: false, error: `Image "${att.name || 'unnamed'}" contains invalid empty base64 string.` };
  }

  // Approximate byte size calculation from base64 length
  const sizeBytes = Math.floor((base64Data.length * 3) / 4);
  if (sizeBytes > MAX_IMAGE_SIZE_BYTES) {
    const sizeMb = (sizeBytes / (1024 * 1024)).toFixed(1);
    return {
      valid: false,
      error: `Image "${att.name || 'unnamed'}" size (${sizeMb} MB) exceeds the maximum allowed limit of 20 MB.`
    };
  }

  // Basic base64 character validation
  if (!/^[A-Za-z0-9+/=_\-\r\n]+$/.test(base64Data.slice(0, 100))) {
    return { valid: false, error: `Image "${att.name || 'unnamed'}" contains corrupt base64 encoding.` };
  }

  return {
    valid: true,
    sanitizedMime: effectiveMime,
    sizeBytes
  };
}

/**
 * Formats image attachment to standard OpenAI-compatible data URL
 */
export function formatImageDataUrl(att: any, sanitizedMime: string): string {
  const raw = String(att.dataUrl || att.base64 || '').trim();
  if (raw.startsWith('data:image/')) {
    return raw;
  }
  const cleanBase64 = raw.replace(/^data:[^;]+;base64,/, '').trim();
  return `data:${sanitizedMime};base64,${cleanBase64}`;
}

/**
 * Builds OpenAI-compatible messages structure with multimodal content
 */
export function buildDeepSeekVisionMessages(
  contentsPayload: any,
  images: ImageAttachment[],
  systemInstruction?: string
): LLMMessage[] {
  const messages: LLMMessage[] = [];

  const effectiveSystemInstruction = injectLanguagePolicyToSystemPrompt(systemInstruction || '');
  if (effectiveSystemInstruction.trim()) {
    messages.push({ role: 'system', content: effectiveSystemInstruction });
  }

  // Multi-turn history turns
  if (Array.isArray(contentsPayload)) {
    for (let i = 0; i < contentsPayload.length; i++) {
      const turn = contentsPayload[i];
      const isLast = i === contentsPayload.length - 1;
      
      if (!isLast) {
        if (typeof turn === 'string') {
          messages.push({ role: 'user', content: turn });
        } else if (turn && turn.role) {
          const role = turn.role === 'model' || turn.role === 'assistant' ? 'assistant' : 'user';
          const text = turn.content || (turn.parts ? turn.parts.map((p: any) => p.text || '').join('\n') : '');
          messages.push({ role, content: text });
        }
      } else {
        // Last turn: inject current question and attached images
        let lastUserText = '';
        if (typeof turn === 'string') {
          lastUserText = turn;
        } else if (turn && turn.parts) {
          lastUserText = turn.parts.map((p: any) => p.text || '').join('\n');
        } else if (turn && turn.content) {
          lastUserText = typeof turn.content === 'string' ? turn.content : JSON.stringify(turn.content);
        }

        const userParts: LLMMessagePart[] = [];
        if (lastUserText.trim()) {
          userParts.push({ type: 'text', text: lastUserText });
        }

        for (const img of images) {
          userParts.push({
            type: 'image_url',
            image_url: {
              url: img.dataUrl,
              detail: 'high'
            }
          });
        }

        messages.push({ role: 'user', content: userParts });
      }
    }
  } else if (typeof contentsPayload === 'string') {
    const userParts: LLMMessagePart[] = [{ type: 'text', text: contentsPayload }];
    for (const img of images) {
      userParts.push({
        type: 'image_url',
        image_url: {
          url: img.dataUrl,
          detail: 'high'
        }
      });
    }
    messages.push({ role: 'user', content: userParts });
  }

  return messages;
}

/**
 * Calls DeepSeek Vision non-streaming content generation with retry
 */
export async function callDeepSeekVisionContentWithRetry(
  contentsPayload: any,
  images: ImageAttachment[],
  modelName: string = DEEPSEEK_VISION_MODEL,
  systemInstruction?: string,
  customApiKey?: string,
  customBaseUrl?: string
): Promise<LLMResponse> {
  const apiKey = customApiKey !== undefined ? customApiKey.trim() : (process.env.DEEPSEEK_API_KEY || '').trim();
  if (!apiKey) {
    throw new Error(
      'DEEPSEEK_API_KEY is not configured. DeepSeek Vision requires a valid DEEPSEEK_API_KEY to process image attachments.'
    );
  }

  const baseUrl = getDeepSeekBaseUrl(customBaseUrl);
  const targetModel = DEEPSEEK_VISION_MODEL;
  const messages = buildDeepSeekVisionMessages(contentsPayload, images, systemInstruction);

  // Safe non-sensitive log (no base64 output)
  const imageSummaries = images.map(img => `${img.name || 'image'} (${img.mimeType}, ~${Math.round(img.size / 1024)}KB)`);
  console.log(`[DeepSeek Vision Content] Processing ${images.length} image(s) [${imageSummaries.join(', ')}] using model ${targetModel}`);

  let lastError: any = null;

  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: targetModel,
          messages,
          stream: false,
          temperature: 0.4,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`DeepSeek Vision API error (${response.status}): ${errText}`);
      }

      const data = await response.json();
      const reasoning = data.choices?.[0]?.message?.reasoning_content || '';
      const content = data.choices?.[0]?.message?.content || '';

      if (content.trim().length > 0) {
        return {
          text: content,
          modelUsed: targetModel,
          provider: 'deepseek_vision',
          reasoningContent: reasoning,
          usage: data.usage
        };
      }

      throw new Error(`DeepSeek Vision returned empty content for ${targetModel}.`);
    } catch (err: any) {
      lastError = err;
      console.warn(`[DeepSeek Vision Attempt ${attempt} failed]:`, err?.message || err);
      if (attempt === 1) await new Promise((r) => setTimeout(r, 800));
    }
  }

  throw lastError || new Error(`DeepSeek Vision model ${targetModel} failed after retries.`);
}

/**
 * Calls DeepSeek Vision streaming generation with retry
 */
export async function callDeepSeekVisionStreamWithRetry(
  contentsPayload: any,
  images: ImageAttachment[],
  onChunk: (text: string) => void,
  modelName: string = DEEPSEEK_VISION_MODEL,
  systemInstruction?: string,
  customApiKey?: string,
  customBaseUrl?: string
): Promise<LLMResponse> {
  const apiKey = customApiKey !== undefined ? customApiKey.trim() : (process.env.DEEPSEEK_API_KEY || '').trim();
  if (!apiKey) {
    throw new Error(
      'DEEPSEEK_API_KEY is not configured. DeepSeek Vision requires a valid DEEPSEEK_API_KEY to process image attachments.'
    );
  }

  const baseUrl = getDeepSeekBaseUrl(customBaseUrl);
  const targetModel = DEEPSEEK_VISION_MODEL;
  const messages = buildDeepSeekVisionMessages(contentsPayload, images, systemInstruction);

  // Safe non-sensitive log
  const imageSummaries = images.map(img => `${img.name || 'image'} (${img.mimeType}, ~${Math.round(img.size / 1024)}KB)`);
  console.log(`[DeepSeek Vision Stream] Streaming ${images.length} image(s) [${imageSummaries.join(', ')}] using model ${targetModel}`);

  let lastError: any = null;

  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      let fullText = '';
      let reasoningAccumulated = '';

      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: targetModel,
          messages,
          stream: true,
          temperature: 0.4,
        }),
      });

      if (!response.ok || !response.body) {
        const errText = await response.text();
        throw new Error(`DeepSeek Vision Stream error (${response.status}): ${errText}`);
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
                onChunk(deltaText);
              }
            } catch {
              // Ignore malformed chunks
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
          provider: 'deepseek_vision',
          reasoningContent: reasoningAccumulated,
        };
      }

      throw new Error(`DeepSeek Vision stream returned no content for ${targetModel}.`);
    } catch (err: any) {
      lastError = err;
      console.warn(`[DeepSeek Vision Stream Attempt ${attempt} failed]:`, err?.message || err);
      if (attempt === 1) await new Promise((r) => setTimeout(r, 800));
    }
  }

  throw lastError || new Error(`DeepSeek Vision model ${targetModel} stream failed after retries.`);
}

/**
 * Diagnostic status check for DeepSeek Vision provider
 */
export function checkDeepSeekVisionStatus(): {
  configured: boolean;
  model: string;
  baseUrl: string;
  supportedFormats: string[];
  maxSizeBytes: number;
} {
  return {
    configured: Boolean(process.env.DEEPSEEK_API_KEY),
    model: DEEPSEEK_VISION_MODEL,
    baseUrl: getDeepSeekBaseUrl(),
    supportedFormats: Array.from(SUPPORTED_IMAGE_MIMES),
    maxSizeBytes: MAX_IMAGE_SIZE_BYTES
  };
}
