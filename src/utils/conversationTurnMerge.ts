import type { ConversationSession, ConversationTurn, CompressedContextSummary } from '../types';

/** Append an idempotent turn pair to the latest canonical session. Never create a missing session. */
export function appendTurnPair(
  session: ConversationSession,
  userTurn: ConversationTurn,
  assistantTurn: ConversationTurn,
  title: string,
  compressedContext?: CompressedContextSummary
): ConversationSession {
  if (!userTurn.id || !assistantTurn.id) throw new Error('Turn IDs are required');
  const existing = new Set(session.turns.map(turn => turn.id).filter(Boolean));
  if (existing.has(userTurn.id) || existing.has(assistantTurn.id)) return session;
  return {
    ...session,
    title: session.turns.length === 0 ? title : session.title,
    turns: [...session.turns, userTurn, assistantTurn],
    compressedContext: compressedContext || session.compressedContext,
    updated_at: new Date().toISOString(),
  };
}
