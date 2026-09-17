import { initializeApp, getApps } from 'firebase/app';
import { initializeAuth, inMemoryPersistence } from 'firebase/auth';

// Inject Referer header on mobile requests to satisfy Google Cloud API Key HTTP Referrer restrictions
if (typeof globalThis !== 'undefined' && (globalThis as any).fetch) {
  const originalFetch = (globalThis as any).fetch;
  (globalThis as any).fetch = async (input: any, init?: any) => {
    try {
      const url = typeof input === 'string' ? input : input?.url || input?.toString?.() || '';
      if (url.includes('googleapis.com') || url.includes('firebase')) {
        init = init || {};
        let headers: Record<string, string> = {};
        if (init.headers instanceof Headers) {
          init.headers.forEach((v: string, k: string) => { headers[k] = v; });
        } else if (Array.isArray(init.headers)) {
          init.headers.forEach(([k, v]: [string, string]) => { headers[k] = v; });
        } else if (init.headers && typeof init.headers === 'object') {
          headers = { ...init.headers };
        }
        if (!headers['Referer'] && !headers['referer']) {
          headers['Referer'] = 'https://firekeeper.site/';
        }
        init.headers = headers;
      }
    } catch {}
    return originalFetch(input, init);
  };
}

// Firebase config from firekeeper-pca project
const firebaseConfig = {
  apiKey: 'AIzaSyCjrY8E1uYL95Z-dStlsuBklyYoFlQH_Vw',
  authDomain: 'firekeeper-pca.firebaseapp.com',
  projectId: 'firekeeper-pca',
  storageBucket: 'firekeeper-pca.firebasestorage.app',
  messagingSenderId: '272949249192',
  appId: '1:272949249192:web:1d013f03054dc184366e9d',
};

// Prevent duplicate initialization on hot-reload
const app = getApps().length === 0
  ? initializeApp(firebaseConfig)
  : getApps()[0];

// Use inMemoryPersistence since @firebase/auth/react-native is not available
// in this Firebase version. We persist the session manually via AsyncStorage
// in AuthContext (the firekeeper server token is stored there).
export const firebaseAuth = initializeAuth(app, {
  persistence: inMemoryPersistence,
});

export { app };
