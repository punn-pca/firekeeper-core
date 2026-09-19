import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import * as AuthSession from 'expo-auth-session';
import {
  signInWithEmailRest,
  signUpWithEmailRest,
  signInWithGoogleIdTokenRest,
  getOrCreateGuestSessionRest,
} from '../lib/firebaseRestAuth';
import {
  loginWithFirebase,
  getStoredSession,
  clearSession,
  StoredSession,
  SessionUser,
} from '../api/client';

// Required for expo-auth-session redirect on Android
WebBrowser.maybeCompleteAuthSession();

// Google OAuth Client IDs — project: firekeeper-pca (272949249192)
const GOOGLE_WEB_CLIENT_ID = '272949249192-0e5fm9epp6qv5m0tv9rlsunf1fv7aunq.apps.googleusercontent.com';
const GOOGLE_ANDROID_CLIENT_ID = '272949249192-ghjmo71cq4hgvi1b1pe1mdh22o6lrghn.apps.googleusercontent.com';

interface AuthContextType {
  session: StoredSession | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  authMode: 'guest' | 'firebase' | null;
  signInAsGuest: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (email: string, pass: string, name?: string) => Promise<void>;
  signOut: () => Promise<void>;
  googleAuthError: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<StoredSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [googleAuthError, setGoogleAuthError] = useState<string | null>(null);

  // Google OAuth redirect URI:
  // On Android, Google requires the reversed client ID scheme matching the Android Client ID
  const redirectUri = Platform.select({
    android: 'com.googleusercontent.apps.272949249192-ghjmo71cq4hgvi1b1pe1mdh22o6lrghn:/oauthredirect',
    default: AuthSession.makeRedirectUri({
      scheme: 'firekeeperapp',
      path: 'oauthredirect',
    }),
  });

  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: GOOGLE_WEB_CLIENT_ID,
    androidClientId: GOOGLE_ANDROID_CLIENT_ID,
    redirectUri,
  });

  // Restore session on mount
  useEffect(() => {
    (async () => {
      try {
        const stored = await getStoredSession();
        if (stored) setSession(stored);
      } catch (e) {
        console.warn('[Auth] Failed to restore session:', e);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  // Handle Google OAuth response
  useEffect(() => {
    if (response?.type === 'success') {
      handleGoogleResponse(response);
    } else if (response?.type === 'error') {
      const msg = response.error?.message || 'Google Sign-In was cancelled or failed';
      setGoogleAuthError(msg);
      setIsLoading(false);
    }
  }, [response]);

  const handleGoogleResponse = async (res: any) => {
    setIsLoading(true);
    setGoogleAuthError(null);
    try {
      const idToken = res.params?.id_token;
      if (!idToken) {
        throw new Error('No ID token received from Google');
      }

      // Exchange Google ID token with Firebase via REST API
      const authResult = await signInWithGoogleIdTokenRest(idToken);
      const stored = await loginWithFirebase(authResult.idToken, authResult.user);
      setSession(stored);
    } catch (err: any) {
      console.error('[Auth] Google sign-in error:', err);
      setGoogleAuthError(err?.message ?? 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  const signInWithEmail = async (email: string, pass: string) => {
    setIsLoading(true);
    setGoogleAuthError(null);
    try {
      const authResult = await signInWithEmailRest(email, pass);
      const stored = await loginWithFirebase(authResult.idToken, authResult.user);
      setSession(stored);
    } catch (err: any) {
      console.error('[Auth] Email sign-in error:', err);
      setGoogleAuthError(err?.message ?? 'Login failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const signUpWithEmail = async (email: string, pass: string, name?: string) => {
    setIsLoading(true);
    setGoogleAuthError(null);
    try {
      const authResult = await signUpWithEmailRest(email, pass, name);
      const stored = await loginWithFirebase(authResult.idToken, authResult.user);
      setSession(stored);
    } catch (err: any) {
      console.error('[Auth] Email sign-up error:', err);
      setGoogleAuthError(err?.message ?? 'Registration failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const signInAsGuest = async () => {
    setIsLoading(true);
    setGoogleAuthError(null);
    try {
      // Create or restore persistent Guest session with genuine Firebase ID Token
      const authResult = await getOrCreateGuestSessionRest();
      const guestUser: SessionUser = {
        ...authResult.user,
        role: 'guest',
      };
      const stored = await loginWithFirebase(authResult.idToken, guestUser);
      setSession(stored);
    } catch (err: any) {
      console.error('[Auth] Guest session error:', err);
      setGoogleAuthError(err?.message ?? 'Failed to initialize guest session');
    } finally {
      setIsLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    setGoogleAuthError(null);
    try {
      if (!request) {
        throw new Error('Google Auth request not initialized yet. Please try again.');
      }
      await promptAsync();
    } catch (err: any) {
      setGoogleAuthError(err?.message ?? 'Google Sign-In failed');
    }
  };

  const signOut = async () => {
    await clearSession();
    setSession(null);
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        isLoading,
        isAuthenticated: !!session,
        authMode: session?.mode ?? null,
        signInAsGuest,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        signOut,
        googleAuthError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
