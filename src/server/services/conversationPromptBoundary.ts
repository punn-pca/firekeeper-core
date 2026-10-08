export type ConversationContextSource = 'server' | 'client' | 'empty';

export interface ConversationContextResolution {
  history: Array<{ role: 'user' | 'assistant'; content: string }>;
  compressedContext: unknown;
  source: ConversationContextSource;
}

export function normalizeConversationTurns(turns: unknown): ConversationContextResolution['history'] {
  if (!Array.isArray(turns)) return [];
  return turns
    .filter((turn: any) => turn && typeof turn.content === 'string')
    .map((turn: any) => ({
      role: turn.role === 'assistant' || turn.role === 'model' ? 'assistant' as const : 'user' as const,
      content: turn.content,
    }));
}

export function resolveConversationContext(input: {
  contextIdentityMatches: boolean;
  requestHistory?: unknown;
  requestCompressedContext?: unknown;
  persistedConversation?: any | null;
  persistedConversationExists?: boolean;
  persistedConversationAuthorized?: boolean;
}): ConversationContextResolution {
  const requestHistory = Array.isArray(input.requestHistory) ? input.requestHistory : [];
  const clientHistory = input.contextIdentityMatches ? normalizeConversationTurns(requestHistory) : [];
  const clientCompressed = input.contextIdentityMatches ? input.requestCompressedContext ?? null : null;

  if (input.persistedConversationExists && input.persistedConversationAuthorized && input.persistedConversation) {
    return {
      history: normalizeConversationTurns(input.persistedConversation.turns),
      compressedContext: input.persistedConversation.compressedContext ?? null,
      source: 'server',
    };
  }

  if (input.persistedConversationExists === false) {
    return { history: [], compressedContext: null, source: 'empty' };
  }

  return {
    history: clientHistory,
    compressedContext: clientCompressed,
    source: clientHistory.length > 0 || clientCompressed ? 'client' : 'empty',
  };
}

export function estimatePromptTelemetry(input: {
  systemPrompt: string;
  history: unknown[];
  contextParts: unknown[];
  question: string;
  conversationContextSource: ConversationContextSource;
}) {
  const estimateTokens = (value: unknown): number => {
    const serialized = typeof value === 'string' ? value : JSON.stringify(value ?? '');
    return Math.max(0, Math.ceil(serialized.length / 4));
  };
  const telemetry = {
    version: 2,
    conversationContextSource: input.conversationContextSource,
    historyTurns: input.history.length,
    historyTurnsIncludedInEstimate: Math.min(input.history.length, 6),
    historyTurnsExcludedFromEstimate: Math.max(0, input.history.length - 6),
    systemEstimatedTokens: estimateTokens(input.systemPrompt),
    historyEstimatedTokens: estimateTokens(input.history.slice(-6)),
    contextEstimatedTokens: estimateTokens(input.contextParts),
    userEstimatedTokens: estimateTokens(input.question),
  };
  return {
    ...telemetry,
    totalEstimatedTokens:
      telemetry.systemEstimatedTokens +
      telemetry.historyEstimatedTokens +
      telemetry.contextEstimatedTokens +
      telemetry.userEstimatedTokens,
    estimated: true,
  };
}
