export type ConversationContextSource = 'server' | 'client' | 'empty';

export interface ConversationContextResolution {
  history: Array<{ role: 'user' | 'assistant'; content: string }>;
  compressedContext: unknown;
  source: ConversationContextSource;
}

export function normalizeConversationTurns(turns: unknown, mode?: string): ConversationContextResolution['history'] {
  if (!Array.isArray(turns)) return [];
  const hasExplicitModeMetadata = turns.some(
    (turn: any) =>
      turn &&
      typeof turn.mode === 'string' &&
      turn.mode.trim().length > 0
  );

  return turns
    // Preserve fully legacy conversations for backward compatibility. Once a
    // conversation contains explicit mode metadata, however, untagged turns
    // become ambiguous and must be quarantined from the prompt boundary.
    .filter((turn: any) => {
      if (!turn || typeof turn.content !== 'string') return false;
      if (!hasExplicitModeMetadata) return true;
      return typeof turn.mode === 'string' && turn.mode.trim().length > 0;
    })
    .map((turn: any) => ({
      role: turn.role === 'assistant' || turn.role === 'model' ? 'assistant' as const : 'user' as const,
      content: turn.content,
    }));
}

/**
 * Firestore writes from the browser are intentionally asynchronous. A follow-up
 * request can therefore arrive after the first turn is already present in the
 * client state but before that turn has reached the server document.
 *
 * In that narrow case, use the client history only as a pending suffix when it
 * exactly extends the server history. This preserves the server-authoritative
 * boundary and prevents arbitrary client content from replacing persisted turns.
 */
function mergePendingClientHistory(
  persistedHistory: ConversationContextResolution['history'],
  clientHistory: ConversationContextResolution['history'],
): ConversationContextResolution['history'] {
  if (clientHistory.length <= persistedHistory.length) return persistedHistory;

  const prefixMatches = persistedHistory.every((turn, index) =>
    turn.role === clientHistory[index]?.role &&
    turn.content === clientHistory[index]?.content
  );

  return prefixMatches ? clientHistory : persistedHistory;
}

export function resolveConversationContext(input: {
  contextIdentityMatches: boolean;
  mode?: string;
  requestHistory?: unknown;
  requestCompressedContext?: unknown;
  persistedConversation?: any | null;
  persistedConversationExists?: boolean;
  persistedConversationAuthorized?: boolean;
}): ConversationContextResolution {
  const requestHistory = Array.isArray(input.requestHistory) ? input.requestHistory : [];
  const clientHistory = input.contextIdentityMatches ? normalizeConversationTurns(requestHistory, input.mode) : [];
  const requestedClientCompressed = input.contextIdentityMatches ? input.requestCompressedContext ?? null : null;
  const clientCompressed = requestedClientCompressed && (!input.mode || typeof (requestedClientCompressed as any).mode === 'string')
    ? requestedClientCompressed
    : null;

  if (input.persistedConversationExists && input.persistedConversationAuthorized && input.persistedConversation) {
    const persistedHistory = normalizeConversationTurns(input.persistedConversation.turns, input.mode);
    const mergedHistory = mergePendingClientHistory(persistedHistory, clientHistory);
    const persistedCompressed = input.persistedConversation.compressedContext && (!input.mode || typeof input.persistedConversation.compressedContext.mode === 'string')
      ? input.persistedConversation.compressedContext
      : null;

    return {
      history: mergedHistory,
      // A newly-created/still-pending client turn may also have a compressed
      // context that is not persisted yet. Accept it only when the server has
      // no usable compressed context; never overwrite server state.
      compressedContext: persistedCompressed ?? clientCompressed,
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
