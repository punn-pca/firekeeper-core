/**
 * FIRE KEEPER Google Gemini AI Service
 * Powered by @google/generative-ai
 */

import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import { LLMMessage, LLMRequestOptions, LLMResponse } from './llmProvider';
import { injectLanguagePolicyToSystemPrompt } from './languagePolicy';

export const GEMINI_DEFAULT_MODEL = 'gemini-1.5-flash';

/**
 * Normalizes messages into Gemini API format
 */
function buildGeminiHistory(messages: LLMMessage[]): any[] {
  // Gemini separates system instruction from history
  return messages
    .filter(m => m.role !== 'system')
    .map(m => {
      let parts: any[] = [];
      if (typeof m.content === 'string') {
        parts.push({ text: m.content });
      } else if (Array.isArray(m.content)) {
        parts = m.content.map(part => {
          if (part.type === 'text') return { text: part.text };
          if (part.type === 'image_url' && part.image_url?.url) {
            const dataUrl = part.image_url.url;
            const matches = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
            if (matches) {
              return {
                inlineData: {
                  mimeType: matches[1],
                  data: matches[2]
                }
              };
            }
          }
          return { text: '' };
        });
      }

      return {
        role: m.role === 'assistant' ? 'model' : 'user',
        parts
      };
    });
}

/**
 * Call Gemini API with retry logic
 */
export async function callGeminiContentWithRetry(
  messages: LLMMessage[],
  options: LLMRequestOptions
): Promise<LLMResponse> {
  const apiKey = options.apiKey || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured.');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const modelName = options.model || GEMINI_DEFAULT_MODEL;
  
  const systemInstruction = messages.find(m => m.role === 'system')?.content as string || options.systemInstruction || '';
  const effectiveSystemInstruction = injectLanguagePolicyToSystemPrompt(systemInstruction);

  const model = genAI.getGenerativeModel({
    model: modelName,
    systemInstruction: effectiveSystemInstruction ? { role: 'system', parts: [{ text: effectiveSystemInstruction }] } : undefined,
    generationConfig: {
      temperature: options.temperature ?? 0.6,
      topP: 0.95,
      topK: 40,
      maxOutputTokens: 8192,
    },
    safetySettings: [
      { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
      { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
      { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
      { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
    ]
  });

  const history = buildGeminiHistory(messages);
  const userMessage = history.pop();
  
  const chat = model.startChat({
    history: history
  });

  const result = await chat.sendMessage(userMessage.parts);
  const response = await result.response;
  const text = response.text();

  return {
    text,
    modelUsed: modelName,
    provider: 'gemini',
    usage: {
      totalTokens: response.usageMetadata?.totalTokenCount,
      promptTokens: response.usageMetadata?.promptTokenCount,
      completionTokens: response.usageMetadata?.candidatesTokenCount
    }
  };
}

/**
 * Call Gemini streaming API
 */
export async function callGeminiStreamWithRetry(
  messages: LLMMessage[],
  onChunk: (text: string) => void,
  options: LLMRequestOptions
): Promise<LLMResponse> {
  const apiKey = options.apiKey || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured.');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const modelName = options.model || GEMINI_DEFAULT_MODEL;
  
  const systemInstruction = messages.find(m => m.role === 'system')?.content as string || options.systemInstruction || '';
  const effectiveSystemInstruction = injectLanguagePolicyToSystemPrompt(systemInstruction);

  const model = genAI.getGenerativeModel({
    model: modelName,
    systemInstruction: effectiveSystemInstruction ? { role: 'system', parts: [{ text: effectiveSystemInstruction }] } : undefined,
    generationConfig: {
      temperature: options.temperature ?? 0.6,
    },
    safetySettings: [
      { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
      { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
      { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
      { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
    ]
  });

  const history = buildGeminiHistory(messages);
  const userMessage = history.pop();
  
  const chat = model.startChat({
    history: history
  });

  const result = await chat.sendMessageStream(userMessage.parts);
  let fullText = '';
  
  for await (const chunk of result.stream) {
    const chunkText = chunk.text();
    fullText += chunkText;
    onChunk(chunkText);
  }

  const response = await result.response;

  return {
    text: fullText,
    modelUsed: modelName,
    provider: 'gemini',
    usage: {
      totalTokens: response.usageMetadata?.totalTokenCount,
      promptTokens: response.usageMetadata?.promptTokenCount,
      completionTokens: response.usageMetadata?.candidatesTokenCount
    }
  };
}
