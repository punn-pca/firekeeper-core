import { Request, Response } from 'express';

export const createScopedRateLimiter = (
  store: Map<string, { count: number; resetAt: number }>,
  maxRequests: number,
  windowMs: number,
  errorMessage: string
) => {
  return (req: Request, res: Response, next: any) => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown-ip';
    const now = Date.now();

    const record = store.get(ip) || { count: 0, resetAt: now + windowMs };
    if (now > record.resetAt) {
      record.count = 1;
      record.resetAt = now + windowMs;
    } else {
      record.count++;
    }
    store.set(ip, record);

    if (record.count > maxRequests) {
      return res.status(429).json({ error: 'Too Many Requests', message: errorMessage });
    }
    next();
  };
};

export const requestCounts = new Map<string, { count: number; resetAt: number }>();
export const authRequestCounts = new Map<string, { count: number; resetAt: number }>();
export const publishRequestCounts = new Map<string, { count: number; resetAt: number }>();

export const rateLimiter = createScopedRateLimiter(
  requestCounts,
  60,
  60 * 1000,
  'คำขอถี่เกินไป กรุณารอสักครู่ก่อนลองใหม่อีกครั้ง (Rate limit exceeded)'
);

export const authRateLimiter = createScopedRateLimiter(
  authRequestCounts,
  15,
  60 * 1000,
  'คำขอเข้าสู่ระบบหรือยืนยันตัวตนถี่เกินไป กรุณารอ 1 นาทีก่อนลองใหม่ (Auth rate limit exceeded)'
);

export const publishRateLimiter = createScopedRateLimiter(
  publishRequestCounts,
  15,
  60 * 1000,
  'คำขอเผยแพร่หรือสร้าง OAuth ถี่เกินไป กรุณารอสักครู่ (Publish/OAuth rate limit exceeded)'
);
