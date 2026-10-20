import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const modal = readFileSync('src/components/AuthModal.tsx', 'utf8');
const authMiddleware = readFileSync('src/server/middleware/auth.ts', 'utf8');
const server = readFileSync('server.ts', 'utf8');

assert.match(modal, /signInAnonymously\(auth\)/, 'web guest sign-in must use Firebase Anonymous Auth');
assert.match(modal, /Authorization|genuine ID token accepted by protected API routes/, 'guest flow documents the real-token boundary');
assert.match(modal, /ทดลองใช้งานแบบ Guest ไม่ต้องสมัคร/, 'the auth modal must expose a guest entry point');
assert.match(modal, /auth\/operation-not-allowed/, 'disabled anonymous auth must show a clear configuration error');
assert.match(authMiddleware, /isGuest: payload\.firebase\?\.sign_in_provider === 'anonymous'/, 'Firebase anonymous identities must be classified as guests');
assert.match(authMiddleware, /const verifiedUser = await verifyFirebaseIdToken\(token\)/, 'protected routes must continue validating tokens');
assert.match(server, /app\.post\('\/api\/pca\/stream', rateLimiter, requireAuth, async/, 'PCA streaming must remain protected by real authentication');
assert.doesNotMatch(modal, /offline-local-token/, 'web guest flow must not use a synthetic offline token');

console.log('Guest auth boundary: 8 assertions passed');
