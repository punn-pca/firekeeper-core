import React, { createContext, useContext, useState, useEffect } from 'react';
import { AttachedFile, ConversationSession, ConversationTurn, PCAState, CompressedContextSummary } from '../types';
import { APP_CONFIG } from '../config/env';
import { safeLocalStorage, safeSessionStorage } from '../utils/safeStorage';
import { auth, db, collection, doc, setDoc, getDocs, deleteDoc, query, where, onAuthStateChanged, getIsFirestoreQuotaExhausted, handleFirestoreError } from '../lib/firebase';

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

import { sanitizeAuditPayload } from '../utils/auditSanitizer';

const sanitizeSession = (session: ConversationSession) => {
  return sanitizeAuditPayload(session);
};

export const ConversationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [conversations, setConversations] = useState<ConversationSession[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
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

  // Listen to Auth State Changes and load/query history by authenticated userId from Firestore
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      const uid = user ? user.uid : null;
      setCurrentUserId(uid);

      if (uid) {
        console.log(`[ConversationContext] User authenticated (${uid}), querying Firestore history...`);
        try {
          const q = query(collection(db, 'conversations'), where('userId', '==', uid));
          const snapshot = await getDocs(q);
          const loadedSessions: ConversationSession[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data() as ConversationSession;
            if (data && data.userId === uid) {
              loadedSessions.push(data);
            }
          });

          // Sort by updated_at descending
          loadedSessions.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());

          if (loadedSessions.length > 0) {
            setConversations(loadedSessions);
            setCurrentConversationId(loadedSessions[0].id);
          } else {
            // Check local session storage first before generating a fresh empty session
            const storageKey = APP_CONFIG.CONVERSATIONS_KEY || 'fire_keeper_conversations';
            const saved = safeSessionStorage.getItem(storageKey);
            let hasRestored = false;
            if (saved) {
              try {
                const parsed: ConversationSession[] = JSON.parse(saved);
                if (Array.isArray(parsed) && parsed.length > 0) {
                  const mapped = parsed.map((s) => ({ ...s, userId: uid }));
                  setConversations(mapped);
                  setCurrentConversationId(mapped[0].id);
                  hasRestored = true;
                }
              } catch (e) {}
            }

            if (!hasRestored) {
              // Create default session for this authenticated user
              const defaultSession: ConversationSession = {
                id: 'session-' + Date.now(),
                userId: uid,
                title: 'เซสชันการวิเคราะห์เริ่มต้น',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                turns: [],
              };
              await setDoc(doc(db, 'conversations', defaultSession.id), sanitizeSession(defaultSession));
              setConversations([defaultSession]);
              setCurrentConversationId(defaultSession.id);
            }
          }
        } catch (err) {
          console.error('[ConversationContext] Error loading user conversations from Firestore:', err);
          initGuestSession();
        }
      } else {
        console.log('[ConversationContext] No authenticated user, falling back to local guest sessions');
        // Fallback to safeSessionStorage for guest mode
        const storageKey = APP_CONFIG.CONVERSATIONS_KEY || 'fire_keeper_conversations';
        const saved = safeSessionStorage.getItem(storageKey);
        if (saved) {
          try {
            const parsed: ConversationSession[] = JSON.parse(saved);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setConversations(parsed);
              setCurrentConversationId(parsed[0].id);
            } else {
              initGuestSession();
            }
          } catch (e) {
            initGuestSession();
          }
        } else {
          initGuestSession();
        }
      }
      setIsInitialized(true);
    });

    return () => unsubscribe();
  }, []);

  // Always persist conversations to safeSessionStorage as local cache / fallback
  useEffect(() => {
    if (!isInitialized || conversations.length === 0) return;
    const storageKey = APP_CONFIG.CONVERSATIONS_KEY || 'fire_keeper_conversations';
    safeSessionStorage.setItem(storageKey, JSON.stringify(conversations));
  }, [conversations, isInitialized]);

  const initGuestSession = () => {
    const storageKey = APP_CONFIG.CONVERSATIONS_KEY || 'fire_keeper_conversations';
    const saved = safeSessionStorage.getItem(storageKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setConversations(parsed);
          setCurrentConversationId(parsed[0].id);
          return;
        }
      } catch (e) {}
    }
    const defaultSession: ConversationSession = {
      id: 'session-' + Date.now(),
      userId: currentUserId || 'guest',
      title: 'เซสชันการวิเคราะห์เริ่มต้น',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      turns: [],
    };
    setConversations([defaultSession]);
    setCurrentConversationId(defaultSession.id);
  };

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

    setConversations((prev) => [newSession, ...prev]);
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
        return [freshSession];
      }
      return filtered;
    });
  };

  const [isCompressingActive, setIsCompressingActive] = useState<boolean>(false);

  const updateCompressedContext = (sessionId: string, compressedContext: CompressedContextSummary) => {
    setConversations((prev) =>
      prev.map((s) => {
        if (s.id === sessionId) {
          const updated = { ...s, compressedContext, updated_at: new Date().toISOString() };
          if (currentUserId && currentUserId !== 'guest' && updated.userId === currentUserId && !getIsFirestoreQuotaExhausted()) {
            setDoc(doc(db, 'conversations', sessionId), sanitizeSession(updated)).catch((err) => {
              handleFirestoreError(err, 'updateCompressedContext');
            });
          }
          return updated;
        }
        return s;
      })
    );
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

    setConversations((prev) =>
      prev.map((session) => {
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
      })
    );
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
