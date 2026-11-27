import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const auth = readFileSync('src/server/middleware/auth.ts', 'utf8');
const server = readFileSync('server.ts', 'utf8');

// Real Firebase tokens are still verified before this branch.
assert.match(auth, /const verifiedUser = await verifyFirebaseIdToken\(token\)/);
assert.match(auth, /verifiedUser\.isGuest === true && req\.path === '\/api\/pca\/stream'/,
  'verified guests may pass authentication only for the PCA stream');
assert.match(auth, /if \(verifiedUser\.isGuest && !isGuestPcaStream\)/,
  'guest identities must remain blocked from other protected endpoints');
assert.match(auth, /isGuest: verifiedUser\.isGuest === true/,
  'downstream quota logic must receive the verified guest status');
assert.match(server, /app\.post\('\/api\/pca\/stream', rateLimiter, requireAuth, async/,
  'PCA stream must remain behind authentication middleware');
assert.match(server, /const isGuestRequest = \(req as any\)\.user\?\.isGuest === true/,
  'guest quota must be selected from verified server identity');
assert.match(server, /const dailyQuotaLimit = isGuestRequest \? 5/,
  'guest PCA usage must retain the server-enforced daily quota');

console.log('Guest auth 401 regression boundary: 7 assertions passed');
