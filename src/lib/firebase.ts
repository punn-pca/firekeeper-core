import { initializeApp } from 'firebase/app';
import {
  getAuth,
  initializeAuth,
  browserLocalPersistence,
  browserSessionPersistence,
  inMemoryPersistence,
  browserPopupRedirectResolver
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

let dbInstance: any;

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
      dbInstance = getFirestore(app, config.firestoreDatabaseId || undefined);
    }
  } catch (err) {
    try {
      dbInstance = initializeFirestore(app, {
        localCache: memoryLocalCache(),
        experimentalForceLongPolling: true
      }, config.firestoreDatabaseId || undefined);
    } catch {
      dbInstance = getFirestore(app, config.firestoreDatabaseId || undefined);
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

export function setFirestoreQuotaExhausted(val: boolean = true) {
  isFirestoreQuotaExhausted = val;
  if (val) console.warn('[Firebase] Firestore quota/error state detected. Requests remain fail-fast.');
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
    message.includes('resource-exhausted') ||
    message.includes('quota limit exceeded') ||
    message.includes('quota');

  if (isQuota) {
    setFirestoreQuotaExhausted(true);
    console.error(`[Firebase] Firestore quota exceeded during ${context}.`, err);
    return true;
  }

  console.error(`[Firebase] Firestore ${context} failed.`, err);
  return false;
}

export async function setDoc(reference: any, data: any, options?: any): Promise<void> {
  try {
    return await rawSetDoc(reference, data, options);
  } catch (err: any) {
    handleFirestoreError(err, 'setDoc');
    throw err;
  }
}

export async function updateDoc(reference: any, dataOrField: any, ...moreFieldsAndValues: any[]): Promise<void> {
  try {
    if (moreFieldsAndValues.length > 0) {
      return await (rawUpdateDoc as any)(reference, dataOrField, ...moreFieldsAndValues);
    }
    return await rawUpdateDoc(reference, dataOrField);
  } catch (err: any) {
    handleFirestoreError(err, 'updateDoc');
    throw err;
  }
}

export async function addDoc(reference: any, data: any): Promise<any> {
  try {
    return await rawAddDoc(reference, data);
  } catch (err: any) {
    handleFirestoreError(err, 'addDoc');
    throw err;
  }
}

export async function deleteDoc(reference: any): Promise<void> {
  try {
    return await rawDeleteDoc(reference);
  } catch (err: any) {
    handleFirestoreError(err, 'deleteDoc');
    throw err;
  }
}

export async function getDoc(reference: any): Promise<any> {
  try {
    return await rawGetDoc(reference);
  } catch (err: any) {
    handleFirestoreError(err, 'getDoc');
    throw err;
  }
}

export async function getDocs(queryRef: any): Promise<any> {
  try {
    return await rawGetDocs(queryRef);
  } catch (err: any) {
    handleFirestoreError(err, 'getDocs');
    throw err;
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
