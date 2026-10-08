import assert from 'node:assert/strict';
import { once } from 'node:events';
import { request } from 'node:http';
import express from 'express';
import { requestBoundary, httpErrorBoundary } from '../src/server/middleware/httpBoundary';
import { securityHeaders } from '../src/server/middleware/security';
import { createHttpLifecycle } from '../src/server/services/httpLifecycle';

let resolveExit: (code: number) => void;
const exited = new Promise<number>(resolve => { resolveExit = resolve; });
const lifecycle = createHttpLifecycle({ graceMs: 2_000, exit: code => resolveExit(code) });
const app = express();
app.use(requestBoundary, securityHeaders, lifecycle.admission);
app.use(express.json({ limit: '1kb' }));
app.post('/api/body', (_req, res) => res.json({ ok: true }));
app.get('/api/error', () => { throw new Error('secret-provider-token'); });
app.get('/api/cors', (_req, _res, next) => next(new Error('CORS_ORIGIN_BLOCKED: Origin not allowed by security policy')));
let release: () => void;
let entered: () => void;
const started = new Promise<void>(resolve => { entered = resolve; });
app.get('/slow', (_req, res) => {
  release = () => res.end('completed');
  entered();
});
app.use(httpErrorBoundary);
const server = app.listen(0, '127.0.0.1');
await once(server, 'listening');
const address = server.address();
assert(address && typeof address !== 'string');
const base = `http://127.0.0.1:${address.port}`;
try {
  for (const [body, status, code] of [
    ['{"broken":', 400, 'INVALID_REQUEST_BODY'],
    [JSON.stringify({ data: 'x'.repeat(2048) }), 413, 'PAYLOAD_TOO_LARGE'],
  ] as const) {
    const response = await fetch(`${base}/api/body`, { method: 'POST', headers: {
      'Content-Type': 'application/json', 'X-Request-ID': 'untrusted-caller-value',
    }, body });
    assert.equal(response.status, status);
    assert.equal(response.headers.get('cache-control'), 'no-store');
    assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
    const result = await response.json();
    assert.equal(result.error, code);
    assert.equal(result.requestId, response.headers.get('x-request-id'));
    assert.match(result.requestId, /^[a-f0-9-]{36}$/);
    assert(!JSON.stringify(result).includes('broken'));
  }
  const error = await fetch(`${base}/api/error`);
  assert.equal(error.status, 500);
  assert(!(await error.text()).includes('secret-provider-token'));
  assert.equal((await fetch(`${base}/api/cors`)).status, 403);

  const pending = fetch(`${base}/slow`).then(response => response.text());
  await started;
  lifecycle.shutdown(server);
  assert(lifecycle.isDraining());
  // A request already accepted on a keep-alive connection is rejected during drain.
  let rejected = 0;
  const headers: Record<string, string> = {};
  lifecycle.admission({} as any, {
    setHeader: (key: string, value: string) => { headers[key] = value; },
    status: (code: number) => { rejected = code; return { json: () => undefined }; },
  } as any, () => assert.fail('draining request admitted'));
  assert.equal(rejected, 503);
  assert.equal(headers.Connection, 'close');
  release();
  assert.equal(await pending, 'completed');
  assert.equal(await exited, 0);
} finally {
  server.closeAllConnections();
  server.close();
}

// A stream that never completes must not prevent bounded shutdown.
let forcedExit: (code: number) => void;
const forced = new Promise<number>(resolve => { forcedExit = resolve; });
const stuck = express();
let stuckEntered: () => void;
const stuckStarted = new Promise<void>(resolve => { stuckEntered = resolve; });
stuck.get('/', () => stuckEntered());
const stuckServer = stuck.listen(0, '127.0.0.1');
await once(stuckServer, 'listening');
const stuckAddress = stuckServer.address();
assert(stuckAddress && typeof stuckAddress !== 'string');
const client = request({ host: '127.0.0.1', port: stuckAddress.port }, () => {});
client.on('error', () => {});
client.end();
await stuckStarted;
createHttpLifecycle({ graceMs: 30, exit: code => forcedExit(code) }).shutdown(stuckServer);
assert.equal(await forced, 1);
client.destroy();
console.log('HTTP error boundary, correlation IDs, graceful drain and shutdown deadline passed.');
