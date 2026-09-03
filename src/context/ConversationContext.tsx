import React, { createContext, useContext, useState, useEffect } from 'react';
import { AttachedFile, ConversationSession, ConversationTurn, PCAState, CompressedContextSummary } from '../types';
import { APP_CONFIG } from '../config/env';
import { safeLocalStorage, safeSessionStorage } from '../utils/safeStorage';
import { auth, db, collection, doc, setDoc, getDocs, deleteDoc, query, where, onAuthStateChanged, getIsFirestoreQuotaExhausted, handleFirestoreError } from '../lib/firebase';
import { sanitizeConversationForFirestore } from '../utils/auditSanitizer';

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
}

const ConversationContext = createContext<ConversationContextType | undefined>(undefined);

const sanitizeSession = (session: ConversationSession) => {
  return sanitizeConversationForFirestore(session);
};

export const persistLocalSessions = (sessions: ConversationSession[]): void => {
  try {
    const storageKey = APP_CONFIG.CONVERSATIONS_KEY || 'fire_keeper_conversations';
    const serialized = JSON.stringify(sessions);
    safeLocalStorage.setItem(storageKey, serialized);
    safeSessionStorage.setItem(storageKey, serialized);
  } catch (e) {
    console.warn('[ConversationContext] Failed to persist conversations locally', e);
  }
};

export const mergeConversationLists = (
  localList: ConversationSession[],
  remoteList: ConversationSession[]
): ConversationSession[] => {
  const map = new Map<string, ConversationSession>();

  // 1. Seed with local conversations
  if (Array.isArray(localList)) {
    for (const session of localList) {
      if (session && session.id) {
        map.set(session.id, session);
      }
    }
  }

  // 2. Merge remote/Firestore conversations
  if (Array.isArray(remoteList)) {
    for (const remoteSession of remoteList) {
      if (!remoteSession || !remoteSession.id) continue;

      const localSession = map.get(remoteSession.id);
      if (!localSession) {
        // Exists only in remote -> Add it
        map.set(remoteSession.id, remoteSession);
      } else {
        // Exists in both -> compare updated_at timestamps
        const localTime = new Date(localSession.updated_at || localSession.created_at || 0).getTime();
        const remoteTime = new Date(remoteSession.updated_at || remoteSession.created_at || 0).getTime();

        if (remoteTime > localTime) {
          // Remote is strictly newer -> use remote
          map.set(remoteSession.id, remoteSession);
        } else if (localTime > remoteTime) {
          // Local is strictly newer -> preserve local
          map.set(localSession.id, localSession);
        } else {
          // Timestamps are identical: retain the one with more turns or preserve local
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

const loadInitialLocalConversations = (): ConversationSession[] => {
  try {
    const storageKey = APP_CONFIG.CONVERSATIONS_KEY || 'fire_keeper_conversations';
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

    const merged = mergeConversationLists(localSessions, sessionSessions);
    if (merged.length > 0) {
      persistLocalSessions(merged);
      return merged;
    }
  } catch (e) {
    console.warn('[ConversationContext] Failed to read initial local conversations', e);
  }
  return [];
};

export const ConversationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [conversations, setConversations] = useState<ConversationSession[]>(() => loadInitialLocalConversations());
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(() => {
    const initial = loadInitialLocalConversations();
    return initial.length > 0 ? initial[0].id : null;
  });
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [drawerTab, setDrawerTab] = useState<'history' | 'strategy'>('history');
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

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

  const initGuestSession = () => {
    setConversations((prev) => {
      if (prev.length > 0) {
        persistLocalSessions(prev);
        return prev;
      }
      const local = loadInitialLocalConversations();
      if (local.length > 0) {
        persistLocalSessions(local);
        setCurrentConversationId((prevId) => {
          if (prevId && local.some((s) => s.id === prevId)) return prevId;
          return local[0].id;
        });
        return local;
      }
      const defaultSession: ConversationSession = {
        id: 'session-' + Date.now(),
        userId: 'guest',
        title: 'เซสชันการวิเคราะห์เริ่มต้น',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        turns: [],
      };
      persistLocalSessions([defaultSession]);
      setCurrentConversationId(defaultSession.id);
      return [defaultSession];
    });
  };

  // Listen to Auth State Changes and merge history without overwriting local changes
  useEffect(() => {
    let isCancelled = false;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      const uid = user ? user.uid : null;
      setCurrentUserId(uid);

      if (uid) {
        console.log(`[ConversationContext] User authenticated (${uid}), querying Firestore history...`);
        try {
          const q = query(collection(db, 'conversations'), where('userId', '==', uid));
          const snapshot = await getDocs(q);
          if (isCancelled) return;

          const loadedSessions: ConversationSession[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data() as ConversationSession;
            if (data && data.id) {
              loadedSessions.push(data);
            }
          });

          // Functional updater ensures we never clobber newer state created while getDocs was in-flight
          setConversations((currentConversations) => {
            // Map any active guest conversations to the authenticated user ID
            const userMappedCurrent = currentConversations.map((c) => {
              if (c.userId === 'guest') {
                return { ...c, userId: uid };
              }
              return c;
            });

            // Deterministic merge: Local + Firestore, newer updated_at wins, local-only preserved, firestore-only added
            const merged = mergeConversationLists(userMappedCurrent, loadedSessions);

            let finalSessions = merged;
            if (finalSessions.length === 0) {
              // Create default session if both local and remote are completely empty
              const defaultSession: ConversationSession = {
                id: 'session-' + Date.now(),
                userId: uid,
                title: 'เซสชันการวิเคราะห์เริ่มต้น',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                turns: [],
              };
              finalSessions = [defaultSession];
              if (!getIsFirestoreQuotaExhausted()) {
                setDoc(doc(db, 'conversations', defaultSession.id), sanitizeSession(defaultSession)).catch((err) => {
                  handleFirestoreError(err, 'defaultSession');
                });
              }
            } else {
              // Background sync: any local conversation that is newer than remote or only in local gets synced to Firestore
              if (!getIsFirestoreQuotaExhausted()) {
                for (const session of finalSessions) {
                  if (session.userId === uid) {
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

            // Immediately persist merged result to local storage
            persistLocalSessions(finalSessions);

            // Preserve active conversation ID if it still exists
            setCurrentConversationId((prevId) => {
              if (prevId && finalSessions.some((s) => s.id === prevId)) {
                return prevId;
              }
              return finalSessions.length > 0 ? finalSessions[0].id : null;
            });

            return finalSessions;
          });
        } catch (err) {
          console.error('[ConversationContext] Error loading user conversations from Firestore:', err);
          initGuestSession();
        }
      } else {
        console.log('[ConversationContext] Guest mode, maintaining local sessions');
        initGuestSession();
      }
      setIsInitialized(true);
    });

    return () => {
      isCancelled = true;
      unsubscribe();
    };
  }, []);

  // Always persist conversations to safeLocalStorage and safeSessionStorage on state changes
  useEffect(() => {
    if (conversations.length === 0) return;
    persistLocalSessions(conversations);
  }, [conversations]);

  const createNewConversation = (title = 'การวิเคราะห์ PCA ใหม่') => {
    const userId = currentUserId || 'guest';
    const newSession: ConversationSession = {
      id: 'session-' + Date.now(),
      userId,
      title,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      turns: [],
    };

    if (userId !== 'guest' && !getIsFirestoreQuotaExhausted()) {
      // Save to Firestore
      setDoc(doc(db, 'conversations', newSession.id), sanitizeSession(newSession)).catch((err) => {
        handleFirestoreError(err, 'createNewConversation');
      });
    }

    setConversations((prev) => {
      const updated = [newSession, ...prev];
      persistLocalSessions(updated);
      return updated;
    });
    setCurrentConversationId(newSession.id);
    return newSession.id;
  };

  const selectConversation = (id: string) => {
    setCurrentConversationId(id);
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
      const filtered = prev.filter((c) => c.id !== id);
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
      persistLocalSessions(nextSessions);
      return nextSessions;
    });
  };

  const [isCompressingActive, setIsCompressingActive] = useState<boolean>(false);

  const updateCompressedContext = (sessionId: string, compressedContext: CompressedContextSummary) => {
    setConversations((prev) => {
      const updated = prev.map((s) => {
        if (s.id === sessionId) {
          const updatedItem = { ...s, compressedContext, updated_at: new Date().toISOString() };
          if (currentUserId && currentUserId !== 'guest' && updatedItem.userId === currentUserId && !getIsFirestoreQuotaExhausted()) {
            setDoc(doc(db, 'conversations', sessionId), sanitizeSession(updatedItem)).catch((err) => {
              handleFirestoreError(err, 'updateCompressedContext');
            });
          }
          return updatedItem;
        }
        return s;
      });
      persistLocalSessions(updated);
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

    setConversations((prev) => {
      const updated = prev.map((session) => {
        if (session.id === targetId) {
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
            title: updatedTitle,
            turns: updatedTurns,
            compressedContext: compressedContext || session.compressedContext,
            updated_at: new Date().toISOString(),
          };

          if (currentUserId && currentUserId !== 'guest' && updatedSession.userId === currentUserId && !getIsFirestoreQuotaExhausted()) {
            setDoc(doc(db, 'conversations', targetId), sanitizeSession(updatedSession)).catch((err) => {
              handleFirestoreError(err, 'addTurnToActiveSync');
            });
          }

          return updatedSession;
        }
        return session;
      });
      persistLocalSessions(updated);
      return updated;
    });
  };

  const activeConversation =
    conversations.find((c) => c.id === currentConversationId) || null;

  const compressActiveSession = async () => {
    setIsCompressingActive(true);
    try {
      let targetId = currentConversationId;
      if (!targetId || !conversations.some((c) => c.id === targetId)) {
        targetId = createNewConversation();
      }
      const targetSession = conversations.find((c) => c.id === targetId) || activeConversation;
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
