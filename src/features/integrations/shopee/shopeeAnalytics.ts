export type ShopeeAnalyticsOrder = {
  orderStatus?: string | null;
  observedAmount?: number | null;
  products?: Array<{ name?: string | null; quantity?: number | null }>;
};

export function summarizeShopeeOrders(orders: ShopeeAnalyticsOrder[]) {
  const statusCounts = new Map<string, number>();
  const productCounts = new Map<string, number>();
  let observedAmountTotal = 0;
  let observedAmountCount = 0;
  for (const order of orders) {
    const status = (order.orderStatus || 'UNKNOWN').trim() || 'UNKNOWN';
    statusCounts.set(status, (statusCounts.get(status) || 0) + 1);
    if (typeof order.observedAmount === 'number' && Number.isFinite(order.observedAmount) && order.observedAmount >= 0) {
      observedAmountTotal += order.observedAmount;
      observedAmountCount += 1;
    }
    for (const product of order.products || []) {
      const name = typeof product.name === 'string' ? product.name.trim() : '';
      if (name) productCounts.set(name, (productCounts.get(name) || 0) + 1);
    }
  }
  return {
    orderCount: orders.length,
    statusCounts: [...statusCounts.entries()].map(([status, count]) => ({ status, count })).sort((a, b) => b.count - a.count || a.status.localeCompare(b.status)),
    topProducts: [...productCounts.entries()].map(([name, appearances]) => ({ name, appearances })).sort((a, b) => b.appearances - a.appearances || a.name.localeCompare(b.name)).slice(0, 5),
    observedAmountTotal,
    observedAmountCount,
    observedAmountCoverage: orders.length ? observedAmountCount / orders.length : 0,
  };
}
