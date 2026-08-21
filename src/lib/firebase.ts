import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  initializeAuth, 
  browserLocalPersistence, 
  browserSessionPersistence, 
  inMemoryPersistence,
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
      const testKey = '__test_auth_storage__';
      window.localStorage.setItem(testKey, '1');
      window.localStorage.removeItem(testKey);
      
      // Also verify sessionStorage is writable
      window.sessionStorage.setItem(testKey, '1');
      window.sessionStorage.removeItem(testKey);

      // Verify indexedDB is available (avoid calling open to prevent async SecurityError logs)
      if (!window.indexedDB) {
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
  const persistenceConfig = isStorageBlocked 
    ? inMemoryPersistence 
    : [browserLocalPersistence, browserSessionPersistence, inMemoryPersistence];

  try {
    // Initialize exactly ONCE and set persistence explicitly to avoid initialization argument issues
    console.log('[Firebase Auth] Initializing auth via getAuth');
    authInstance = getAuth(app);
    
    // Set persistence based on environment constraints
    if (isStorageBlocked) {
      console.log('[Firebase Auth] Setting in-memory persistence');
      setPersistence(authInstance, inMemoryPersistence).catch(e => console.error('Failed to set persistence:', e));
    } else {
      console.log('[Firebase Auth] Setting browser local/session persistence');
      setPersistence(authInstance, browserLocalPersistence).catch(e => console.error('Failed to set persistence:', e));
    }
    
    console.log('[Firebase Auth] Auth initialized successfully');
  } catch (initErr: any) {
    console.error('[Firebase Auth] Initialization failed:', initErr);
    authInstance = { _isDummy: true } as any;
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
  increment
} from 'firebase/firestore';
