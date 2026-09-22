import assert from 'node:assert/strict';
import { isBlockedNetworkAddress, validateOutboundBaseUrl } from '../src/server/security/outboundUrlPolicy';

assert.equal(isBlockedNetworkAddress('127.0.0.1'), true);
assert.equal(isBlockedNetworkAddress('10.0.0.1'), true);
assert.equal(isBlockedNetworkAddress('169.254.169.254'), true);
assert.equal(isBlockedNetworkAddress('192.168.1.10'), true);
assert.equal(isBlockedNetworkAddress('::1'), true);
assert.equal(isBlockedNetworkAddress('fc00::1'), true);
assert.equal(isBlockedNetworkAddress('::ffff:7f00:1'), true);
assert.equal(isBlockedNetworkAddress('8.8.8.8'), false);

await assert.rejects(() => validateOutboundBaseUrl('http://example.com'), /HTTPS/);
await assert.rejects(() => validateOutboundBaseUrl('https://127.0.0.1'), /private or reserved/);
await assert.rejects(() => validateOutboundBaseUrl('https://169.254.169.254/latest/meta-data'), /private or reserved/);
await assert.rejects(() => validateOutboundBaseUrl('https://metadata.google.internal'), /blocked host/);
await assert.rejects(() => validateOutboundBaseUrl('file:///etc/passwd'), /HTTPS/);
assert.equal(
  await validateOutboundBaseUrl('http://127.0.0.1:11434', 'ollamaBaseUrl', { allowPrivateNetwork: true }),
  'http://127.0.0.1:11434'
);

console.log('✅ Outbound URL / SSRF policy tests passed.');
