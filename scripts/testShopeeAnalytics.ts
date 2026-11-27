import assert from 'node:assert/strict';
import { summarizeShopeeOrders } from '../src/features/integrations/shopee/shopeeAnalytics';
const summary = summarizeShopeeOrders([
  { orderStatus: 'ที่ต้องจัดส่ง', observedAmount: 120, products: [{ name: 'A' }, { name: 'B' }] },
  { orderStatus: 'สำเร็จ', observedAmount: 80, products: [{ name: 'A' }] },
  { orderStatus: 'สำเร็จ', observedAmount: null, products: [{ name: 'C' }] },
]);
assert.equal(summary.orderCount, 3);
assert.deepEqual(summary.statusCounts, [{ status: 'สำเร็จ', count: 2 }, { status: 'ที่ต้องจัดส่ง', count: 1 }]);
assert.deepEqual(summary.topProducts[0], { name: 'A', appearances: 2 });
assert.equal(summary.observedAmountTotal, 200);
assert.equal(summary.observedAmountCount, 2);
assert.equal(summary.observedAmountCoverage, 2 / 3);
assert.equal(summarizeShopeeOrders([]).orderCount, 0);
