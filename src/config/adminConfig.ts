import { getDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { User as FirebaseUser } from 'firebase/auth';

/**
 * Enterprise Admin Access Control Configuration
 * Hardened ABAC & RBAC Verification for Fire Keeper (UID-based only)
 */

export const ADMIN_WHITELIST_UIDS: readonly string[] = [
  '9wcNWi3Fq7SoDxo4lXS92dUm7s43',
];

/**
 * Synchronously checks if a user is an administrator based on verified UID whitelist
 */
export function checkIsAdminSync(user: FirebaseUser | { uid?: string } | null): boolean {
  if (!user || !user.uid) return false;
  if (ADMIN_WHITELIST_UIDS.includes(user.uid)) return true;
  return false;
}

/**
 * Asynchronously verifies admin status against Firestore /admins/{uid} collection and user profile role
 */
export async function verifyAdminStatusAsync(user: FirebaseUser | { uid?: string } | null): Promise<boolean> {
  if (!user || !user.uid) return false;

  // 1. Check in-memory whitelist UIDs
  if (checkIsAdminSync(user)) {
    return true;
  }

  // 2. Verification against Firestore /admins/{uid} registry (Server/Admin provisioned)
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

  // 3. Verification against user profile role in /users/{uid}
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
