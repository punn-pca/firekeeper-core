import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { AttachedFile, ConversationSession, ConversationTurn, PCAState, CompressedContextSummary } from '../types';
import { APP_CONFIG } from '../config/env';
import { safeLocalStorage, safeSessionStorage, purgeLegacyUnscopedStorage } from '../utils/safeStorage';
import {
  auth,
  db,
  collection,
  doc,
  setDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
  onAuthStateChanged,
  getIsFirestoreQuotaExhausted,
  handleFirestoreError
} from '../lib/firebase';
import { sanitizeConversationForFirestore } from '../utils/auditSanitizer';

// Purge legacy un-scoped storage on module load
try {
  purgeLegacyUnscopedStorage();
} catch {}

interface ConversationContextType {
  conversations: ConversationSession[];
  currentConversationId: string | null;
  activeConversation: ConversationSession | null;
  createNewConversation: (title?: string) => string;
  selectConversation: (id: string) => void;
  deleteConversation: (id: string) => Promise<void>;
  addTurnToActive: (
    userContent: string,
    assistantContent: string,
    pcaState?: PCAState,
    attachments?: AttachedFile[],
    targetSessionId?: string,
    tokensUsed?: number,
    isTokenEstimated?: boolean,
    compressedContext?: CompressedContextSummary,
    durationMs?: number,
    userSentTimestamp?: string,
    assistantReceivedTimestamp?: string
  ) => void;
  updateCompressedContext: (sessionId: string, compressedContext: CompressedContextSummary) => void;
  compressActiveSession: () => Promise<void>;
  isCompressingActive: boolean;
  isDrawerOpen: boolean;
  drawerTab: 'history' | 'strategy';
  openDrawer: (tab?: 'history' | 'strategy') => void;
  closeDrawer: () => void;
  toggleDrawer: () => void;
  setDrawerTab: (tab: 'history' | 'strategy') => void;
  clearAllUserState: (userId?: string | null) => void;
}

const ConversationContext = createContext<ConversationContextType | undefined>(undefined);

const sanitizeSession = (session: ConversationSession) => {
  return sanitizeConversationForFirestore(session);
};

export const getConversationsStorageKey = (userId: string | null): string => {
  const uid = userId && userId.trim() ? userId.trim() : 'guest';
  return `fire_keeper_conversations_user_${uid}`;
};

export const getCurrentConversationKey = (userId: string | null): string => {
  const uid = userId && userId.trim() ? userId.trim() : 'guest';
  return `fire_keeper_current_conversation_id_user_${uid}`;
};

/**
 * Persists conversations to local cache ONLY.
 * Local Storage is strictly a secondary read-through cache and never an authoritative store.
 */
export function persistLocalSessions(
  arg1: string | null | ConversationSession[],
  arg2?: string | null | ConversationSession[]
): void {
  let userId: string | null = null;
  let sessions: ConversationSession[] = [];

  if (Array.isArray(arg1)) {
    sessions = arg1;
    userId = typeof arg2 === 'string' ? arg2 : null;
  } else {
    userId = typeof arg1 === 'string' ? arg1 : null;
    sessions = Array.isArray(arg2) ? arg2 : [];
  }

  try {
    const expectedUserId = userId && userId.trim() ? userId.trim() : 'guest';
    const storageKey = getConversationsStorageKey(expectedUserId);
    // Strict ownership guard: only cache sessions that match this user namespace
    const userOnlySessions = sessions.filter(s => s && s.id && s.userId === expectedUserId);
    const serialized = JSON.stringify(userOnlySessions);
    safeLocalStorage.setItem(storageKey, serialized);
    safeSessionStorage.setItem(storageKey, serialized);
  } catch (e) {
    console.warn('[ConversationContext] Failed to persist conversations to local cache', e);
  }
}

/**
 * Loads cached conversations for instant initial render before Firebase snapshot resolves.
 */
export const loadLocalConversationsForUser = (userId: string | null = null): ConversationSession[] => {
  try {
    const expectedUserId = userId && userId.trim() ? userId.trim() : 'guest';
    const storageKey = getConversationsStorageKey(expectedUserId);
    let localSessions: ConversationSession[] = [];

    const localRaw = safeLocalStorage.getItem(storageKey);
    if (localRaw) {
      try {
        const parsed = JSON.parse(localRaw);
        if (Array.isArray(parsed)) localSessions = parsed;
      } catch (e) {}
    } else {
      const sessionRaw = safeSessionStorage.getItem(storageKey);
      if (sessionRaw) {
        try {
          const parsed = JSON.parse(sessionRaw);
          if (Array.isArray(parsed)) localSessions = parsed;
        } catch (e) {}
      }
    }

    // Strict ownership verification on local cache read
    return localSessions.filter(s => s && s.id && s.userId === expectedUserId);
  } catch (e) {
    console.warn('[ConversationContext] Failed to read local cache for user', e);
  }
  return [];
};

export const loadInitialLocalConversations = loadLocalConversationsForUser;

export const ConversationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUserId, setCurrentUserId] = useState<string | null>(() => {
    try {
      if (typeof window !== 'undefined' && safeLocalStorage.getItem(APP_CONFIG.OFFLINE_MODE_KEY) === 'true') {
        return 'usr-offline-local';
      }
    } catch {}
    return auth.currentUser ? auth.currentUser.uid : null;
  });

  const currentUserIdRef = useRef<string | null>(currentUserId);
  currentUserIdRef.current = currentUserId;

  const authGenerationRef = useRef<number>(0);
  const firestoreUnsubscribeRef = useRef<(() => void) | null>(null);

  // Initialize conversations from local cache for instant paint
  const [conversations, setConversations] = useState<ConversationSession[]>(() => {
    return loadLocalConversationsForUser(currentUserId);
  });

  const [currentConversationId, setCurrentConversationId] = useState<string | null>(() => {
    const initial = loadLocalConversationsForUser(currentUserId);
    const lastSavedId = safeLocalStorage.getItem(getCurrentConversationKey(currentUserId));
    if (lastSavedId && initial.some(s => s.id === lastSavedId)) {
      return lastSavedId;
    }
    return initial.length > 0 ? initial[0].id : null;
  });

  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [drawerTab, setDrawerTab] = useState<'history' | 'strategy'>('history');
  const [isCompressingActive, setIsCompressingActive] = useState<boolean>(false);

  const openDrawer = (tab: 'history' | 'strategy' = 'history') => {
    setDrawerTab(tab);
    setIsDrawerOpen(true);
  };

  const closeDrawer = () => {
    setIsDrawerOpen(false);
  };

  const toggleDrawer = () => {
    if (isDrawerOpen && drawerTab === 'history') {
      setIsDrawerOpen(false);
    } else {
      setDrawerTab('history');
      setIsDrawerOpen(true);
    }
  };

  const clearAllUserState = (userId?: string | null) => {
    const targetUid = userId !== undefined ? userId : currentUserIdRef.current;
    const convKey = getConversationsStorageKey(targetUid);
    const currentConvKey = getCurrentConversationKey(targetUid);
    try {
      safeLocalStorage.removeItem(convKey);
      safeLocalStorage.removeItem(currentConvKey);
      safeSessionStorage.removeItem(convKey);
      safeSessionStorage.removeItem(currentConvKey);
    } catch (e) {}
    if (targetUid === currentUserIdRef.current) {
      setConversations([]);
      setCurrentConversationId(null);
    }
  };

  // Auth State & Real-Time Firebase Listener Lifecycle
  useEffect(() => {
    let isCancelled = false;

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      const authGeneration = ++authGenerationRef.current;

      // Clean up any previously attached Firestore realtime listener
      if (firestoreUnsubscribeRef.current) {
        firestoreUnsubscribeRef.current();
        firestoreUnsubscribeRef.current = null;
      }

      const isOffline = typeof window !== 'undefined' && safeLocalStorage.getItem(APP_CONFIG.OFFLINE_MODE_KEY) === 'true';
      const nextUid = isOffline ? 'usr-offline-local' : (user ? user.uid : null);
      const prevUid = currentUserIdRef.current;

      console.log(`[ConversationContext] Auth state transitioned: [${prevUid || 'guest'}] -> [${nextUid || 'guest'}] (gen=${authGeneration})`);

      // Atomically update user ref and state
      currentUserIdRef.current = nextUid;
      setCurrentUserId(nextUid);

      if (nextUid && nextUid !== 'usr-offline-local') {
        // --- AUTHENTICATED FIREBASE USER: REALTIME SINGLE SOURCE OF TRUTH ---
        // 1. Initial fast local cache paint
        const cachedSessions = loadLocalConversationsForUser(nextUid);
        if (!isCancelled && authGenerationRef.current === authGeneration && currentUserIdRef.current === nextUid) {
          setConversations(cachedSessions);
          if (cachedSessions.length > 0) {
            const savedId = safeLocalStorage.getItem(getCurrentConversationKey(nextUid));
            setCurrentConversationId(savedId && cachedSessions.some(s => s.id === savedId) ? savedId : cachedSessions[0].id);
          }
        }

        // 2. Attach authoritative realtime Firestore listener
        try {
          const q = query(collection(db, 'conversations'), where('userId', '==', nextUid));
          
          const unsubscribeSnapshot = onSnapshot(
            q,
            (snapshot) => {
              // Generation & User Race Guard: ignore snapshot if auth transitioned
              if (isCancelled || authGenerationRef.current !== authGeneration || currentUserIdRef.current !== nextUid) {
                return;
              }

              const remoteSessions: ConversationSession[] = [];
              snapshot.forEach((docSnap) => {
                const data = docSnap.data() as ConversationSession;
                if (data && data.id && data.userId === nextUid) {
                  remoteSessions.push(data);
                }
              });

              // Authoritative ordering by updated_at / created_at descending
              remoteSessions.sort((a, b) => {
                const timeA = new Date(a.updated_at || a.created_at || 0).getTime();
                const timeB = new Date(b.updated_at || b.created_at || 0).getTime();
                return timeB - timeA;
              });

              console.log(`[ConversationContext] Realtime snapshot received for user ${nextUid}: ${remoteSessions.length} sessions`);

              let finalSessions = remoteSessions;

              // If new user with 0 remote sessions, create a single initial default session on Firebase
              if (finalSessions.length === 0 && !getIsFirestoreQuotaExhausted()) {
                const defaultSession: ConversationSession = {
                  id: 'session-' + Date.now() + '-' + Math.random().toString(36).substring(2, 8),
                  userId: nextUid,
                  title: 'เซสชันการวิเคราะห์เริ่มต้น',
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                  turns: [],
                  compressedContext: undefined,
                };
                finalSessions = [defaultSession];
                setDoc(doc(db, 'conversations', defaultSession.id), sanitizeSession(defaultSession)).catch((err) => {
                  handleFirestoreError(err, 'defaultSessionCreation');
                });
              }

              // RECONCILIATION: Firebase is Single Source of Truth.
              // Overwrite Local Cache with strictly canonical sessions from Firebase.
              // Stale local items not present in Firebase are discarded and NEVER restored.
              persistLocalSessions(nextUid, finalSessions);
              setConversations(finalSessions);

              // Maintain or adjust current selected conversation
              setCurrentConversationId((prevId) => {
                if (prevId && finalSessions.some((s) => s.id === prevId && s.userId === nextUid)) {
                  return prevId;
                }
                const savedId = safeLocalStorage.getItem(getCurrentConversationKey(nextUid));
                if (savedId && finalSessions.some((s) => s.id === savedId && s.userId === nextUid)) {
                  return savedId;
                }
                return finalSessions.length > 0 ? finalSessions[0].id : null;
              });
            },
            (error) => {
              console.warn('[ConversationContext] Realtime listener error (using local cache):', error);
              handleFirestoreError(error, 'onSnapshotConversations');
            }
          );

          firestoreUnsubscribeRef.current = unsubscribeSnapshot;
        } catch (err) {
          console.warn('[ConversationContext] Failed to attach realtime listener:', err);
        }
      } else if (nextUid === 'usr-offline-local') {
        // --- OFFLINE OPERATOR MODE ---
        console.log('[ConversationContext] Operating in offline operator mode');
        const offlineSessions = loadLocalConversationsForUser('usr-offline-local');
        if (!isCancelled && authGenerationRef.current === authGeneration) {
          if (offlineSessions.length > 0) {
            setConversations(offlineSessions);
            setCurrentConversationId(offlineSessions[0].id);
          } else {
            const freshOffline: ConversationSession = {
              id: 'session-' + Date.now() + '-' + Math.random().toString(36).substring(2, 8),
              userId: 'usr-offline-local',
              title: 'เซสชันการวิเคราะห์แบบออฟไลน์',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              turns: [],
            };
            persistLocalSessions('usr-offline-local', [freshOffline]);
            setConversations([freshOffline]);
            setCurrentConversationId(freshOffline.id);
          }
        }
      } else {
        // --- GUEST / LOGGED-OUT MODE ---
        console.log('[ConversationContext] Initializing isolated guest session');
        const guestSessions = loadLocalConversationsForUser(null);
        if (!isCancelled && authGenerationRef.current === authGeneration) {
          if (guestSessions.length > 0) {
            setConversations(guestSessions);
            setCurrentConversationId(guestSessions[0].id);
          } else {
            const freshGuest: ConversationSession = {
              id: 'session-' + Date.now() + '-' + Math.random().toString(36).substring(2, 8),
              userId: 'guest',
              title: 'เซสชันการวิเคราะห์เริ่มต้น',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              turns: [],
            };
            persistLocalSessions('guest', [freshGuest]);
            setConversations([freshGuest]);
            setCurrentConversationId(freshGuest.id);
          }
        }
      }
    });

    return () => {
      isCancelled = true;
      if (firestoreUnsubscribeRef.current) {
        firestoreUnsubscribeRef.current();
        firestoreUnsubscribeRef.current = null;
      }
      unsubscribeAuth();
    };
  }, []);

  // Save current conversation ID on selection change
  useEffect(() => {
    if (currentConversationId) {
      safeLocalStorage.setItem(getCurrentConversationKey(currentUserId), currentConversationId);
    }
  }, [currentConversationId, currentUserId]);

  const createNewConversation = (title = 'การวิเคราะห์ PCA ใหม่'): string => {
    const userId = currentUserIdRef.current || 'guest';
    const newSession: ConversationSession = {
      id: 'session-' + Date.now() + '-' + Math.random().toString(36).substring(2, 8),
      userId,
      title,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      turns: [],
      compressedContext: undefined,
    };

    // 1. Optimistic UI & Local Cache update
    setConversations((prev) => {
      const filteredPrev = prev.filter(s => s.userId === userId);
      const updated = [newSession, ...filteredPrev];
      persistLocalSessions(userId, updated);
      return updated;
    });
    setCurrentConversationId(newSession.id);

    // 2. Authoritative Mutation to Firebase
    if (userId !== 'guest' && userId !== 'usr-offline-local' && !getIsFirestoreQuotaExhausted()) {
      setDoc(doc(db, 'conversations', newSession.id), sanitizeSession(newSession)).catch((err) => {
        handleFirestoreError(err, 'createNewConversation');
      });
    }

    return newSession.id;
  };

  const selectConversation = (id: string) => {
    const userId = currentUserIdRef.current || 'guest';
    if (conversations.some((c) => c.id === id && c.userId === userId)) {
      setCurrentConversationId(id);
    }
    setIsDrawerOpen(false);
  };

  const deleteConversation = async (id: string): Promise<void> => {
    const userId = currentUserIdRef.current || 'guest';

    // 1. Optimistic UI update: Remove immediately from state & local cache
    setConversations((prev) => {
      const filtered = prev.filter((c) => c.id !== id && c.userId === userId);
      let nextSessions = filtered;

      if (filtered.length === 0) {
        const freshId = 'session-' + Date.now() + '-' + Math.random().toString(36).substring(2, 8);
        const freshSession: ConversationSession = {
          id: freshId,
          userId,
          title: 'เซสชันการวิเคราะห์เริ่มต้น',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          turns: [],
        };
        if (userId !== 'guest' && userId !== 'usr-offline-local' && !getIsFirestoreQuotaExhausted()) {
          setDoc(doc(db, 'conversations', freshSession.id), sanitizeSession(freshSession)).catch((err) => {
            handleFirestoreError(err, 'freshSessionCreationOnDeleteAll');
          });
        }
        setCurrentConversationId(freshId);
        nextSessions = [freshSession];
      } else if (currentConversationId === id) {
        setCurrentConversationId(filtered[0].id);
      }

      persistLocalSessions(userId, nextSessions);
      return nextSessions;
    });

    // 2. Authoritative Deletion: Write mutation to Firebase
    // Realtime listeners on all devices/tabs will receive the 'removed' event and clear local state
    if (userId !== 'guest' && userId !== 'usr-offline-local' && !getIsFirestoreQuotaExhausted()) {
      try {
        await deleteDoc(doc(db, 'conversations', id));
        console.log(`[ConversationContext] Authoritative delete successful for conversation: ${id}`);
      } catch (err) {
        handleFirestoreError(err, 'deleteConversation');
      }
    }
  };

  const updateCompressedContext = (sessionId: string, compressedContext: CompressedContextSummary) => {
    const userId = currentUserIdRef.current || 'guest';
    setConversations((prev) => {
      const updated = prev.map((s) => {
        if (s.id === sessionId && s.userId === userId) {
          const updatedItem = { ...s, compressedContext, updated_at: new Date().toISOString() };
          if (userId !== 'guest' && userId !== 'usr-offline-local' && !getIsFirestoreQuotaExhausted()) {
            setDoc(doc(db, 'conversations', sessionId), sanitizeSession(updatedItem)).catch((err) => {
              handleFirestoreError(err, 'updateCompressedContext');
            });
          }
          return updatedItem;
        }
        return s;
      });
      persistLocalSessions(userId, updated);
      return updated;
    });
  };

  const addTurnToActive = (
    userContent: string,
    assistantContent: string,
    pcaState?: PCAState,
    attachments?: AttachedFile[],
    targetSessionId?: string,
    tokensUsed?: number,
    isTokenEstimated?: boolean,
    compressedContext?: CompressedContextSummary,
    durationMs?: number,
    userSentTimestamp?: string,
    assistantReceivedTimestamp?: string
  ) => {
    const targetId = targetSessionId || currentConversationId;
    if (!targetId) return;
    const userId = currentUserIdRef.current || 'guest';

    setConversations((prev) => {
      let found = false;
      const updated = prev.map((session) => {
        if (session.id === targetId && session.userId === userId) {
          found = true;
          const nowIso = new Date().toISOString();
          const userIso = userSentTimestamp || (pcaState as any)?.start_time || nowIso;
          const assistantIso = assistantReceivedTimestamp || (pcaState as any)?.end_time || nowIso;
          
          let calculatedDuration = durationMs;
          if (calculatedDuration === undefined && pcaState?.execution_time_ms) {
            calculatedDuration = pcaState.execution_time_ms;
          }
          if (calculatedDuration === undefined && userIso && assistantIso) {
            const diff = new Date(assistantIso).getTime() - new Date(userIso).getTime();
            if (diff >= 0) calculatedDuration = diff;
          }

          const userTurn: ConversationTurn = {
            role: 'user',
            content: userContent,
            attachments,
            timestamp: userIso,
          };
          const assistantTurn: ConversationTurn = {
            role: 'assistant',
            content: assistantContent,
            pcaState,
            tokensUsed,
            isTokenEstimated,
            timestamp: assistantIso,
            durationMs: calculatedDuration,
            userSentTimestamp: userIso,
          };
          const updatedTurns = [...session.turns, userTurn, assistantTurn];
          const displayTitle = userContent.trim()
            ? userContent.slice(0, 32) + (userContent.length > 32 ? '...' : '')
            : (attachments && attachments.length > 0 ? `วิเคราะห์ไฟล์: ${attachments[0].name}` : 'การวิเคราะห์ PCA');
          const updatedTitle = session.turns.length === 0 ? displayTitle : session.title;

          const updatedSession: ConversationSession = {
            ...session,
            userId,
            title: updatedTitle,
            turns: updatedTurns,
            compressedContext: compressedContext || session.compressedContext || undefined,
            updated_at: new Date().toISOString(),
          };

          // Authoritative write to Firebase
          if (userId !== 'guest' && userId !== 'usr-offline-local' && !getIsFirestoreQuotaExhausted()) {
            setDoc(doc(db, 'conversations', targetId), sanitizeSession(updatedSession)).catch((err) => {
              handleFirestoreError(err, 'addTurnToActiveSync');
            });
          }

          return updatedSession;
        }
        return session;
      });

      if (found) {
        persistLocalSessions(userId, updated);
        return updated;
      }
      return prev;
    });
  };

  const activeConversation =
    conversations.find((c) => c.id === currentConversationId && c.userId === (currentUserId || 'guest')) || null;

  const compressActiveSession = async () => {
    const userId = currentUserIdRef.current || 'guest';
    setIsCompressingActive(true);
    try {
      let targetId = currentConversationId;
      if (!targetId || !conversations.some((c) => c.id === targetId && c.userId === userId)) {
        targetId = createNewConversation();
      }
      const targetSession = conversations.find((c) => c.id === targetId && c.userId === userId) || activeConversation;
      const history = targetSession ? targetSession.turns || [] : [];
      const existingCompressed = targetSession ? targetSession.compressedContext : undefined;

      let token = safeLocalStorage.getItem(APP_CONFIG.TOKEN_KEY);
      if (auth.currentUser) {
        try {
          token = await auth.currentUser.getIdToken();
        } catch (e) {}
      }
      const authHeader = token ? `Bearer ${token}` : '';

      const response = await fetch('/api/compress-context', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authHeader ? { Authorization: authHeader } : {}),
        },
        body: JSON.stringify({
          conversationId: targetId,
          history,
          existingCompressed,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.compressedContext && targetId) {
          updateCompressedContext(targetId, data.compressedContext);
          console.log('[ContextCompression] Successfully compressed session context manually.');
        }
      } else {
        console.warn('[ContextCompression] Failed to compress context, status:', response.status);
      }
    } catch (err) {
      console.error('Failed to manually compress active session:', err);
    } finally {
      setIsCompressingActive(false);
    }
  };

  return (
    <ConversationContext.Provider
      value={{
        conversations,
        currentConversationId,
        activeConversation,
        createNewConversation,
        selectConversation,
        deleteConversation,
        addTurnToActive,
        updateCompressedContext,
        compressActiveSession,
        isCompressingActive,
        isDrawerOpen,
        drawerTab,
        openDrawer,
        closeDrawer,
        toggleDrawer,
        setDrawerTab,
        clearAllUserState,
      }}
    >
      {children}
    </ConversationContext.Provider>
  );
};

export const useConversation = () => {
  const context = useContext(ConversationContext);
  if (!context) {
    throw new Error('useConversation must be used within a ConversationProvider');
  }
  return context;
};
