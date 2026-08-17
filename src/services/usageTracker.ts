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
  orderBy
} from '../lib/firebase';
import { db } from '../lib/firebase';
import { checkIsAdminSync } from '../config/adminConfig';

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
  if (!user || !user.uid) return;
  try {
    const userDocRef = doc(db, 'users', user.uid);
    const isAdmin = checkIsAdminSync(user);

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
        role: isAdmin ? 'admin' : 'member',
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
    console.warn('[UsageTracker] Non-fatal catch in recordUserSignUp:', err);
  }
}

/**
 * 2. Record User Login in Firestore
 */
export async function recordUserLogin(user: { uid: string; email?: string | null }): Promise<void> {
  if (!user || !user.uid) return;
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
    console.warn('[UsageTracker] Non-fatal catch in recordUserLogin:', err);
  }
}

/**
 * 3. Record Analysis Started (Active User event)
 */
export async function recordAnalysisStarted(uid: string): Promise<void> {
  if (!uid) return;
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
  } catch (err) {
    console.warn('[UsageTracker] Non-fatal catch in recordAnalysisStarted:', err);
  }
}

/**
 * 4. Record Analysis Completed (+1 analysisCount, update timestamps)
 */
export async function recordAnalysisCompleted(uid: string, options: { hasPdf?: boolean } = {}): Promise<void> {
  if (!uid) return;
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
    console.warn('[UsageTracker] Non-fatal catch in recordAnalysisCompleted:', err);
  }
}

/**
 * 5. Record PDF Uploaded (Active User event)
 */
export async function recordPdfUploaded(uid: string): Promise<void> {
  if (!uid) return;
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
  } catch (err) {
    console.warn('[UsageTracker] Non-fatal catch in recordPdfUploaded:', err);
  }
}

/**
 * 6. Record Question Submitted (Active User event)
 */
export async function recordQuestionSubmitted(uid: string): Promise<void> {
  if (!uid) return;
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
  } catch (err) {
    console.warn('[UsageTracker] Non-fatal catch in recordQuestionSubmitted:', err);
  }
}

/**
 * 7. Admin Analytics Dashboard Data Aggregator
 */
export async function fetchAdminAnalyticsSummary(): Promise<AdminAnalyticsSummary> {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const sevenDaysAgo = now.getTime() - 7 * 24 * 60 * 60 * 1000;

  try {
    const usersCollection = collection(db, 'users');
    const usersSnap = await getDocs(usersCollection);

    let totalMembers = 0;
    let activeUsers = 0;
    let newMembersToday = 0;
    let newMembersThisWeek = 0;
    let totalAnalyses = 0;
    let returningUsers = 0;
    let analysesTodayFromUsers = 0;
    let analysesThisWeekFromUsers = 0;

    const rawUsers: any[] = [];

    usersSnap.forEach((docSnap) => {
      totalMembers++;
      const data = docSnap.data();
      rawUsers.push(data);

      const analysisCount = Number(data.analysisCount) || 0;
      const pdfAnalysisCount = Number(data.pdfAnalysisCount) || 0;
      const activeEventsCount = Number(data.activeEventsCount) || 0;

      totalAnalyses += analysisCount;

      // Active User Definition: user with at least one active event (analysis_started, analysis_completed, pdf_uploaded, question_submitted)
      const isUserActive = analysisCount > 0 || pdfAnalysisCount > 0 || activeEventsCount > 0 || !!data.lastAnalysisAt;
      if (isUserActive) {
        activeUsers++;
      }

      // Returning user definition: user with multiple analyses or multiple sessions
      if (analysisCount >= 2 || activeEventsCount >= 3) {
        returningUsers++;
      }

      // Timestamps conversion
      const createdMillis = parseFirestoreTimestampToMillis(data.createdAt);
      if (createdMillis) {
        if (createdMillis >= startOfToday) {
          newMembersToday++;
        }
        if (createdMillis >= sevenDaysAgo) {
          newMembersThisWeek++;
        }
      }

      const lastAnalysisMillis = parseFirestoreTimestampToMillis(data.lastAnalysisAt);
      if (lastAnalysisMillis) {
        if (lastAnalysisMillis >= startOfToday) {
          analysesTodayFromUsers += 1;
        }
        if (lastAnalysisMillis >= sevenDaysAgo) {
          analysesThisWeekFromUsers += 1;
        }
      }
    });

    // Also fetch daily_stats if available
    let analysesToday = Math.max(analysesTodayFromUsers, 0);
    let analysesThisWeek = Math.max(analysesThisWeekFromUsers, 0);
    const dailyMap = new Map<string, { analyses: number; newUsers: number; activeUsers: number }>();

    // Seed last 7 days in dailyMap
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = d.toISOString().split('T')[0];
      dailyMap.set(dateStr, { analyses: 0, newUsers: 0, activeUsers: 0 });
    }

    try {
      const dailySnap = await getDocs(collection(db, 'daily_stats'));
      let sumWeekDaily = 0;
      const todayStr = getTodayDateString();

      dailySnap.forEach((d) => {
        const data = d.data();
        const dateStr = data.date || d.id;
        const count = Number(data.analysesCount) || 0;
        const newUsers = Number(data.newUsersCount) || 0;

        if (dailyMap.has(dateStr)) {
          const entry = dailyMap.get(dateStr)!;
          entry.analyses = count;
          entry.newUsers = newUsers;
          dailyMap.set(dateStr, entry);
          sumWeekDaily += count;
        }

        if (dateStr === todayStr && count > analysesToday) {
          analysesToday = count;
        }
      });

      if (sumWeekDaily > analysesThisWeek) {
        analysesThisWeek = sumWeekDaily;
      }
    } catch (e) {
      console.info('[UsageTracker] Note on daily_stats fetch:', e);
    }

    // Convert dailyMap to sorted array
    const dailyTrends = Array.from(dailyMap.entries()).map(([date, val]) => ({
      date: date.slice(5), // MM-DD for clean charts
      analyses: val.analyses,
      newUsers: val.newUsers,
      activeUsers: Math.max(val.analyses, val.newUsers),
    }));

    // Format recent users list
    const recentUsers = rawUsers
      .sort((a, b) => {
        const timeB = parseFirestoreTimestampToMillis(b.lastActiveAt) || parseFirestoreTimestampToMillis(b.lastLoginAt) || 0;
        const timeA = parseFirestoreTimestampToMillis(a.lastActiveAt) || parseFirestoreTimestampToMillis(a.lastLoginAt) || 0;
        return timeB - timeA;
      })
      .slice(0, 50)
      .map((u) => {
        const analysisCount = Number(u.analysisCount) || 0;
        const pdfAnalysisCount = Number(u.pdfAnalysisCount) || 0;
        const activeEventsCount = Number(u.activeEventsCount) || 0;
        const isActive = analysisCount > 0 || pdfAnalysisCount > 0 || activeEventsCount > 0 || !!u.lastAnalysisAt;

        return {
          uid: u.uid || 'anonymous',
          email: u.email || 'user@firebase',
          createdAtText: formatDateText(u.createdAt),
          lastLoginText: formatDateText(u.lastLoginAt),
          lastAnalysisText: u.lastAnalysisAt ? formatDateText(u.lastAnalysisAt) : 'ยังไม่เคยวิเคราะห์',
          analysisCount,
          pdfAnalysisCount,
          isActive,
          role: u.role || 'member',
        };
      });

    return {
      totalMembers,
      activeUsers,
      newMembersToday,
      newMembersThisWeek,
      analysesToday,
      analysesThisWeek,
      totalAnalyses,
      returningUsers,
      dailyTrends,
      recentUsers,
      lastRefreshedAt: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    };
  } catch (err) {
    console.error('[UsageTracker] Failed to fetch Admin Analytics summary:', err);
    throw err;
  }
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

function formatDateText(ts: any): string {
  const millis = parseFirestoreTimestampToMillis(ts);
  if (!millis) return '-';
  const d = new Date(millis);
  return d.toLocaleString('th-TH', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
