import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { adminDb, stripUndefinedFields } from './firebase';

export interface PublishedPostRecord {
  id: string;
  text: string;
  normalized_text: string;
  content_hash: string;
  fingerprint: string[];
  timestamp: string;
}

export interface DedupAuditLogEntry {
  candidate_id: string;
  similarity_score: number;
  matched_post_id: string | null;
  dedup_result: 'EXACT_MATCH' | 'SEMANTIC_DUPLICATE' | 'UNIQUE';
  retry_count: number;
  final_action: 'PUBLISHED' | 'REGENERATED' | 'DEDUPLICATION_REJECTED' | 'SKIPPED';
  timestamp: string;
}

export interface TopicMemoryRecord {
  id: string;
  topic: string;
  concept: string;
  thesis: string;
  perspective: string;
  related_concepts: string[];
  timestamp: string;
  novelty_score: {
    semantic: number;
    conceptual: number;
    perspective: number;
    temporal: number;
    conversation_potential: number;
    overall: number;
  };
}

export interface AutonomousPersistentState {
  current_tick: number;
  last_tick_at: string;
  last_action: string;
  last_decision: string;
  daily_post_count: number;
  last_post_date: string;
  last_post_at: string;
  daily_post_limit: number;
  decision_state: string;
  execution_state: string;
  governance_result: string;
  audit_id: string;
  error_state: string | null;
  last_execution_id: string;
  is_active: boolean;
  tick_interval_ms: number;
  active_platform?: 'instagram' | 'x';
  ig_access_token?: string;
  ig_account_id?: string;
  ig_enabled?: boolean;
  x_api_key?: string;
  x_api_secret?: string;
  x_access_token?: string;
  x_access_secret?: string;
  x_refresh_token?: string;
  x_user_id?: string;
  x_username?: string;
  x_expires_at?: number;
  x_token_expired?: boolean;
  x_auth_mode?: 'oauth1' | 'oauth2' | 'sandbox';
  x_enabled?: boolean;
  published_posts?: PublishedPostRecord[];
  dedup_audit_logs?: DedupAuditLogEntry[];
  topic_memory?: TopicMemoryRecord[];
}

export let persistentState: AutonomousPersistentState = {
  current_tick: 0,
  last_tick_at: new Date().toISOString(),
  last_action: 'INITIALIZED',
  last_decision: 'OBSERVE',
  daily_post_count: 0,
  last_post_date: new Date().toISOString().split('T')[0],
  last_post_at: '',
  daily_post_limit: 3,
  decision_state: 'IDLE',
  execution_state: 'READY',
  governance_result: 'APPROVED',
  audit_id: 'audit_init',
  error_state: null,
  last_execution_id: '',
  is_active: true,
  tick_interval_ms: 300000, // 5 minutes
  active_platform: 'x',
  x_username: 'firekeeper_ai',
  x_token_expired: false,
};

export function getSanitizedState(state: AutonomousPersistentState) {
  const { x_api_secret, x_access_secret, x_refresh_token, ig_access_token, ...safeState } = state;
  return {
    ...safeState,
    has_ig_access_token: Boolean(state.ig_access_token),
    has_ig_account_id: Boolean(state.ig_account_id),
    ig_access_token_masked: state.ig_access_token ? `****${state.ig_access_token.slice(-4)}` : undefined,
    ig_account_id: state.ig_account_id,
    ig_enabled: Boolean(state.ig_enabled),
    has_x_api_key: Boolean(state.x_api_key),
    has_x_api_secret: Boolean(state.x_api_secret),
    has_x_access_token: Boolean(state.x_access_token),
    has_x_access_secret: Boolean(state.x_access_secret),
    has_x_refresh_token: Boolean(state.x_refresh_token),
    x_username: state.x_username || 'firekeeper_ai',
    x_token_expired: Boolean(state.x_token_expired),
    x_expires_at: state.x_expires_at,
    x_api_key_masked: state.x_api_key ? `****${state.x_api_key.slice(-4)}` : undefined,
    x_access_token_masked: state.x_access_token ? `****${state.x_access_token.slice(-4)}` : undefined,
    x_enabled: Boolean(state.x_enabled && state.x_access_token && !state.x_token_expired),
  };
}

const LOCAL_STATE_DIR = path.join(process.cwd(), '.data');
const LOCAL_STATE_FILE = path.join(LOCAL_STATE_DIR, 'autonomous_state.json');

export function ensureDataDir() {
  if (!fs.existsSync(LOCAL_STATE_DIR)) {
    try {
      fs.mkdirSync(LOCAL_STATE_DIR, { recursive: true });
    } catch (e) {
      // ignore
    }
  }
}

let isFirestorePermissionWarningLogged = false;

export async function loadPersistentState() {
  ensureDataDir();
  const today = new Date().toISOString().split('T')[0];

  // 1. Load from local cache file first
  try {
    if (fs.existsSync(LOCAL_STATE_FILE)) {
      const localData = JSON.parse(fs.readFileSync(LOCAL_STATE_FILE, 'utf8'));
      // Direct assignment so other modules can reference the mutated object
      Object.assign(persistentState, localData);
      if (persistentState.last_post_date !== today) {
        persistentState.daily_post_count = 0;
        persistentState.last_post_date = today;
      }
    }
  } catch (localErr) {
    console.warn('[Autonomous Worker] Notice reading local state file:', localErr);
  }

  // 2. Try loading from Firestore if Admin SDK is configured
  if (adminDb) {
    try {
      const docRef = adminDb.collection('autonomous_state').doc('singleton');
      const docSnap = await docRef.get();
      if (docSnap.exists) {
        const data = docSnap.data() as AutonomousPersistentState;
        Object.assign(persistentState, data);
        if (persistentState.last_post_date !== today) {
          persistentState.daily_post_count = 0;
          persistentState.last_post_date = today;
        }
        console.log('[Autonomous Worker] Loaded state from Firestore successfully.');
      } else {
        persistentState.last_post_date = today;
        await docRef.set(stripUndefinedFields(persistentState));
      }
    } catch (err: any) {
      if (!isFirestorePermissionWarningLogged) {
        console.warn('[Autonomous Worker] Firestore cloud storage unavailable (running with local persistent storage fallback):', err?.message || err);
        isFirestorePermissionWarningLogged = true;
      }
    }
  }

  // Auto-sync X credentials from process.env if present
  const envApiKey = process.env.X_API_KEY || process.env.TWITTER_API_KEY;
  const envApiSecret = process.env.X_API_SECRET || process.env.TWITTER_API_SECRET;
  const envAccessToken = process.env.X_ACCESS_TOKEN || process.env.TWITTER_ACCESS_TOKEN;
  const envAccessSecret = process.env.X_ACCESS_SECRET || process.env.TWITTER_ACCESS_SECRET;

  if (envAccessToken) {
    if (envApiKey) persistentState.x_api_key = envApiKey;
    if (envApiSecret) persistentState.x_api_secret = envApiSecret;
    persistentState.x_access_token = envAccessToken;
    if (envAccessSecret) persistentState.x_access_secret = envAccessSecret;
    persistentState.x_enabled = true;
    persistentState.x_token_expired = false;
    persistentState.x_auth_mode = (envAccessSecret || persistentState.x_access_secret) ? 'oauth1' : 'oauth2';
    persistentState.active_platform = 'x';
    persistentState.error_state = null;
    if (!persistentState.x_username || persistentState.x_username === 'firekeeper_ai') {
      persistentState.x_username = 'punn_firekeeper';
    }
    await savePersistentState();
  }
}

export async function savePersistentState() {
  ensureDataDir();
  // 1. Save to local state file
  try {
    fs.writeFileSync(LOCAL_STATE_FILE, JSON.stringify({
      ...persistentState,
      updated_at: new Date().toISOString(),
    }, null, 2), 'utf8');
  } catch (localSaveErr) {
    console.warn('[Autonomous Worker] Error saving local state file:', localSaveErr);
  }

  // 2. Sync to Firestore if Admin SDK is available
  if (!adminDb) return;
  try {
    const docRef = adminDb.collection('autonomous_state').doc('singleton');
    const payload = stripUndefinedFields({
      ...persistentState,
      updated_at: new Date().toISOString(),
    });
    await docRef.set(payload, { merge: true });
  } catch (err: any) {
    // Non-fatal Firestore update failure
  }
}
