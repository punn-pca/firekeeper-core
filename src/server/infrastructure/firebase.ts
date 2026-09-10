import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { initializeApp as initAdminApp, getApps as getAdminApps } from 'firebase-admin/app';
import { getFirestore as getAdminFirestore } from 'firebase-admin/firestore';
import path from 'path';
import fs from 'fs';

/**
 * ARCHITECTURAL IMMUTABILITY & WORM SPECIFICATION:
 * ------------------------------------------------
 * Note: Admin Firestore (adminDb) operates with service account privileges and
 * bypasses Firestore security rules. Thus, while client writes are forbidden
 * by firestore.rules, Firestore documents do not constitute hardware WORM
 * (Write-Once-Read-Many) storage. System audits are tamper-evident through
 * SHA-256 forward cryptographic hash-chaining, rather than storage-level WORM.
 */

export let serverDb: any = null;
export let adminDb: any = null;
export let firebaseAppConfig: any = {};
export let isServerFirestoreAdminAvailable = true;
let isWarningLogged = false;

export function markAdminFirestoreUnavailable(err?: any) {
  if (isServerFirestoreAdminAvailable) {
    isServerFirestoreAdminAvailable = false;
    const msg = err?.message || String(err || '');
    if (!isWarningLogged) {
      isWarningLogged = true;
      if (msg.includes('PERMISSION_DENIED') || msg.includes('Missing or insufficient permissions') || msg.includes('UNAUTHENTICATED') || err?.code === 7) {
        console.log('[Backend] Firestore Admin credentials not provisioned in current environment. Gracefully operating with client-side Firestore + server local isolated persistence.');
      } else {
        console.warn('[Backend] Firestore Admin unavailable:', msg);
      }
    }
  }
}

try {
  const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
  if (fs.existsSync(configPath)) {
    firebaseAppConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  }
} catch (e) {
  console.warn('Could not load firebase-applet-config.json:', e);
}

try {
  if (firebaseAppConfig && firebaseAppConfig.projectId) {
    const apps = getApps();
    const appInstance = apps.length === 0 ? initializeApp(firebaseAppConfig) : apps[0];
    const databaseId = firebaseAppConfig.firestoreDatabaseId || undefined;
    serverDb = getFirestore(appInstance, databaseId);

    try {
      const adminApps = getAdminApps();
      const adminApp = adminApps.length === 0
        ? initAdminApp({
            projectId: firebaseAppConfig.projectId,
            storageBucket: firebaseAppConfig.storageBucket,
          })
        : adminApps[0];

      adminDb = databaseId ? getAdminFirestore(adminApp, databaseId) : getAdminFirestore(adminApp);
      console.log('[Backend] Firestore and Admin SDK initialized successfully for project:', firebaseAppConfig.projectId, 'database:', databaseId || '(default)');
    } catch (adminErr) {
      console.warn('[Backend] Admin Firestore initialization notice:', adminErr);
    }
  }
} catch (err) {
  console.warn('[Backend] Failed to initialize Firestore in server:', err);
}

export function stripUndefinedFields(obj: any): any {
  if (obj === null || obj === undefined) return null;
  if (Array.isArray(obj)) {
    return obj.map(stripUndefinedFields);
  }
  if (typeof obj === 'object') {
    const cleaned: any = {};
    for (const key of Object.keys(obj)) {
      const val = obj[key];
      if (val !== undefined) {
        cleaned[key] = stripUndefinedFields(val);
      }
    }
    return cleaned;
  }
  return obj;
}
