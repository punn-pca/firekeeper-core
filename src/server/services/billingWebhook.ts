import type Stripe from 'stripe';

export type BillingResult = { status: number; message: string };

/** Applies signed Stripe events without allowing delayed retries to restore old plans. */
export async function applyBillingEvent(
  event: Stripe.Event,
  stripe: Stripe,
  db: any,
  prices: Record<string, string | undefined>
): Promise<BillingResult> {
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.metadata?.userId || session.client_reference_id;
    const planId = session.metadata?.planId;
    const expectedPrice = planId && prices[planId];
    if (session.mode !== 'subscription' || session.payment_status !== 'paid' || !userId || !expectedPrice || typeof session.subscription !== 'string') {
      return { status: 400, message: 'Invalid checkout session' };
    }
    const [lineItems, subscription] = await Promise.all([
      stripe.checkout.sessions.listLineItems(session.id, { limit: 100 }),
      stripe.subscriptions.retrieve(session.subscription)
    ]);
    if (lineItems.data.length !== 1 || lineItems.data[0].price?.id !== expectedPrice || lineItems.data[0].quantity !== 1 ||
      subscription.metadata?.userId !== userId || subscription.metadata?.planId !== planId) {
      return { status: 400, message: 'Checkout subscription mismatch' };
    }
    if (subscription.status !== 'active' && subscription.status !== 'trialing') return { status: 200, message: 'received' };
    await db.runTransaction(async (tx: any) => {
      const ref = db.collection('users').doc(userId);
      const user = await tx.get(ref);
      if (Number(user.data()?.billingEventCreatedAt || 0) >= event.created) return;
      tx.set(ref, {
        planId, stripeCustomerId: session.customer, stripeSubscriptionId: session.subscription,
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
      tx.set(ref, { planId: 'free', stripeSubscriptionId: null, billingEventCreatedAt: event.created, planUpdatedAt: new Date().toISOString() }, { merge: true });
    });
  }
  return { status: 200, message: 'received' };
}
