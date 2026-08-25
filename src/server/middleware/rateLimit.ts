import { Request, Response, NextFunction } from 'express';
import { getApps as getAdminApps } from 'firebase-admin/app';
import { getFirestore as getAdminFirestore } from 'firebase-admin/firestore';

let firestoreUnavailable = false;

function getRateLimitDb() {
  if (firestoreUnavailable) return null;
  try {
    if (getAdminApps().length > 0) {
      return getAdminFirestore();
    }
  } catch (err) {
    // Admin app not initialized
  }
  return null;
}

const localFallbackMap = new Map<string, { count: number; resetAt: number }>();

export const createDistributedRateLimiter = (
  scopeName: string,
  maxRequests: number,
  windowMs: number,
  errorMessage: string
) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown-ip';
    const clientKey = `${scopeName}_${ip.replace(/[:.]/g, '_')}`;
    const now = Date.now();
    const resetAt = now + windowMs;

    const db = getRateLimitDb();

    if (db) {
      try {
        const docRef = db.collection('rate_limits').doc(clientKey);
        
        const allowed = await db.runTransaction(async (transaction) => {
          const docSnap = await transaction.get(docRef);
          if (!docSnap.exists) {
            transaction.set(docRef, { count: 1, resetAt });
            return true;
          }

          const data = docSnap.data();
          if (!data) {
            transaction.set(docRef, { count: 1, resetAt });
            return true;
          }

          if (now > data.resetAt) {
            transaction.set(docRef, { count: 1, resetAt });
            return true;
          }

          if (data.count >= maxRequests) {
            return false;
          }

          transaction.update(docRef, { count: data.count + 1 });
          return true;
        });

        if (!allowed) {
          return res.status(429).json({ error: 'Too Many Requests', message: errorMessage });
        }
        return next();
      } catch (err: any) {
        if (err?.code === 5 || err?.message?.includes('NOT_FOUND')) {
          firestoreUnavailable = true;
        } else {
          console.warn(`[Distributed Rate Limit] Firestore transaction failed for ${scopeName}, falling back to local memory:`, err?.message || err);
        }
      }
    }

    let record = localFallbackMap.get(clientKey);
    if (!record || now > record.resetAt) {
      record = { count: 1, resetAt };
    } else {
      record.count++;
    }
    localFallbackMap.set(clientKey, record);

    if (record.count > maxRequests) {
      return res.status(429).json({ error: 'Too Many Requests', message: errorMessage });
    }

    return next();
  };
};

export const rateLimiter = createDistributedRateLimiter(
  'general',
  60,
  60 * 1000,
  'คำขอถี่เกินไป กรุณารอสักครู่ก่อนลองใหม่อีกครั้ง (Rate limit exceeded)'
);

export const authRateLimiter = createDistributedRateLimiter(
  'auth',
  15,
  60 * 1000,
  'คำขอเข้าสู่ระบบหรือยืนยันตัวตนถี่เกินไป กรุณารอ 1 นาทีก่อนลองใหม่ (Auth rate limit exceeded)'
);

export const publishRateLimiter = createDistributedRateLimiter(
  'publish',
  15,
  60 * 1000,
  'คำขอเผยแพร่หรือสร้าง OAuth ถี่เกินไป กรุณารอสักครู่ (Publish/OAuth rate limit exceeded)'
);

