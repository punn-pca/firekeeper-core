// Direct REST API client for Firebase Auth
// Solves Google Cloud API Key HTTP Referrer restrictions on mobile
// by explicitly attaching 'Referer: https://firekeeper.site/' on every request.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { SessionUser } from '../api/client';

const FIREBASE_API_KEY = 'AIzaSyCjrY8E1uYL95Z-dStlsuBklyYoFlQH_Vw';
const IDENTITY_TOOLKIT_URL = 'https://identitytoolkit.googleapis.com/v1/accounts';
const SECURE_TOKEN_URL = 'https://securetoken.googleapis.com/v1/token';
const REFERER_URL = 'https://firekeeper.site/';

const GUEST_CREDS_KEY = '@firekeeper_guest_credentials';

export interface FirebaseAuthResult {
  idToken: string;
  refreshToken: string;
  user: SessionUser;
}

// Helper to make authenticated requests to Google Identity Toolkit
async function postIdentityToolkit(endpoint: string, body: Record<string, any>): Promise<any> {
  const url = `${IDENTITY_TOOLKIT_URL}:${endpoint}?key=${FIREBASE_API_KEY}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Referer': REFERER_URL,
    },
    body: JSON.stringify(body),
  });

  const data = await response.json();
  if (!response.ok) {
    const errorCode = data?.error?.message || 'UNKNOWN_AUTH_ERROR';
    throw new Error(formatAuthError(errorCode));
  }
  return data;
}

// Helper to map Firebase error strings to human-readable Thai/English messages
function formatAuthError(code: string): string {
  if (code.includes('EMAIL_NOT_FOUND') || code.includes('INVALID_PASSWORD') || code.includes('INVALID_LOGIN_CREDENTIALS')) {
    return 'อีเมลหรือรหัสผ่านไม่ถูกต้อง (Invalid email or password)';
  }
  if (code.includes('EMAIL_EXISTS')) {
    return 'อีเมลนี้ถูกลงทะเบียนไว้แล้ว โปรดเลือกเข้าสู่ระบบ (Email already registered)';
  }
  if (code.includes('WEAK_PASSWORD')) {
    return 'รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร (Password must be at least 6 characters)';
  }
  if (code.includes('INVALID_EMAIL')) {
    return 'รูปแบบอีเมลไม่ถูกต้อง (Invalid email format)';
  }
  if (code.includes('TOO_MANY_ATTEMPTS_TRY_LATER')) {
    return 'มีการพยายามเข้าสู่ระบบผิดพลาดบ่อยเกินไป โปรดลองใหม่อีกครั้งในภายหลัง';
  }
  if (code.includes('USER_DISABLED')) {
    return 'บัญชีนี้ถูกระงับการใช้งาน';
  }
  return `Authentication Error: ${code}`;
}

/**
 * Sign in with Email & Password via direct REST API
 */
export async function signInWithEmailRest(email: string, pass: string): Promise<FirebaseAuthResult> {
  const data = await postIdentityToolkit('signInWithPassword', {
    email: email.trim(),
    password: pass,
    returnSecureToken: true,
  });

  const user: SessionUser = {
    uid: data.localId,
    displayName: data.displayName || data.email?.split('@')[0] || 'Firekeeper Analyst',
    email: data.email || email,
    role: 'user',
  };

  return {
    idToken: data.idToken,
    refreshToken: data.refreshToken,
    user,
  };
}

/**
 * Register new user with Email & Password via direct REST API
 */
export async function signUpWithEmailRest(email: string, pass: string, name?: string): Promise<FirebaseAuthResult> {
  const data = await postIdentityToolkit('signUp', {
    email: email.trim(),
    password: pass,
    returnSecureToken: true,
  });

  const displayName = name?.trim() || data.email?.split('@')[0] || 'Firekeeper Analyst';

  // Update profile name if provided
  if (name?.trim()) {
    try {
      await postIdentityToolkit('update', {
        idToken: data.idToken,
        displayName,
        returnSecureToken: true,
      });
    } catch {
      // Non-critical, continue
    }
  }

  const user: SessionUser = {
    uid: data.localId,
    displayName,
    email: data.email || email,
    role: 'user',
  };

  return {
    idToken: data.idToken,
    refreshToken: data.refreshToken,
    user,
  };
}

/**
 * Sign in with Google ID Token via direct REST API
 */
export async function signInWithGoogleIdTokenRest(googleIdToken: string): Promise<FirebaseAuthResult> {
  const data = await postIdentityToolkit('signInWithIdp', {
    postBody: `id_token=${googleIdToken}&providerId=google.com`,
    requestUri: REFERER_URL,
    returnSecureToken: true,
  });

  const user: SessionUser = {
    uid: data.localId,
    displayName: data.displayName || 'Google User',
    email: data.email || '',
    role: 'user',
    photoURL: data.photoUrl || undefined,
  };

  return {
    idToken: data.idToken,
    refreshToken: data.refreshToken,
    user,
  };
}

/**
 * Create or restore an Instant Guest Firebase Session.
 * Generates a persistent guest credential so the user has a 100% genuine
 * Firebase ID token recognized by the firekeeper.site server without requiring any login.
 */
export async function getOrCreateGuestSessionRest(): Promise<FirebaseAuthResult> {
  // 1. Check if we already have saved guest credentials
  try {
    const saved = await AsyncStorage.getItem(GUEST_CREDS_KEY);
    if (saved) {
      const { email, password } = JSON.parse(saved);
      if (email && password) {
        try {
          return await signInWithEmailRest(email, password);
        } catch {
          // If login with saved fails (e.g. password rotated), proceed to create new
          await AsyncStorage.removeItem(GUEST_CREDS_KEY);
        }
      }
    }
  } catch {}

  // 2. Create fresh guest user with random unique credentials
  const randomSuffix = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  const guestEmail = `guest_${randomSuffix}@firekeeper.site`;
  const guestPass = `FKGuest!${Math.random().toString(36).substring(2, 10)}${Date.now()}`;
  const guestName = `Guest Analyst ${randomSuffix.slice(-4).toUpperCase()}`;

  const result = await signUpWithEmailRest(guestEmail, guestPass, guestName);

  // 3. Save guest credentials for fast auto-login next time
  try {
    await AsyncStorage.setItem(
      GUEST_CREDS_KEY,
      JSON.stringify({ email: guestEmail, password: guestPass, name: guestName })
    );
  } catch {}

  return result;
}

/**
 * Refresh an expired Firebase ID Token
 */
export async function refreshFirebaseToken(refreshToken: string): Promise<string> {
  const url = `${SECURE_TOKEN_URL}?key=${FIREBASE_API_KEY}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Referer': REFERER_URL,
    },
    body: `grant_type=refresh_token&refresh_token=${encodeURIComponent(refreshToken)}`,
  });

  const data = await response.json();
  if (!response.ok || !data.id_token) {
    throw new Error('Token refresh failed');
  }
  return data.id_token;
}
