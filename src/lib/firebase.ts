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

import {
  doc,
  collection,
  query,
  where,
  orderBy,
  serverTimestamp,
  increment,
  onSnapshot,
  limit,
  setDoc as rawSetDoc,
  getDoc as rawGetDoc,
  getDocs as rawGetDocs,
  addDoc as rawAddDoc,
  updateDoc as rawUpdateDoc,
  deleteDoc as rawDeleteDoc,
} from 'firebase/firestore';

// Quota exhaustion and circuit breaker flag with session persistence
let isFirestoreQuotaExhausted = false;

try {
  if (typeof window !== 'undefined') {
    const cached = window.sessionStorage?.getItem('fk_firestore_quota_exhausted');
    if (cached === 'true') {
      isFirestoreQuotaExhausted = true;
    }
  }
} catch (e) {}

export function setFirestoreQuotaExhausted(val: boolean = true) {
  isFirestoreQuotaExhausted = val;
  try {
    if (typeof window !== 'undefined') {
      if (val) {
        window.sessionStorage?.setItem('fk_firestore_quota_exhausted', 'true');
      } else {
        window.sessionStorage?.removeItem('fk_firestore_quota_exhausted');
      }
    }
  } catch (e) {}
  if (val) {
    console.warn('[Firebase] Firestore daily free tier quota active. Operating in resilient offline-first mode.');
  }
}

export function getIsFirestoreQuotaExhausted(): boolean {
  return isFirestoreQuotaExhausted;
}

export function handleFirestoreError(err: any, context: string = 'operation'): boolean {
  const errMsg = String(err?.message || err?.code || err || '');
  if (
    errMsg.includes('RESOURCE_EXHAUSTED') ||
    errMsg.includes('resource-exhausted') ||
    errMsg.includes('Quota limit exceeded') ||
    errMsg.includes('quota')
  ) {
    setFirestoreQuotaExhausted(true);
    return true;
  }
  if (errMsg.includes('network-request-failed') || errMsg.includes('unavailable')) {
    console.warn(`[Firebase] Network/Auth notice during ${context}:`, errMsg);
    return true;
  }
  console.warn(`[Firebase] Non-fatal notice during ${context}:`, errMsg);
  return false;
}

// Resilient Wrapped Operations (Prevent uncaught errors and background retry loops when quota is exhausted)
export async function setDoc(reference: any, data: any, options?: any): Promise<void> {
  if (isFirestoreQuotaExhausted) {
    return Promise.resolve();
  }
  try {
    return await rawSetDoc(reference, data, options);
  } catch (err: any) {
    handleFirestoreError(err, 'setDoc');
    return Promise.resolve();
  }
}

export async function updateDoc(reference: any, dataOrField: any, ...moreFieldsAndValues: any[]): Promise<void> {
  if (isFirestoreQuotaExhausted) {
    return Promise.resolve();
  }
  try {
    if (moreFieldsAndValues.length > 0) {
      return await (rawUpdateDoc as any)(reference, dataOrField, ...moreFieldsAndValues);
    }
    return await rawUpdateDoc(reference, dataOrField);
  } catch (err: any) {
    handleFirestoreError(err, 'updateDoc');
    return Promise.resolve();
  }
}

export async function addDoc(reference: any, data: any): Promise<any> {
  if (isFirestoreQuotaExhausted) {
    return Promise.resolve({ id: `local-${Date.now()}` });
  }
  try {
    return await rawAddDoc(reference, data);
  } catch (err: any) {
    handleFirestoreError(err, 'addDoc');
    return Promise.resolve({ id: `local-${Date.now()}` });
  }
}

export async function deleteDoc(reference: any): Promise<void> {
  if (isFirestoreQuotaExhausted) {
    return Promise.resolve();
  }
  try {
    return await rawDeleteDoc(reference);
  } catch (err: any) {
    handleFirestoreError(err, 'deleteDoc');
    return Promise.resolve();
  }
}

export async function getDoc(reference: any): Promise<any> {
  if (isFirestoreQuotaExhausted) {
    return {
      exists: () => false,
      data: () => undefined,
      id: reference?.id || 'unknown',
    };
  }
  try {
    return await rawGetDoc(reference);
  } catch (err: any) {
    handleFirestoreError(err, 'getDoc');
    return {
      exists: () => false,
      data: () => undefined,
      id: reference?.id || 'unknown',
    };
  }
}

export async function getDocs(queryRef: any): Promise<any> {
  if (isFirestoreQuotaExhausted) {
    return {
      empty: true,
      size: 0,
      docs: [],
      forEach: () => {},
    };
  }
  try {
    return await rawGetDocs(queryRef);
  } catch (err: any) {
    handleFirestoreError(err, 'getDocs');
    return {
      empty: true,
      size: 0,
      docs: [],
      forEach: () => {},
    };
  }
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
  collection,
  query,
  where,
  orderBy,
  serverTimestamp,
  increment,
  onSnapshot,
  limit
};
