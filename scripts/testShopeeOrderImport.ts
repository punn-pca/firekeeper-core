import assert from 'node:assert/strict';
import { cleanOrder, stableOrderKey } from '../src/server/integrations/shopee/shopeeOrders';

const valid = cleanOrder({
  orderId: '261027Q4VHV52K',
  orderStatus: 'ที่ต้องจัดส่ง',
  observedAmount: 10396,
  currency: 'THB',
});
assert.ok(valid);
assert.equal(valid.orderId, '261027Q4VHV52K');
assert.equal(valid.observedAmount, 10396);
assert.equal(valid.amountMeaning, 'UNVERIFIED_VISIBLE_AMOUNT');
assert.equal(valid.validationStatus, 'NEEDS_REVIEW');

const noVisibleOrderId = cleanOrder({
  orderId: null,
  recordKey: 'visible-1a2b3c4d',
  orderStatus: 'ที่ต้องจัดส่ง',
  observedAmount: 10396,
  currency: 'THB',
});
assert.ok(noVisibleOrderId);
assert.equal(noVisibleOrderId.orderId, null);
assert.equal(noVisibleOrderId.recordKey, 'visible-1a2b3c4d');

assert.equal(cleanOrder({ orderId: 'bad' }), null);
assert.equal(cleanOrder({ orderId: null, recordKey: 'untrusted-key' }), null);
assert.equal(cleanOrder({ orderId: 'ORDER12345', observedAmount: -1 })?.observedAmount, null);
assert.equal(cleanOrder({ orderId: 'ORDER12345', observedAmount: Number.NaN })?.observedAmount, null);
assert.equal(stableOrderKey('shopee', 'ORDER12345'), stableOrderKey('shopee', 'ORDER12345'));
assert.notEqual(stableOrderKey('shopee', 'ORDER12345'), stableOrderKey('shopee', 'OTHER12345'));
assert.notEqual(stableOrderKey('shopee', 'ORDER12345'), stableOrderKey('lazada', 'ORDER12345'));
console.log('Shopee order import boundary tests passed.');
