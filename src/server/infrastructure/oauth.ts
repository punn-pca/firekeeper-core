import crypto from 'crypto';

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

// Periodic cleanup of expired states
setInterval(() => {
  const now = Date.now();
  for (const [stateKey, rec] of oauthStateStore.entries()) {
    if (rec.expiresAt < now) {
      oauthStateStore.delete(stateKey);
    }
  }
}, 60000);
