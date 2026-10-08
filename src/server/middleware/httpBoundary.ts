import crypto from 'node:crypto';
import type { ErrorRequestHandler, RequestHandler } from 'express';

// Generate IDs locally: arbitrary caller input must never become log metadata.
export const requestBoundary: RequestHandler = (req, res, next) => {
  res.locals.requestId = crypto.randomUUID();
  res.setHeader('X-Request-ID', res.locals.requestId);
  if (req.path.startsWith('/api/')) res.setHeader('Cache-Control', 'no-store');
  next();
};

export const httpErrorBoundary: ErrorRequestHandler = (error, _req, res, next) => {
  if (res.headersSent) return next(error);
  const kind = error?.type;
  const status = kind === 'entity.too.large' ? 413
    : kind === 'entity.parse.failed' || kind === 'request.aborted' ? 400
    : kind === 'encoding.unsupported' || kind === 'charset.unsupported' ? 415
    : error?.message === 'CORS_ORIGIN_BLOCKED: Origin not allowed by security policy' ? 403
    : 500;
  const code = status === 413 ? 'PAYLOAD_TOO_LARGE'
    : status === 400 ? 'INVALID_REQUEST_BODY'
    : status === 415 ? 'UNSUPPORTED_BODY_ENCODING'
    : status === 403 ? 'ORIGIN_NOT_ALLOWED' : 'INTERNAL_SERVER_ERROR';
  // Never log bodies, URLs, tokens, stack traces, or provider error messages.
  if (status === 500) console.error(JSON.stringify({
    event: 'http_request_failed', requestId: res.locals.requestId, status,
  }));
  res.status(status).setHeader('Cache-Control', 'no-store');
  res.json({ error: code, requestId: res.locals.requestId });
};
