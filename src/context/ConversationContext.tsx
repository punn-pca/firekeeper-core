import React, { createContext, useContext, useState, useEffect } from 'react';
import { AttachedFile, ConversationSession, ConversationTurn, PCAState, CompressedContextSummary } from '../types';
import { APP_CONFIG } from '../config/env';
import { useAuth } from './AuthContext';

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
    compressedContext?: CompressedContextSummary
  ) => void;
  updateCompressedContext: (sessionId: string, compressedContext: CompressedContextSummary) => void;
  compressActiveSession: () => Promise<void>;
  isCompressingActive: boolean;
  isDrawerOpen: boolean;
  toggleDrawer: () => void;
  closeDrawer: () => void;
}

const ConversationContext = createContext<ConversationContextType | undefined>(undefined);

export const ConversationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<ConversationSession[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);

  // Load user sessions from localStorage
  useEffect(() => {
    if (!user) return;
    const storageKey = `${APP_CONFIG.CONVERSATIONS_KEY}_${user.id}`;
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const parsed: ConversationSession[] = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setConversations(parsed);
          setCurrentConversationId(parsed[0].id);
        } else {
          initDefaultSession(user.id);
        }
      } catch (e) {
        initDefaultSession(user.id);
      }
    } else {
      initDefaultSession(user.id);
    }
    setIsInitialized(true);
  }, [user]);

  // Save to localStorage when conversations update (only after initial load)
  useEffect(() => {
    if (!user || !isInitialized) return;
    const storageKey = `${APP_CONFIG.CONVERSATIONS_KEY}_${user.id}`;
    localStorage.setItem(storageKey, JSON.stringify(conversations));
  }, [conversations, user, isInitialized]);

  const initDefaultSession = (userId: string) => {
    const defaultSession: ConversationSession = {
      id: 'session-' + Date.now(),
      userId,
      title: 'เซสชันการวิเคราะห์เริ่มต้น',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      turns: [],
    };
    setConversations([defaultSession]);
    setCurrentConversationId(defaultSession.id);
  };

  const createNewConversation = (title = 'การวิเคราะห์ PCA ใหม่') => {
    const newSession: ConversationSession = {
      id: 'session-' + Date.now(),
      userId: user?.id || 'guest',
      title,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      turns: [],
    };
    setConversations((prev) => [newSession, ...prev]);
    setCurrentConversationId(newSession.id);
    return newSession.id;
  };

  const selectConversation = (id: string) => {
    setCurrentConversationId(id);
    setIsDrawerOpen(false);
  };

  const deleteConversation = (id: string) => {
    setConversations((prev) => {
      const filtered = prev.filter((c) => c.id !== id);
      if (filtered.length > 0 && currentConversationId === id) {
        setCurrentConversationId(filtered[0].id);
      } else if (filtered.length === 0) {
        const freshId = 'session-' + Date.now();
        const freshSession: ConversationSession = {
          id: freshId,
          userId: user?.id || 'guest',
          title: 'เซสชันการวิเคราะห์เริ่มต้น',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          turns: [],
        };
        setCurrentConversationId(freshId);
        return [freshSession];
      }
      return filtered;
    });
  };

  const [isCompressingActive, setIsCompressingActive] = useState<boolean>(false);

  const updateCompressedContext = (sessionId: string, compressedContext: CompressedContextSummary) => {
    setConversations((prev) =>
      prev.map((s) => (s.id === sessionId ? { ...s, compressedContext, updated_at: new Date().toISOString() } : s))
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
    compressedContext?: CompressedContextSummary
  ) => {
    const targetId = targetSessionId || currentConversationId;
    if (!targetId) return;

    setConversations((prev) =>
      prev.map((session) => {
        if (session.id === targetId) {
          const userTurn: ConversationTurn = { role: 'user', content: userContent, attachments };
          const assistantTurn: ConversationTurn = {
            role: 'assistant',
            content: assistantContent,
            pcaState,
            tokensUsed,
            isTokenEstimated,
          };
          const updatedTurns = [...session.turns, userTurn, assistantTurn];
          // Auto update title based on first query
          const displayTitle = userContent.trim()
            ? userContent.slice(0, 32) + (userContent.length > 32 ? '...' : '')
            : (attachments && attachments.length > 0 ? `วิเคราะห์ไฟล์: ${attachments[0].name}` : 'การวิเคราะห์ PCA');
          const updatedTitle = session.turns.length === 0 ? displayTitle : session.title;

          return {
            ...session,
            title: updatedTitle,
            turns: updatedTurns,
            compressedContext: compressedContext || session.compressedContext,
            updated_at: new Date().toISOString(),
          };
        }
        return session;
      })
    );
  };

  const activeConversation =
    conversations.find((c) => c.id === currentConversationId) || null;

  const compressActiveSession = async () => {
    if (!activeConversation || activeConversation.turns.length === 0) return;
    setIsCompressingActive(true);
    try {
      const authHeader = localStorage.getItem(APP_CONFIG.TOKEN_KEY)
        ? `Bearer ${localStorage.getItem(APP_CONFIG.TOKEN_KEY)}`
        : '';
      const response = await fetch('/api/compress-context', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: authHeader,
        },
        body: JSON.stringify({
          history: activeConversation.turns,
          existingCompressed: activeConversation.compressedContext,
        }),
      });
      if (response.ok) {
        const data = await response.json();
        if (data.compressedContext && activeConversation.id) {
          updateCompressedContext(activeConversation.id, data.compressedContext);
        }
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
        toggleDrawer: () => setIsDrawerOpen(!isDrawerOpen),
        closeDrawer: () => setIsDrawerOpen(false),
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
