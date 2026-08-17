import { getDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { User as FirebaseUser } from 'firebase/auth';

/**
 * Enterprise Admin Access Control Configuration
 * Hardened ABAC & RBAC Verification for Fire Keeper
 */

export const ADMIN_WHITELIST_EMAILS: readonly string[] = [
  'kriangkrai.tmlth@gmail.com',
  'admin@firekeeper.ai',
  'admin@firekeeper.site',
];

export const ADMIN_WHITELIST_UIDS: readonly string[] = [
  // Known bootstrap admin UIDs can be configured here
];

/**
 * Synchronously checks if a user is an administrator based on verified credentials
 */
export function checkIsAdminSync(user: FirebaseUser | { uid?: string; email?: string | null } | null): boolean {
  if (!user) return false;
  if (user.uid && ADMIN_WHITELIST_UIDS.includes(user.uid)) return true;
  if (user.email && ADMIN_WHITELIST_EMAILS.includes(user.email.toLowerCase().trim())) return true;
  return false;
}

/**
 * Asynchronously verifies admin status against both in-memory whitelist and Firestore /admins/{uid} collection
 */
export async function verifyAdminStatusAsync(user: FirebaseUser | { uid?: string; email?: string | null } | null): Promise<boolean> {
  if (!user || !user.uid) return false;

  // 1. First-tier fast check against verified email/UID whitelist
  if (checkIsAdminSync(user)) {
    return true;
  }

  // 2. Second-tier verification against Firestore /admins/{uid} registry
  try {
    const adminDocRef = doc(db, 'admins', user.uid);
    const adminSnap = await getDoc(adminDocRef);
    if (adminSnap.exists()) {
      return true;
    }
  } catch (err) {
    // Non-blocking catch to prevent app stalls if network drops
    console.warn('[Admin Security] Firestore admin doc check error:', err);
  }

  // 3. Third-tier verification against user profile role in /users/{uid}
  try {
    const userDocRef = doc(db, 'users', user.uid);
    const userSnap = await getDoc(userDocRef);
    if (userSnap.exists()) {
      const data = userSnap.data();
      if (data?.role === 'admin') {
        return true;
      }
    }
  } catch (err) {
    console.warn('[Admin Security] User role check error:', err);
  }

  return false;
}
