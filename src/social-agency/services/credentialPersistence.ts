import { db, doc, getDoc, setDoc } from '../../lib/firebase';
import { CadencePolicyManager } from '../cadencePolicy';

export interface SocialCredentials {
  // Instagram Meta Graph API
  igAccessToken: string;
  igAccountId: string;
  isUsingRealInstagram: boolean;

  // X (Twitter) API v2
  xApiKey: string;
  xApiSecret: string;
  xAccessToken: string;
  xAccessSecret: string;
  xAuthMode: 'oauth1' | 'oauth2' | 'sandbox';
  isUsingRealX: boolean;
  xStatus?: 'CONNECTED' | 'NOT_CONNECTED' | 'TOKEN_EXPIRED';
  xUsername?: string;

  // Active Default Platform
  activePlatform: 'instagram' | 'x';
  updatedAt?: string;
}

export const CredentialPersistenceService = {
  /**
   * Check X (Twitter) live persistent connection status from backend
   */
  async getXConnectionStatus(): Promise<{
    connected: boolean;
    status: 'CONNECTED' | 'NOT_CONNECTED' | 'TOKEN_EXPIRED';
    username: string;
    authMode: string;
    tokenExpired: boolean;
  }> {
    try {
      const res = await fetch('/api/x/status');
      if (res.ok) {
        const data = await res.json();
        return {
          connected: Boolean(data.connected),
          status: data.status || (data.connected ? 'CONNECTED' : 'NOT_CONNECTED'),
          username: data.username || 'firekeeper_ai',
          authMode: data.authMode || 'oauth2',
          tokenExpired: Boolean(data.tokenExpired),
        };
      }
    } catch (err) {
      console.warn('[CredentialPersistence] Failed to fetch X connection status:', err);
    }
    return {
      connected: false,
      status: 'NOT_CONNECTED',
      username: 'firekeeper_ai',
      authMode: 'oauth2',
      tokenExpired: false,
    };
  },

  /**
   * Load stored persistent connection state from backend server & Firestore
   */
  async loadCredentials(): Promise<SocialCredentials | null> {
    try {
      // 1. Fetch server-side persistent status
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
          const xStatus = xStatusData?.status || (isXConnected ? 'CONNECTED' : 'NOT_CONNECTED');

          const creds: SocialCredentials = {
            igAccessToken: state.ig_access_token || '',
            igAccountId: state.ig_account_id || '',
            isUsingRealInstagram: Boolean(state.ig_enabled && (state.has_ig_access_token || state.ig_access_token)),
            xApiKey: state.x_api_key || '',
            xApiSecret: '', // Protected: do not leak raw secret to client
            xAccessToken: state.has_x_access_token ? 'PERSISTENT_BACKEND_TOKEN' : '',
            xAccessSecret: '',
            xAuthMode: state.x_auth_mode || 'oauth2',
            isUsingRealX: isXConnected,
            xStatus,
            xUsername: xStatusData?.username || state.x_username || 'firekeeper_ai',
            activePlatform: state.active_platform || 'x',
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
   * Save credentials permanently to backend server & Firestore
   */
  async saveCredentials(creds: Partial<SocialCredentials>): Promise<boolean> {
    try {
      // Send directly to backend config endpoint (which persists in Firestore)
      const res = await fetch('/api/autonomous/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          igAccessToken: creds.igAccessToken,
          igAccountId: creds.igAccountId,
          igEnabled: creds.isUsingRealInstagram,
          xApiKey: creds.xApiKey,
          xApiSecret: creds.xApiSecret,
          xAccessToken: creds.xAccessToken === 'PERSISTENT_BACKEND_TOKEN' ? undefined : creds.xAccessToken,
          xAccessSecret: creds.xAccessSecret,
          xAuthMode: creds.xAuthMode,
          xEnabled: creds.isUsingRealX,
          activePlatform: creds.activePlatform,
        }),
      });
      return res.ok;
    } catch (err) {
      console.warn('[CredentialPersistence] Error saving credentials to backend:', err);
      return false;
    }
  },

  /**
   * Disconnect X on the backend
   */
  async disconnectX(): Promise<boolean> {
    try {
      const res = await fetch('/api/x/disconnect', { method: 'POST' });
      return res.ok;
    } catch (err) {
      console.warn('[CredentialPersistence] Error disconnecting X:', err);
      return false;
    }
  },
};
