# FIRE KEEPER — Product & System Specification

**Specification:** FIRE KEEPER Product & System Specification v1.0  
**Architecture:** PUNN Predictive Cognitive Architecture (PUNN Predictive Cognitive Architecture (PCA))  
**Classification:** Enterprise Decision Intelligence & AI Governance  
**Status:** Active Development  
**Date:** September 2026

---

## 1. Purpose

FIRE KEEPER is an enterprise decision-intelligence and AI governance platform designed to help organizations analyze complex information, evaluate evidence and risk, structure strategic reasoning, and support high-confidence decisions while preserving human decision authority.

FIRE KEEPER is the governance and application layer operating on top of the **PUNN Predictive Cognitive Architecture (PCA) (PCA)**.

> **Core principle:** AI supports the decision. Humans retain decision authority.

---

## 2. System Identity

| Layer | Definition |
| --- | --- |
| **PUNN** | Architectural creator / originating intelligence framework |
| **PUNN PUNN Predictive Cognitive Architecture (PCA)** | Underlying cognitive and epistemic architecture |
| **FIRE KEEPER** | Enterprise decision-intelligence and AI governance platform |
| **FIRE KEEPER Core** | Implementation, governance, security, audit, and application layer |
| **Human Decision Maker** | Final authority for consequential decisions |

### 2.1 Architectural Relationship

```text
PUNN
  │
  ▼
PUNN Predictive Cognitive Architecture (PCA) (PUNN Predictive Cognitive Architecture (PCA))
  │
  │  12-Stage Epistemic Reasoning
  │  Evidence / Uncertainty / Risk
  │  Human Agency / Governance
  ▼
FIRE KEEPER
  │
  ├── Decision Intelligence Interface
  ├── Evidence & Reasoning Controls
  ├── Risk & Scenario Analysis
  ├── Governance Checks
  ├── Audit & Traceability
  └── Human Decision Gate
```

---

## 3. Product Scope

FIRE KEEPER is designed to provide the following capabilities:

1. Strategic decision analysis
2. Evidence synthesis and epistemic classification
3. Competing-hypothesis analysis (ACH)
4. Risk and adversarial critique
5. Scenario intelligence
6. Governance and policy checks
7. Confidence and uncertainty handling
8. Cryptographic/audit-oriented traceability
9. Human-in-the-loop decision approval
10. Structured action planning
11. Decision history and operational traceability
12. Architecture and capability-status visibility

---

## 4. Product Interface Specification

The product interface is organized around four principal surfaces.

### 4.1 Executive Decision Intelligence Landing Surface

**Reference:** `docs/screenshots/firekeeper-home.jpeg`

The landing interface communicates the product identity and primary value proposition.

Required elements:

- FIRE KEEPER product identity
- Enterprise Executive Decision Intelligence positioning
- AI governance positioning
- Relationship to PUNN Predictive Cognitive Architecture (PCA)
- Example reasoning / cognitive trace
- 12-stage pipeline indicator
- Capability/status indicators
- Primary entry point to the workspace

**Objective:** establish FIRE KEEPER as a functioning enterprise product rather than a source-code-only project.

### 4.2 Decision Intelligence Workspace

**Reference:** `docs/screenshots/firekeeper-workspace.jpeg`

The workspace is the primary operational interface.

Required functional areas:

- System Overview
- Architecture status
- Stage readiness
- Knowledge-base status
- Integrity status
- Recent Activity
- Quick Examples
- Strategic Analysis
- Evidence Synthesis
- Risk & Impact Assessment
- Scenario Intelligence
- Governance Check
- Trusted Intelligence indicators
- Transparent Process indicators
- Human-Centered controls
- Decision input / execution interface

### 4.3 Founder & Intellectual Lineage

**Reference:** `docs/screenshots/punn-firekeeper-about.jpeg`

This surface documents the relationship between the originating philosophy, founder identity, FIRE KEEPER, and PCA.

Required conceptual entities:

```text
PUNN
  → Firekeeper Theory
  → FIRE KEEPER
  → PUNN Predictive Cognitive Architecture (PCA)
```

This page is informational and must not be represented as a technical capability claim.

### 4.4 Canonical PCA Specification

**Reference:** `docs/screenshots/pca-specification.jpeg`

This surface documents the canonical architecture and its reasoning model.

Required sections include:

- Canonical Definition
- Entity Hierarchy
- 12 Canonical Stages
- Epistemic Evidence Taxonomy
- Mathematical / Epistemic Formulations
- Enterprise Governance & Standards Alignment
- Canonical Citation & Attribution

---

## 5. PCA 12-Stage Processing Model

FIRE KEEPER uses the PUNN Predictive Cognitive Architecture (PCA) 12-stage model as its canonical reasoning structure.

The [`ExecutionStepStageKey`](../src/types.ts) union defines the 12 PCA runtime stage identifiers. The orchestration in [`server.ts`](../server.ts) uses the same identifiers for stages 1–12 and adds conditional governance stage 9.5 (`DECISION_GOVERNANCE`) outside that 12-stage set. The following table records runtime execution order separately from the displayed stage number; it is not a claim that each row executes for every request.

| Execution order | Stage number shown by runtime | Runtime stage key / label | Canonical type counterpart | Execution notes |
| --- | --- | --- | --- | --- |
| 1 | 1 | `INTENT_DEFINITION` — Intent Definition | `INTENT_DEFINITION` | Records input observations. |
| 2 | 2 | `CONTEXT_UNDERSTANDING` — Context Understanding | `CONTEXT_UNDERSTANDING` | Current implementation assigns a fixed understanding string. |
| 3 | 3 | `PURPOSE_SCOPE` — Purpose & Scope | `PURPOSE_SCOPE` | Sets purpose and human-agency constraints. |
| 4 | 4 | `DATA_STRUCTURING` — Data Structuring & Memory Retrieval | `DATA_STRUCTURING` | Skipped for `GREETING`; filters retrieved memories. |
| 5 | 5 | `RELATIONSHIP_MODELING` — Relationship Modeling | `RELATIONSHIP_MODELING` | Skipped for `GREETING`; current callback returns a framework name. |
| 6 | 6 | `EVIDENCE_EVALUATION` — Evidence Evaluation | `EVIDENCE_EVALUATION` | Evaluates assembled evidence before hypothesis formation. |
| 7 | 7 | `HYPOTHESIS_FORMATION` — Hypothesis Formation | `HYPOTHESIS_FORMATION` | Conditional; skipped for `GREETING` and `SIMPLE_QUERY`. |
| 8 | 8 | `RISK_CRITIQUE_ANALYSIS` — Risk & Critique Analysis | `RISK_CRITIQUE_ANALYSIS` | Conditional; skipped for `GREETING`. |
| 9 | 9 | `STRATEGIC_OPTIONS` — Strategic Options | `STRATEGIC_OPTIONS` | Conditional; skipped for `GREETING` and `SIMPLE_QUERY`. |
| 10 | 9.5 | `DECISION_GOVERNANCE` — Decision Governance | None | Additional conditional governance stage; not part of the 12 PCA stage identifiers. |
| 11 | 10 | `ANALYSIS_COMMUNICATION` — Analysis Communication | `ANALYSIS_COMMUNICATION` | Generates the governed response. |
| 12 | 11 | `REVIEW_VERIFICATION` — Review & Verification | `REVIEW_VERIFICATION` | Reviews output and governance consistency. |
| 13 | 12 | `CONTINUOUS_IMPROVEMENT` — Continuous Improvement & Human Agency | `CONTINUOUS_IMPROVEMENT` | Records learning/agency metadata. Interactive approval is enforced separately by the governance approval workflow when policy requires it. |

Canonical schema order is `INTENT_DEFINITION`, `CONTEXT_UNDERSTANDING`, `PURPOSE_SCOPE`, `DATA_STRUCTURING`, `RELATIONSHIP_MODELING`, `EVIDENCE_EVALUATION`, `HYPOTHESIS_FORMATION`, `RISK_CRITIQUE_ANALYSIS`, `STRATEGIC_OPTIONS`, `ANALYSIS_COMMUNICATION`, `REVIEW_VERIFICATION`, `CONTINUOUS_IMPROVEMENT`. Runtime follows this order and inserts `DECISION_GOVERNANCE` at 9.5 when applicable. Human approval is a separate governance boundary/workflow: when account policy requires approval, the decision remains `PENDING_HUMAN_APPROVAL` until a matching authorized workspace approval satisfies the server-side gate.

`ProcessDepth` (`L0_DIRECT`–`L3_DEEP_AUDIT`) and control activation are handled by the runtime controller, while the orchestration also gates stages by intent. Do not infer complete stage execution from the 12-key type or the nominal stage numbers. Detailed behavior must be established from pipeline implementation and integration tests. The theoretical architecture remains described in [`WHITEPAPER.md`](../WHITEPAPER.md).

### 5.1 Evidence Evaluation (Runtime Stage 6)

In `server.ts`, `EVIDENCE_EVALUATION` is deliberately called before `HYPOTHESIS_FORMATION`. Its result, `evidence_explorer`, is passed to `buildDynamicACH`, so ACH can use the assembled evidence. This order is canonical: Stage 6 evaluates evidence and Stage 7 forms hypotheses from that governed evidence.

The current Stage 6 implementation performs these operations:

| Operation | Current behavior | Limitation / interpretation |
| --- | --- | --- |
| Source catalog | Records user input, external search, official publication chunks, parsed attachments, system specification, and model knowledge. User input, system specification, and model knowledge are marked `isEvidence: false`. | A catalog entry is not necessarily an evidence item supplied to ACH. |
| Relevance | `validateEvidenceRelevance` uses keyword overlap, with special cases for `META_INQUIRY` and `DOCUMENT_ANALYSIS`; each item gets a relevance label and reason. | This is a heuristic discovery/filtering signal, not semantic verification. The current helper returns `HIGH`, `MEDIUM`, or `LOW`; although the item type/filter allows `IRRELEVANT`, the shown helper does not return it. |
| Stage-level status | For processed sources, `processEvidence` preserves upstream `CONFLICTING`; preserves upstream `VERIFIED` or `PARTIALLY_VERIFIED` only when source, content, and a locator (`sourceUrl`, `provenance`, or `locator`) are present; otherwise it sets `UNVERIFIED`. Official publication chunks are explicitly `UNVERIFIED`, despite canonical URL and content hash. | Retrieval, source authority, relevance, URL, and hash alone do not establish that a claim is true. |
| Content integrity | `computeCanonicalHash` trims content, collapses whitespace, then hashes it with SHA-256. | The hash supports content integrity/identity checks; it is not claim verification. |
| Outputs | Saves accepted items as `evidence_explorer`, catalog entries as `sources_used`, and source/content strings in `state.evidence`. | The summary string is not a replacement for item-level provenance or claim links. |

Claim-level verification is a separate governance layer, not an automatic promotion performed by Stage 7. [`claimVerificationGovernance.ts`](../src/server/services/claimVerificationGovernance.ts) documents that `VERIFIED` requires an explicit verification method and a `SUPPORTS` link; conflicts produce `CONFLICTING`; independent corroboration requires at least two supporting items from distinct non-empty source identifiers. Lexical overlap alone can support, at most, `PARTIALLY_VERIFIED`. The surrounding evidence services also distinguish retrieval data from verified facts; consult [`pcaEngine.ts`](../src/server/services/pcaEngine.ts), [`webEvidenceGovernance.ts`](../src/server/services/webEvidenceGovernance.ts), and [`pcaEpistemicAnalysis.ts`](../src/server/services/pcaEpistemicAnalysis.ts) for those boundaries and activation behavior.

#### Evidence Evaluation limits and verification status

- **Observed in code:** Stage 7 relevance relies on keyword overlap. An upstream `VERIFIED` or `PARTIALLY_VERIFIED` status is preserved only when the source remains locatable; retrieval/relevance alone cannot promote status.
- **Maintainability risk:** source assembly and relevance logic live inline in `server.ts`, increasing the cost of isolated testing and change.
- **Not established by this review:** semantic quality of claim–evidence links, production rates of claim-level `VERIFIED` results for web evidence, whether the frontend consistently displays `evidence_status` and `relevance`, and integration behavior across representative intents.
- **Integrity boundary:** fallback evidence identifiers use cryptographically generated UUIDs when a raw source lacks an ID; source provenance still remains the authority for evidence identity across runs.

The current safeguards align with “retrieval is not verification” at the stage-item level. Any display of `credibilityScore` must make clear that it is a source/scoring signal, not the probability that a claim is true. Attachment content should be visibly identified as user-provided material.

### 5.2 Claim–Evidence Linking, Verification, and Lineage

The repository separates three responsibilities: [`claimEvidenceLinker.ts`](../src/utils/claimEvidenceLinker.ts) discovers candidate relations; [`claimVerificationGovernance.ts`](../src/server/services/claimVerificationGovernance.ts) applies the verification gate; and [`claimEvidenceMatrix.ts`](../src/utils/claimEvidenceMatrix.ts) builds an explicitly linked claim/evidence lineage view. A discovered relation is not itself a verified claim.

#### Linker: relation discovery

`linkClaimEvidence` reports `CONSERVATIVE_STRUCTURED_LEXICAL` and exposes per-item support/contradiction scores, numeric/year consistency, relation labels, and epistemic warnings. It uses normalized token overlap (with a short English/Thai stopword list), numeric and year matching, and a limited explicit-contradiction lexicon. It does not use source authority or credibility to decide a relation and cannot return `VERIFIED`.

The current thresholds and ordering are:

| Condition | Relation |
| --- | --- |
| Contradiction score ≥ 0.70 | `CONTRADICTS` |
| Support overlap ≥ 0.70 and no numeric/year mismatch | `SUPPORTS` |
| Support overlap ≥ 0.35 | `CONTEXTUAL` |
| Otherwise | `NEUTRAL` |

Because structured mismatch requires at least 0.50 lexical overlap, it cannot turn a substantially unrelated document into a contradiction. This is a deterministic lexical/structured heuristic, not semantic entailment. It can miss paraphrases and synonyms, particularly in Thai; numeric normalization is currently string-based (comma decimals are normalized, but equivalent representations such as `5%` and `5.0%` need not match).

#### Verifier: claim-level status gate

`governClaimVerification` handles the relation links separately from evidence quality:

| Condition | Outcome |
| --- | --- |
| Any linked `CONTRADICTS` relation or recognized conflicting evidence ID | `CONFLICTING` |
| Explicit verification method plus at least one valid `SUPPORTS` link | May be `VERIFIED` |
| `INDEPENDENT_CORROBORATION` without two supporting evidence IDs from distinct non-empty source labels | `PARTIALLY_VERIFIED` |
| `SUPPORTS` link without a verification method | `PARTIALLY_VERIFIED` |
| Lexical overlap of at least 50% without a qualifying link | At most `PARTIALLY_VERIFIED` |
| No qualifying support | `UNVERIFIED` |

Authority alone and naming a verification method alone are insufficient. In `pcaEngine.ts`, `retrieveExternalEvidenceAsync` currently passes the complete query string as a single claim to the linker/verifier. It returns links, scores, method, verification status, and a summary string; although the linker itself returns warnings, this wrapper does not currently forward the warnings array in its result. Other call paths, including `preOutputQualityGate.ts`, link individual output sentences, so linking behavior is not limited to the retrieval path.

#### Matrix: explicit lineage

`buildClaimEvidenceMatrix` links evidence only through each claim's explicit `linkedEvidenceIds`; it does not attach all retrieved evidence to a default claim. It reports `SUPPORTED`, `PARTIAL`, `CONTRADICTED`, or `UNTESTED`, and intentionally sets `verified_count` to `0`, because a `SUPPORTS` relation is not equivalent to independent verification. Its integrity summary is based on grounding scores and untested claim count, not a claim-verification certificate.

When an evidence ID is explicitly linked but the evidence item omits `relation`, the matrix defaults that relation to `CONTEXTUAL`, not `SUPPORTS`. Only an explicit linker/governance relation may establish affirmative support.

#### Tests and remaining uncertainty

[`scripts/testClaimEvidenceLinker.ts`](../scripts/testClaimEvidenceLinker.ts) covers strong exact-match support, numeric and year mismatch, authority-only neutrality, and the boundary that prediction wording does not create `VERIFIED`. These are targeted regression examples, not a measured precision/recall benchmark. Quality across long Thai claims, paraphrase/synonym cases, multi-claim evidence, and the completeness of the Thai contradiction lexicon remains unestablished. The configured thresholds are observable implementation values; their empirical calibration is not established by the test script.

Priority follow-up areas are sentence/claim decomposition before linking multi-claim queries, broader Thai contradiction tests, numeric normalization with unit/context awareness, and passing explicit relation values into the matrix. A benchmark on representative Thai and English claims is needed before describing semantic matching quality or false-positive/false-negative rates.

### 5.3 ACH Consumption of Evidence and Links

The current pipeline does **not** pass `claimEvidenceLinks` or `claimEvidenceLinkScores` from the retrieval wrapper into `buildDynamicACH`. In `server.ts`, Stage 6 calls `buildDynamicACH(userInput, evidence_explorer, [], [], requestedCount)`; the later Stage 9 call supplies `missing_info` and `conflicts`. `evidenceGovernance.ts` aliases `buildDynamicACH` to `buildGovernedDynamicACH`.

#### ACH evidence eligibility

The implementation in [`governedDynamicACH.ts`](../src/utils/governedDynamicACH.ts) selects ACH evidence with this predicate:

```ts
(e?.type === 'Empirical' || e?.source === 'attachment') &&
e?.evidence_status === 'VERIFIED' &&
Boolean(e?.source) &&
Boolean(e?.content)
```

Therefore an item must be classified as empirical (or be an attachment), carry `evidence_status === 'VERIFIED'`, and have non-empty source/content before it is included in ACH evidence. In particular, Stage 7 items marked `UNVERIFIED` do not enter H1's `supportingEvidence` through this filter.

The Bayesian boundary is separate: [`sourceBackedACH.ts`](../src/utils/sourceBackedACH.ts) preserves the neutral prior and quarantines the update unless an evidence item carries both numeric `likelihood` and `counterLikelihood`, plus non-uncalibrated `probabilityProvenance` that names that same evidence ID and has a source. Source credibility/authority and linker relations do not supply those conditional probabilities. The gate therefore protects posterior movement. Separately, the ACH eligibility filter excludes `UNVERIFIED` empirical items from H1 supporting context; a `VERIFIED` item may enter diagnostic support while still leaving Bayesian posterior movement quarantined when probability provenance is absent.

#### Current hypothesis construction

| Output | Current source/behavior |
| --- | --- |
| H1 | User query is used as the main hypothesis text. All selected verified items (`type === 'Empirical'` or `source === 'attachment'`, with non-empty source/content) are passed together to the governed Bayesian calculation and their source/content snippets populate `supportingEvidence`; there is no per-hypothesis diagnosticity matrix. |
| H2 | A fixed alternative template; no evidence is passed to its Bayesian calculation. |
| H1 `counterEvidence` | Built from the `conflicts` string array, not from `CONTRADICTS` links. |
| `evidenceIds` | Taken from probability provenance returned by the Bayesian calculation; not derived from linker `SUPPORTS` links. |
| Additional H3+ | Generic candidate templates added only when the user explicitly requests a minimum; they remain unconfirmed/quarantined without evidence. |

At Stage 6, the caller currently passes empty `missingSignals` and `conflicts`; Stage 9 recomputes ACH after risk analysis has populated missing information and conflicts. The injected ACH guidance in [`epistemicAchKnowledge.ts`](../src/server/services/epistemicAchKnowledge.ts) calls for assessing evidence against each hypothesis and emphasizing diagnosticity/disconfirming evidence, but the current `buildGovernedDynamicACH` implementation does not construct that full hypothesis-by-evidence matrix.

#### Consequences and follow-up

- Linker relations are not consumed by this ACH builder. Any indirect influence would require an upstream caller to use verification results to mutate evidence fields, and that is not the flow shown by the Stage 7 orchestration.
- `evidence_status === 'VERIFIED'` is required for ACH evidence eligibility, but it does not by itself provide Bayesian likelihoods. The separate probability-provenance gate still controls posterior movement.
- A safer extension would pass typed claim/evidence relations into ACH, evaluate each evidence item against each hypothesis as `CONSISTENT`, `INCONSISTENT`, or `NEUTRAL`, and keep probability updates quarantined unless their separate likelihood provenance gate passes. Any adoption should include regression coverage proving that `SUPPORTS` alone cannot move a posterior.
- Before treating the evidence filter as verified-only or links as ACH inputs, update the implementation and add integration tests for Stage 7→6 and Stage 8/9 data flow.
- Linker-to-ACH integration is not implemented in this checkout; do not describe a proposed API or ranking formula as current behavior.

---

## 6. Epistemic Evidence Model

FIRE KEEPER must distinguish different epistemic states rather than treating every generated statement as fact.

Canonical evidence classes include:

- `FACT`
- `USER CLAIM`
- `EVIDENCE`
- `INFERENCE`
- `ASSUMPTION`
- `UNCERTAINTY`

### 6.1 Epistemic Rules

**No Evidence = No Fact**  
Unsupported information must not be represented as verified fact.

**Plausible ≠ True**  
A coherent or probable-sounding output does not constitute verification.

**Absence of Evidence ≠ Evidence of Absence**  
Missing evidence must remain an explicit epistemic gap.

---

## 7. Confidence & Verification Model

FIRE KEEPER separates implementation status from verification status.

```text
IMPLEMENTED ≠ VERIFIED ≠ CERTIFIED
```

Canonical capability states:

- `VERIFIED`
- `IMPLEMENTED`
- `NOT_VERIFIED`
- `NOT_PROVISIONED`
- `THEORETICAL`

Current confidence mechanisms are to be treated as heuristic evidence scoring unless empirical calibration and benchmark evidence are available.

The system must not imply third-party certification solely from references to ISO or NIST frameworks.

---

## 8. Governance Model

FIRE KEEPER is human-centered by design.

### 8.1 Human Decision Authority

The system may:

- analyze
- compare
- synthesize
- identify risks
- generate hypotheses
- propose strategies
- formulate action plans

The system must not represent its recommendation as replacing the authorized human decision maker for consequential decisions.

### 8.2 Human Approval Gate

Stage 12 functions as the final human decision gate in the canonical reasoning model.

```text
Evidence
   ↓
Reasoning
   ↓
Risk / Vulnerability Review
   ↓
Recommendation
   ↓
Action Plan
   ↓
Human Approval Gate
   ↓
Decision
```

---

## 9. Core Capability Specification

### 9.1 Epistemic Evidence Taxonomy

Classifies information according to evidentiary status and supports evidence-aware reasoning.

### 9.2 Analysis of Competing Hypotheses (ACH)

Generates and evaluates competing explanations or strategic hypotheses rather than prematurely converging on a single conclusion.

### 9.3 Adversarial Risk & Red-Team Critique

Challenges assumptions, identifies vulnerabilities, and attempts to expose weaknesses in a proposed conclusion.

### 9.4 Calibrated Confidence

Provides confidence/evidence scoring with explicit verification status. Empirical calibration must be demonstrated separately before scores are treated as statistically calibrated probabilities.

### 9.5 Dynamic Memory Bank & Hard Gate

Supports structured contextual memory and governance constraints where provisioned by the implementation.

### 9.6 Cryptographic Integrity & Audit Hash

Supports audit-oriented integrity mechanisms and traceability. Any production-grade cryptographic assurance must be validated against the actual implementation and operational controls.

---

## 10. Audit & Security Requirements

The implementation should provide controls for:

- credential and secret redaction
- audit-log sanitization
- access-control enforcement
- Firestore security rules where applicable
- governance metadata
- capability-state metadata
- traceability of consequential outputs
- separation of development claims from verified operational claims

See [`SECURITY_AUDIT.md`](../SECURITY_AUDIT.md) for the current security assessment.

---

## 11. Standards Alignment

FIRE KEEPER references the following frameworks as design and governance references:

- ISO/IEC 42001:2023
- NIST AI Risk Management Framework (AI RMF)
- NIST Cybersecurity Framework (CSF)
- NIST SP 800-61 incident-response guidance

These references indicate architectural alignment only unless independent assessment or certification evidence is explicitly documented.

---

## 12. UI / UX Requirements

The product UI should preserve the following characteristics:

- dark enterprise interface
- high information density without visual clutter
- clear distinction between status, evidence, risk, and recommendation
- visible system integrity indicators
- explicit capability states
- consistent FIRE KEEPER / PCA terminology
- clear human-control affordances
- responsive desktop and mobile layouts
- accessible contrast and readable typography

UI labels must not imply verification, certification, or operational capability that has not been established by evidence.

---

## 13. Documentation Requirements

The repository documentation should maintain separation between:

| Document | Responsibility |
| --- | --- |
| `README.md` | Product overview, positioning, quick start, screenshots |
| `docs/FIRE_KEEPER_SPEC.md` | Product, system, UI, capability, and governance requirements |
| `WHITEPAPER.md` | Canonical architecture and theoretical/design specification |
| `SECURITY_AUDIT.md` | Security assessment and controls |
| `CHANGES.md` | Remediation, hardening, and verification history |

This separation prevents the README from becoming overloaded while keeping the canonical architecture and implementation requirements traceable.

---

## 14. Verification Policy

Every material capability should be classified according to the strongest evidence currently available.

A feature should not be marked `VERIFIED` solely because:

- the UI displays the feature;
- code for the feature exists;
- a design document describes the feature;
- a framework or standard is referenced;
- an LLM generates a plausible result.

Verification should be supported by appropriate tests, benchmarks, operational evidence, or independent assessment where applicable.

---

## 15. Acceptance Criteria

A FIRE KEEPER release is documentation-complete when:

- product identity is clearly separated from PCA architecture;
- the 12-stage reasoning model is consistently represented;
- evidence and uncertainty states are explicit;
- implementation and verification claims are separated;
- human decision authority is preserved;
- screenshots correspond to actual product interfaces;
- security and governance documentation is linked;
- standards references are not presented as certification claims;
- major capabilities have explicit implementation/verification status.

---

## 16. Source of Truth

For architecture-level definitions, consult [`WHITEPAPER.md`](../WHITEPAPER.md).  
For implementation and verification status, consult [`CHANGES.md`](../CHANGES.md).  
For security controls and findings, consult [`SECURITY_AUDIT.md`](../SECURITY_AUDIT.md).

**FIRE KEEPER — Decision Intelligence with Human Agency by Design.**
