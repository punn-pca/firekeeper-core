# Paid release acceptance

This document records implemented boundaries and the deployment evidence still required. Passing local tests is not a production certification.

## Implemented boundaries

- Hosted conversation reads use Firestore as the authority. Unavailable storage returns 503; local ownership fallback is restricted to explicit offline mode.
- Conversation save/delete checks ownership in the transaction that writes/deletes. Save acknowledgements and cache changes follow successful commit. A foreign ID is reassigned on save/stream; direct read/delete is denied.
- Account policy is enforced on PCA provider routing (including a custom base URL), literal restricted phrases in request/history/parsed document text, filtered memory, and final response text. DeepSeek contextual LLM resolution is disabled when DeepSeek is disallowed. This is not semantic topic detection or image DLP. Other application features are outside this policy boundary.
- `approvalRequired` keeps PCA results advisory and requires a matching approved Decision Object at `/api/audit/decision`. Approval binds a canonical content hash, requires workspace membership and a current reviewer/owner, and excludes client-supplied approval assertions. Final reviews cannot be replaced through the review API. ID-only legacy approval records do not satisfy this gate.
- Conversation and audit lifetimes follow the plan. Memory and Enterprise fallback lifetimes follow deployment settings; see [retention policy](DATA_RETENTION.md).
- Stripe subscription updates and invoice events refresh current Stripe state, verify the account/subscription binding, and map configured prices to plans. Unpaid/past-due or unsupported-price subscriptions receive Free entitlements. Successful payment recovery restores the mapped plan; cancellation at period end retains access while the subscription is active and its current invoice is paid. Canceled or replaced subscriptions cannot be rebound by an invoice event.
- The billing portal derives the Customer ID from server-owned user data, never from the request body. Users cannot edit plan, billing, or usage authority fields under the revised Firestore rules.

- Hosted PCA validates ownership, provider/plan entitlement, account policy, restricted input, and attachment parsing before atomically reserving analysis quota. Web clients provide a stable `analysisRequestId` so retries cannot start the same logical request twice. Post-reservation failures are best-effort marked terminal `FAILED_CONSUMED` and are not automatically refunded; older clients without an ID retain quota enforcement but not request deduplication.
- Governed Hosted completion is fail-closed on the canonical Firestore audit and required completion bookkeeping. The `complete` event is emitted only after audit persistence, completed-analysis usage persistence, and idempotency finalization (when an ID is present). Secondary export/aggregate telemetry remains best-effort.

## Deployment steps and evidence

1. Deploy the application and publish `firestore.rules` to the intended Firebase project. Check the rules with two real test accounts: neither can create/update `planId`, Stripe IDs, billing state, or quota counters. Review preexisting paid-plan/billing records against Stripe or an approved manual grant; revised rules do not retroactively prove older field values were trusted.
2. Enable `expiresAt` TTL for `conversations`, `memories`, `decision_audits`, `pca_audit_logs`, and `security_events`. Verify expired records are not returned and physical deletion occurs.
3. Configure Stripe keys, `STRIPE_PRICE_*`, HTTPS `APP_ORIGIN`, and the Billing customer portal. Enable only the intended price changes and cancellation settings in the portal.
4. Subscribe the webhook to `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `customer.subscription.updated`, `customer.subscription.paused`, `customer.subscription.resumed`, `customer.subscription.deleted`, `invoice.paid`, and `invoice.payment_failed`. Send test-mode events through the signed HTTP webhook; verify purchase, failed renewal, recovery, price change, cancellation, duplicate delivery, and stale delivery against stored entitlements.
5. Run cross-account acceptance on at least two application instances with the same test Firestore project. Verify foreign read/delete denial, save/stream reassignment, storage failure 503, and isolation-event visibility.
6. Verify policy denial before inference, including image routing and custom endpoints. Verify restricted-phrase behavior, failed policy-store reads, and a changed Decision Object being rejected even if its previous version was approved.

## Remaining operational gates

Before an Enterprise SLA is promised, retain evidence of load tests, backup/restore drills, monitoring/incident ownership, deployed OIDC configuration, and commercial/service terms. The repository does not establish that these operational gates have passed.

## Local verification

`npm test` runs conversation transaction/fault tests, policy/approval/retention tests, portal account binding, billing event ordering/lifecycle, and the maintained governance/security suite. `test-user-isolation.ts` now runs the actual persistence-helper regression suite; it no longer calls obsolete HTTP assumptions. These tests use controlled substitutes for Firestore and Stripe, and do not claim live service integration.
