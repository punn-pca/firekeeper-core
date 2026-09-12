# FIRE KEEPER Core

**English** | [ภาษาไทย](README.th.md)

**FIRE KEEPER** is the governance and decision-intelligence layer of the **PUNN Predictive Cognitive Architecture (PCA)** — a structured AI decision-intelligence framework designed to improve reasoning validation, evidence traceability, uncertainty handling, and human oversight.

> **Core principle:** AI supports the decision. Humans retain decision authority.

---

## What is FIRE KEEPER?

FIRE KEEPER is the implementation layer for the governance concepts defined by PUNN Predictive Cognitive Architecture. It is engineered to make AI-assisted reasoning **structured, inspectable, evidence-aware, and accountable** rather than treating a large language model's raw generation as an unquestioned conclusion.

The repository contains the complete full-stack application: an interactive React workspace, an Express API runtime, governance state machines, cryptographic audit logging, mathematical confidence calibration, and comprehensive regression test suites.

---

## PUNN Predictive Cognitive Architecture (PCA)
PUNN Predictive Cognitive Architecture provides the reasoning framework behind FIRE KEEPER. The architecture defines a **12-stage epistemic reasoning pipeline** that systematically separates context, stakeholders, logic, evidence, competing hypotheses, confidence, vulnerability analysis, recommendation, action planning, reflection, and human approval:

```text
Input / Strategic Decision Query
              │
              ▼
1.  Intent Definition
              ↓
2.  Context Understanding
              ↓
3.  Purpose & Scope
              ↓
4.  Data Structuring
              ↓
5.  Relationship Modeling
              ↓
6.  Hypothesis Formation (ACH)
              ↓
7.  Evidence Evaluation
              ↓
8.  Risk & Critique Analysis
              ↓
9.  Strategic Options
              ↓
10. Analysis Communication
              ↓
11. Review & Verification
              ↓
12. Continuous Improvement
              │
              ▼
  Transparent Decision Intelligence Output
```

For full theoretical foundations and formal specifications, consult [`WHITEPAPER.md`](WHITEPAPER.md) and [`docs/FIRE_KEEPER_SPEC.md`](docs/FIRE_KEEPER_SPEC.md).

---

## Governance Model

FIRE KEEPER enforces an **evidence-aligned governance model** built upon a strict operational distinction:

```text
IMPLEMENTED  ≠  VERIFIED  ≠  CERTIFIED
```

A capability may exist in the codebase without having empirical verification or independent certification. The system therefore enforces explicit, inspectable capability states:

| State | Definition | System Action |
| --- | --- | --- |
| `VERIFIED` / `EMPIRICAL_VERIFIED` | Formally proven via deterministic test suites or empirical evidence | Allowed for high-confidence decisions |
| `IMPLEMENTED` | Code exists and functions, pending empirical benchmark validation | Qualified with epistemic limitation notice |
| `NOT_VERIFIED` | Heuristic evaluation only; unverified external assertions | Confidence capped; warnings displayed |
| `INSUFFICIENT_EVIDENCE` | No authoritative sources or measurable evidence found | Score evaluated as `N/A`; halts autonomous overclaims |
| `THEORETICAL` | Conceptual design or architectural proposal only | Strictly informational |

---

## Calibrated Confidence Engine

FIRE KEEPER treats uncertainty and evidence quality as mathematical first-class concerns:

- **No evidence does not become fact:** Unsupported claims remain inferences or hypotheses.
- **Plausibility is not truth:** Fluent or persuasive language is not a substitute for verified evidence.
- **Unknowns remain unknowns:** Epistemic gaps are explicitly exposed rather than filled with probabilistic guesses.

### Mathematical Scoring Formulation

When verified evidence is present, the Calibrated Confidence Engine computes an empirical score using multi-criteria weighted synthesis:

$$\text{Confidence Score} = \Big( 0.40 \times \text{Coverage} + 0.35 \times \text{Reliability} + 0.25 \times \text{Quality} \Big) - \sum \text{Penalties}$$

- **Weights:** Evidence Coverage (40%), Source Reliability (35%), Content Quality (25%).
- **Penalties:** Missing Information ($-10\%$ per item), Evidence Conflicts ($-15\%$ per contradiction).
- **Invariant Rule:** A score of `null` (`N/A`) is returned whenever evidence is absent or unmeasured, strictly preventing synthetic certainty.

---

## Cryptographic Auditability & Integrity

FIRE KEEPER includes tamper-evident, audit-grade verification mechanisms:

- **Execution Trace Hash Chaining:** Every step in the decision pipeline is hashed sequentially (`eventHash = SHA256(prevHash + stepData)`).
- **Merkle Tree Root Calculation:** Computes a cryptographic Merkle root across all decision steps for verifiable batch anchoring.
- **WORM Ledger Alignment:** Enforces immutable Write-Once-Read-Many logging principles; prevents retroactive history tampering.
- **Sensitive Data Redaction:** Automated audit sanitizer strips API keys, session tokens, passwords, and PII prior to ledger persistence and export.

---

---

## Repository Status

- **Public repository:** FIRE KEEPER Core is publicly available and actively developed.
- **Public API boundary:** No OpenAPI specification or guaranteed public HTTP endpoint names are currently published. See the developer API reference; endpoint paths must not be invented or treated as public contracts unless implemented and versioned.
- **License:** FIRE KEEPER Core is released under the Apache License 2.0. See [`LICENSE`](LICENSE) for the full license terms.
- **Decision Object Schema:** The machine-readable schema is available at docs/developers/decision.schema.json.
- **Security audit:** Security findings and audit material are maintained in SECURITY_AUDIT.md.
- **Implementation status:** FIRE KEEPER Core is an implemented software repository containing executable application code, governance logic, decision contracts, and test suites. The public website primarily communicates architecture and product concepts; the repository contains the implementation layer.
- **Evidence boundary:** Implementation does not automatically mean VERIFIED or CERTIFIED. Capability status must remain explicitly separated according to the evidence available.

## Project Structure

```text
firekeeper-core/
├── docs/                        # Architecture and governance specifications
│   ├── ARCHITECTURE.md          # System architecture and layer breakdown
│   ├── EVIDENCE_MODEL.md        # Epistemic states and evidence lifecycle
│   ├── FIRE_KEEPER_SPEC.md      # Detailed engineering and feature specification
│   ├── GOVERNANCE.md            # Human oversight and capability policies
│   ├── PUBLIC_RELEASE.md        # Release boundary and classification guidelines
│   └── screenshots/             # Interface and specification screenshots
├── public/                      # Static assets, branding, and vector logos
├── scripts/                     # Automated audit, benchmark, and regression test suites
│   ├── testGovernance.ts        # Policy enforcement tests (BLOCK, REVISE, PASS)
│   ├── testConfidenceCalibration.ts # Mathematical formula and weighting tests
│   ├── testAdversarialAudit.ts  # Cryptographic trace and Merkle root tamper tests
│   └── testConversationMerge.ts # Hydration, offline sync, and race condition tests
├── src/
│   ├── components/              # UI components (Workspace, Audit Viewer, ConfidenceCard)
│   ├── context/                 # Application and Conversation state management
│   ├── lib/                     # Firebase client and environment adapters
│   ├── server/                  # Server-side API and governance engines
│   │   ├── middleware/          # Security, auth, and rate-limiting middleware
│   │   └── services/            # PCA engine, AI runtime, verification state machine
│   └── types.ts                 # TypeScript domain definitions
├── server.ts                    # Express backend server entrypoint
├── package.json                 # Project dependencies, scripts, and build pipeline
├── vite.config.ts               # Vite configuration with Tailwind CSS v4
├── SECURITY_AUDIT.md            # Security architecture assessment
├── WHITEPAPER.md                # Theoretical specification of PCA
└── CHANGES.md                   # Remediation and verification change log
```

---

## Run Locally

### Prerequisites

- **Node.js:** v18.0.0 or later (Node.js 20+ recommended)
- **npm:** v9.0.0 or later
- **DeepSeek API Key:** Required for AI execution (`DEEPSEEK_API_KEY`)
- **Firebase Configuration:** Web configuration in `firebase-applet-config.json`

### 1. Installation

```bash
git clone https://github.com/punn-pca/firekeeper-core.git
cd firekeeper-core
npm install
```

### 2. Environment Configuration

Copy `.env.example` to `.env` and provide your configuration:

```bash
cp .env.example .env
```

Key environment variables:

| Variable | Description |
| --- | --- |
| `DEEPSEEK_API_KEY` | DeepSeek API key for `deepseek-chat` and `deepseek-reasoner` models |
| `APP_URL` | Base URL of the hosted application (for callbacks and origins) |
| `FIREKEEPER_ADMIN_PASSWORD` | Optional admin password for administrative diagnostics |
| `ADMIN_UID` | Optional Firebase UID with elevated administrative privileges |
| `SERVICE_SECRET` | Secret token for authorized background worker routines |

### 3. Development Server

Starts the Vite frontend and Express server concurrently in full development mode:

```bash
npm run dev
```

The application will be available at `http://localhost:5173` (or the port specified in terminal output).

### 4. Running the Test Suite

FIRE KEEPER includes 4 automated verification suites covering governance, calibrated confidence, cryptographic security, and multi-session hydration:

```bash
npm test
```

You can also run individual suites:

```bash
# Governance policy enforcement (BLOCK, REVISE, PASS)
npx tsx scripts/testGovernance.ts

# Calibrated confidence mathematical scoring and evidence weighting
npx tsx scripts/testConfidenceCalibration.ts

# Adversarial cryptographic integrity & Merkle root audit
npx tsx scripts/testAdversarialAudit.ts

# Conversation hydration, storage deduplication & race conditions
npx tsx scripts/testConversationMerge.ts
```

### 5. Type-Check & Lint

```bash
npm run lint
```

### 6. Production Build

Builds the optimized frontend bundle via Vite and the backend server bundle via esbuild:

```bash
npm run build
npm run start
```

---

## Standards & Governance Alignment

FIRE KEEPER is designed with alignment to international AI governance and security frameworks:

- **ISO/IEC 42001:2023:** Artificial Intelligence Management System
- **NIST AI Risk Management Framework (AI RMF 1.0):** Governance, Map, Measure, Manage
- **NIST Cybersecurity Framework (CSF 2.0)**
- **RFC 7636:** Proof Key for Code Exchange (PKCE)
- **RFC 3161:** Time-Stamping Protocol for cryptographic ledger events

> *Note: These alignments describe engineering architecture and governance principles. They do not constitute formal third-party certification.*

---

## Documentation Index

- [`README.th.md`](README.th.md) — คู่มือและภาพรวมโครงการฉบับภาษาไทย (Thai Overview)
- [`docs/`](docs/) — Cognitive Architecture & Epistemic Documentation
- [`docs/developers/`](docs/developers/) — Developer Portal, Decision Object & JSON Schema
- [`docs/`](docs/) — เอกสาร Cognitive Architecture และ Epistemic Transparency
- [`docs/developers/`](docs/developers/) — Developer Portal, Decision Object และ JSON Schema
- [`WHITEPAPER.md`](WHITEPAPER.md) — เอกสารทฤษฎีฉบับขยาย
- [`docs/FIRE_KEEPER_SPEC.md`](docs/FIRE_KEEPER_SPEC.md) — Comprehensive technical system specification
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — System layers, lifecycle, and component interactions
- [`docs/EVIDENCE_MODEL.md`](docs/EVIDENCE_MODEL.md) — Epistemic classification and evidence governance
- [`docs/GOVERNANCE.md`](docs/GOVERNANCE.md) — Human-in-the-loop policies and authority boundaries
- [`docs/PUBLIC_RELEASE.md`](docs/PUBLIC_RELEASE.md) — Public release boundaries and security perimeter
- [`SECURITY_AUDIT.md`](SECURITY_AUDIT.md) — Security posture, access controls, and self-assessment
- [`CHANGES.md`](CHANGES.md) — Chronological history of fixes, hardening, and verification
