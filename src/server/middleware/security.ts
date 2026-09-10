import { Request, Response, NextFunction } from 'express';

/**
 * Enterprise Security Headers Middleware
 * ISO 42001 & NIST AI RMF Compliant
 */
export const securityHeaders = (req: Request, res: Response, next: NextFunction) => {
  // Prevent MIME-sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // Referrer Policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Feature & Permissions Policy
  res.setHeader('Permissions-Policy', 'camera=(), geolocation=(), microphone=(), interest-cohort=()');
  
  // HTTP Strict Transport Security (HSTS)
  res.setHeader('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  
  // Legacy XSS Protection Header
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Iframe Protection
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');

  // Cross-Origin Isolation (COOP)
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');

  // Cross-Origin Resource Policy (CORP)
  res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');

  const isDev = process.env.NODE_ENV !== 'production';

  // Enterprise Content Security Policy
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self' https: data: blob:; " +
    (isDev
      ? "script-src 'self' https: 'unsafe-inline' 'unsafe-eval'; "
      : "script-src 'self' https: 'unsafe-inline'; ") +
    "style-src 'self' https: 'unsafe-inline'; " +
    "img-src 'self' https: data: blob:; " +
    "connect-src 'self' https: http: ws: wss:; " +
    "frame-ancestors 'self' https://firekeeper.site https://*.firekeeper.site https://*.google.com https://*.run.app https://ai.studio https://*.aistudio.google.com https://*.googleusercontent.com;"
  );

  next();
};
