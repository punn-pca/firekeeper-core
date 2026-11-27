import type { Express, Request, Response } from 'express';
import { createHash } from 'node:crypto';

type ShopeeOrderInput = {
  orderId?: unknown;
  recordKey?: unknown;
  orderStatus?: unknown;
  observedAmount?: unknown;
  currency?: unknown;
  amountMeaning?: unknown;
  orderDateText?: unknown;
  products?: unknown;
  validationStatus?: unknown;
};

const MAX_ORDERS_PER_IMPORT = 100;
const ORDER_ID_PATTERN = /^[A-Za-z0-9_-]{5,64}$/;

export function stableOrderKey(platform: string, orderId: string): string {
  return createHash('sha256').update(platform + ':' + orderId).digest('hex');
}

export function cleanOrder(value: ShopeeOrderInput): Record<string, unknown> | null {
  if (!value || typeof value !== 'object') return null;
  const orderId = typeof value.orderId === 'string' ? value.orderId.trim() : '';
  const recordKey = typeof value.recordKey === 'string' ? value.recordKey.trim() : '';
  if ((!ORDER_ID_PATTERN.test(orderId)) && !/^visible-[a-f0-9]{8}$/.test(recordKey)) return null;

  const status = typeof value.orderStatus === 'string'
    ? value.orderStatus.trim().slice(0, 80)
    : 'UNKNOWN';
  const amount = typeof value.observedAmount === 'number' &&
    Number.isFinite(value.observedAmount) && value.observedAmount >= 0
    ? value.observedAmount
    : null;

  const products = Array.isArray(value.products) ? value.products.slice(0, 30).flatMap((item: any) => {
    if (!item || typeof item !== 'object' || typeof item.name !== 'string') return [];
    const name = item.name.trim().slice(0, 180);
    if (!name) return [];
    const quantity = Number.isInteger(item.quantity) && item.quantity > 0 && item.quantity <= 999 ? item.quantity : null;
    const productAmount = typeof item.observedUnitOrLineAmount === 'number' &&
      Number.isFinite(item.observedUnitOrLineAmount) && item.observedUnitOrLineAmount >= 0
      ? item.observedUnitOrLineAmount : null;
    return [{ name, quantity, observedUnitOrLineAmount: productAmount, amountMeaning: 'UNVERIFIED_VISIBLE_PRODUCT_AMOUNT' }];
  }) : [];

  return {
    orderId: ORDER_ID_PATTERN.test(orderId) ? orderId : null,
    recordKey: /^visible-[a-f0-9]{8}$/.test(recordKey) ? recordKey : null,
    orderStatus: status || 'UNKNOWN',
    orderDateText: typeof value.orderDateText === 'string' ? value.orderDateText.slice(0, 80) : null,
    products,
    observedAmount: amount,
    currency: value.currency === 'THB' ? 'THB' : 'UNKNOWN',
    amountMeaning: 'UNVERIFIED_VISIBLE_AMOUNT',
    validationStatus: 'NEEDS_REVIEW',
    source: 'browser_visible_dom',
  };
}

export function registerShopeeOrderRoutes(
  app: Express,
  options: {
    adminDb: any;
    firestoreAvailable: () => boolean;
    requireAuth: any;
  },
): void {
  const { adminDb, firestoreAvailable, requireAuth } = options;

  app.post('/api/integrations/shopee/import', requireAuth, async (req: Request, res: Response) => {
    const identity = (req as any).user || {};
    const userId = String((req as any).userId || identity.uid || '');
    if (!userId || identity.isGuest === true || identity.providerId === 'anonymous') {
      return res.status(403).json({ error: 'SHOPEE_IMPORT_AUTHENTICATED_ACCOUNT_REQUIRED' });
    }
    if (!adminDb || !firestoreAvailable()) {
      return res.status(503).json({ error: 'SHOPEE_IMPORT_STORAGE_UNAVAILABLE' });
    }

    const payload = req.body;
    if (!payload || payload.schemaVersion !== 'firekeeper-commerce-orders.v1' ||
        payload.platform !== 'shopee' || payload.scope !== 'visible_current_page_only' ||
        !Array.isArray(payload.orders)) {
      return res.status(400).json({ error: 'SHOPEE_IMPORT_INVALID_PAYLOAD' });
    }
    if (payload.orders.length < 1 || payload.orders.length > MAX_ORDERS_PER_IMPORT) {
      return res.status(400).json({ error: 'SHOPEE_IMPORT_ORDER_COUNT_INVALID', maxOrders: MAX_ORDERS_PER_IMPORT });
    }

    const cleaned = payload.orders.map(cleanOrder);
    if (cleaned.some((order) => !order)) {
      return res.status(400).json({ error: 'SHOPEE_IMPORT_ORDER_VALIDATION_FAILED' });
    }

    try {
      const collection = adminDb.collection('users').doc(userId).collection('commerce_orders');
      const batch = adminDb.batch();
      const importedAt = new Date().toISOString();
      for (const order of cleaned as Record<string, unknown>[]) {
        const stableId = String(order.orderId || order.recordKey);
        const ref = collection.doc(stableOrderKey('shopee', stableId));
        batch.set(ref, {
          ...order,
          platform: 'shopee',
          importedAt,
          lastSeenAt: importedAt,
        }, { merge: true });
      }
      const syncRef = adminDb.collection('users').doc(userId).collection('commerce_syncs').doc();
      batch.set(syncRef, {
        platform: 'shopee',
        source: 'browser_visible_dom',
        importedCount: cleaned.length,
        scope: 'visible_current_page_only',
        importedAt,
      });
      await batch.commit();
      return res.status(201).json({
        success: true,
        importedCount: cleaned.length,
        deduplication: 'deterministic_user_scoped_order_key',
        scope: 'visible_current_page_only',
        importedAt,
      });
    } catch {
      return res.status(503).json({ error: 'SHOPEE_IMPORT_PERSISTENCE_FAILED' });
    }
  });

  app.get('/api/integrations/shopee/orders', requireAuth, async (req: Request, res: Response) => {
    const identity = (req as any).user || {};
    const userId = String((req as any).userId || identity.uid || '');
    if (!userId || identity.isGuest === true || identity.providerId === 'anonymous') {
      return res.status(403).json({ error: 'SHOPEE_ORDERS_AUTHENTICATED_ACCOUNT_REQUIRED' });
    }
    if (!adminDb || !firestoreAvailable()) {
      return res.status(503).json({ error: 'SHOPEE_ORDERS_STORAGE_UNAVAILABLE' });
    }
    try {
      const snapshot = await adminDb.collection('users').doc(userId)
        .collection('commerce_orders').limit(200).get();
      const orders = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }))
        .sort((a: any, b: any) => String(b.importedAt || '').localeCompare(String(a.importedAt || '')));
      return res.json({ orders });
    } catch {
      return res.status(503).json({ error: 'SHOPEE_ORDERS_READ_FAILED' });
    }
  });
}
