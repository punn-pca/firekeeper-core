import assert from 'node:assert/strict';
import { isRetryableProviderStatus } from '../src/server/services/ai';

for (const status of [408, 425, 429, 500, 502, 503, 504]) {
  assert.equal(isRetryableProviderStatus(status), true, `${status} should be retryable`);
}
for (const status of [400, 401, 403, 404, 409, 422]) {
  assert.equal(isRetryableProviderStatus(status), false, `${status} must fail fast`);
}
assert.equal(isRetryableProviderStatus(undefined), true, 'Network failures without HTTP status remain retryable');

console.log('Provider retry classification passed.');
