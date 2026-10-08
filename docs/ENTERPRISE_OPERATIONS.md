# Enterprise runtime operations

This repository provides technical controls, not a certification or an assurance
that a particular deployment is ready for enterprise traffic. Production approval
requires evidence from the target environment and an accountable service owner.

## Release gate

Use Node.js 22 and the committed lockfile. Run `npm ci`, `npm run lint`,
`npm test`, `npm run test:publication-rag`, `npm run build`, and
`npm run test:production-http`.
The Docker build enforces those checks before producing the runtime image and
does not fall back to a different dependency resolution if installation fails.
Run `npm audit --omit=dev` and triage findings before deployment.

The container runs as the unprivileged `node` user. Application files are
read-only to that user; temporary files may use `/tmp`. Durable enterprise state
must be stored in the configured Firestore database, never the container filesystem.
Cloud Run does not use Docker HEALTHCHECK; configure platform probes explicitly.

## Runtime contract

- `/healthz` and `/health` indicate HTTP process liveness, not database or model
  availability. Monitor real authenticated transactions separately.
- SIGTERM and SIGINT stop admission, close idle connections, and allow existing
  requests up to eight seconds to finish. The process exits with status zero on a
  clean drain and nonzero on a fatal error or exceeded drain deadline.
- Requests accepted on existing connections during drain receive 503,
  `Connection: close`, and `Retry-After: 5`. Streaming requests exceeding the
  deadline are disconnected. Clients must reconcile request IDs before retries.
- Incoming headers have a 15-second deadline, request bodies 60 seconds, and idle
  keep-alive connections five seconds. These are not LLM response deadlines.
- API responses are marked `Cache-Control: no-store`. Each request receives a
  server-generated `X-Request-ID`. Central HTTP errors include the same ID and a
  stable error code without echoing parser input or provider details.
- Unknown `/api` routes return JSON 404 rather than the SPA document.
- `/api/system/diagnostics` requires an authenticated administrator. Use liveness
  endpoints for load balancer probes instead.
- Request body ceilings are 12 MB for analysis, 4 MB for conversations, 24 MB for
  document resources, and 1 MB otherwise. Stripe retains raw-body verification.

## Deployment acceptance checklist

Record the owner, date, environment, evidence link, and pass/fail for each item:

1. Set an exact HTTPS `APP_ORIGIN`; provision Firebase identity, database access,
   least-privilege service identity, and provider secrets using a secret manager.
   Confirm the existing one-hop proxy trust matches the deployed ingress topology.
2. Exercise SSO login, logout, revoked/expired credentials, admin denial for normal
   users, and cross-tenant access denial against real services.
3. Verify Firestore rules, required indexes, TTL policies, quota alarms, backup
   schedules, retention/deletion behavior, and an actual restore drill.
4. Load-test representative concurrent analysis, uploads, and streaming requests;
   choose capacity, timeout, and error-budget targets from measured results.
5. Test instance termination during analysis and verify client recovery without
   duplicate billing or lost acknowledged writes. Give the process more than
   eight seconds of platform termination grace.
6. Simulate database/provider/SIEM outages. The rate limiter currently falls back
   to per-instance memory when Firestore fails; this is not a global quota under
   failure. Enforce edge quotas and alert on fallback before high-scale release.
7. Verify logs contain no credentials or user document/prompt content; configure
   alert routing, on-call ownership, incident response, and access retention.
8. Require successful Verify CI checks and review on the protected release branch.
   Scan the final container and dependencies; record vulnerability dispositions.
9. Deploy a canary, exercise an authenticated workflow, and confirm rollback to a
   previously verified image before expanding traffic.

## Rollback

Retain the previous immutable image digest and deployment configuration. Shift
traffic back to that revision on elevated failures or isolation regressions.
These runtime changes require no data migration. Do not delete or roll back
Firestore data as part of application rollback. Re-run liveness, authentication,
tenant isolation, and a representative analysis after switching traffic.
