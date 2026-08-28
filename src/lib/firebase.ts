import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  initializeAuth, 
  browserLocalPersistence, 
  browserSessionPersistence, 
  inMemoryPersistence,
  browserPopupRedirectResolver,
  setPersistence 
} from 'firebase/auth';
import { getFirestore, initializeFirestore, memoryLocalCache } from 'firebase/firestore';
import config from '../../firebase-applet-config.json';

const firebaseConfig = {
  apiKey: config.apiKey,
  authDomain: config.authDomain,
  projectId: config.projectId,
  storageBucket: config.storageBucket,
  messagingSenderId: config.messagingSenderId,
  appId: config.appId,
  measurementId: config.measurementId
};

const app = initializeApp(firebaseConfig);
export { app };

// Initialize auth with fallbacks for sandboxed iframes (avoiding "The operation is insecure" DOMException)
let authInstance;
let isStorageBlocked = false;

// Determine if browser storage is blocked or restricted before calling initializeAuth
try {
  let isInsideIframe = false;
  try {
    isInsideIframe = typeof window !== 'undefined' && (window.self !== window.parent);
  } catch (iframeErr) {
    isInsideIframe = true;
  }
  
  const isHeadlessOrNoCookies = typeof window !== 'undefined' && (
    !window.navigator.cookieEnabled ||
    window.navigator.webdriver ||
    /Headless|Automated/i.test(window.navigator.userAgent)
  );

  if (isInsideIframe || isHeadlessOrNoCookies || typeof window === 'undefined') {
    isStorageBlocked = true;
  } else {
    // Check if localStorage works and is not a mocked/restricted interface
    try {
      const storage = typeof window !== 'undefined' ? window.localStorage : null;
      if (!storage) {
        isStorageBlocked = true;
      } else {
        const testKey = '__test_auth_storage__';
        storage.setItem(testKey, '1');
        storage.removeItem(testKey);
      }
    } catch (e) {
      isStorageBlocked = true;
    }

    try {
      if (!isStorageBlocked) {
        const sessStorage = typeof window !== 'undefined' ? window.sessionStorage : null;
        if (!sessStorage) {
          isStorageBlocked = true;
        } else {
          const testKey = '__test_auth_storage__';
          sessStorage.setItem(testKey, '1');
          sessStorage.removeItem(testKey);
        }
      }
    } catch (e) {
      isStorageBlocked = true;
    }

    try {
      if (!isStorageBlocked && (typeof window === 'undefined' || !window.indexedDB)) {
        isStorageBlocked = true;
      }
    } catch (e) {
      isStorageBlocked = true;
    }
  }
} catch (e) {
  isStorageBlocked = true;
}

// Use globalThis cache to prevent double-initialization in HMR / module reload
const globalAny = globalThis as any;

if (globalAny._firebaseAuthInstance) {
  authInstance = globalAny._firebaseAuthInstance;
} else {
  try {
    if (isStorageBlocked) {
      console.log('[Firebase Auth] Initializing auth with inMemoryPersistence to prevent insecure storage errors');
      authInstance = initializeAuth(app, {
        persistence: inMemoryPersistence,
        popupRedirectResolver: browserPopupRedirectResolver
      });
    } else {
      console.log('[Firebase Auth] Initializing auth with standard persistence list');
      try {
        authInstance = initializeAuth(app, {
          persistence: [browserLocalPersistence, browserSessionPersistence, inMemoryPersistence],
          popupRedirectResolver: browserPopupRedirectResolver
        });
      } catch (e) {
        console.warn('[Firebase Auth] initializeAuth failed, falling back to getAuth', e);
        authInstance = getAuth(app);
      }
    }
  } catch (initErr: any) {
    console.error('[Firebase Auth] Initialization failed:', initErr);
    try {
      authInstance = getAuth(app);
    } catch (fallbackErr) {
      authInstance = { _isDummy: true } as any;
    }
  }

  // Cache instance in globalThis if successfully created to prevent future re-initialization failures
  if (authInstance && authInstance.app) {
    globalAny._firebaseAuthInstance = authInstance;
  }
}

export const auth = authInstance;

// Initialize Firestore with memoryLocalCache to avoid "The operation is insecure" errors in sandboxed iframes
let dbInstance;

if (globalAny._firebaseDbInstance) {
  dbInstance = globalAny._firebaseDbInstance;
} else {
  try {
    if (isStorageBlocked) {
      dbInstance = initializeFirestore(app, {
        localCache: memoryLocalCache(),
        experimentalForceLongPolling: true
      }, config.firestoreDatabaseId || undefined);
    } else {
      try {
        dbInstance = getFirestore(app, config.firestoreDatabaseId || undefined);
      } catch (e) {
        dbInstance = initializeFirestore(app, {
          localCache: memoryLocalCache(),
          experimentalForceLongPolling: true
        }, config.firestoreDatabaseId || undefined);
      }
    }
  } catch (err) {
    try {
      dbInstance = initializeFirestore(app, {
        localCache: memoryLocalCache(),
        experimentalForceLongPolling: true
      }, config.firestoreDatabaseId || undefined);
    } catch (getDbErr) {
      try {
        dbInstance = getFirestore(app, config.firestoreDatabaseId || undefined);
      } catch (e) {
        dbInstance = {} as any;
      }
    }
  }

  if (dbInstance && dbInstance.app) {
    globalAny._firebaseDbInstance = dbInstance;
  }
}

export const db = dbInstance;

export function sanitizeFirestorePayload(obj: any): any {
  if (obj === null || obj === undefined) return null;
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeFirestorePayload(item));
  }
  if (typeof obj === 'object') {
    // Keep standard Firestore FieldValues or Timestamps unaltered
    if (obj.constructor && (obj.constructor.name === 'FieldValue' || obj.constructor.name === 'Timestamp' || typeof obj.toMillis === 'function')) {
      return obj;
    }
    const cleaned: any = {};
    for (const key of Object.keys(obj)) {
      const val = obj[key];
      if (val !== undefined) {
        cleaned[key] = sanitizeFirestorePayload(val);
      }
    }
    return cleaned;
  }
  return obj;
}

export {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  setPersistence,
  inMemoryPersistence
} from 'firebase/auth';

export {
  doc,
  setDoc,
  getDoc,
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  getDocs,
  orderBy,
  serverTimestamp,
  increment,
  onSnapshot,
  limit
} from 'firebase/firestore';
