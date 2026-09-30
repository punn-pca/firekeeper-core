import type Stripe from 'stripe';

export type BillingResult = { status: number; message: string };

export const BILLING_EVENTS = ['checkout.session.completed', 'checkout.session.async_payment_succeeded',
  'customer.subscription.updated', 'customer.subscription.paused', 'customer.subscription.resumed',
  'customer.subscription.deleted', 'invoice.paid', 'invoice.payment_failed'] as const;

const objectId = (value: any): string | undefined => typeof value === 'string' ? value : value?.id;

/** Applies signed Stripe events without allowing delayed retries to restore old plans. */
export async function applyBillingEvent(
  event: Stripe.Event,
  stripe: Stripe,
  db: any,
  prices: Record<string, string | undefined>
): Promise<BillingResult> {
  if (event.type === 'checkout.session.completed' || event.type === 'checkout.session.async_payment_succeeded') {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.metadata?.userId || session.client_reference_id;
    const planId = session.metadata?.planId;
    const expectedPrice = planId && prices[planId];
    if (session.mode !== 'subscription' || session.payment_status !== 'paid' || !userId || !expectedPrice || typeof session.subscription !== 'string' || !objectId(session.customer)) {
      return { status: 400, message: 'Invalid checkout session' };
    }
    const [lineItems, subscription] = await Promise.all([
      stripe.checkout.sessions.listLineItems(session.id, { limit: 100 }),
      stripe.subscriptions.retrieve(session.subscription)
    ]);
    if (lineItems.data.length !== 1 || lineItems.data[0].price?.id !== expectedPrice || lineItems.data[0].quantity !== 1 ||
      subscription.metadata?.userId !== userId || subscription.metadata?.planId !== planId ||
      subscription.items.data.length !== 1 || subscription.items.data[0].price.id !== expectedPrice || subscription.items.data[0].quantity !== 1 ||
      objectId(subscription.customer) !== objectId(session.customer)) {
      return { status: 400, message: 'Checkout subscription mismatch' };
    }
    if (subscription.status !== 'active' && subscription.status !== 'trialing') return { status: 200, message: 'received' };
    await db.runTransaction(async (tx: any) => {
      const ref = db.collection('users').doc(userId);
      const user = await tx.get(ref);
      if (Number(user.data()?.billingEventCreatedAt || 0) >= event.created) return;
      tx.set(ref, {
        planId, stripeCustomerId: objectId(session.customer), stripeSubscriptionId: session.subscription,
        billingStatus: subscription.status, billingPastDue: false, billingEventId: event.id || null,
        billingEventCreatedAt: event.created, planUpdatedAt: new Date().toISOString()
      }, { merge: true });
    });
  }

  if (event.type === 'customer.subscription.deleted') {
    const subscription = event.data.object as Stripe.Subscription;
    const userId = subscription.metadata?.userId;
    if (!userId) return { status: 400, message: 'Missing subscription owner' };
    await db.runTransaction(async (tx: any) => {
      const ref = db.collection('users').doc(userId);
      const user = await tx.get(ref);
      if (user.data()?.stripeSubscriptionId !== subscription.id || Number(user.data()?.billingEventCreatedAt || 0) > event.created) return;
      tx.set(ref, { planId: 'free', stripeSubscriptionId: null, billingStatus: 'canceled', billingPastDue: false,
        billingEventId: event.id || null, billingEventCreatedAt: event.created, planUpdatedAt: new Date().toISOString() }, { merge: true });
    });
  }

  if (['customer.subscription.updated', 'customer.subscription.paused', 'customer.subscription.resumed', 'invoice.paid', 'invoice.payment_failed'].includes(event.type)) {
    const object: any = event.data.object;
    const isInvoice = event.type.startsWith('invoice.');
    const subscriptionId = isInvoice
      ? objectId(object.parent?.subscription_details?.subscription || object.subscription)
      : object.id;
    if (!subscriptionId) return { status: 200, message: 'Non-subscription event ignored' };
    // Fetch current Stripe state rather than replaying a possibly stale event snapshot.
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    const userId = subscription.metadata?.userId;
    if (!userId) return { status: 400, message: 'Missing subscription owner' };
    const items = subscription.items.data;
    const mappedPlan = items.length === 1 && items[0].quantity === 1
      ? Object.entries(prices).find(([, price]) => Boolean(price) && price === items[0].price.id)?.[0] : undefined;
    let latestPaymentFailed = false;
    if (objectId(subscription.latest_invoice)) {
      const invoice = await stripe.invoices.retrieve(objectId(subscription.latest_invoice)!);
      latestPaymentFailed = invoice.status === 'uncollectible' || (invoice.status === 'open' && invoice.attempted && invoice.amount_due > 0);
    }
    const active = ['active', 'trialing'].includes(subscription.status) && !latestPaymentFailed;
    await db.runTransaction(async (tx: any) => {
      const ref = db.collection('users').doc(userId);
      const user = (await tx.get(ref)).data() || {};
      // Only Checkout can bind a new subscription. Delayed events from a previous
      // subscription must never restore an account after cancellation/replacement.
      if (user.stripeSubscriptionId !== subscription.id || user.stripeCustomerId !== objectId(subscription.customer) ||
        Number(user.billingEventCreatedAt || 0) > event.created || (event.id && user.billingEventId === event.id)) return;
      tx.set(ref, {
        planId: active && mappedPlan ? mappedPlan : 'free',
        billingStatus: subscription.status, billingPastDue: latestPaymentFailed || ['past_due', 'unpaid'].includes(subscription.status),
        billingCancelAtPeriodEnd: subscription.cancel_at_period_end,
        billingEventId: event.id || null, billingEventCreatedAt: event.created, planUpdatedAt: new Date().toISOString()
      }, { merge: true });
    });
  }
  return { status: 200, message: 'received' };
}
