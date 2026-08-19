# FIRE KEEPER — Security Architecture & Production Hardening Audit

**Document Version:** 3.0.0  
**Target Platform:** FIRE KEEPER (PUNN Cognitive Architecture)  
**Security Standard:** ISO 42001 · NIST AI RMF · RFC 7636 (PKCE) · RFC 3161 (Time-Stamping)  
**Status:** FULL HARDENING COMPLETED (Non-Destructive Patch)

---

## 1. Executive Summary

FIRE KEEPER has completed a comprehensive, non-destructive security hardening pass across all system layers. The hardening strictly enforces:
- **Zero Hardcoded Secrets**: Complete elimination of client secrets, access tokens, and admin identifiers from default codebase fallbacks.
- **Fail-Closed Authentication & RBAC**: Real RSA-SHA256 signature verification of Firebase ID tokens against Google public JWKS, centralized admin whitelist validation, and denial of pseudo-tokens.
- **OAuth 2.0 PKCE & CSRF Defense**: RFC 7636 compliant S256 code challenge, server-side memory state store with 15-minute TTL, strict redirect validation, and token refresh isolation.
- **Autonomous Worker & Atomic Publishing Guard**: Hardened sequence of `AUTH → GOVERNANCE POLICY → DUPLICATE GUARD → PACING LOCK → AUDIT LEDGER → PUBLISH`.
- **DoS & Input Flood Protection**: Scoped rate-limiting partitions (Authentication, Publishing, and General) with strict CORS whitelist enforcement and HSTS/CSP headers.

---

## 2. Security Posture by Subsystem

### 2.1. Authentication & Token Verification (AUTH-01 to AUTH-06)
- **Token Verification Mechanism**:
  - Validates full Firebase ID tokens (JWT format with header, payload, and signature).
  - Fetches Google X.509 certificates from `https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com`.
  - Verifies signature using RSA-SHA256 (`crypto.createVerify('RSA-SHA256')`).
  - Checks issuer (`https://securetoken.google.com/<PROJECT_ID>`), audience, expiration (`exp`), and issued-at (`iat`).
- **Pseudo-Token Rejection**: Blocks all mock tokens (`mock-`, `fake-`, `dummy-`, `test-token`, `token-123`, `admin-token`) from bypassing authentication.
- **Service Secret Authentication**: `/api/autonomous/tick` and service routes require exact matching of `process.env.SERVICE_SECRET` (no hardcoded fallbacks).

### 2.2. Role-Based Access Control (RBAC-01 to RBAC-04)
- **Centralized Admin Validation**: Admin permissions are exclusively evaluated through `isUserAdmin(decodedToken)`.
- **Admin Verification Criteria**:
  1. UID is present in `ADMIN_WHITELIST_UIDS` (from `process.env.ADMIN_UID`).
  2. Token contains `admin: true` or `role: 'admin'` in custom claims.
  3. User email is listed in `ADMIN_WHITELIST_EMAILS` (if configured).
- **Protected Administrative Endpoints**:
  - `/api/x/oauth/initiate` (requireAuth, requireAdmin)
  - `/api/x/oauth/exchange` (requireAuth, requireAdmin)
  - `/api/x/configure` (requireAuth, requireAdmin)
  - `/api/x/disconnect` (requireAuth, requireAdmin)
  - `/api/x/publish` (requireAuth, requireAdmin, publishRateLimiter, concurrencyLock)
  - `/api/autonomous/config` (requireAuth, requireAdmin)
  - `/api/autonomous/tick` (requireAuth, requireAdmin)

### 2.3. OAuth 2.0 Security & Token Handling (OAUTH-01 to OAUTH-05)
- **PKCE Implementation**: Standard RFC 7636 S256 with 32-byte cryptographic random verifiers (`crypto.randomBytes(32).toString('base64url')`).
- **State Store & CSRF**: Stored in a server-side `oauthStateStore` Map with 15-minute expiration and atomic single-use deletion on exchange.
- **Zero Token Leakage**:
  - Sensitive tokens (`x_access_token`, `x_refresh_token`, `x_api_secret`, `x_access_secret`) are strictly omitted from `/status` and `/api/autonomous/status` via `getSanitizedState()`.
  - Responses return connection status, username, and token expiration timestamps only.

### 2.4. Autonomous Publishing & Concurrency Guard (PUB-01 to PUB-05)
- **Atomic Concurrency Mutex**: `isPublishingInProgress` prevents concurrent race conditions across simultaneous autonomous ticks and manual publish calls.
- **6-Hour Minimum Post Interval**: Strict time difference check (`persistentState.last_post_at`) prevents pacing violations.
- **Daily Quota Ceiling**: Hard limit of 3 posts per rolling 24 hours (`persistentState.daily_post_limit`).
- **Duplicate Prevention Gate**:
  - Exact SHA-256 normalized hash deduplication (`executedContentHashes`).
  - Semantic Jaccard similarity evaluation against recent posts (threshold: 38%).
- **Governance Policy Pre-flight**: Evaluates system boundaries (Human Agency, IP Firewall, Distribution Ethics) before any API network request is dispatched.

### 2.5. Network, Headers & DoS Defense (NET-01 to NET-05)
- **Granular Rate Limiting**:
  - General API: 120 requests / 60 seconds
  - Authentication Endpoints: 15 requests / 60 seconds
  - Publishing & OAuth Endpoints: 10 requests / 60 seconds
- **Strict CORS Origin Validation**:
  - Allows verified origins matching `localhost`, `*.run.app`, `*.google.com`, and `firekeeper.site`.
  - Blocks wildcard reflections on authenticated endpoints.
- **Security Headers**:
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: SAMEORIGIN`
  - `Strict-Transport-Security: max-age=31536000; includeSubDomains`
  - `Referrer-Policy: strict-origin-when-cross-origin`

---

## 3. Cryptographic Verification & Audit Trail

| Subsystem | Standard | Implementation |
| :--- | :--- | :--- |
| **Token Verification** | JWT / JWKS | Google X.509 RSA-SHA256 |
| **Audit Log Packaging** | WORM Ledger | SHA-256 Content-Addressed Hash Chain |
| **OAuth 2.0 PKCE** | RFC 7636 | SHA-256 Code Challenge (S256) |
| **Report Verification** | EDAR v2.1 | Canonical HTML Normalization & RSA-PSS |

---

## 4. Verification Checkpoint Status

- [x] AUTH-01: Real Firebase token signature verification enforced.
- [x] AUTH-02: Pseudo/mock tokens blocked from authentication.
- [x] AUTH-03: Zero hardcoded API keys or fallback secrets in codebase.
- [x] RBAC-01: Centralized `isUserAdmin` validation across all administrative routes.
- [x] RBAC-02: Autonomous configuration endpoints secured with authentication & admin guards.
- [x] OAUTH-01: RFC 7636 PKCE S256 and single-use CSRF state store active.
- [x] OAUTH-02: Tokens sanitized from all client-facing state payloads.
- [x] PUB-01: Atomic `AUTH → GOVERNANCE → DUPLICATE GUARD → PACING → PUBLISH` pipeline enforced.
- [x] PUB-02: Concurrency mutex locking active for publishing operations.
- [x] NET-01: Strict CORS allowlist and granular rate limiting active.
