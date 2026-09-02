# FIRE KEEPER Core

**FIRE KEEPER** is the governance layer of the **PUNN Cognitive Architecture (PCA)** — a structured AI decision-intelligence framework designed to improve reasoning validation, evidence traceability, uncertainty handling, and human oversight.

> **Core principle:** AI supports the decision. Humans retain decision authority.

## What is FIRE KEEPER?

FIRE KEEPER is the implementation layer for the governance concepts defined by PUNN Cognitive Architecture. It is designed to make AI-assisted reasoning more **structured, inspectable, evidence-aware, and accountable** rather than treating a language-model response as an unquestioned conclusion.

The repository contains the application, governance components, security controls, audit-oriented mechanisms, and architecture documentation used to develop and evaluate the FIRE KEEPER system.

## PUNN Cognitive Architecture (PCA)

PUNN Cognitive Architecture provides the reasoning framework behind FIRE KEEPER. The architecture defines a **12-stage epistemic reasoning pipeline** that separates context, stakeholders, logic, evidence, competing hypotheses, confidence, vulnerability analysis, recommendation, action planning, reflection, and human approval.

```text
Input / Query
     │
     ▼
1. Context Understanding
     ↓
2. Stakeholder Assessment
     ↓
3. Logical Chain Analysis
     ↓
4. Logical Conflict Identification
     ↓
5. External Anchoring & Standards Verification
     ↓
6. Multi-Hypothesis / ACH Analysis
     ↓
7. Evidence & Confidence Scoring
     ↓
8. Vulnerability Critique
     ↓
9. Strategic Recommendation
     ↓
10. Concrete Action Plan
     ↓
11. Meta-Reflection
     ↓
12. Human Approval Gate
     │
     ▼
Verifiable Decision Output
```

The architecture is described in greater detail in [`WHITEPAPER.md`](WHITEPAPER.md).

## Governance Model

FIRE KEEPER is built around an **evidence-aligned governance model**. A key distinction in the project is:

```text
IMPLEMENTED  ≠  VERIFIED  ≠  CERTIFIED
```

A capability may exist in the codebase without having empirical verification or independent certification. The project therefore uses explicit capability states such as:

- `VERIFIED`
- `IMPLEMENTED`
- `NOT_VERIFIED`
- `NOT_PROVISIONED`
- `THEORETICAL`

This distinction is important for responsible AI engineering and prevents implementation status from being presented as independent validation or formal compliance.

## Evidence & Uncertainty

FIRE KEEPER treats evidence quality and uncertainty as first-class concerns.

The project follows several core epistemic principles:

- **No evidence does not become fact.** Unsupported claims should remain inference or hypothesis.
- **Plausibility is not truth.** A coherent answer still requires verification.
- **Unknowns remain unknowns.** Epistemic gaps and limitations should be made explicit.

Confidence scoring in the current system is treated as a **heuristic evidence score**, not as an empirically calibrated Bayesian posterior unless independently verified by an appropriate benchmark suite.

## Auditability & Security

The repository includes mechanisms and documentation for auditability, sensitive-data handling, and security hardening, including:

- audit-log sanitization and credential redaction
- Firestore security rules
- governance and capability-status metadata
- audit-oriented traceability mechanisms
- security and architecture self-assessment documentation

See [`SECURITY_AUDIT.md`](SECURITY_AUDIT.md) and [`CHANGES.md`](CHANGES.md) for the current security and remediation record.

## Standards & Governance References

The architecture references established AI governance and security frameworks, including:

- ISO/IEC 42001:2023
- NIST AI Risk Management Framework (AI RMF)
- NIST Cybersecurity Framework (CSF)
- NIST incident-response guidance

These references describe **design and governance alignment**. They should not be interpreted as a claim of third-party certification unless certification evidence is explicitly provided.

## Project Structure

Important project documentation includes:

| File | Purpose |
| --- | --- |
| `WHITEPAPER.md` | Architecture and design specification for FIRE KEEPER / PCA |
| `SECURITY_AUDIT.md` | Security and implementation assessment |
| `CHANGES.md` | Remediation, hardening, and verification record |
| `firestore.rules` | Firestore security rules |
| `.env.example` | Environment-variable template |

## Run Locally

### Prerequisites

- Node.js
- A configured Gemini API key for AI functionality
- Firebase configuration where required by the application

### Installation

```bash
npm install
```

Create your local environment configuration from `.env.example` and provide the required values.

### Development

```bash
npm run dev
```

### Build

```bash
npm run build
```

### Start production build

```bash
npm run start
```

### Type-check

```bash
npm run lint
```

## Security Notes

Do not commit API keys, service-account credentials, access tokens, or other secrets to the repository.

The project includes explicit sanitization and access-control measures intended to reduce exposure of sensitive data in audit and operational records. Review the security documentation before deploying the system to a production environment.

## Project Status

FIRE KEEPER is an actively developed research and engineering project. Features and governance mechanisms should be evaluated according to their documented verification status rather than inferred from architectural descriptions alone.

For implementation details and the current evidence-aligned status of capabilities, consult [`CHANGES.md`](CHANGES.md) and [`SECURITY_AUDIT.md`](SECURITY_AUDIT.md).

## Documentation

- [`WHITEPAPER.md`](WHITEPAPER.md) — PUNN Cognitive Architecture & FIRE KEEPER design specification
- [`SECURITY_AUDIT.md`](SECURITY_AUDIT.md) — security assessment and controls
- [`CHANGES.md`](CHANGES.md) — remediation and hardening history
