import assert from 'node:assert/strict';
import { isUserAdmin, verifyFirebaseIdToken, OFFLINE_USER_UID, OFFLINE_USER_EMAIL } from '../src/server/middleware/auth';

assert.equal(isUserAdmin(OFFLINE_USER_UID, OFFLINE_USER_EMAIL), false);
assert.equal(isUserAdmin('ordinary-user', OFFLINE_USER_EMAIL), false);
assert.equal(await verifyFirebaseIdToken('offline-local-token'), null);
assert.equal(await verifyFirebaseIdToken('offline-anything'), null);
console.log('Offline authentication boundary passed.');
