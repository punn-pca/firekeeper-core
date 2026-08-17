import { initializeApp } from 'firebase/app';
import { getAuth, browserLocalPersistence, browserSessionPersistence, inMemoryPersistence, setPersistence, signInWithEmailAndPassword, createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, collection, addDoc, updateDoc, deleteDoc, query, where, getDocs, orderBy, serverTimestamp, increment } from 'firebase/firestore';
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

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

try {
  setPersistence(auth, browserLocalPersistence).catch((err) => {
    console.warn('browserLocalPersistence failed, trying browserSessionPersistence:', err);
    setPersistence(auth, browserSessionPersistence).catch((err2) => {
      console.warn('browserSessionPersistence failed, falling back to inMemoryPersistence:', err2);
      setPersistence(auth, inMemoryPersistence).catch(() => {});
    });
  });
} catch (err) {
  console.warn('Persistence setup threw security exception, using default persistence:', err);
}

export const db = getFirestore(app, config.firestoreDatabaseId || undefined);

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
  browserLocalPersistence,
  setPersistence,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged
};
