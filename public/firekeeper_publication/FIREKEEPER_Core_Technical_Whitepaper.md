# FIREKEEPER Core — Technical Product Whitepaper & Founder Architecture Report

**Version:** 2.0 — Two-Repository Edition  
**Project inception:** 1 February 2026 (founder-declared; not a verified Git commit date)  
**Assessment date:** 22 September 2026  
**Product stage:** Working MVP; not independently certified.

> AI assists. PUNN creates. Human agency remains the governing principle.

## Executive summary

FIREKEEPER Core grew from the PUNN Cognitive Architecture (PCA) concept into an application for structured AI decision support, evidence assessment, uncertainty handling and human oversight. The project timeline begins with concept development on 1 February 2026 as declared by its creator, including work before the first repository. The repository dates and actual working hours must be verified separately.

## 1. The two repositories and their roles

**[PUNN Cognitive Architecture](https://github.com/punn-pca/punn-cognitive-architecture)** describes a cognitive layer for local LLMs, organizing observation, understanding, purpose, memory, mental models, hypotheses, evidence, critique, decision, communication, reflection and learning. Its README describes intended benefits; these should not be represented as independently benchmarked outcomes. Its repository LICENSE is MIT.

**[FIREKEEPER Core](https://github.com/punn-pca/firekeeper-core)** is the application implementation: a React workspace and Express backend with PCA governance workflows, evidence states, confidence assessment, audit functionality and tests. Its repository LICENSE is Apache-2.0. A conceptual lineage between the projects does not by itself prove file-level code ancestry.

## 2. Architecture and governance

Human user → FIREKEEPER workspace → application/session layer → PCA governance and orchestration → model/provider layer → structured decision-support output → human review and final decision.

FIREKEEPER Core documents a 12-stage application pipeline: Intent Definition; Context Understanding; Purpose & Scope; Data Structuring; Relationship Modeling; Hypothesis Formation (ACH); Evidence Evaluation; Risk & Critique Analysis; Strategic Options; Analysis Communication; Review & Verification; Continuous Improvement. Twelve stages do **not** imply twelve LLM calls.

**Implemented ≠ Tested ≠ Verified ≠ Production Verified ≠ Certified.** A feature described in source code or documentation is not, by that fact alone, independently verified in the currently deployed revision.

## 3. Evidence, confidence and audit

The project distinguishes evidence-backed statements from hypotheses, inferences and insufficient evidence. Its documented confidence rubric is `C = 0.40 × coverage + 0.35 × reliability + 0.25 × quality − penalties`, with `N/A` where evidence is insufficient. This rubric is not a calibrated probability of correctness without empirical calibration. Hash chaining and Merkle roots can support tamper-evidence but do not make the entire storage system tamper-proof.

## 4. Persistence and security boundaries

Offline Mode stores conversations, memory and settings locally according to the project documentation. Hosted Mode persists conversation, memory and audit records in the backend and must **not** be described as zero-persistence. BYOK keys stored in browser localStorage require appropriate browser and backend threat-model considerations. Source-level controls, tests and actual production security are separate claims; this report does not certify the deployed revision.

## 5. Development history and founder contribution

The founder-declared inception date is **1 February 2026**. Cost and effort accounting should include: (1) pre-repository concept formation; (2) PCA architecture and documentation; (3) FIREKEEPER application implementation; (4) testing, security remediation, deployment and documentation. Calendar duration is not the same as actual working hours. AI-assisted coding can reduce cash expenditure but does not eliminate the founder's design, review, decision and verification work.

## 6. Financial assessment: separate cost from value

| Category | Meaning | Evidence status |
| --- | --- | --- |
| Actual cash cost | Cash actually paid for AI tools, API, cloud, domains and other direct expenses since 1 February 2026 | Not established; requires receipts and billing records |
| Founder time cost | Actual working hours × explicitly stated valuation rate | Not established; no complete time log |
| Economic development cost | Actual cash cost + separately assessed founder time cost | Not established |
| Replacement cost | Budget to build a comparable, specified MVP today | Requires scope and independent quotes; not a valuation |
| Technology asset value | Value of defined technology/IP rights and transferability | Not established |
| Business valuation | Value of an operating business, informed by customers, revenue and economics | Not established |

The previously discussed three-month cash scenario of THB 2,800–13,000 **is not the project's actual cash cost** and must not be presented as such. For sensitivity analysis only, 234 calendar days inclusive from 1 February through 22 September 2026 at an assumed 1–4 working hours/day implies 234–936 hours; this is **not a time log**. At assumed THB 300–500/hour, illustrative time costs span THB 70,200–468,000, **not verified expenditure or an asset valuation**. The previously discussed THB 10,000–50,000 DIY and THB 100,000–350,000 contracted replacement budgets are unverified planning scenarios, not market quotations.

Open-source licensing, maintainability, verification, rights, customer demand and commercial economics must be considered before assigning technology or business value. Working MVP ≠ commercial validation.

## 7. Verification roadmap

Record the earliest dated concept artifacts and first commits in both repositories; reconcile actual invoices and cloud credits; estimate actual working hours by phase; run and archive tests against named commits and deployed revisions; verify authentication, SSRF, CORS, logs and persistence end to end; conduct reproducible decision-quality comparisons; collect real usage and commercial evidence.

## Evidence and limitations

Primary project sources: [PCA README](https://github.com/punn-pca/punn-cognitive-architecture/blob/main/README.md), [FIREKEEPER README](https://github.com/punn-pca/firekeeper-core/blob/main/README.md), [FIREKEEPER technical specification](https://github.com/punn-pca/firekeeper-core/blob/main/WHITEPAPER.md). This is a founder-architecture and product overview, **not** a complete file-by-file code audit, a current production verification, a security certification or a formal valuation.
