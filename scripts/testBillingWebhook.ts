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
let subscription: any = { id: 'sub1', customer: 'cus_1', status: 'active', metadata: { userId: 'u1', planId: 'professional' }, items: { data: [{ quantity: 1, price: { id: 'price-pro' } }] }, latest_invoice: 'in1', cancel_at_period_end: false };
let invoice: any = { id: 'in1', status: 'paid', attempted: true, amount_due: 990 };
const stripe = {
  checkout: { sessions: { listLineItems: async () => ({ data: [{ price: { id: 'price-pro' }, quantity: 1 }] }) } },
  subscriptions: { retrieve: async () => subscription },
  invoices: { retrieve: async () => invoice }
} as any;
const checkout = (created: number) => ({ type: 'checkout.session.completed', created, data: { object: {
  id: 'cs1', mode: 'subscription', payment_status: 'paid', metadata: { userId: 'u1', planId: 'professional' },
  subscription: 'sub1', customer: 'cus_1'
} } }) as any;
const deleted = (created: number, id = 'sub1') => ({ type: 'customer.subscription.deleted', created, data: { object: {
  id, metadata: { userId: 'u1' }
} } }) as any;
const prices = { professional: 'price-pro', team: 'price-team' };

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

await applyBillingEvent(checkout(130), stripe, db, prices);
const event = (type: string, created: number, object: any = { id: 'sub1' }) => ({ id: `${type}-${created}`, type, created, data: { object } }) as any;
subscription = { ...subscription, items: { data: [{ quantity: 1, price: { id: 'price-team' } }] } };
await applyBillingEvent(event('customer.subscription.updated', 140), stripe, db, prices);
assert.equal(users.get('u1')?.planId, 'team', 'portal price change maps from trusted Stripe price, not stale metadata');
subscription.status = 'past_due'; invoice.status = 'open';
await applyBillingEvent(event('invoice.payment_failed', 150, { id: 'in1', parent: { subscription_details: { subscription: 'sub1' } } }), stripe, db, prices);
assert.equal(users.get('u1')?.planId, 'free');
assert.equal(users.get('u1')?.billingPastDue, true);
subscription.status = 'active'; invoice.status = 'paid';
await applyBillingEvent(event('invoice.paid', 160, { id: 'in1', subscription: 'sub1' }), stripe, db, prices);
assert.equal(users.get('u1')?.planId, 'team', 'successful retry restores the current price plan');
subscription.status = 'past_due'; invoice.status = 'open';
await applyBillingEvent(event('customer.subscription.updated', 155), stripe, db, prices);
assert.equal(users.get('u1')?.planId, 'team', 'older event cannot undo recovery');
subscription.status = 'active'; invoice.status = 'paid';
subscription.items.data[0].price.id = 'unsupported';
await applyBillingEvent(event('customer.subscription.updated', 170), stripe, db, prices);
assert.equal(users.get('u1')?.planId, 'free', 'unknown price cannot grant paid entitlements');
subscription.items.data[0].price.id = 'price-team';
await applyBillingEvent(event('customer.subscription.updated', 180), stripe, db, prices);
await applyBillingEvent(deleted(190), stripe, db, prices);
await applyBillingEvent(event('invoice.paid', 200, { id: 'in1', subscription: 'sub1' }), stripe, db, prices);
assert.equal(users.get('u1')?.planId, 'free', 'post-cancellation invoice cannot rebind a subscription');
await applyBillingEvent(event('invoice.paid', 210, { id: 'one-off' }), stripe, db, prices);
console.log('Subscription lifecycle, recovery, portal plan changes, and stale-event tests passed.');
