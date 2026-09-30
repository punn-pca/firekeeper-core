import crypto from 'node:crypto';

export class ConversationPersistenceError extends Error {
  constructor(public readonly code: 'PERSISTENCE_UNAVAILABLE' | 'CONVERSATION_FORBIDDEN') {
    super(code);
  }
}

export function recordExpired(record: any, now = Date.now()): boolean {
  if (!record?.expiresAt) return false;
  const value = record.expiresAt;
  const date = typeof value.toDate === 'function' ? value.toDate() : new Date(value);
  return Number.isFinite(date.getTime()) && date.getTime() <= now;
}

/** Hosted ownership is never inferred from an instance-local cache. */
export async function readConversationOwnership(db: any, userId: string, id: string) {
  if (!db) throw new ConversationPersistenceError('PERSISTENCE_UNAVAILABLE');
  try {
    const snapshot = await db.collection('conversations').doc(id).get();
    if (!snapshot.exists) return { authorized: true, exists: false };
    const conversation = snapshot.data();
    if (conversation?.userId !== userId) return { authorized: false, exists: true };
    if (recordExpired(conversation)) return { authorized: true, exists: false };
    return { authorized: true, exists: true, conversation };
  } catch {
    throw new ConversationPersistenceError('PERSISTENCE_UNAVAILABLE');
  }
}

/** The ownership read and write share a transaction; only committed data is returned. */
export async function saveOwnedConversation(db: any, userId: string, session: any, expiresAt: Date) {
  if (!db) throw new ConversationPersistenceError('PERSISTENCE_UNAVAILABLE');
  try {
    return await db.runTransaction(async (tx: any) => {
      let ref = db.collection('conversations').doc(session.id);
      const existing = await tx.get(ref);
      const reassigned = existing.exists && existing.data()?.userId !== userId;
      if (reassigned) ref = db.collection('conversations').doc(`session-${crypto.randomUUID()}`);
      const conversation = { ...session, id: ref.id, userId, updated_at: new Date().toISOString(), expiresAt };
      if (reassigned || !existing.exists) tx.create(ref, conversation);
      else tx.set(ref, conversation);
      return { conversation, reassigned };
    });
  } catch {
    throw new ConversationPersistenceError('PERSISTENCE_UNAVAILABLE');
  }
}

export async function deleteOwnedConversation(db: any, userId: string, id: string): Promise<void> {
  if (!db) throw new ConversationPersistenceError('PERSISTENCE_UNAVAILABLE');
  try {
    await db.runTransaction(async (tx: any) => {
      const ref = db.collection('conversations').doc(id);
      const existing = await tx.get(ref);
      if (existing.exists && existing.data()?.userId !== userId) {
        throw new ConversationPersistenceError('CONVERSATION_FORBIDDEN');
      }
      if (existing.exists) tx.delete(ref);
    });
  } catch (error) {
    if (error instanceof ConversationPersistenceError) throw error;
    throw new ConversationPersistenceError('PERSISTENCE_UNAVAILABLE');
  }
}
