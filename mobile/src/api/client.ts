// Base API client for firekeeper-core backend
import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Production server URL
export const API_BASE_URL = 'https://firekeeper.site';

const SESSION_TOKEN_KEY = '@firekeeper_session_token';
const SESSION_USER_KEY = '@firekeeper_session_user';
const AUTH_MODE_KEY = '@firekeeper_auth_mode'; // 'guest' | 'firebase'

export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach token (guest session OR Firebase ID token) to every request
apiClient.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const token = await AsyncStorage.getItem(SESSION_TOKEN_KEY);
  if (config.headers) {
    config.headers['Authorization'] = `Bearer ${token && token.length > 10 ? token : 'offline-local-token'}`;
  }
  return config;
});

// ── Types ─────────────────────────────────────────────────────────────────────

export interface SessionUser {
  uid: string;
  displayName: string;
  email: string;
  role: string;
  photoURL?: string;
}

export interface StoredSession {
  token: string;
  user: SessionUser;
  mode: 'guest' | 'firebase';
}

// ── Session Storage ───────────────────────────────────────────────────────────

export async function saveSession(token: string, user: SessionUser, mode: 'guest' | 'firebase'): Promise<void> {
  await AsyncStorage.setItem(SESSION_TOKEN_KEY, token);
  await AsyncStorage.setItem(SESSION_USER_KEY, JSON.stringify(user));
  await AsyncStorage.setItem(AUTH_MODE_KEY, mode);
}

export async function getStoredSession(): Promise<StoredSession | null> {
  const token = await AsyncStorage.getItem(SESSION_TOKEN_KEY);
  const userStr = await AsyncStorage.getItem(SESSION_USER_KEY);
  const mode = await AsyncStorage.getItem(AUTH_MODE_KEY);
  if (!token || !userStr) return null;
  try {
    return { token, user: JSON.parse(userStr), mode: (mode as 'guest' | 'firebase') ?? 'guest' };
  } catch {
    return null;
  }
}

export async function clearSession(): Promise<void> {
  await AsyncStorage.removeItem(SESSION_TOKEN_KEY);
  await AsyncStorage.removeItem(SESSION_USER_KEY);
  await AsyncStorage.removeItem(AUTH_MODE_KEY);
}

// ── Guest Auth ────────────────────────────────────────────────────────────────

export interface GuestAuthResponse {
  success?: boolean;
  token: string;
  userId?: string;
  user?: SessionUser;
}

export async function loginAsGuest(): Promise<StoredSession> {
  const res = await apiClient.post<GuestAuthResponse>('/api/auth/guest');
  const token = res.data.token;
  const userId = res.data.userId || 'guest';
  const user: SessionUser = res.data.user || {
    uid: userId,
    displayName: `Guest Analyst ${userId.slice(-4).toUpperCase()}`,
    email: `${userId}@guest.firekeeper.site`,
    role: 'guest',
  };

  const session: StoredSession = { token, user, mode: 'guest' };
  await saveSession(session.token, session.user, 'guest');
  return session;
}

export async function loginWithFirebase(firebaseIdToken: string, user: SessionUser): Promise<StoredSession> {
  const session: StoredSession = { token: firebaseIdToken, user, mode: 'firebase' };
  await saveSession(session.token, session.user, 'firebase');
  return session;
}

// ── Health ────────────────────────────────────────────────────────────────────

export async function checkHealth(): Promise<boolean> {
  try {
    await apiClient.get('/api/health');
    return true;
  } catch {
    return false;
  }
}

// ── Conversations ─────────────────────────────────────────────────────────────

// ── Conversations ─────────────────────────────────────────────────────────────

export interface ConversationTurn {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
  governance?: any;
  confidenceCalibration?: any;
  pcaState?: any;
  executionTrace?: any;
  model?: string;
}

export interface Conversation {
  id: string;
  title: string;
  created_at?: string;
  updated_at?: string;
  createdAt?: string;
  updatedAt?: string;
  turns?: ConversationTurn[];
  messageCount?: number;
}

export interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
  governance?: any;
  confidenceCalibration?: any;
  pcaState?: any;
  executionTrace?: any;
  model?: string;
}

const CONVERSATIONS_INDEX_KEY = '@firekeeper_conversations_index';

export async function getConversations(): Promise<Conversation[]> {
  // 1. Load local cache immediately
  let localList: Conversation[] = [];
  try {
    const raw = await AsyncStorage.getItem(CONVERSATIONS_INDEX_KEY);
    if (raw) localList = JSON.parse(raw);
  } catch {}

  // 2. Fetch from server and merge
  try {
    const res = await apiClient.get<{ success: boolean; conversations: Conversation[] }>('/api/conversations');
    const serverList = res.data.conversations ?? [];

    const map = new Map<string, Conversation>();
    for (const c of localList) {
      if (c && c.id) map.set(c.id, c);
    }
    for (const s of serverList) {
      if (!s || !s.id) continue;
      const existing = map.get(s.id);
      if (!existing || (s.turns?.length ?? 0) >= (existing.turns?.length ?? 0)) {
        map.set(s.id, {
          ...existing,
          ...s,
          turns: (s.turns?.length ?? 0) >= (existing?.turns?.length ?? 0) ? s.turns : existing?.turns,
        });
      }
    }

    const merged = Array.from(map.values()).sort((a, b) => {
      const tA = new Date(a.updated_at || a.created_at || 0).getTime();
      const tB = new Date(b.updated_at || b.created_at || 0).getTime();
      return tB - tA;
    });

    await AsyncStorage.setItem(CONVERSATIONS_INDEX_KEY, JSON.stringify(merged));
    return merged;
  } catch (err) {
    console.warn('[API] getConversations fetch failed, returning local cache:', err);
    return localList;
  }
}

export async function getConversation(id: string): Promise<{ conversation: Conversation | null; messages: Message[] }> {
  // 1. Check local cache first
  let conv: Conversation | null = null;
  try {
    const raw = await AsyncStorage.getItem(`@firekeeper_conv_${id}`);
    if (raw) conv = JSON.parse(raw);
  } catch {}

  // 2. Check if it exists in conversations index if single conv doc wasn't found
  if (!conv) {
    try {
      const listRaw = await AsyncStorage.getItem(CONVERSATIONS_INDEX_KEY);
      if (listRaw) {
        const list: Conversation[] = JSON.parse(listRaw);
        const found = list.find(c => c.id === id);
        if (found) conv = found;
      }
    } catch {}
  }

  // 3. Try fetching latest from server
  try {
    const res = await apiClient.get<{ success: boolean; conversation: any }>(`/api/conversations/${id}`);
    const serverConv = res.data.conversation;
    if (serverConv && (serverConv.turns?.length ?? 0) >= (conv?.turns?.length ?? 0)) {
      conv = serverConv;
      AsyncStorage.setItem(`@firekeeper_conv_${id}`, JSON.stringify(serverConv)).catch(() => {});
    }
  } catch (e) {
    console.warn('[API] getConversation server notice, using local cache:', e);
  }

  const turns = conv?.turns || [];
  const messages: Message[] = turns.map((t: any) => ({
    role: t.role,
    content: t.content,
    timestamp: t.timestamp,
    governance: t.governance,
    confidenceCalibration: t.confidenceCalibration || t.confidence_calibration,
    pcaState: t.pcaState || t.pca_state,
    executionTrace: t.executionTrace || t.execution_trace,
    model: t.model || t.llm_model,
  }));
  return { conversation: conv, messages };
}

export async function createConversation(title?: string): Promise<Conversation> {
  const convId = `conv-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  const now = new Date().toISOString();
  const payload: Conversation = {
    id: convId,
    title: title || 'New Analysis',
    turns: [],
    created_at: now,
    updated_at: now,
  };

  // Save to local storage immediately
  try {
    await AsyncStorage.setItem(`@firekeeper_conv_${convId}`, JSON.stringify(payload));
    const listRaw = await AsyncStorage.getItem(CONVERSATIONS_INDEX_KEY);
    const list: Conversation[] = listRaw ? JSON.parse(listRaw) : [];
    list.unshift(payload);
    await AsyncStorage.setItem(CONVERSATIONS_INDEX_KEY, JSON.stringify(list));
  } catch {}

  // Sync to server in background
  try {
    const res = await apiClient.post<{ success: boolean; conversation: Conversation }>('/api/conversations', payload);
    return res.data.conversation || payload;
  } catch {
    return payload;
  }
}

export async function saveConversationTurns(
  id: string,
  title: string,
  turns: ConversationTurn[]
): Promise<void> {
  const now = new Date().toISOString();
  const payload: Conversation = {
    id,
    title,
    turns,
    updated_at: now,
  };

  // 1. Save locally to AsyncStorage immediately
  try {
    await AsyncStorage.setItem(`@firekeeper_conv_${id}`, JSON.stringify(payload));

    const listRaw = await AsyncStorage.getItem(CONVERSATIONS_INDEX_KEY);
    let list: Conversation[] = listRaw ? JSON.parse(listRaw) : [];
    const idx = list.findIndex(c => c.id === id);
    const summaryItem: Conversation = {
      ...payload,
      created_at: idx >= 0 ? list[idx].created_at : now,
    };
    if (idx >= 0) {
      list[idx] = summaryItem;
    } else {
      list.unshift(summaryItem);
    }
    await AsyncStorage.setItem(CONVERSATIONS_INDEX_KEY, JSON.stringify(list));
  } catch (e) {
    console.warn('[Storage] Failed to save conversation turns locally:', e);
  }

  // 2. Sync to server
  try {
    await apiClient.post('/api/conversations', payload);
  } catch (e) {
    console.warn('[API] saveConversationTurns server sync notice:', e);
  }
}

export async function deleteConversation(id: string): Promise<void> {
  // 1. Delete from local storage
  try {
    await AsyncStorage.removeItem(`@firekeeper_conv_${id}`);
    const listRaw = await AsyncStorage.getItem(CONVERSATIONS_INDEX_KEY);
    if (listRaw) {
      let list: Conversation[] = JSON.parse(listRaw);
      list = list.filter(c => c.id !== id);
      await AsyncStorage.setItem(CONVERSATIONS_INDEX_KEY, JSON.stringify(list));
    }
  } catch {}

  // 2. Delete from server
  try {
    await apiClient.delete(`/api/conversations/${id}`);
  } catch (e) {
    console.warn('[API] deleteConversation server notice:', e);
  }
}

// ── Memory ────────────────────────────────────────────────────────────────────

export interface MemoryRecord {
  id: string;
  content: string;
  layer: string;
  source: string;
  confidence: number;
  created_at: string;
}

export async function getMemories(): Promise<MemoryRecord[]> {
  const res = await apiClient.get<{ memories: MemoryRecord[] }>('/api/memory');
  return res.data.memories ?? [];
}

// ── Ollama Status ─────────────────────────────────────────────────────────────

export async function getOllamaStatus(): Promise<{ available: boolean; model?: string }> {
  try {
    const res = await apiClient.get('/api/ollama/status');
    return res.data;
  } catch {
    return { available: false };
  }
}
