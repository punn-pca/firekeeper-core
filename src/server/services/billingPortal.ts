export class BillingPortalError extends Error {
  constructor(public readonly status: number, public readonly code: string) { super(code); }
}

/** Customer identity is read only from server-owned account data. */
export async function createAccountBillingPortal(stripe: any, db: any, userId: string, origin: string) {
  if (!stripe || !db) throw new BillingPortalError(503, 'BILLING_NOT_CONFIGURED');
  const account = await db.collection('users').doc(userId).get();
  const customer = account.data()?.stripeCustomerId;
  if (typeof customer !== 'string' || !customer.startsWith('cus_')) throw new BillingPortalError(404, 'BILLING_CUSTOMER_NOT_FOUND');
  return stripe.billingPortal.sessions.create({ customer, return_url: `${origin}/plans` });
}
