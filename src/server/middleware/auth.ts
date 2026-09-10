import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { firebaseAppConfig } from '../infrastructure/firebase';

export interface StoredUser {
  id: string;
  name: string;
  email: string;
  salt: string;
  passwordHash: string;
  isGuest: boolean;
  created_at: string;
}

export function hashPassword(password: string, customSalt?: string): { salt: string; hash: string } {
  const salt = customSalt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return { salt, hash };
}

export function verifyPassword(password: string, salt: string, expectedHash: string): boolean {
  if (!password || !salt || !expectedHash) return false;
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  try {
    const hashBuf = Buffer.from(hash, 'hex');
    const expectedBuf = Buffer.from(expectedHash, 'hex');
    if (hashBuf.length !== expectedBuf.length) return false;
    return crypto.timingSafeEqual(hashBuf, expectedBuf);
  } catch {
    return false;
  }
}

export const userDatabase = new Map<string, StoredUser>();

// Seed admin only if secure password is provided in environment, hashed securely with salt
if (process.env.FIREKEEPER_ADMIN_PASSWORD) {
  const adminSalted = hashPassword(process.env.FIREKEEPER_ADMIN_PASSWORD);
  userDatabase.set('admin@firekeeper.ai', {
    id: 'usr-admin-001',
    name: 'System Administrator',
    email: 'admin@firekeeper.ai',
    salt: adminSalted.salt,
    passwordHash: adminSalted.hash,
    isGuest: false,
    created_at: new Date().toISOString(),
  });
}

export interface ActiveSession {
  userId: string;
  email: string;
  name: string;
  isGuest: boolean;
  expiresAt: number;
}

export const activeSessions = new Map<string, ActiveSession>();

export interface GoogleCertCache {
  certs: Record<string, string>;
  fetchedAt: number;
  maxAge: number;
}
export let googleCertCache: GoogleCertCache | null = null;

export async function getGoogleFirebasePublicKeys(): Promise<Record<string, string>> {
  const now = Date.now();
  if (googleCertCache && (now - googleCertCache.fetchedAt) < googleCertCache.maxAge) {
    return googleCertCache.certs;
  }
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    const res = await fetch('https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com', {
      signal: controller.signal
    }).finally(() => clearTimeout(timeoutId));

    if (res.ok) {
      const cacheControl = res.headers.get('cache-control');
      let maxAge = 3600000; // default 1 hour
      if (cacheControl) {
        const match = cacheControl.match(/max-age=(\d+)/);
        if (match) maxAge = parseInt(match[1], 10) * 1000;
      }
      const certs = await res.json() as Record<string, string>;
      googleCertCache = { certs, fetchedAt: now, maxAge };
      return certs;
    }
  } catch (err: any) {
    console.warn('[Auth] Failed to fetch Google Firebase certificates for live verification (timed out or error):', err?.message || err);
  }
  return googleCertCache?.certs || {};
}

// Prefetch Google certificates in background on startup
getGoogleFirebasePublicKeys().catch((err) => console.warn('[Auth] Init cert fetch error:', err));

export const ADMIN_WHITELIST_UIDS = new Set<string>([
  'usr-admin-001',
]);

export const ADMIN_WHITELIST_EMAILS = new Set<string>([
  'admin@firekeeper.ai',
]);

export const OFFLINE_USER_UID = 'usr-offline-local';
export const OFFLINE_USER_EMAIL = 'offline@firekeeper.local';

export function isOfflineOnlyMode(): boolean {
  const envVal = (process.env.OFFLINE_ONLY || process.env.OFFLINE_MODE || '').toLowerCase().trim();
  return envVal === 'true' || envVal === '1';
}

export function isUserAdmin(uid?: string, email?: string, roleClaim?: string): boolean {
  if (uid === OFFLINE_USER_UID || email === OFFLINE_USER_EMAIL) return true;
  if (isOfflineOnlyMode()) return true;
  if (!uid && !email) return false;
  if (uid && ADMIN_WHITELIST_UIDS.has(uid)) return true;
  if (process.env.ADMIN_UID && uid === process.env.ADMIN_UID) return true;
  if (email && (ADMIN_WHITELIST_EMAILS.has(email.toLowerCase()) || email.toLowerCase() === 'admin@firekeeper.ai')) return true;
  if (roleClaim === 'admin') return true;
  return false;
}

export async function verifyFirebaseIdToken(token: string): Promise<{ uid: string; email?: string; isGuest?: boolean; role?: 'admin' | 'user' } | null> {
  if (!token || typeof token !== 'string') return null;

  // Blocked hard-coded / pseudo token strings
  const blockedTokens = ['guest-token', 'default', 'user-fallback', 'null', 'undefined', 'test-token', 'token-123'];
  if (blockedTokens.includes(token.toLowerCase().trim())) {
    return null;
  }

  // 1. Check local active user/guest sessions first
  const activeSession = activeSessions.get(token);
  if (activeSession) {
    if (activeSession.expiresAt < Date.now()) {
      activeSessions.delete(token);
      return null;
    }
    const role: 'admin' | 'user' = isUserAdmin(activeSession.userId, activeSession.email) ? 'admin' : 'user';
    return { uid: activeSession.userId, email: activeSession.email, isGuest: activeSession.isGuest, role };
  }

  // 1.1 Check offline local operator token or offline mode
  if (token === 'offline-local-token' || (isOfflineOnlyMode() && token.startsWith('offline-'))) {
    return {
      uid: OFFLINE_USER_UID,
      email: OFFLINE_USER_EMAIL,
      isGuest: false,
      role: 'admin',
    };
  }

  // 2. Parse and validate Firebase JWT structure & Cryptographic Signature
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    const headerJson = Buffer.from(parts[0], 'base64url').toString('utf8');
    const header = JSON.parse(headerJson);
    if (header.alg !== 'RS256' || !header.kid) {
      return null;
    }

    const payloadJson = Buffer.from(parts[1], 'base64url').toString('utf8');
    const payload = JSON.parse(payloadJson);
    const now = Math.floor(Date.now() / 1000);

    // Verify expiration timestamp
    if (!payload.exp || payload.exp < now) {
      return null;
    }

    // Verify Issuer and Audience against Firebase Project
    const expectedProjectId = firebaseAppConfig?.projectId || 'ai-studio-firekeeper-dc5cddb2-9aa3-4afb-9b95-904baa93fd69';
    const expectedIss = `https://securetoken.google.com/${expectedProjectId}`;
    if (payload.iss && payload.iss !== expectedIss) {
      console.warn('[Auth Security] Token issuer mismatch:', payload.iss, expectedIss);
      return null;
    }
    if (payload.aud && payload.aud !== expectedProjectId) {
      console.warn('[Auth Security] Token audience mismatch:', payload.aud, expectedProjectId);
      return null;
    }

    // Cryptographic RSA-SHA256 signature check using Google public certificates
    const certs = await getGoogleFirebasePublicKeys();
    const certPem = certs[header.kid];
    if (!certPem) {
      console.warn('[Auth Security] Certificate key ID not found in Google certs:', header.kid);
      return null;
    }

    try {
      const verifier = crypto.createVerify('RSA-SHA256');
      verifier.update(`${parts[0]}.${parts[1]}`);
      const isValid = verifier.verify(certPem, parts[2], 'base64url');
      if (!isValid) {
        console.warn('[Auth Security] Cryptographic signature check failed for Firebase token.');
        return null;
      }
    } catch (verifyErr) {
      console.warn('[Auth Security] Signature verification exception:', verifyErr);
      return null;
    }

    const uid = payload.user_id || payload.sub;
    if (!uid || typeof uid !== 'string') {
      return null;
    }

    const email = payload.email || `${uid}@firebase.user`;
    const role: 'admin' | 'user' = isUserAdmin(uid, email, payload.admin ? 'admin' : undefined) ? 'admin' : 'user';

    return {
      uid,
      email,
      isGuest: false,
      role,
    };
  } catch (err) {
    return null;
  }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (isOfflineOnlyMode()) {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.replace('Bearer ', '').trim() : 'offline-local-token';
    (req as any).user = {
      userId: OFFLINE_USER_UID,
      email: OFFLINE_USER_EMAIL,
      isGuest: false,
      role: 'admin',
    };
    (req as any).userId = OFFLINE_USER_UID;
    (req as any).userToken = token;
    return next();
  }

  const authHeader = req.headers.authorization;
  const hasAuthHeader = !!authHeader && authHeader.startsWith('Bearer ');
  const token = hasAuthHeader ? authHeader.replace('Bearer ', '').trim() : null;

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized', message: 'AUTHENTICATION_FAILED: Missing Authorization header' });
  }

  const verifiedUser = await verifyFirebaseIdToken(token);
  if (!verifiedUser) {
    return res.status(401).json({ error: 'Unauthorized', message: 'AUTHENTICATION_FAILED: Invalid, untrusted, or expired token' });
  }

  if (verifiedUser.isGuest) {
    return res.status(401).json({ error: 'Unauthorized', message: 'AUTHENTICATION_FAILED: Guest token cannot access protected endpoints' });
  }

  (req as any).user = {
    userId: verifiedUser.uid,
    email: verifiedUser.email,
    isGuest: false,
    role: verifiedUser.role || 'user',
  };
  (req as any).userId = verifiedUser.uid;
  (req as any).userToken = token;
  next();
}

export function requireRole(requiredRole: 'admin' | 'user') {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized', message: 'AUTHENTICATION_REQUIRED: User not authenticated' });
    }
    if (user.isGuest) {
      return res.status(401).json({ error: 'Unauthorized', message: 'AUTHENTICATION_FAILED: Guest session not permitted' });
    }
    if (requiredRole === 'admin') {
      const email = (user.email || '').toLowerCase();
      const isAdmin = user.role === 'admin' || isUserAdmin(user.userId, email);
      if (!isAdmin) {
        return res.status(403).json({ error: 'Forbidden', message: 'FORBIDDEN: Insufficient permissions. Admin role required.' });
      }
    }
    next();
  };
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const user = (req as any).user;
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized', message: 'AUTHENTICATION_REQUIRED: User not authenticated' });
  }
  const email = (user.email || '').toLowerCase();
  const isAdmin = user.role === 'admin' || isUserAdmin(user.userId, email);
  if (!isAdmin) {
    return res.status(403).json({ error: 'Forbidden', message: 'FORBIDDEN: Admin privileges required.' });
  }
  next();
}

export function requireOwner(getResourceOwnerId: (req: Request) => string | Promise<string>) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      if (!user) {
        return res.status(401).json({ error: 'Unauthorized', message: 'AUTHENTICATION_REQUIRED: User not authenticated' });
      }
      const ownerId = await getResourceOwnerId(req);
      const email = (user.email || '').toLowerCase();
      const isAdmin = user.role === 'admin' || isUserAdmin(user.userId, email);
      if (!isAdmin && user.userId !== ownerId) {
        return res.status(403).json({ error: 'Forbidden', message: 'FORBIDDEN: Owner or Admin authorization required.' });
      }
      next();
    } catch (err) {
      return res.status(403).json({ error: 'Forbidden', message: 'FORBIDDEN: Authorization check failed.' });
    }
  };
}

export function requireServiceAuth(req: Request, res: Response, next: NextFunction) {
  const serviceToken = req.headers['x-service-token'] || req.headers['authorization'];
  const expectedSecret = process.env.SERVICE_SECRET;
  if (expectedSecret && (serviceToken === expectedSecret || serviceToken === `Bearer ${expectedSecret}`)) {
    return next();
  }
  return requireAdmin(req, res, next);
}

export function getValidOrigin(req: Request): string | null {
  const configured = process.env.APP_ORIGIN;
  if (configured && configured !== '*' && (configured.startsWith('https://') || configured.startsWith('http://localhost') || configured.startsWith('http://127.0.0.1'))) {
    return configured;
  }
  const host = req.get('host');
  if (host) {
    const isHttps = req.protocol === 'https' || req.headers['x-forwarded-proto'] === 'https' || (!host.startsWith('localhost') && !host.startsWith('127.0.0.1'));
    const protocol = isHttps ? 'https' : 'http';
    const computed = `${protocol}://${host}`;
    if (computed.startsWith('https://') || computed.startsWith('http://localhost') || computed.startsWith('http://127.0.0.1')) {
      return computed;
    }
  }
  return null;
}
