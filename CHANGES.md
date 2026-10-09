# FIREKEEPER PCA — REMEDIATION & SECURITY HARDENING CHANGES.md

**Date:** August 22, 2026  
**Project:** Firekeeper PCA (PUNN Cognitive Architecture v3.0)  
**Status:** Successfully Completed & Verified (Evidence-Aligned Remediation)

---

## Executive Summary of Changes

In accordance with the **Evidence-Aligned Remediation** directive and security hardening requirements, the Firekeeper PCA codebase has undergone a complete audit and structural adjustment to ensure absolute alignment between claims, UI metrics, governance models, and actual codebase implementation (`IMPLEMENTED ≠ VERIFIED`).

---

## Summary of Remediation Items

1. **Firestore Security Hardening (`/firestore.rules`)**:
   - Restricted write access to `daily_stats` and operational metrics to admin/server identities only.
   - Restricted read access to the `admins` registry collection to authorized administrative users only.

2. **Confidence Calibration & Evidence Integrity (`evidenceGovernance.ts`, `ConfidenceCalibrationViewer.tsx`)**:
   - Replaced unverified Expected Calibration Error (ECE) and Brier Score placeholders with `null` and marked `calibrationStatus` as `NOT_VERIFIED`.
   - Added explicit documentation and UI disclosures noting that ECE and Brier metrics are theoretical / pending empirical benchmark suite execution.
   - Clarified that confidence scores are heuristic evidence scores rather than true empirically calibrated Bayesian posteriors.

3. **Capability Status Model & Metadata (`CapabilityStatusPanel.tsx`)**:
   - Created a dedicated `CapabilityStatusPanel` component implementing the standardized status model: `VERIFIED`, `IMPLEMENTED`, `NOT_VERIFIED`, `NOT_PROVISIONED`, and `THEORETICAL`.
   - Provided explicit evidence metadata (source files, verification level, and limitations) for all system capabilities (Firebase Auth, RBAC, Governance Gate, Autonomous Worker, LTM, WORM storage, RFC 3161, ISO 42001).

4. **Whitepaper & Architecture Alignment (`whitepaperData.ts`, `PCAFrameworkInfo.tsx`, `SECURITY_AUDIT.md`)**:
   - Updated technical documentation and self-assessment records to distinguish between implemented features and third-party certified compliance.
   - Clarified that ISO 42001 and NIST RMF alignment represent design reference principles rather than formal external third-party certification.

5. **Audit Sanitization & Sensitive Data Redaction (`auditSanitizer.ts`)**:
   - Ensured robust deep-sanitization of audit logs to redact API keys, tokens, and credentials before serialization or export.

---

## Verification & Testing
- **Linter & Build Validation**: Executed compilation and build verification (`npm run build`). The application compiles successfully into standalone production artifacts.

---

## October 2026: Dual-Mode Architecture & Documentation Parity

**Status:** Completed & 100% Regression Verified

1. **Dual-Mode Core Pipeline (`server.ts`, `normalChatService.ts`)**:
   - Implemented Option B: Two Independent Execution Paths on One Platform.
   - Built standalone `normalChatService.ts` connecting directly to `callUnifiedLlmContent`, bypassing PCA 12 stages, epistemic tags, Bayesian ACH, and adversarial verification.
   - Mode router in `/api/pca/stream` strictly defaults to `'governed'`.
   - Distinct audit targets: Operational logging in `chat_logs` vs durable cryptographic hash chain in `pca_audit_logs`.
   - Rate limit, request quota, and security boundary uniformly enforced across both modes.

2. **Web & Mobile Parity (`LandingPage.tsx`, `Chatข้อมูลนำเข้า.tsx`, `MessageBubble.tsx`, `MobileComposer.tsx`, `ChatSettingsModal.tsx`)**:
   - Added Dual-Mode switchers across Web toolbar and Mobile app (toolbar quick toggle + settings modal).
   - Displayed distinctive mode badges (`⚡ Normal` vs `🛡️ Governed`) on message bubbles and selectively gate PCA trace dashboard.
   - Updated Landing Page (`LandingPage.tsx`), Hero Welcome card, and Getting Started Guide with the new Dual-Mode capability.

3. **Documentation Alignment Across Entire Repository**:
   - Aligned `README.md`, `README.th.md`, `docs/ARCHITECTURE.md`, `WHITEPAPER.md`, `ARCHITECTURE_ARTICLE_TH.md`, and `mobile/README.md`.

4. **Automated Isolation & Regression Testing**:
   - Added `scripts/testDualModeIsolation.ts` (100% pass) and updated full test suite to 51 regression test suites.
