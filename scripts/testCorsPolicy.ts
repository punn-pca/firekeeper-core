import assert from 'node:assert/strict';
import { createCorsOriginPolicy } from '../src/server/security/corsPolicy';

assert.throws(
  () => createCorsOriginPolicy({ isProduction: true, configuredOrigin: '*' }),
  /exact HTTPS APP_ORIGIN/
);
assert.throws(
  () => createCorsOriginPolicy({ isProduction: true }),
  /exact HTTPS APP_ORIGIN/
);
assert.throws(
  () => createCorsOriginPolicy({ isProduction: true, configuredOrigin: 'http://firekeeper.site' }),
  /must use HTTPS/
);

const production = createCorsOriginPolicy({
  isProduction: true,
  configuredOrigin: 'https://firekeeper.site',
});
assert.equal(production(undefined), true);
assert.equal(production('https://firekeeper.site'), true);
assert.equal(production('https://evil.run.app'), false);
assert.equal(production('https://docs.google.com'), false);
assert.equal(production('https://sub.firekeeper.site'), false);

const development = createCorsOriginPolicy({
  isProduction: false,
  configuredOrigin: '*',
});
assert.equal(development('http://localhost:5173'), true);

console.log('✅ CORS origin policy tests passed.');
