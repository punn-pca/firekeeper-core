import assert from 'node:assert/strict';
import { isBlockedNetworkAddress, safeOutboundRedirectMode, validateOutboundBaseUrl } from '../src/server/security/outboundUrlPolicy';
import { decodeResponseText } from '../src/server/services/webAccess/httpFetcher';

assert.equal(isBlockedNetworkAddress('127.0.0.1'), true);
assert.equal(isBlockedNetworkAddress('10.0.0.1'), true);
assert.equal(isBlockedNetworkAddress('169.254.169.254'), true);
assert.equal(isBlockedNetworkAddress('192.168.1.10'), true);
assert.equal(isBlockedNetworkAddress('::1'), true);
assert.equal(isBlockedNetworkAddress('fc00::1'), true);
assert.equal(isBlockedNetworkAddress('::ffff:7f00:1'), true);
assert.equal(isBlockedNetworkAddress('2002:0808:0808::1'), true, '6to4 transition range must be blocked');
assert.equal(isBlockedNetworkAddress('64:ff9b::808:808'), true, 'NAT64 translation range must be blocked');
assert.equal(isBlockedNetworkAddress('fec0::1'), true, 'deprecated site-local range must be blocked');
assert.equal(isBlockedNetworkAddress('ff02::1'), true, 'IPv6 multicast must be blocked');
assert.equal(isBlockedNetworkAddress('2001:db8::1'), true, 'documentation range must be blocked');
assert.equal(isBlockedNetworkAddress('8.8.8.8'), false);
assert.equal(safeOutboundRedirectMode('manual'), 'manual');
assert.equal(safeOutboundRedirectMode('follow'), 'error', 'automatic redirects must never bypass per-hop validation');
assert.equal(safeOutboundRedirectMode('error'), 'error');
assert.equal(decodeResponseText(new Uint8Array([0xa1]), 'text/html; charset=TIS-620'), 'ก');


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
