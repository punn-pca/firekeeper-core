/**
 * FIRE KEEPER Unified LLM Provider Interface
 * Supports Text and Multimodal (Vision) AI Providers
 */

export interface LLMMessagePart {
  type: 'text' | 'image_url';
  text?: string;
  image_url?: {
    url: string; // "data:image/png;base64,..." or URL
    detail?: 'auto' | 'low' | 'high';
  };
}

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string | LLMMessagePart[];
}

export interface LLMRequestOptions {
  model: string;
  systemInstruction?: string;
  stream?: boolean;
  temperature?: number;
  apiKey?: string;
  baseUrl?: string;
  ollamaBaseUrl?: string;
}

export interface LLMResponse {
  text: string;
  modelUsed: string;
  provider: string;
  reasoningContent?: string;
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
}

export interface ImageAttachment {
  name: string;
  mimeType: string;
  size: number;
  dataUrl: string;
  base64?: string;
}

export interface ImageValidationResult {
  valid: boolean;
  error?: string;
  sanitizedMime?: string;
  sizeBytes?: number;
}

export interface LLMProvider {
  id: string; // 'ollama' | 'deepseek' | 'deepseek_vision'
  name: string;
  supportsVision: boolean;
  defaultModel: string;
  generateContent(messages: LLMMessage[], options: LLMRequestOptions): Promise<LLMResponse>;
  generateStream(
    messages: LLMMessage[],
    onChunk: (text: string) => void,
    options: LLMRequestOptions
  ): Promise<LLMResponse>;
}
