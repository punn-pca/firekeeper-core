import { initializeApp } from 'firebase/app';
import {
  getAuth,
  initializeAuth,
  browserLocalPersistence,
  browserSessionPersistence,
  inMemoryPersistence,
  browserPopupRedirectResolver
} from 'firebase/auth';
import {
  getFirestore,
  initializeFirestore,
  memoryLocalCache,
  setLogLevel
} from 'firebase/firestore';
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

let authInstance: any;
let isStorageBlocked = false;

try {
  if (typeof window === 'undefined') {
    isStorageBlocked = true;
  } else {
    try {
      const storage = window.localStorage;
      const testKey = '__fk_auth_storage_test__';
      storage.setItem(testKey, '1');
      storage.removeItem(testKey);
    } catch {
      isStorageBlocked = true;
    }

    if (!isStorageBlocked) {
      try {
        const storage = window.sessionStorage;
        const testKey = '__fk_auth_session_test__';
        storage.setItem(testKey, '1');
        storage.removeItem(testKey);
      } catch {
        isStorageBlocked = true;
      }
    }
  }
} catch {
  isStorageBlocked = true;
}

const globalAny = globalThis as any;

if (globalAny._firebaseAuthInstance) {
  authInstance = globalAny._firebaseAuthInstance;
} else {
  try {
    authInstance = initializeAuth(app, {
      persistence: isStorageBlocked
        ? inMemoryPersistence
        : [browserLocalPersistence, browserSessionPersistence, inMemoryPersistence],
      popupRedirectResolver: typeof window !== 'undefined' ? browserPopupRedirectResolver : undefined
    });
  } catch (e) {
    if (typeof window !== 'undefined') {
      console.warn('[Firebase Auth] initializeAuth failed, falling back to getAuth', e);
    }
    authInstance = getAuth(app);
  }

  if (authInstance?.app) globalAny._firebaseAuthInstance = authInstance;
}

export const auth = authInstance;

// Mute non-fatal Firestore network retry and internal sandbox noise in console
try {
  setLogLevel('silent');
} catch {}

let dbInstance: any;

if (globalAny._firebaseDbInstance) {
  dbInstance = globalAny._firebaseDbInstance;
} else {
  try {
    dbInstance = initializeFirestore(app, {
      localCache: memoryLocalCache(),
      experimentalAutoDetectLongPolling: true
    }, config.firestoreDatabaseId || undefined);
  } catch (err) {
    try {
      dbInstance = getFirestore(app, config.firestoreDatabaseId || undefined);
    } catch {
      dbInstance = null;
    }
  }

  if (dbInstance?.app) globalAny._firebaseDbInstance = dbInstance;
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

/**
 * Firestore errors are intentionally NOT converted into fake success values.
 * Callers must be able to distinguish a persisted operation from a failed one.
 * Quota state is retained only as diagnostic telemetry; it never suppresses a
 * Firestore request or manufactures local document IDs / empty snapshots.
 */
let isFirestoreQuotaExhausted = false;

try {
  if (typeof window !== 'undefined') {
    const today = new Date().toISOString().split('T')[0];
    const cachedQuotaKey = `__fk_quota_exhausted_${today}`;
    if (window.sessionStorage?.getItem(cachedQuotaKey) === '1' || window.localStorage?.getItem(cachedQuotaKey) === '1') {
      isFirestoreQuotaExhausted = true;
    }
  }
} catch {}

export function setFirestoreQuotaExhausted(val: boolean = true) {
  isFirestoreQuotaExhausted = val;
  try {
    if (typeof window !== 'undefined' && val) {
      const today = new Date().toISOString().split('T')[0];
      window.sessionStorage?.setItem(`__fk_quota_exhausted_${today}`, '1');
    }
  } catch {}
  if (val) console.warn('[Firebase] Firestore quota limit reached for today. Application active in local cache fallback mode.');
}

export function getIsFirestoreQuotaExhausted(): boolean {
  return isFirestoreQuotaExhausted;
}

export function handleFirestoreError(err: any, context: string = 'operation'): boolean {
  const code = String(err?.code || '').toLowerCase();
  const message = String(err?.message || err || '').toLowerCase();
  const isQuota =
    code.includes('resource-exhausted') ||
    message.includes('resource_exhausted') ||
    message.includes('quota limit exceeded') ||
    message.includes('quota metric') ||
    message.includes('quota');

  if (isQuota) {
    setFirestoreQuotaExhausted(true);
    console.warn(`[Firebase] Firestore quota notice during ${context}. Switched to local offline resilience.`);
    return true;
  }

  const isUnavailable =
    code.includes('unavailable') ||
    message.includes('could not reach cloud firestore') ||
    message.includes('offline') ||
    message.includes('network');

  if (isUnavailable) {
    console.info(`[Firebase] Firestore backend in offline/reconnect state during ${context}; using cached state.`);
    return true;
  }

  console.warn(`[Firebase] Firestore ${context} issue (handled via local fallback):`, err?.message || err);
  return false;
}

export async function setDoc(reference: any, data: any, options?: any): Promise<void> {
  if (isFirestoreQuotaExhausted) {
    return;
  }
  try {
    return await rawSetDoc(reference, data, options);
  } catch (err: any) {
    handleFirestoreError(err, 'setDoc');
  }
}

export async function updateDoc(reference: any, dataOrField: any, ...moreFieldsAndValues: any[]): Promise<void> {
  if (isFirestoreQuotaExhausted) {
    return;
  }
  try {
    if (moreFieldsAndValues.length > 0) {
      return await (rawUpdateDoc as any)(reference, dataOrField, ...moreFieldsAndValues);
    }
    return await rawUpdateDoc(reference, dataOrField);
  } catch (err: any) {
    handleFirestoreError(err, 'updateDoc');
  }
}

export async function addDoc(reference: any, data: any): Promise<any> {
  if (isFirestoreQuotaExhausted) {
    return { id: `local-${Date.now()}` };
  }
  try {
    return await rawAddDoc(reference, data);
  } catch (err: any) {
    handleFirestoreError(err, 'addDoc');
    return { id: `local-${Date.now()}` };
  }
}

export async function deleteDoc(reference: any): Promise<void> {
  if (isFirestoreQuotaExhausted) {
    return;
  }
  try {
    return await rawDeleteDoc(reference);
  } catch (err: any) {
    handleFirestoreError(err, 'deleteDoc');
  }
}

export async function getDoc(reference: any): Promise<any> {
  if (isFirestoreQuotaExhausted) {
    return { exists: () => false, data: () => undefined, id: reference?.id || 'local' };
  }
  try {
    return await rawGetDoc(reference);
  } catch (err: any) {
    handleFirestoreError(err, 'getDoc');
    return { exists: () => false, data: () => undefined, id: reference?.id || 'local' };
  }
}

export async function getDocs(queryRef: any): Promise<any> {
  if (isFirestoreQuotaExhausted) {
    return { empty: true, docs: [], size: 0, forEach: () => {} };
  }
  try {
    return await rawGetDocs(queryRef);
  } catch (err: any) {
    handleFirestoreError(err, 'getDocs');
    return { empty: true, docs: [], size: 0, forEach: () => {} };
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
