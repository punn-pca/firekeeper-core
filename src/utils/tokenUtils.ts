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
