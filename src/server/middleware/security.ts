import { Request, Response, NextFunction } from 'express';

/**
 * Defense-in-depth HTTP headers. CSP remains compatible with the existing
 * application while narrowing script sources in production.
 */
export const securityHeaders = (_req: Request, res: Response, next: NextFunction) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), geolocation=(), microphone=(), interest-cohort=()');
  res.setHeader('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
  res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');

  const isDev = process.env.NODE_ENV !== 'production';
  const directives = [
    "default-src 'self' https: data: blob:",
    isDev
      ? "script-src 'self' https: 'unsafe-inline' 'unsafe-eval'"
      : "script-src 'self' 'unsafe-inline'",
    "style-src 'self' https: 'unsafe-inline'",
    "img-src 'self' https: data: blob:",
    "connect-src 'self' https: http: ws: wss:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'self' https://firekeeper.site https://*.firekeeper.site https://*.google.com https://*.run.app https://ai.studio https://*.aistudio.google.com https://*.googleusercontent.com",
  ];
  res.setHeader('Content-Security-Policy', directives.join('; ') + ';');
  next();
};
