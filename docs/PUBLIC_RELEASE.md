# FIRE KEEPER — Public Release & Security Boundary Specification

**Specification Version:** 1.0  
**Classification:** Public Release Specification  
**Architecture:** PUNN Cognitive Architecture (PCA) / FIRE KEEPER Core  
**Date:** September 2026

---

## 1. Overview & Purpose

This document defines the boundary, public structure, security policies, and excluded components for the public release of **FIRE KEEPER Core**.

FIRE KEEPER is an open research, engineering, and decision-intelligence platform built on the **PUNN Cognitive Architecture (PCA)**. It provides structured 12-stage epistemic reasoning, evidence classification, risk critique, and human-in-the-loop decision governance.

> **Core Principle:** AI supports the decision. Humans retain decision authority.

---

## 2. Release Scope & Asset Classification

The repository is divided strictly into public and private/excluded classifications.

```text
┌─────────────────────────────────────────────────────────────┐
│                    FIRE KEEPER REPOSITORY                   │
├──────────────────────────────┬──────────────────────────────┤
│         PUBLIC ASSETS        │      EXCLUDED / PRIVATE      │
│                              │                              │
│ • Source Code (React/Express)│ • API Keys & Secrets         │
│ • Architecture Documentation │ • .env / Local Configurations│
│ • Whitepaper & Governance    │ • .data/ Runtime State       │
│ • Evidence & Decision Models │ • Ticks Logs (*.jsonl)       │
│ • Public Branding & UI Assets│ • User Personal Data         │
│ • .env.example (Placeholders)│ • Internal Service Accounts  │
└──────────────────────────────┴──────────────────────────────┘
```

### 2.1 What is Public (Included in Repository)

The public release contains:

- **Core Application Source Code**:
  - React 18 + Vite frontend interface
  - Express backend server and streaming SSE pipeline
  - 12-stage PCA epistemic engine implementation
  - Evidence classification and dynamic ACH (Analysis of Competing Hypotheses) modules
  - Audit log sanitization and export utilities
- **Canonical Architecture & Governance Specifications**:
  - `README.md` — Product and executive overview
  - `WHITEPAPER.md` — Canonical architecture and theoretical design specification
  - `CHANGES.md` — Hardening, remediation, and verification history
  - `SECURITY_AUDIT.md` — Security posture and self-assessment
  - `docs/FIRE_KEEPER_SPEC.md` — Product and system requirements
  - `docs/ARCHITECTURE.md` — System architecture specification
  - `docs/EVIDENCE_MODEL.md` — Epistemic states and evidence lifecycle
  - `docs/GOVERNANCE.md` — AI governance and human oversight policies
  - `docs/PUBLIC_RELEASE.md` — This release and security boundary specification
- **Public Assets & Configuration**:
  - Public UI screenshots (`docs/screenshots/`)
  - Icons, favicons, and vector branding (`public/`)
  - Web client Firebase configuration (`firebase-applet-config.json`)
  - Firestore security rules (`firestore.rules`)
  - Environment variable template with empty placeholders (`.env.example`)

### 2.2 What is Intentionally Excluded (Never in Public Release)

The following items are permanently excluded via `.gitignore` and must never be committed to the repository:

- **API Keys & Credentials**:
  - `DEEPSEEK_API_KEY` (Primary execution engine under DEEPSEEK_ONLY policy)
  - `GEMINI_API_KEY` (Optional / legacy)
  - `OPENAI_API_KEY` (Optional fallback, currently inactive under DEEPSEEK_ONLY policy)
  - `X_CLIENT_ID`, `X_CLIENT_SECRET`, `X_API_KEY`, `X_API_SECRET`, `X_ACCESS_TOKEN`, `X_ACCESS_SECRET`
  - `FIREKEEPER_ADMIN_PASSWORD`
  - `SERVICE_SECRET`
  - `ADMIN_UID`
- **Runtime-Generated & Operational State**:
  - `.data/` directory and subdirectories
  - `autonomous_state.json`
  - `ticks.jsonl`
  - System runtime logs (`*.log`, `logs/`)
- **Private Data & Internal Infrastructure**:
  - User records, personal emails, personal UIDs
  - Firebase Admin service-account private keys (`*.json`, `*.pem`, `*.p12`)
  - Production database connection strings or credentials

---

## 3. Security Boundary & Credential Handling

### 3.1 Zero Hardcoded Secrets Policy

- No secret, token, password, or private key is embedded in any source file, template, or documentation.
- All secrets are injected strictly via environment variables at runtime (`process.env`) or managed through secret stores (e.g., Google Cloud Secret Manager / AI Studio Secrets).
- In-memory state objects never serialize or persist authentication secrets to disk or cloud databases.

### 3.2 Audit Log Sanitization

All telemetry, audit exports, and execution traces pass through `sanitizeAuditPayload()` to redact any occurrence of keys matching sensitive patterns (passwords, tokens, API keys, secrets, authorization headers).

### 3.3 Role-Based Access Control & Rules

- Protected endpoints require cryptographically verified Firebase ID tokens (verified against Google X.509 certificates).
- Administrative capabilities require explicit role claims (`admin: true`), document-based admin registry checks, or `ADMIN_UID` environment configuration.
- Firestore security rules (`firestore.rules`) enforce a default-deny posture and strict user data isolation.

---

## 4. Implementation vs. Verification Distinction

FIRE KEEPER adheres strictly to an evidence-aligned capability model:

```text
IMPLEMENTED ≠ VERIFIED ≠ CERTIFIED
```

| State | Definition | Public Interpretation |
| :--- | :--- | :--- |
| `THEORETICAL` | Conceptual or algorithmic model described in whitepaper | Research concept; not implemented |
| `IMPLEMENTED` | Executable code exists in the repository | Functional in codebase; pending empirical benchmark |
| `VERIFIED` | Validated by empirical tests, benchmarks, or operational trials | Evidence-supported capability |
| `CERTIFIED` | Independently audited and certified by an accredited third party | Only claimed when formal third-party certification exists |

References in the documentation to standards (such as **ISO/IEC 42001**, **NIST AI RMF**, **NIST CSF**, **NIST SP 800-61**) describe **design alignment and governance targets**, not third-party compliance certificates.

---

## 5. Compromised Credential Handling & Incident Policy

In accordance with security best practices:

1. Any credential previously present in local runtime artifacts (`.data/autonomous_state.json`) is treated as **COMPROMISED**.
2. Compromised credentials must be revoked and rotated immediately in the respective provider console (e.g., X Developer Portal).
3. The public codebase contains no references, backups, or residue of compromised credentials.

---

## 6. Pre-Publish Checklist for Contributors

Before pushing changes to a public repository:

- [ ] `.env` and `.env.*` files are excluded from Git (`git status` confirms untracked).
- [ ] `.data/` directory does not exist or is ignored by `.gitignore`.
- [ ] No API keys, tokens, or passwords are hardcoded in source code or documentation.
- [ ] `.env.example` contains only empty string placeholders or descriptive guidance.
- [ ] `npm run lint` (`tsc --noEmit`) passes with zero errors.
- [ ] `npm run build` succeeds cleanly.
