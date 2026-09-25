import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  collection,
  getDocs,
  serverTimestamp,
  increment,
  query,
  orderBy,
  getIsFirestoreQuotaExhausted,
  handleFirestoreError
} from '../lib/firebase';
import { db } from '../lib/firebase';
import { fetchWithAuthorization } from '../config/authFetch';

export interface UserUsageProfile {
  uid: string;
  email?: string | null;
  createdAt: any;
  lastLoginAt: any;
  lastAnalysisAt?: any;
  lastActiveAt?: any;
  analysisCount: number;
  pdfAnalysisCount: number;
  activeEventsCount: number;
  role: 'member' | 'admin';
}

export interface AdminAnalyticsSummary {
  totalMembers: number;
  activeUsers: number;
  newMembersToday: number;
  newMembersThisWeek: number;
  analysesToday: number;
  analysesThisWeek: number;
  totalAnalyses: number;
  returningUsers: number;
  dailyTrends: Array<{
    date: string;
    analyses: number;
    newUsers: number;
    activeUsers: number;
  }>;
  recentUsers: Array<{
    uid: string;
    email: string;
    createdAtText: string;
    lastLoginText: string;
    lastAnalysisText: string;
    analysisCount: number;
    pdfAnalysisCount: number;
    isActive: boolean;
    role: string;
  }>;
  lastRefreshedAt: string;
}

function getTodayDateString(): string {
  const now = new Date();
  return now.toISOString().split('T')[0]; // YYYY-MM-DD
}

/**
 * 1. Record User Sign Up in Firestore
 */
export async function recordUserSignUp(user: { uid: string; email?: string | null }): Promise<void> {
  if (!user || !user.uid || getIsFirestoreQuotaExhausted()) return;
  try {
    const userDocRef = doc(db, 'users', user.uid);

    await setDoc(
      userDocRef,
      {
        uid: user.uid,
        email: user.email || 'user@firebase',
        createdAt: serverTimestamp(),
        lastLoginAt: serverTimestamp(),
        lastActiveAt: serverTimestamp(),
        analysisCount: 0,
        pdfAnalysisCount: 0,
        activeEventsCount: 0,
      },
      { merge: true }
    );

    // Update Daily Aggregate
    const today = getTodayDateString();
    const dailyDocRef = doc(db, 'daily_stats', today);
    await setDoc(
      dailyDocRef,
      {
        date: today,
        newUsersCount: increment(1),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    ).catch(() => {});
  } catch (err) {
    handleFirestoreError(err, 'recordUserSignUp');
  }
}

/**
 * 2. Record User Login in Firestore
 */
export async function recordUserLogin(user: { uid: string; email?: string | null }): Promise<void> {
  if (!user || !user.uid || getIsFirestoreQuotaExhausted()) return;
  try {
    const userDocRef = doc(db, 'users', user.uid);
    const existingSnap = await getDoc(userDocRef);

    if (!existingSnap.exists()) {
      // First-time doc creation on login
      await recordUserSignUp(user);
    } else {
      await updateDoc(userDocRef, {
        lastLoginAt: serverTimestamp(),
        lastActiveAt: serverTimestamp(),
        ...(user.email ? { email: user.email } : {}),
      });
    }
  } catch (err) {
    handleFirestoreError(err, 'recordUserLogin');
  }
}

// In-memory debounce / deduplication maps to reduce repetitive Firestore writes
const recentActiveUserWrites = new Map<string, number>();
const ACTIVE_USER_WRITE_DEBOUNCE_MS = 60000; // 1 minute debounce for generic active events

/**
 * 3. Record Analysis Started (In-memory tracking to avoid redundant intermediate writes)
 */
export async function recordAnalysisStarted(uid: string): Promise<void> {
  if (!uid || getIsFirestoreQuotaExhausted()) return;
  // Non-blocking in-memory timestamp update; full write is batched in recordAnalysisCompleted
  recentActiveUserWrites.set(uid, Date.now());
}

/**
 * 4. Record Analysis Completed (+1 analysisCount, update timestamps, atomic daily aggregation)
 */
export async function recordAnalysisCompleted(uid: string, options: { hasPdf?: boolean } = {}): Promise<void> {
  if (!uid || getIsFirestoreQuotaExhausted()) return;
  try {
    const userDocRef = doc(db, 'users', uid);
    const updates: any = {
      analysisCount: increment(1),
      activeEventsCount: increment(1),
      lastAnalysisAt: serverTimestamp(),
      lastActiveAt: serverTimestamp(),
    };

    if (options.hasPdf) {
      updates.pdfAnalysisCount = increment(1);
    }

    await setDoc(userDocRef, updates, { merge: true });
    recentActiveUserWrites.set(uid, Date.now());

    // Increment today's daily aggregate
    const today = getTodayDateString();
    const dailyDocRef = doc(db, 'daily_stats', today);
    await setDoc(
      dailyDocRef,
      {
        date: today,
        analysesCount: increment(1),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    ).catch(() => {});
  } catch (err) {
    handleFirestoreError(err, 'recordAnalysisCompleted');
  }
}

/**
 * 5. Record PDF Uploaded (Active User event with 1-min debounce to reduce redundant writes)
 */
export async function recordPdfUploaded(uid: string): Promise<void> {
  if (!uid || getIsFirestoreQuotaExhausted()) return;
  const lastWrite = recentActiveUserWrites.get(uid) || 0;
  if (Date.now() - lastWrite < ACTIVE_USER_WRITE_DEBOUNCE_MS) {
    return;
  }
  try {
    const userDocRef = doc(db, 'users', uid);
    await setDoc(
      userDocRef,
      {
        activeEventsCount: increment(1),
        lastActiveAt: serverTimestamp(),
      },
      { merge: true }
    );
    recentActiveUserWrites.set(uid, Date.now());
  } catch (err) {
    handleFirestoreError(err, 'recordPdfUploaded');
  }
}

/**
 * 6. Record Question Submitted (Active User event with 1-min debounce)
 */
export async function recordQuestionSubmitted(uid: string): Promise<void> {
  if (!uid || getIsFirestoreQuotaExhausted()) return;
  const lastWrite = recentActiveUserWrites.get(uid) || 0;
  if (Date.now() - lastWrite < ACTIVE_USER_WRITE_DEBOUNCE_MS) {
    return;
  }
  try {
    const userDocRef = doc(db, 'users', uid);
    await setDoc(
      userDocRef,
      {
        activeEventsCount: increment(1),
        lastActiveAt: serverTimestamp(),
      },
      { merge: true }
    );
    recentActiveUserWrites.set(uid, Date.now());
  } catch (err) {
    handleFirestoreError(err, 'recordQuestionSubmitted');
  }
}

/**
 * 7. Admin Analytics Dashboard Data Aggregator
 */
export async function fetchAdminAnalyticsSummary(): Promise<AdminAnalyticsSummary> {
  const response = await fetchWithAuthorization('/api/admin/usage', {
    headers: { Accept: 'application/json' },
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload?.summary) {
    throw new Error(payload?.message || 'ไม่สามารถโหลดสถิติผู้ดูแลระบบได้');
  }
  return payload.summary as AdminAnalyticsSummary;
}

export interface AdminAuditLookupResult {
  referenceType: 'user_hash' | 'execution_id';
  user: { uid: string; email: string | null; role: string };
  auditRecords: Array<{
    executionId: string;
    traceId: string;
    timestamp: string | null;
    model: string;
    logLevel: string;
    durationMs: number;
    evidenceCount: number;
    conflictCount: number;
    riskCount: number;
    governanceStatus: string;
    integrityStatus: string;
  }>;
}

export async function lookupAdminAuditReference(reference: string): Promise<AdminAuditLookupResult | null> {
  const response = await fetchWithAuthorization(`/api/admin/audit-lookup?reference=${encodeURIComponent(reference)}`, {
    headers: { Accept: 'application/json' },
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload?.message || 'ไม่สามารถค้นหา audit reference ได้');
  return payload?.result || null;
}
function parseFirestoreTimestampToMillis(ts: any): number | null {
  if (!ts) return null;
  if (typeof ts === 'number') return ts;
  if (ts.toMillis && typeof ts.toMillis === 'function') return ts.toMillis();
  if (ts.seconds) return ts.seconds * 1000;
  if (typeof ts === 'string') {
    const parsed = Date.parse(ts);
    return isNaN(parsed) ? null : parsed;
  }
  if (ts instanceof Date) return ts.getTime();
  return null;
}

function formatDateText(timestamp: any): string {
  if (!timestamp) return 'N/A';
  try {
    const d = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    if (isNaN(d.getTime())) return 'N/A';
    return d.toLocaleDateString('th-TH', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return 'N/A';
  }
}

/**
 * 8. Record PCA Audit Log
 */
export async function recordPcaAuditLog(uid: string, log: any): Promise<void> {
  if (!uid || getIsFirestoreQuotaExhausted()) return;
  try {
    const auditId = log.execution_id || `audit-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const auditDocRef = doc(db, 'users', uid, 'pca_audit_logs', auditId);
    
    await setDoc(auditDocRef, {
      ...log,
      timestamp: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, 'recordPcaAuditLog');
  }
}
