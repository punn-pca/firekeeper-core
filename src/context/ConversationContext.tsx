import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { AttachedFile, ConversationSession, ConversationTurn, PCAState, CompressedContextSummary } from '../types';
import { APP_CONFIG } from '../config/env';
import { safeLocalStorage, safeSessionStorage, purgeLegacyUnscopedStorage } from '../utils/safeStorage';
import { auth, db, collection, doc, setDoc, getDocs, deleteDoc, query, where, onAuthStateChanged, getIsFirestoreQuotaExhausted, handleFirestoreError } from '../lib/firebase';
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
  deleteConversation: (id: string) => void;
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
    // Strict ownership guard: only persist sessions that match this user's namespace
    const userOnlySessions = sessions.filter(s => s && s.id && s.userId === expectedUserId);
    const serialized = JSON.stringify(userOnlySessions);
    safeLocalStorage.setItem(storageKey, serialized);
    safeSessionStorage.setItem(storageKey, serialized);
  } catch (e) {
    console.warn('[ConversationContext] Failed to persist conversations locally', e);
  }
}

export const mergeConversationLists = (
  localList: ConversationSession[],
  remoteList: ConversationSession[],
  expectedUserId?: string | null
): ConversationSession[] => {
  const map = new Map<string, ConversationSession>();
  const targetUid = expectedUserId && expectedUserId.trim() ? expectedUserId.trim() : null;

  // 1. Seed with local conversations
  if (Array.isArray(localList)) {
    for (const session of localList) {
      if (session && session.id) {
        if (targetUid && session.userId !== targetUid) continue;
        map.set(session.id, session);
      }
    }
  }

  // 2. Merge remote/Firestore conversations
  if (Array.isArray(remoteList)) {
    for (const remoteSession of remoteList) {
      if (!remoteSession || !remoteSession.id) continue;
      if (targetUid && remoteSession.userId !== targetUid) continue;

      const localSession = map.get(remoteSession.id);
      if (!localSession) {
        // Exists only in remote -> Add it
        map.set(remoteSession.id, remoteSession);
      } else {
        // Exists in both -> compare updated_at timestamps
        const localTime = new Date(localSession.updated_at || localSession.created_at || 0).getTime();
        const remoteTime = new Date(remoteSession.updated_at || remoteSession.created_at || 0).getTime();

        if (remoteTime > localTime) {
          map.set(remoteSession.id, remoteSession);
        } else if (localTime > remoteTime) {
          map.set(localSession.id, localSession);
        } else {
          const localTurns = localSession.turns?.length || 0;
          const remoteTurns = remoteSession.turns?.length || 0;
          if (remoteTurns > localTurns) {
            map.set(remoteSession.id, remoteSession);
          } else {
            map.set(localSession.id, localSession);
          }
        }
      }
    }
  }

  // Deduplicate and sort descending by updated_at / created_at
  const merged = Array.from(map.values());
  merged.sort((a, b) => {
    const timeA = new Date(a.updated_at || a.created_at || 0).getTime();
    const timeB = new Date(b.updated_at || b.created_at || 0).getTime();
    return timeB - timeA;
  });

  return merged;
};

export const loadLocalConversationsForUser = (userId: string | null = null): ConversationSession[] => {
  try {
    const expectedUserId = userId && userId.trim() ? userId.trim() : 'guest';
    const storageKey = getConversationsStorageKey(expectedUserId);
    let localSessions: ConversationSession[] = [];
    let sessionSessions: ConversationSession[] = [];

    const localRaw = safeLocalStorage.getItem(storageKey);
    if (localRaw) {
      try {
        const parsed = JSON.parse(localRaw);
        if (Array.isArray(parsed)) localSessions = parsed;
      } catch (e) {}
    }

    const sessionRaw = safeSessionStorage.getItem(storageKey);
    if (sessionRaw) {
      try {
        const parsed = JSON.parse(sessionRaw);
        if (Array.isArray(parsed)) sessionSessions = parsed;
      } catch (e) {}
    }

    const merged = mergeConversationLists(localSessions, sessionSessions, expectedUserId);
    // Strict ownership verification on local load
    const verified = merged.filter(s => s && s.id && s.userId === expectedUserId);
    return verified;
  } catch (e) {
    console.warn('[ConversationContext] Failed to read local conversations for user', e);
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

  // Initialize conversations only for already resolved user or guest
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

  // Auth State Listener: Strictly isolate data across account changes with Generation Race Guard
  useEffect(() => {
    let isCancelled = false;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      const authGeneration = ++authGenerationRef.current;
      const isOffline = typeof window !== 'undefined' && safeLocalStorage.getItem(APP_CONFIG.OFFLINE_MODE_KEY) === 'true';
      const nextUid = isOffline ? 'usr-offline-local' : (user ? user.uid : null);
      const prevUid = currentUserIdRef.current;

      console.log(`[ConversationContext] Auth state transitioned: [${prevUid || 'guest'}] -> [${nextUid || 'guest'}] (gen=${authGeneration})`);

      // Atomically update user ref and state
      currentUserIdRef.current = nextUid;
      setCurrentUserId(nextUid);

      // Atomically reset React state so previous user's conversation state is never leaked or mixed
      setConversations([]);
      setCurrentConversationId(null);

      if (nextUid) {
        // Authenticated user: Load local user-scoped sessions first
        const localScoped = loadLocalConversationsForUser(nextUid);
        if (isCancelled || authGenerationRef.current !== authGeneration || currentUserIdRef.current !== nextUid) {
          return;
        }

        setConversations(localScoped);
        if (localScoped.length > 0) {
          const savedId = safeLocalStorage.getItem(getCurrentConversationKey(nextUid));
          setCurrentConversationId(savedId && localScoped.some(s => s.id === savedId) ? savedId : localScoped[0].id);
        } else {
          setCurrentConversationId(null);
        }

        // Query Firestore with strict user filter
        try {
          const q = query(collection(db, 'conversations'), where('userId', '==', nextUid));
          const snapshot = await getDocs(q);

          // Race Condition Guard: If auth changed while getDocs was in flight, abort immediately
          if (isCancelled || authGenerationRef.current !== authGeneration || currentUserIdRef.current !== nextUid) {
            console.warn(`[ConversationContext] Stale getDocs response discarded for user ${nextUid} (active=${currentUserIdRef.current})`);
            return;
          }

          const loadedSessions: ConversationSession[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data() as ConversationSession;
            // Strict server-side and client-side ownership check
            if (data && data.id && data.userId === nextUid) {
              loadedSessions.push(data);
            }
          });

          // Secondary guard before updating state
          if (authGenerationRef.current !== authGeneration || currentUserIdRef.current !== nextUid) {
            return;
          }

          setConversations(() => {
            // Guard inside state updater against concurrent user switch
            if (currentUserIdRef.current !== nextUid) return [];

            // Only merge local sessions of THIS user with remote sessions of THIS user
            const currentLocal = loadLocalConversationsForUser(nextUid);
            const merged = mergeConversationLists(currentLocal, loadedSessions, nextUid);

            let finalSessions = merged;
            if (finalSessions.length === 0) {
              const defaultSession: ConversationSession = {
                id: 'session-' + Date.now(),
                userId: nextUid,
                title: 'เซสชันการวิเคราะห์เริ่มต้น',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                turns: [],
                compressedContext: null,
              };
              finalSessions = [defaultSession];
              if (!getIsFirestoreQuotaExhausted()) {
                setDoc(doc(db, 'conversations', defaultSession.id), sanitizeSession(defaultSession)).catch((err) => {
                  handleFirestoreError(err, 'defaultSession');
                });
              }
            } else {
              // Sync any newer local changes to Firestore
              if (!getIsFirestoreQuotaExhausted()) {
                for (const session of finalSessions) {
                  if (session.userId === nextUid) {
                    const remote = loadedSessions.find((r) => r.id === session.id);
                    const localIsNewer = !remote || 
                      new Date(session.updated_at || 0).getTime() > new Date(remote.updated_at || 0).getTime() ||
                      (new Date(session.updated_at || 0).getTime() === new Date(remote.updated_at || 0).getTime() && (session.turns?.length || 0) > (remote.turns?.length || 0));
                    if (localIsNewer) {
                      setDoc(doc(db, 'conversations', session.id), sanitizeSession(session)).catch((err) => {
                        handleFirestoreError(err, 'syncLocalToFirestore');
                      });
                    }
                  }
                }
              }
            }

            persistLocalSessions(nextUid, finalSessions);

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

            return finalSessions;
          });
        } catch (err: any) {
          console.warn('[ConversationContext] Notice loading remote conversations:', err?.message || err);
        }
      } else {
        // Logged out / Guest: Reset to strictly isolated guest sessions
        console.log('[ConversationContext] Initializing isolated guest session...');
        const guestSessions = loadLocalConversationsForUser(null);
        if (isCancelled || authGenerationRef.current !== authGeneration || currentUserIdRef.current !== null) {
          return;
        }

        if (guestSessions.length > 0) {
          setConversations(guestSessions);
          setCurrentConversationId(guestSessions[0].id);
        } else {
          const freshGuest: ConversationSession = {
            id: 'session-' + Date.now(),
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
    });

    return () => {
      isCancelled = true;
      unsubscribe();
    };
  }, []);

  // Save current conversation ID on selection change
  useEffect(() => {
    if (currentConversationId) {
      safeLocalStorage.setItem(getCurrentConversationKey(currentUserId), currentConversationId);
    }
  }, [currentConversationId, currentUserId]);

  const createNewConversation = (title = 'การวิเคราะห์ PCA ใหม่') => {
    const userId = currentUserId || 'guest';
    const newSession: ConversationSession = {
      id: 'session-' + Date.now(),
      userId,
      title,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      turns: [],
      compressedContext: null,
    };

    if (userId !== 'guest' && !getIsFirestoreQuotaExhausted()) {
      setDoc(doc(db, 'conversations', newSession.id), sanitizeSession(newSession)).catch((err) => {
        handleFirestoreError(err, 'createNewConversation');
      });
    }

    setConversations((prev) => {
      // Ensure only sessions belonging to this user are in state
      const filteredPrev = prev.filter(s => s.userId === userId);
      const updated = [newSession, ...filteredPrev];
      persistLocalSessions(updated, userId);
      return updated;
    });
    setCurrentConversationId(newSession.id);
    return newSession.id;
  };

  const selectConversation = (id: string) => {
    const userId = currentUserIdRef.current || 'guest';
    if (conversations.some((c) => c.id === id && c.userId === userId)) {
      setCurrentConversationId(id);
    }
    setIsDrawerOpen(false);
  };

  const deleteConversation = (id: string) => {
    const userId = currentUserId || 'guest';
    if (userId !== 'guest' && !getIsFirestoreQuotaExhausted()) {
      deleteDoc(doc(db, 'conversations', id)).catch((err) => {
        handleFirestoreError(err, 'deleteConversation');
      });
    }

    setConversations((prev) => {
      const filtered = prev.filter((c) => c.id !== id && c.userId === userId);
      let nextSessions = filtered;
      if (filtered.length > 0 && currentConversationId === id) {
        setCurrentConversationId(filtered[0].id);
      } else if (filtered.length === 0) {
        const freshId = 'session-' + Date.now();
        const freshSession: ConversationSession = {
          id: freshId,
          userId,
          title: 'เซสชันการวิเคราะห์เริ่มต้น',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          turns: [],
        };
        if (userId !== 'guest' && !getIsFirestoreQuotaExhausted()) {
          setDoc(doc(db, 'conversations', freshSession.id), sanitizeSession(freshSession)).catch((err) => {
            handleFirestoreError(err, 'freshSession');
          });
        }
        setCurrentConversationId(freshId);
        nextSessions = [freshSession];
      }
      persistLocalSessions(nextSessions, userId);
      return nextSessions;
    });
  };

  const updateCompressedContext = (sessionId: string, compressedContext: CompressedContextSummary) => {
    const userId = currentUserId || 'guest';
    setConversations((prev) => {
      const updated = prev.map((s) => {
        if (s.id === sessionId && s.userId === userId) {
          const updatedItem = { ...s, compressedContext, updated_at: new Date().toISOString() };
          if (userId !== 'guest' && !getIsFirestoreQuotaExhausted()) {
            setDoc(doc(db, 'conversations', sessionId), sanitizeSession(updatedItem)).catch((err) => {
              handleFirestoreError(err, 'updateCompressedContext');
            });
          }
          return updatedItem;
        }
        return s;
      });
      persistLocalSessions(updated, userId);
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
    const userId = currentUserId || 'guest';

    setConversations((prev) => {
      const updated = prev.map((session) => {
        if (session.id === targetId && session.userId === userId) {
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
            compressedContext: compressedContext || session.compressedContext || null,
            updated_at: new Date().toISOString(),
          };

          if (userId !== 'guest' && !getIsFirestoreQuotaExhausted()) {
            setDoc(doc(db, 'conversations', targetId), sanitizeSession(updatedSession)).catch((err) => {
              handleFirestoreError(err, 'addTurnToActiveSync');
            });
          }

          return updatedSession;
        }
        return session;
      });
      persistLocalSessions(updated, userId);
      return updated;
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
