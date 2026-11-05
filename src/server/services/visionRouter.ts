/**
 * FIRE KEEPER Request Router & Vision Detection Engine
 * 
 * Rules:
 *  1. Backend is the SOLE authority for provider & model routing. Frontend never decides.
 *  2. Groq is the default hosted provider for text and image requests.
 *  3. Image requests use Groq's vision-capable qwen/qwen3.8-27b model.
 *  4. Other providers remain explicit BYOK selections.
 *  5. Validates all image attachments strictly and separates documents from images.
 */

import { validateImageAttachment, formatImageDataUrl, DEEPSEEK_VISION_MODEL, SUPPORTED_IMAGE_MIMES } from './deepseekVision';
import { ImageAttachment } from './llmProvider';
import { isOllamaModel, normalizeOllamaModel } from './ollama';

export interface RouteResolution {
  provider: 'ollama' | 'deepseek' | 'deepseek_vision' | 'openai' | 'anthropic' | 'gemini' | 'groq' | 'openrouter' | 'mistral' | 'perplexity' | 'custom' | string;
  model: string;
  hasImages: boolean;
  images: ImageAttachment[];
  nonImageAttachments: any[];
  invalidImages: Array<{ name: string; error: string }>;
  routingReason: string;
  decisionAuthority: 'SERVER_ROUTER_EXCLUSIVE';
  timestamp: string;
}

/**
 * Checks whether an attachment is an image based on MIME type or filename extension.
 */
export function isImageAttachment(att: any): boolean {
  if (!att) return false;
  const mime = String(att.type || att.mimeType || '').toLowerCase().trim();
  const name = String(att.name || '').toLowerCase().trim();

  if (SUPPORTED_IMAGE_MIMES.has(mime) || mime.startsWith('image/')) {
    return true;
  }

  if (name.match(/\.(png|jpe?g|webp|gif)$/i)) {
    return true;
  }

  const dataUrl = String(att.dataUrl || att.base64 || '').trim();
  if (dataUrl.startsWith('data:image/')) {
    return true;
  }

  return false;
}

/**
 * Inspects all attachments and separates validated images from non-image files.
 */
export function inspectAttachments(attachments: any[]): {
  images: ImageAttachment[];
  nonImageAttachments: any[];
  invalidImages: Array<{ name: string; error: string }>;
} {
  const images: ImageAttachment[] = [];
  const nonImageAttachments: any[] = [];
  const invalidImages: Array<{ name: string; error: string }> = [];

  if (!Array.isArray(attachments) || attachments.length === 0) {
    return { images, nonImageAttachments, invalidImages };
  }

  for (const att of attachments) {
    if (isImageAttachment(att)) {
      const validation = validateImageAttachment(att);
      if (validation.valid && validation.sanitizedMime) {
        images.push({
          name: att.name || 'image',
          mimeType: validation.sanitizedMime,
          size: validation.sizeBytes || att.size || 0,
          dataUrl: formatImageDataUrl(att, validation.sanitizedMime),
        });
      } else {
        invalidImages.push({
          name: att.name || 'unnamed_image',
          error: validation.error || 'Invalid image payload',
        });
      }
    } else {
      nonImageAttachments.push(att);
    }
  }

  return { images, nonImageAttachments, invalidImages };
}

/**
 * Core Request Router: Analyzes input question, attachments, and requested model to determine the LLM provider.
 * 
 * Strict Invariant:
 * - Default text -> Groq GPT-OSS 120B
 * - Default images -> Groq Qwen 3.8 27B Vision
 * - Other providers require explicit selection
 */
export function routeRequest(
  question: string,
  attachments: any[] = [],
  requestedModel?: string,
  explicitProvider?: string
): RouteResolution {
  const { images, nonImageAttachments, invalidImages } = inspectAttachments(attachments);
  const hasImages = images.length > 0;
  const timestamp = new Date().toISOString();
  const normalizedExplicit = (explicitProvider || '').toLowerCase().trim();

  // Explicit BYOK providers remain selectable. The built-in Free runtime is
  // Groq; image requests use Groq's vision-capable Qwen model, never GPT-OSS.
  if (normalizedExplicit && !['groq', 'deepseek', 'ollama', 'deepseek_vision'].includes(normalizedExplicit)) {
    return {
      provider: normalizedExplicit,
      model: requestedModel || 'custom-model',
      hasImages,
      images,
      nonImageAttachments,
      invalidImages,
      routingReason: `Routed to explicitly selected BYOK provider: ${normalizedExplicit}`,
      decisionAuthority: 'SERVER_ROUTER_EXCLUSIVE',
      timestamp,
    };
  }

  if (normalizedExplicit === 'groq' || (!normalizedExplicit && (
    requestedModel === 'qwen/qwen3.8-27b' ||
    requestedModel?.startsWith('openai/gpt-oss-')
  ))) {
    const visionModel = 'qwen/qwen3.8-27b';
    const supportedGroqModels = ['openai/gpt-oss-120b', 'openai/gpt-oss-20b', visionModel];
    const selectedGroqModel = supportedGroqModels.includes(requestedModel || '')
      ? requestedModel!
      : 'openai/gpt-oss-120b';
    const model = hasImages ? visionModel : selectedGroqModel;
    return {
      provider: 'groq',
      model,
      hasImages,
      images,
      nonImageAttachments,
      invalidImages,
      routingReason: hasImages
        ? `Groq vision route selected (${visionModel}) for ${images.length} image attachment(s)`
        : `Groq text route selected (${model})`,
      decisionAuthority: 'SERVER_ROUTER_EXCLUSIVE',
      timestamp,
    };
  }

  // Image requests without an explicit provider use Groq's supported vision
  // model. Explicit DeepSeek vision remains available only to entitled BYOK users.
  if (hasImages) {
    return {
      provider: normalizedExplicit === 'deepseek' || normalizedExplicit === 'deepseek_vision' ? 'deepseek_vision' : 'groq',
      model: normalizedExplicit === 'deepseek' || normalizedExplicit === 'deepseek_vision'
        ? DEEPSEEK_VISION_MODEL
        : 'qwen/qwen3.8-27b',
      hasImages: true,
      images,
      nonImageAttachments,
      invalidImages,
      routingReason: normalizedExplicit === 'deepseek' || normalizedExplicit === 'deepseek_vision'
        ? `Explicit DeepSeek Vision route (${DEEPSEEK_VISION_MODEL})`
        : 'Image request routed to Groq vision model (qwen/qwen3.8-27b)',
      decisionAuthority: 'SERVER_ROUTER_EXCLUSIVE',
      timestamp,
    };
  }

  const isRequestedVision = requestedModel === DEEPSEEK_VISION_MODEL || requestedModel?.includes('deepseek-vision');
  if (isRequestedVision || normalizedExplicit === 'deepseek_vision') {
    return {
      provider: 'deepseek_vision',
      model: DEEPSEEK_VISION_MODEL,
      hasImages: false,
      images: [],
      nonImageAttachments,
      invalidImages,
      routingReason: `Explicitly routed to DeepSeek Vision (${DEEPSEEK_VISION_MODEL})`,
      decisionAuthority: 'SERVER_ROUTER_EXCLUSIVE',
      timestamp,
    };
  }

  const lower = (requestedModel || '').toLowerCase();
  if (lower.startsWith('gpt-') || lower.startsWith('o1') || lower.startsWith('o3') || lower.startsWith('chatgpt')) {
    return {
      provider: 'openai',
      model: requestedModel || 'gpt-4o',
      hasImages: false,
      images: [],
      nonImageAttachments,
      invalidImages,
      routingReason: `Routed to OpenAI (${requestedModel})`,
      decisionAuthority: 'SERVER_ROUTER_EXCLUSIVE',
      timestamp,
    };
  }
  if (lower.startsWith('claude-')) {
    return {
      provider: 'anthropic',
      model: requestedModel || 'claude-3-7-sonnet-20250219',
      hasImages: false,
      images: [],
      nonImageAttachments,
      invalidImages,
      routingReason: `Routed to Anthropic Claude (${requestedModel})`,
      decisionAuthority: 'SERVER_ROUTER_EXCLUSIVE',
      timestamp,
    };
  }
  if (lower.startsWith('gemini-')) {
    return {
      provider: 'gemini',
      model: requestedModel || 'gemini-3.8-flash',
      hasImages: false,
      images: [],
      nonImageAttachments,
      invalidImages,
      routingReason: `Routed to Google Gemini (${requestedModel})`,
      decisionAuthority: 'SERVER_ROUTER_EXCLUSIVE',
      timestamp,
    };
  }

  if (normalizedExplicit === 'deepseek' || lower.startsWith('deepseek')) {
    return {
      provider: 'deepseek',
      model: requestedModel?.startsWith('deepseek') ? requestedModel : 'deepseek-chat',
      hasImages: false,
      images: [],
      nonImageAttachments,
      invalidImages,
      routingReason: 'DeepSeek selected explicitly; it is not the built-in Free default',
      decisionAuthority: 'SERVER_ROUTER_EXCLUSIVE',
      timestamp,
    };
  }

  if (normalizedExplicit === 'ollama' || requestedModel?.startsWith('ollama:')) {
    const targetOllamaModel = isOllamaModel(requestedModel)
      ? normalizeOllamaModel(requestedModel)
      : normalizeOllamaModel(process.env.OLLAMA_MODEL || 'qwen3:4b');
    return {
      provider: 'ollama',
      model: targetOllamaModel,
      hasImages: false,
      images: [],
      nonImageAttachments,
      invalidImages,
      routingReason: `Explicitly routed to Local Ollama LLM (${targetOllamaModel})`,
      decisionAuthority: 'SERVER_ROUTER_EXCLUSIVE',
      timestamp,
    };
  }

  const model = requestedModel || 'openai/gpt-oss-120b';
  return {
    provider: 'groq',
    model,
    hasImages: false,
    images: [],
    nonImageAttachments,
    invalidImages,
    routingReason: `Text-only request routed to Groq default (${model})`,
    decisionAuthority: 'SERVER_ROUTER_EXCLUSIVE',
    timestamp,
  };
}
