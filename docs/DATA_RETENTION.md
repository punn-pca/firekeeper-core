# Data Retention Policy

## Scope

This policy applies to Hosted Mode. Offline Mode keeps conversations, memory, and settings on the user's device and does not write them to the hosted Firestore database.

## Default retention

| Record | Default | Environment variable | Storage |
| --- | ---: | --- | --- |
| Conversations | Plan lifetime below | `CONVERSATION_RETENTION_DAYS` for Enterprise fallback | Firestore + instance-local cache |
| User memories | 90 days | `MEMORY_RETENTION_DAYS` | Firestore + short-lived in-memory cache |
| Decision/PCA audit logs and isolation events | Plan lifetime below | `AUDIT_LOG_RETENTION_DAYS` for Enterprise fallback | Firestore |

The server writes an `expiresAt` timestamp to newly saved hosted records. Conversations and audit records use Free 7 days, Starter 30 days, Professional 365 days, Team 90 days, and Business 365 days. Memory has a separate 90-day deployment default. Enterprise uses finite deployment defaults (conversation 30 days and audit 365 days) until its contractual retention is configured; `retentionDays: 0` does not automatically mean unlimited storage.

Expired conversations and memories are excluded when read. Conversation physical deletion uses Firestore TTL rather than deleting an old snapshot that may have been refreshed concurrently. Memory reads also attempt lazy deletion. Audit-list endpoints exclude expired records. `/api/account/plan` returns the effective `retention` values per resource.

## Firestore TTL requirement

Enable a Firestore TTL policy on the `expiresAt` field for these collection groups:

- `conversations`
- `memories`
- `decision_audits`
- `pca_audit_logs`
- `security_events`

Firestore TTL deletion is asynchronous. The application must continue to treat any record past `expiresAt` as expired even if physical deletion has not completed.

## User deletion

Authenticated users can delete their conversations and memories through the existing API/UI. Application deletion removes the hosted Firestore record and the current instance's in-memory cache entry.

## BYOK keys

BYOK API keys are not written to Firestore, audit logs, or server disk. They are read from the authenticated request only for the provider call. The request property is deleted and mutable bindings are released in `finally` blocks. Because JavaScript strings are immutable and garbage collection is nondeterministic, the system does not claim cryptographic memory zeroization.

## Operational notes

Plan changes affect newly saved conversations and newly created audit events. Existing records retain their previously assigned `expiresAt` value unless migrated. Deployment variables govern memory and Enterprise fallback lifetimes. Legal holds and backups require a separate documented process.
