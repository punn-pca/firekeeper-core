import { 
  db, 
  collection, 
  query, 
  where, 
  onSnapshot, 
  getIsFirestoreQuotaExhausted, 
  handleFirestoreError,
  doc,
  setDoc
} from '../lib/firebase';
import { ConversationSession } from '../types';
import { sanitizeConversationForFirestore } from '../utils/auditSanitizer';

export interface SyncOptions {
  userId: string;
  onUpdate: (sessions: ConversationSession[]) => void;
  onError?: (error: Error) => void;
  onConnecting?: () => void;
  onConnected?: () => void;
}

export const ChatHistorySyncService = {
  /**
   * Starts a realtime synchronization of chat history from Firestore for the given user.
   * If there are no sessions found on the remote database, it initializes a default session.
   * 
   * @param options Sync configuration options
   * @returns Unsubscribe function to tear down the listener
   */
  syncUserHistory(options: SyncOptions): () => void {
    const { userId, onUpdate, onError, onConnecting, onConnected } = options;

    if (!db) {
      console.warn('[ChatHistorySyncService] Firestore DB is not initialized. Synchronization disabled.');
      if (onError) {
        onError(new Error('Firestore DB not initialized'));
      }
      return () => {};
    }

    if (onConnecting) {
      onConnecting();
    }

    try {
      console.log(`[ChatHistorySyncService] Initializing sync listener for user: ${userId}`);
      
      const q = query(
        collection(db, 'conversations'),
        where('userId', '==', userId)
      );

      const unsubscribe = onSnapshot(
        q,
        async (snapshot) => {
          if (onConnected) {
            onConnected();
          }

          const remoteSessions: ConversationSession[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data() as ConversationSession;
            if (data && data.id && data.userId === userId) {
              remoteSessions.push(data);
            }
          });

          // Sort by updated_at or created_at descending
          remoteSessions.sort((a, b) => {
            const timeA = new Date(a.updated_at || a.created_at || 0).getTime();
            const timeB = new Date(b.updated_at || b.created_at || 0).getTime();
            return timeB - timeA;
          });

          console.log(`[ChatHistorySyncService] Sync success for user ${userId}. Received ${remoteSessions.length} sessions. [fromCache=${snapshot.metadata.fromCache}]`);

          let finalSessions = remoteSessions;

          // If the remote list is empty, and we aren't experiencing a quota issue or reading stale cache:
          if (finalSessions.length === 0 && !getIsFirestoreQuotaExhausted() && !snapshot.metadata.fromCache) {
            const defaultSession: ConversationSession = {
              id: 'session-' + Date.now() + '-' + Math.random().toString(36).substring(2, 8),
              userId: userId,
              title: 'เซสชันการวิเคราะห์เริ่มต้น',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              turns: [],
            };
            
            finalSessions = [defaultSession];
            
            try {
              console.log(`[ChatHistorySyncService] Remote history is empty. Provisioning default session: ${defaultSession.id}`);
              await setDoc(doc(db, 'conversations', defaultSession.id), sanitizeConversationForFirestore(defaultSession));
            } catch (err: any) {
              handleFirestoreError(err, 'defaultSessionCreation');
              if (onError) onError(err);
            }
          }

          onUpdate(finalSessions);
        },
        (error) => {
          console.error(`[ChatHistorySyncService] Realtime sync error for user ${userId}:`, error);
          handleFirestoreError(error, 'onSnapshotConversations');
          if (onError) {
            onError(error);
          }
        }
      );

      return unsubscribe;
    } catch (err: any) {
      console.error('[ChatHistorySyncService] Failed to establish synchronization:', err);
      if (onError) {
        onError(err);
      }
      return () => {};
    }
  }
};
