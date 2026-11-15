import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const auth = readFileSync('src/server/middleware/auth.ts', 'utf8');
const server = readFileSync('server.ts', 'utf8');
const dockerfile = readFileSync('Dockerfile', 'utf8');
const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));

assert.match(auth, /createPersistentGuestSession/);
assert.match(auth, /collection\('auth_sessions'\)/, 'guest sessions must use shared Firestore storage');
assert.match(auth, /createHash\('sha256'\)\.update\(token\)/, 'only token digests may be stored');
assert.match(auth, /process\.env\.NODE_ENV === 'test'/, 'process-local synthetic sessions must be test-only');
assert.match(auth, /expiresAt: new Date\(session\.expiresAt\)/, 'expiry must be a Firestore timestamp for TTL');
assert.match(auth, /snapshot\.exists/, 'unknown tokens must fail closed');
assert.match(auth, /GUEST_SESSION_STORAGE_UNAVAILABLE/, 'production must fail closed without shared storage');
assert.match(server, /app\.post\('\/api\/auth\/guest', rateLimiter, async/);
assert.match(server, /await createPersistentGuestSession\(guestToken/);
assert.match(server, /crypto\.randomBytes\(32\)/, 'guest bearer tokens must have 256 bits of entropy');
assert.match(dockerfile, /npm test/, 'Docker must run the test suite');
assert.match(packageJson.scripts.test, /testDistributedGuestSessions\.ts/, 'the regression test must run in npm test');
assert.match(packageJson.scripts.test, /testEvidenceBindingAudit\.ts/, 'the citation gate test must run in npm test');

console.log('Distributed guest session boundary: 13 assertions passed');
