# FIRE KEEPER — Security Architecture & Production Hardening Assessment (Self-Assessed)

**Document Version:** 3.0.1  
**Target Platform:** FIRE KEEPER (PUNN Cognitive Architecture)  
**Security Standard:** ISO 42001 · NIST AI RMF · NIST SP 800-61 Rev. 3 · RFC 7636 (PKCE) · RFC 3161 (Time-Stamping)  
**Status:** INTERNAL HARDENING COMPLETED (Self-Assessed, Pending Independent Third-Party Audit)

> **Notice:** This document reflects internal development self-assessments and implemented hardening measures. It does not constitute formal independent third-party certification or external audit validation.

---

## 1. Executive Summary

FIRE KEEPER's current security boundary is centered on the active Core runtime: authenticated conversation isolation, account policy enforcement, safe outbound retrieval, governed model invocation, decision approval, and tamper-evident audit records.

The legacy Instagram/X OAuth and autonomous social-publishing TypeScript infrastructure was removed on 1 October 2026 after repository-wide caller inspection found no active product caller. Historical Firestore collections/rules are retained only as migration-sensitive data surfaces and are not evidence that an autonomous publishing runtime is currently active.

Current hardening includes:
- **Zero Hardcoded Secrets:** no default client secrets, access tokens, or admin identifiers in active runtime code.
- **Authentication & Authorization:** Firebase identity verification and server-side ownership/policy boundaries protect hosted resources.
- **Conversation Isolation:** hosted conversation context is server-authoritative after ownership verification; cross-session context is quarantined.
- **Outbound Network Controls:** governed outbound URL policy and CORS controls constrain retrieval/network surfaces.
- **Audit Integrity:** sanitization plus SHA-256 hash-chain/Merkle mechanisms provide tamper evidence; this is not storage-enforced WORM.
- **Human Authority:** approval and governance controls preserve the human decision boundary.

- **Analysis Replay/Quota Boundary:** hosted analysis quota is transactionally reserved only after ownership, entitlement, policy, and attachment validation. Stable request IDs prevent duplicate web-client retries from starting a second logical analysis; post-reservation failures are best-effort closed as `FAILED_CONSUMED`; a simultaneous state-storage failure can prevent that transition.
- **Governed Completion Durability:** Hosted Mode requires the canonical Firestore audit write and required completion bookkeeping before emitting governed `complete`; secondary export/telemetry remains non-authoritative.

---

## 2. Security Posture by Active Subsystem

### 2.1 Authentication, Authorization & Ownership
- Hosted user resources are bound to authenticated identities.
- Conversation ownership is checked server-side before persisted history becomes authoritative.
- Foreign or mismatched conversation context is isolated rather than trusted.
- Administrative and account policy checks are server-side boundaries; client assertions are not authoritative.

### 2.2 Prompt & Context Boundary
- Hosted persisted turns override modified client history after ownership verification.
- New conversations begin without inherited history/compressed context.
- Prompt telemetry records size estimates and source metadata only; prompt text is not emitted in telemetry.
- The conversation/prompt boundary regression is part of `npm test` and `npm run test:security`.

### 2.3 Network & Retrieval
- Outbound URL policy protects custom/provider retrieval paths from unsafe targets.
- CORS policy is explicitly tested.
- Retrieval evidence remains subject to evidence status and governance checks; successful retrieval does not itself mean verification.

### 2.4 Audit & Decision Governance
- Audit payloads are sanitized before persistence/export.
- Hash chaining and Merkle-root mechanisms provide tamper-evident integrity checks.
- Human approval remains a separate governance boundary and is not replaced by model confidence.

### 2.5 Retired / Historical Security Surfaces
The following controls described by earlier revisions are **not current active-runtime claims**:
- Instagram/X OAuth PKCE state infrastructure.
- Autonomous social-publishing worker state and publishing pipeline.
- Social publishing pacing/concurrency controls tied to that retired runtime.

Historical Firestore rules/collections such as `autonomous_state` and `ticks` remain until an explicit data-migration decision. Their presence must not be interpreted as an active product capability.

---

## 3. Cryptographic Verification & Audit Trail

| Subsystem | Standard | Implementation |
| :--- | :--- | :--- |
| **Token Verification** | JWT / JWKS | Google X.509 RSA-SHA256 |
| **Audit Log Packaging** | WORM Ledger | SHA-256 Content-Addressed Hash Chain |
| **Report Verification** | EDAR v2.1 | Canonical HTML Normalization & RSA-PSS |

---

## 4. Verification Checkpoint Status

- [x] AUTH: Hosted identity/ownership boundaries are enforced server-side.
- [x] CONTEXT: Cross-session history/compressed context is quarantined.
- [x] HISTORY: Persisted hosted conversation history is server-authoritative.
- [x] TELEMETRY: Prompt telemetry excludes prompt content and is regression-tested.
- [x] NET: Outbound URL and CORS policies have regression coverage.
- [x] AUDIT: Tamper-evident audit integrity and sanitization remain covered.
- [x] HUMAN: Decision approval/human authority remains an explicit governance boundary.
- [~] LEGACY DATA: Historical autonomous/social Firestore collections remain pending an explicit migration decision.
