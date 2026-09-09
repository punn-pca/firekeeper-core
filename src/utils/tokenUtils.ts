import { AttachedFile } from '../types';

/**
 * Estimates token count for a given text string and attached files.
 * Uses an empirical formula for mixed Thai/English/Code text (~3.5 chars/token).
 */
export function estimateTokenCount(text: string = '', attachments?: AttachedFile[]): number {
  let attachmentCharCount = 0;
  if (attachments && attachments.length > 0) {
    for (const att of attachments) {
      if (att.textContent) {
        attachmentCharCount += att.textContent.length;
      } else {
        // Base character estimate for binary/image metadata
        attachmentCharCount += Math.ceil((att.size || 500) / 3);
      }
    }
  }

  const totalLength = (text || '').length + attachmentCharCount;
  if (totalLength === 0) return 0;

  return Math.max(1, Math.ceil(totalLength / 3.5));
}

/**
 * Calculates real token cost in Thai Baht (THB) and USD based on official model pricing per 1M tokens.
 * Exchange rate: 1 USD = 35 THB.
 */
export interface TokenCostResult {
  costTHB: number;
  costUSD: number;
  formattedTHB: string;
  formattedUSD: string;
  metadata: {
    model: string;
    inputTokens: number;
    outputTokens: number;
    inputRate: number; // USD per 1M tokens
    outputRate: number; // USD per 1M tokens
    currency: string;
    exchangeRate: number;
    isAvailable: boolean;
  };
}

export function calculateActualTokenCost(
  modelName: string = 'unknown',
  inputTokens: number | null = null,
  outputTokens: number | null = null
): TokenCostResult {
  const normalizedModel = (modelName || '').toLowerCase().trim();
  
  let inputRate = 0.075; // default flash $0.075 / 1M
  let outputRate = 0.30; // default flash $0.30 / 1M
  let available = true;

  if (normalizedModel.includes('ollama') || normalizedModel.includes('qwen') || normalizedModel.includes('llama') || normalizedModel.includes('local')) {
    inputRate = 0;
    outputRate = 0;
  } else if (normalizedModel.includes('pro') || normalizedModel.includes('gemini-1.5-pro') || normalizedModel.includes('gemini-3.1-pro')) {
    inputRate = 1.25;
    outputRate = 5.00;
  } else if (normalizedModel.includes('flash-8b')) {
    inputRate = 0.0375;
    outputRate = 0.15;
  } else if (normalizedModel.includes('flash-3.7') || normalizedModel.includes('3.7-flash') || normalizedModel.includes('gemini-3.7')) {
    inputRate = 0.75;
    outputRate = 3.75;
  } else if (normalizedModel.includes('flash') || normalizedModel.includes('gemini')) {
    inputRate = 0.075;
    outputRate = 0.30;
  } else if (normalizedModel.includes('gpt-4o-mini')) {
    inputRate = 0.15;
    outputRate = 0.60;
  } else if (normalizedModel.includes('gpt-4o')) {
    inputRate = 2.50;
    outputRate = 10.00;
  } else if (normalizedModel.includes('deepseek-chat')) {
    inputRate = 0.14;
    outputRate = 0.28;
  } else if (normalizedModel.includes('deepseek-reasoner')) {
    inputRate = 0.55;
    outputRate = 2.19;
  } else if (!normalizedModel || normalizedModel === 'unknown' || normalizedModel === 'pca-cognitive-fallback') {
    available = false;
  }

  if (!available || inputTokens === null || outputTokens === null || isNaN(inputTokens as any) || isNaN(outputTokens as any) || (inputTokens === 0 && outputTokens === 0)) {
    return {
      costTHB: 0,
      costUSD: 0,
      formattedTHB: 'N/A',
      formattedUSD: 'N/A',
      metadata: {
        model: modelName || 'Unknown',
        inputTokens: inputTokens ?? 0,
        outputTokens: outputTokens ?? 0,
        inputRate: 0,
        outputRate: 0,
        currency: 'THB',
        exchangeRate: 35,
        isAvailable: false
      }
    };
  }

  const usdInput = (inputTokens / 1_000_000) * inputRate;
  const usdOutput = (outputTokens / 1_000_000) * outputRate;
  const costUSD = usdInput + usdOutput;
  const exchangeRate = 35;
  const costTHB = costUSD * exchangeRate;

  let formattedTHB = '';
  if (costTHB === 0) {
    formattedTHB = normalizedModel.includes('ollama') ? '฿0.00 (Local / Free)' : '฿0.00 / run';
  } else if (costTHB < 0.01) {
    formattedTHB = `฿${costTHB.toFixed(4)} / run`;
  } else {
    formattedTHB = `฿${costTHB.toFixed(2)} / run`;
  }

  const formattedUSD = `~$${costUSD < 0.0001 ? costUSD.toFixed(6) : costUSD.toFixed(4)} USD`;

  return {
    costTHB,
    costUSD,
    formattedTHB,
    formattedUSD,
    metadata: {
      model: modelName || 'unknown',
      inputTokens,
      outputTokens,
      inputRate,
      outputRate,
      currency: 'THB',
      exchangeRate,
      isAvailable: true
    }
  };
}

export function calculateTokenCostTHB(inputTokens: number, outputTokens: number, modelName?: string): {
  costTHB: number;
  costUSD: number;
  formattedTHB: string;
} {
  const res = calculateActualTokenCost(modelName || 'unknown', inputTokens, outputTokens);
  return {
    costTHB: res.costTHB,
    costUSD: res.costUSD,
    formattedTHB: res.formattedTHB
  };
}

/**
 * Calculates total tokens for a conversation turn.
 */
export function calculateTurnTokens(
  promptText: string = '',
  responseText: string = '',
  attachments?: AttachedFile[],
  realTimePromptTokens?: number,
  realTimeCompletionTokens?: number,
  realTimeTotalTokens?: number
): { totalTokens: number; isEstimated: boolean } {
  if (typeof realTimeTotalTokens === 'number' && realTimeTotalTokens > 0) {
    return { totalTokens: realTimeTotalTokens, isEstimated: false };
  }

  const promptTokens =
    typeof realTimePromptTokens === 'number' && realTimePromptTokens > 0
      ? realTimePromptTokens
      : estimateTokenCount(promptText, attachments);

  const completionTokens =
    typeof realTimeCompletionTokens === 'number' && realTimeCompletionTokens > 0
      ? realTimeCompletionTokens
      : estimateTokenCount(responseText);

  const isEstimated = !realTimeTotalTokens && (realTimePromptTokens === undefined || realTimeCompletionTokens === undefined);
  return {
    totalTokens: promptTokens + completionTokens,
    isEstimated,
  };
}
