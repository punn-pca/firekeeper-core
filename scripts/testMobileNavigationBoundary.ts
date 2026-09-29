import assert from 'node:assert/strict';
import { isTrustedNavigation } from '../mobile/src/screens/trustedNavigation';

assert.equal(isTrustedNavigation('file:///android_asset/web/index.html'), true);
assert.equal(isTrustedNavigation('file:///android_asset/web/assets/index.js'), true);
assert.equal(isTrustedNavigation('file:///android_asset/web/../../etc/passwd'), false);
assert.equal(isTrustedNavigation('file:///android_asset/web/%2e%2e/%2e%2e/etc/passwd'), false);
assert.equal(isTrustedNavigation('https://firekeeper.site/home'), true);
assert.equal(isTrustedNavigation('https://accounts.google.com/o/oauth2/auth'), true);
assert.equal(isTrustedNavigation('https://firekeeper-pca.firebaseapp.com/__/auth/handler'), true);
assert.equal(isTrustedNavigation('https://firekeeper.site.evil.example/'), false);
assert.equal(isTrustedNavigation('https://attacker.firebaseapp.com/'), false);
assert.equal(isTrustedNavigation('javascript:alert(1)'), false);
console.log('Mobile navigation boundary passed.');
