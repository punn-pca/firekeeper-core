import type { Server } from 'node:http';
import type { RequestHandler } from 'express';

export function createHttpLifecycle(options: {
  graceMs?: number;
  exit?: (code: number) => void;
} = {}) {
  let draining = false;
  let exitCode = 0;
  let closingServer: Server | null = null;
  const exit = options.exit ?? ((code: number) => process.exit(code));
  const admission: RequestHandler = (_req, res, next) => {
    if (!draining) {
      res.once('finish', () => {
        // A connection can become idle after close() has begun.
        if (draining) setImmediate(() => closingServer?.closeIdleConnections());
      });
      return next();
    }
    res.setHeader('Connection', 'close');
    res.setHeader('Retry-After', '5');
    res.status(503).json({ error: 'SERVER_DRAINING' });
  };
  return {
    admission,
    isDraining: () => draining,
    shutdown(server: Server | null, code = 0) {
      exitCode = Math.max(exitCode, code);
      if (draining) return;
      draining = true;
      closingServer = server;
      const deadline = setTimeout(() => {
        server?.closeAllConnections();
        exit(exitCode || 1);
      }, options.graceMs ?? 8_000);
      deadline.unref();
      const done = () => {
        clearTimeout(deadline);
        exit(exitCode);
      };
      if (!server) return done();
      server.close(done);
      server.closeIdleConnections();
    },
  };
}
