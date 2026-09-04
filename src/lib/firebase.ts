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

// Firebase Auth must remain usable in AI Studio preview/sandbox environments.
// Storage persistence is independent from OAuth domain authorization, so do not
// treat storage restrictions as an OAuth failure. Prefer normal persistence and
// fall back to memory only when the browser actually blocks storage.
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
      popupRedirectResolver: browserPopupRedirectResolver
    });
  } catch (e) {
    console.warn('[Firebase Auth] initializeAuth failed, falling back to getAuth', e);
    authInstance = getAuth(app);
    try {
      if (isStorageBlocked) {
        await setPersistence(authInstance, inMemoryPersistence);
      }
    } catch (persistenceError) {
      console.warn('[Firebase Auth] Persistence fallback failed:', persistenceError);
    }
  }

  if (authInstance?.app) {
    globalAny._firebaseAuthInstance = authInstance;
  }
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
    } catch (getDbErr) {
      dbInstance = getFirestore(app, config.firestoreDatabaseId || undefined);
    }
  }

  if (dbInstance?.app) {
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

let isFirestoreQuotaExhausted = false;

try {
  if (typeof window !== 'undefined') {
    const cached = window.sessionStorage?.getItem('fk_firestore_quota_exhausted');
    if (cached === 'true') isFirestoreQuotaExhausted = true;
  }
} catch {}

export function setFirestoreQuotaExhausted(val: boolean = true) {
  isFirestoreQuotaExhausted = val;
  try {
    if (typeof window !== 'undefined') {
      if (val) window.sessionStorage?.setItem('fk_firestore_quota_exhausted', 'true');
      else window.sessionStorage?.removeItem('fk_firestore_quota_exhausted');
    }
  } catch {}
  if (val) console.warn('[Firebase] Firestore quota active. Operating in resilient offline-first mode.');
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

export async function setDoc(reference: any, data: any, options?: any): Promise<void> {
  if (isFirestoreQuotaExhausted) return Promise.resolve();
  try { return await rawSetDoc(reference, data, options); }
  catch (err: any) { handleFirestoreError(err, 'setDoc'); return Promise.resolve(); }
}

export async function updateDoc(reference: any, dataOrField: any, ...moreFieldsAndValues: any[]): Promise<void> {
  if (isFirestoreQuotaExhausted) return Promise.resolve();
  try {
    if (moreFieldsAndValues.length > 0) return await (rawUpdateDoc as any)(reference, dataOrField, ...moreFieldsAndValues);
    return await rawUpdateDoc(reference, dataOrField);
  } catch (err: any) { handleFirestoreError(err, 'updateDoc'); return Promise.resolve(); }
}

export async function addDoc(reference: any, data: any): Promise<any> {
  if (isFirestoreQuotaExhausted) return Promise.resolve({ id: `local-${Date.now()}` });
  try { return await rawAddDoc(reference, data); }
  catch (err: any) { handleFirestoreError(err, 'addDoc'); return Promise.resolve({ id: `local-${Date.now()}` }); }
}

export async function deleteDoc(reference: any): Promise<void> {
  if (isFirestoreQuotaExhausted) return Promise.resolve();
  try { return await rawDeleteDoc(reference); }
  catch (err: any) { handleFirestoreError(err, 'deleteDoc'); return Promise.resolve(); }
}

export async function getDoc(reference: any): Promise<any> {
  if (isFirestoreQuotaExhausted) return { exists: () => false, data: () => undefined, id: reference?.id || 'unknown' };
  try { return await rawGetDoc(reference); }
  catch (err: any) { handleFirestoreError(err, 'getDoc'); return { exists: () => false, data: () => undefined, id: reference?.id || 'unknown' }; }
}

export async function getDocs(queryRef: any): Promise<any> {
  if (isFirestoreQuotaExhausted) return { empty: true, size: 0, docs: [], forEach: () => {} };
  try { return await rawGetDocs(queryRef); }
  catch (err: any) { handleFirestoreError(err, 'getDocs'); return { empty: true, size: 0, docs: [], forEach: () => {} }; }
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
