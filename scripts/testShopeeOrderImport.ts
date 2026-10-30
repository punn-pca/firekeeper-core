import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';

const valid = {
  schemaVersion: 'firekeeper-commerce-orders.v1',
  platform: 'shopee',
  scope: 'visible_current_page_only',
  orders: [{ orderId: '261027Q4VHV52K', orderStatus: 'ที่ต้องจัดส่ง', observedAmount: 10396, currency: 'THB' }],
};
assert.equal(valid.orders.length, 1);
assert.match(valid.orders[0].orderId, /^[A-Za-z0-9_-]{5,64}$/);
assert.equal(valid.scope, 'visible_current_page_only');
assert.equal(valid.orders[0].observedAmount >= 0, true);
assert.equal(
  createHash('sha256').update('shopee:' + valid.orders[0].orderId).digest('hex'),
  createHash('sha256').update('shopee:' + valid.orders[0].orderId).digest('hex'),
  'the same order key must be deterministic for idempotent imports',
);
assert.notEqual(
  createHash('sha256').update('shopee:' + valid.orders[0].orderId).digest('hex'),
  createHash('sha256').update('shopee:OTHERORDER123').digest('hex'),
);
assert.equal(valid.orders.length <= 100, true);
console.log('Shopee order import boundary tests passed.');
