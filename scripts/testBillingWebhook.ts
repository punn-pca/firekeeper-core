import assert from 'node:assert/strict';
import { applyBillingEvent } from '../src/server/services/billingWebhook';

const users = new Map<string, Record<string, any>>();
const db = {
  collection: () => ({ doc: (id: string) => ({ id }) }),
  runTransaction: async (fn: (tx: any) => Promise<void>) => fn({
    get: async (ref: { id: string }) => ({ data: () => users.get(ref.id) }),
    set: (ref: { id: string }, data: Record<string, any>) => users.set(ref.id, { ...users.get(ref.id), ...data })
  })
};
const stripe = {
  checkout: { sessions: { listLineItems: async () => ({ data: [{ price: { id: 'price-pro' }, quantity: 1 }] }) } },
  subscriptions: { retrieve: async () => ({ status: 'active', metadata: { userId: 'u1', planId: 'professional' } }) }
} as any;
const checkout = (created: number) => ({ type: 'checkout.session.completed', created, data: { object: {
  id: 'cs1', mode: 'subscription', payment_status: 'paid', metadata: { userId: 'u1', planId: 'professional' },
  subscription: 'sub1', customer: 'cus1'
} } }) as any;
const deleted = (created: number, id = 'sub1') => ({ type: 'customer.subscription.deleted', created, data: { object: {
  id, metadata: { userId: 'u1' }
} } }) as any;
const prices = { professional: 'price-pro' };

assert.equal((await applyBillingEvent(checkout(100), stripe, db, prices)).status, 200);
assert.equal(users.get('u1')?.planId, 'professional');
await applyBillingEvent(deleted(90), stripe, db, prices);
assert.equal(users.get('u1')?.planId, 'professional', 'older deletion cannot revoke current plan');
await applyBillingEvent(deleted(110, 'old-sub'), stripe, db, prices);
assert.equal(users.get('u1')?.planId, 'professional', 'another subscription cannot revoke current plan');
await applyBillingEvent(deleted(110), stripe, db, prices);
assert.equal(users.get('u1')?.planId, 'free');
await applyBillingEvent(checkout(100), stripe, db, prices);
assert.equal(users.get('u1')?.planId, 'free', 'delayed checkout retry cannot reinstate cancelled plan');
await applyBillingEvent(checkout(110), stripe, db, prices);
assert.equal(users.get('u1')?.planId, 'free', 'same-second checkout retry cannot reinstate cancelled plan');
assert.equal((await applyBillingEvent(checkout(120), stripe, db, { professional: 'another-price' })).status, 400);
console.log('Billing webhook ordering and price validation tests passed.');
