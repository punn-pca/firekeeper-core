import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDoc, collection, addDoc, updateDoc, deleteDoc, query, where, getDocs, orderBy, serverTimestamp } from 'firebase/firestore';
import config from '../../firebase-applet-config.json';

// Ensure storage safety
try {
  if (typeof window !== 'undefined') {
    const testKey = '__firebase_storage_test__';
    try {
      window.localStorage.setItem(testKey, testKey);
      window.localStorage.removeItem(testKey);
    } catch (e) {
      const memory: Record<string, string> = {};
      const mockStorage = {
        getItem: (k: string) => memory[k] !== undefined ? memory[k] : null,
        setItem: (k: string, v: string) => { memory[k] = String(v); },
        removeItem: (k: string) => { delete memory[k]; },
        clear: () => { Object.keys(memory).forEach(k => delete memory[k]); },
        key: (i: number) => Object.keys(memory)[i] || null,
        get length() { return Object.keys(memory).length; }
      };
      Object.defineProperty(window, 'localStorage', { value: mockStorage, configurable: true, writable: true });
    }
  }
} catch (err) {}

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
  serverTimestamp
};
