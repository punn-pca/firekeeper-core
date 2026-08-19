import { auth } from '../../lib/firebase';
import { CadencePolicyManager } from '../cadencePolicy';

export type XConnectionStatusType = 'CONNECTED' | 'DISCONNECTED' | 'DEGRADED' | 'AUTH_REQUIRED';

export interface SocialCredentials {
  // X (Twitter) API v2 (Metadata only - secrets remain server-side)
  xClientIdMasked?: string;
  xAuthMode: 'oauth1' | 'oauth2' | 'sandbox';
  isUsingRealX: boolean;
  xStatus: XConnectionStatusType;
  xUsername: string;
  xUserId?: string;
  verifiedAt?: string;
  verificationSource?: string;

  // Active Default Platform
  activePlatform: 'x';
  updatedAt?: string;
}

export const CredentialPersistenceService = {
  /**
   * Check X (Twitter) live verified connection status from backend API
   */
  async getXConnectionStatus(force = false): Promise<{
    connected: boolean;
    status: XConnectionStatusType;
    username: string;
    userId?: string;
    authMode: string;
    tokenExpired: boolean;
    verifiedAt?: string;
    verificationSource?: string;
    error?: string;
  }> {
    try {
      const res = await fetch(`/api/x/status${force ? '?force=true' : ''}`);
      if (res.ok) {
        const data = await res.json();
        return {
          connected: Boolean(data.connected),
          status: (data.status as XConnectionStatusType) || (data.connected ? 'CONNECTED' : 'DISCONNECTED'),
          username: data.username || 'punn_firekeeper',
          userId: data.userId || undefined,
          authMode: data.authMode || 'oauth2',
          tokenExpired: Boolean(data.tokenExpired),
          verifiedAt: data.verifiedAt,
          verificationSource: data.verificationSource,
          error: data.error,
        };
      }
    } catch (err: any) {
      console.warn('[CredentialPersistence] Failed to fetch X connection status:', err);
    }
    return {
      connected: false,
      status: 'DISCONNECTED',
      username: 'punn_firekeeper',
      authMode: 'oauth2',
      tokenExpired: false,
    };
  },

  /**
   * Load stored persistent connection state from backend server & Firestore
   */
  async loadCredentials(): Promise<SocialCredentials | null> {
    try {
      const [autoRes, xStatusRes] = await Promise.allSettled([
        fetch('/api/autonomous/status'),
        fetch('/api/x/status'),
      ]);

      let xStatusData: any = null;
      if (xStatusRes.status === 'fulfilled' && xStatusRes.value.ok) {
        xStatusData = await xStatusRes.value.json();
      }

      if (autoRes.status === 'fulfilled' && autoRes.value.ok) {
        const autoData = await autoRes.value.json();
        if (autoData.state) {
          const state = autoData.state;
          CadencePolicyManager.syncPersistentState(state.last_post_at, state.daily_post_count);
          const isXConnected = xStatusData ? Boolean(xStatusData.connected) : Boolean(state.x_enabled);
          const xStatus: XConnectionStatusType = xStatusData?.status || (isXConnected ? 'CONNECTED' : 'DISCONNECTED');

          const creds: SocialCredentials = {
            xClientIdMasked: state.x_api_key ? `****${state.x_api_key.slice(-4)}` : undefined,
            xAuthMode: state.x_auth_mode || 'oauth2',
            isUsingRealX: isXConnected,
            xStatus,
            xUsername: xStatusData?.username || state.x_username || 'punn_firekeeper',
            xUserId: xStatusData?.userId || state.x_user_id,
            verifiedAt: xStatusData?.verifiedAt,
            verificationSource: xStatusData?.verificationSource,
            activePlatform: 'x',
            updatedAt: state.updated_at,
          };
          return creds;
        }
      }
    } catch (err) {
      console.warn('[CredentialPersistence] Failed to read backend state:', err);
    }

    return null;
  },

  /**
   * Configure credentials securely on backend server & Firestore
   */
  async configureXCredentials(params: {
    apiKey?: string;
    apiSecret?: string;
    accessToken?: string;
    accessSecret?: string;
    authMode?: 'oauth1' | 'oauth2';
  }): Promise<boolean> {
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (auth.currentUser) {
        try {
          const token = await auth.currentUser.getIdToken();
          if (token) headers['Authorization'] = `Bearer ${token}`;
        } catch {}
      }

      const res = await fetch('/api/x/configure', {
        method: 'POST',
        headers,
        body: JSON.stringify(params),
      });
      return res.ok;
    } catch (err) {
      console.warn('[CredentialPersistence] Error configuring X on backend:', err);
      return false;
    }
  },

  /**
   * Disconnect X on the backend
   */
  async disconnectX(): Promise<boolean> {
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (auth.currentUser) {
        try {
          const token = await auth.currentUser.getIdToken();
          if (token) headers['Authorization'] = `Bearer ${token}`;
        } catch {}
      }
      const res = await fetch('/api/x/disconnect', { method: 'POST', headers });
      return res.ok;
    } catch (err) {
      console.warn('[CredentialPersistence] Error disconnecting X:', err);
      return false;
    }
  },
};
