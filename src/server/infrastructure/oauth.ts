import { getApps as getAdminApps } from 'firebase-admin/app';
import { getFirestore as getAdminFirestore } from 'firebase-admin/firestore';

export interface OAuthStateRecord {
  state: string;
  provider: 'instagram' | 'x';
  userId?: string;
  codeVerifier?: string;
  redirectUri?: string;
  createdAt: number;
  expiresAt: number;
}

export const oauthStateStore = new Map<string, OAuthStateRecord>();

function getOAuthStateDb() {
  try {
    return getAdminApps().length > 0 ? getAdminFirestore() : null;
  } catch {
    return null;
  }
}

const OAUTH_STATE_TTL_MS = 10 * 60 * 1000;

/** Shared OAuth state storage for multi-instance Cloud Run deployments. */
export async function saveOAuthState(record: OAuthStateRecord): Promise<void> {
  const db = getOAuthStateDb();
  if (!db) {
    oauthStateStore.set(record.state, record);
    return;
  }
  await db.collection('oauth_states').doc(record.state).set({
    ...record,
    expiresAt: record.expiresAt || Date.now() + OAUTH_STATE_TTL_MS,
  });
}

export async function loadOAuthState(state: string): Promise<OAuthStateRecord | null> {
  const db = getOAuthStateDb();
  if (!db) {
    const local = oauthStateStore.get(state);
    if (!local || local.expiresAt <= Date.now()) {
      oauthStateStore.delete(state);
      return null;
    }
    return local;
  }
  const snap = await db.collection('oauth_states').doc(state).get();
  if (!snap.exists) return null;
  const record = snap.data() as OAuthStateRecord;
  if (!record || record.expiresAt <= Date.now()) {
    await db.collection('oauth_states').doc(state).delete();
    return null;
  }
  return record;
}

export async function deleteOAuthState(state: string): Promise<void> {
  const db = getOAuthStateDb();
  if (db) await db.collection('oauth_states').doc(state).delete();
  oauthStateStore.delete(state);
}

// Periodic cleanup of expired states
setInterval(() => {
  const now = Date.now();
  for (const [stateKey, rec] of oauthStateStore.entries()) {
    if (rec.expiresAt < now) {
      oauthStateStore.delete(stateKey);
    }
  }
}, 60000);
