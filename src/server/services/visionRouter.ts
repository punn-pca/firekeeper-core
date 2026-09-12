/**
 * FIRE KEEPER Request Router & Vision Detection Engine
 * 
 * Rules:
 *  1. Backend is the SOLE authority for provider & model routing. Frontend never decides.
 *  2. If images are attached (PNG, JPEG, WEBP, GIF):
 *     -> Automatically route to DeepSeek Vision (deepseek-v4-flash-vision-exp).
 *  3. If no images are attached:
 *     -> Route to default Ollama / local LLM (or user-selected local model).
 *  4. Validates all image attachments strictly and separates documents from images.
 */

import { validateImageAttachment, formatImageDataUrl, DEEPSEEK_VISION_MODEL, SUPPORTED_IMAGE_MIMES } from './deepseekVision';
import { ImageAttachment } from './llmProvider';
import { isOllamaModel, normalizeOllamaModel } from './ollama';

export interface RouteResolution {
  provider: 'ollama' | 'deepseek' | 'deepseek_vision' | 'gemini';
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
 * - If images present -> deepseek_vision (deepseek-v4-flash-vision-exp)
 * - If no images -> Ollama local runtime (default: qwen3:4b or configured model)
 */
export function routeRequest(
  question: string,
  attachments: any[] = [],
  requestedModel?: string
): RouteResolution {
  const { images, nonImageAttachments, invalidImages } = inspectAttachments(attachments);
  const hasImages = images.length > 0;
  const timestamp = new Date().toISOString();

  // Route 1: Image(s) detected -> DeepSeek Vision
  if (hasImages) {
    return {
      provider: 'deepseek_vision',
      model: DEEPSEEK_VISION_MODEL,
      hasImages: true,
      images,
      nonImageAttachments,
      invalidImages,
      routingReason: `Auto-routed to DeepSeek Vision (${DEEPSEEK_VISION_MODEL}) due to ${images.length} image attachment(s) detected`,
      decisionAuthority: 'SERVER_ROUTER_EXCLUSIVE',
      timestamp
    };
  }

  // Route 2: No images -> Local Ollama (or requested local/text/vision model)
  const isRequestedVision = requestedModel === DEEPSEEK_VISION_MODEL || requestedModel?.includes('vision');
  if (isRequestedVision) {
    return {
      provider: 'deepseek_vision',
      model: DEEPSEEK_VISION_MODEL,
      hasImages: false,
      images: [],
      nonImageAttachments,
      invalidImages,
      routingReason: `Explicitly routed to DeepSeek Vision (${DEEPSEEK_VISION_MODEL})`,
      decisionAuthority: 'SERVER_ROUTER_EXCLUSIVE',
      timestamp
    };
  }

  const targetOllamaModel = isOllamaModel(requestedModel) 
    ? normalizeOllamaModel(requestedModel)
    : (requestedModel && (requestedModel.startsWith('deepseek') || requestedModel.includes('gemini')) ? requestedModel : normalizeOllamaModel(process.env.OLLAMA_MODEL || 'qwen3:4b'));

  let provider: 'ollama' | 'deepseek' | 'gemini' = 'ollama';
  if (targetOllamaModel.includes('gemini')) {
    provider = 'gemini';
  } else if (targetOllamaModel.startsWith('deepseek')) {
    provider = 'deepseek';
  }

  // Smart Fallback: If no DeepSeek key but Gemini is available, pivot to Gemini
  if (provider === 'deepseek' && !process.env.DEEPSEEK_API_KEY && process.env.GEMINI_API_KEY) {
    provider = 'gemini';
  }

  return {
    provider,
    model: targetOllamaModel,
    hasImages: false,
    images: [],
    nonImageAttachments,
    invalidImages,
    routingReason: `Text-only request routed to ${provider === 'ollama' ? 'Local Ollama LLM' : 'DeepSeek Text'} (${targetOllamaModel})`,
    decisionAuthority: 'SERVER_ROUTER_EXCLUSIVE',
    timestamp
  };
}
