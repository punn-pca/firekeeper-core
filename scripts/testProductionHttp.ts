import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';

// The production server defaults zero to 3000, so select an ephemeral port first.
const { createServer } = await import('node:net');
const reservation = createServer().listen(0, '127.0.0.1');
await once(reservation, 'listening');
const address = reservation.address();
assert(address && typeof address !== 'string');
await new Promise<void>(resolve => reservation.close(() => resolve()));
const port = String(address.port);
const child = spawn(process.execPath, ['dist/server.cjs'], {
  env: { ...process.env, NODE_ENV: 'production', PORT: port, APP_ORIGIN: 'https://example.com' },
  stdio: ['ignore', 'pipe', 'pipe'],
});
const closed = once(child, 'close');
let output = '';
child.stdout.on('data', data => { output += data.toString(); });
child.stderr.on('data', data => { output += data.toString(); });
const base = `http://127.0.0.1:${port}`;
const get = (url: string, options: RequestInit = {}) => fetch(url, {
  ...options, signal: AbortSignal.timeout(5_000),
});
try {
  const deadline = Date.now() + 30_000;
  while (true) {
    try { if ((await fetch(`${base}/healthz`, { signal: AbortSignal.timeout(500) })).ok) break; } catch {}
    if (child.exitCode !== null || Date.now() > deadline) throw new Error(`Server startup failed: ${output.slice(-2000)}`);
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  const missing = await get(`${base}/api/not-a-real-route`);
  assert.equal(missing.status, 404);
  assert.equal((await missing.json()).error, 'NOT_FOUND');
  assert.equal(missing.headers.get('cache-control'), 'no-store');
  assert.equal((await get(`${base}/api/system/diagnostics`)).status, 401);
  const malformed = await get(`${base}/api/conversations`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', Connection: 'close' }, body: '{',
  });
  assert.equal(malformed.status, 401, 'unauthenticated conversation requests must be rejected before JSON parsing');
  assert.equal(malformed.headers.get('x-content-type-options'), 'nosniff');
  const csp = malformed.headers.get('content-security-policy') || '';
  assert.match(csp, /(?:^|; )script-src 'self' 'unsafe-inline' https:\/\/apis\.google\.com(?:;|$)/, 'Firebase Google Sign-In must be allowed to load the Google API script');
  assert.doesNotMatch(csp, /script-src[^;]*https:(?:\s|;|$)/, 'production must not allow arbitrary HTTPS script sources');
  assert.match(csp, /(?:^|; )object-src 'none'(?:;|$)/, 'plugins must be disabled');
  assert.match(csp, /(?:^|; )base-uri 'self'(?:;|$)/, 'base URI must be restricted');
  assert.match(csp, /(?:^|; )form-action 'self'(?:;|$)/, 'form submission must be restricted');
  assert.doesNotMatch(csp, /script-src[^;]*'unsafe-eval'/, 'production must not allow unsafe-eval');
  const document = await get(`${base}/api/document-resources`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content: 'x'.repeat(1024 * 1024 + 1) }),
  });
  assert.equal(document.status, 401, 'document parser must accept >1 MB and reach authentication');
  const webhook = await get(`${base}/api/billing/webhook`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{',
  });
  assert.equal(webhook.status, 400);
  assert.equal(await webhook.text(), 'Webhook is not configured', 'webhook must retain raw bytes');
  console.log('Production HTTP routing, diagnostics auth, CSP, body limits, error headers, and webhook parsing passed.');
} finally {
  child.kill('SIGTERM');
  const force = setTimeout(() => child.kill('SIGKILL'), 10_000);
  await closed;
  clearTimeout(force);
}
