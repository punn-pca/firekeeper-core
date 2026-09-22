# Data Retention Policy

## Scope

This policy applies to Hosted Mode. Offline Mode keeps conversations, memory, and settings on the user's device and does not write them to the hosted Firestore database.

## Default retention

| Record | Default | Environment variable | Storage |
| --- | ---: | --- | --- |
| Conversations | 30 days | `CONVERSATION_RETENTION_DAYS` | Firestore + short-lived in-memory cache |
| User memories | 90 days | `MEMORY_RETENTION_DAYS` | Firestore + short-lived in-memory cache |
| Decision and PCA audit logs | 365 days | `AUDIT_LOG_RETENTION_DAYS` | Firestore |

The server writes an `expiresAt` timestamp to new hosted records. Expired conversations and memories are excluded and lazily deleted when read.

## Firestore TTL requirement

Enable a Firestore TTL policy on the `expiresAt` field for these collection groups:

- `conversations`
- `memories`
- `decision_audits`
- `pca_audit_logs`

Firestore TTL deletion is asynchronous. The application must continue to treat any record past `expiresAt` as expired even if physical deletion has not completed.

## User deletion

Authenticated users can delete their conversations and memories through the existing API/UI. Application deletion removes the hosted Firestore record and the current instance's in-memory cache entry.

## BYOK keys

BYOK API keys are not written to Firestore, audit logs, or server disk. They are read from the authenticated request only for the provider call. The request property is deleted and mutable bindings are released in `finally` blocks. Because JavaScript strings are immutable and garbage collection is nondeterministic, the system does not claim cryptographic memory zeroization.

## Operational notes

Changing retention environment variables affects newly written records. Existing records retain their previously assigned `expiresAt` value unless migrated. Legal holds and backups require a separate documented process.
