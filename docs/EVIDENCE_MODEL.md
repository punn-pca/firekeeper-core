# FIRE KEEPER Evidence Model

**Version:** 1.0  
**Status:** Engineering Specification

## 1. Purpose

The Evidence Model defines how FIRE KEEPER distinguishes facts, supported claims, inferences, hypotheses, and unknowns. It is intended to reduce unsupported certainty in AI-assisted decision intelligence.

## 2. Epistemic States

| State | Meaning | Default treatment |
| --- | --- | --- |
| `FACT` | Claim supported by sufficient evidence for the current scope | May be presented as fact with provenance |
| `SUPPORTED_CLAIM` | Evidence-backed claim whose scope or strength requires qualification | Present with evidence and qualification |
| `INFERENCE` | Reasoned conclusion derived from available information | Label as inference |
| `HYPOTHESIS` | Candidate explanation or scenario requiring testing | Label as hypothesis |
| `UNKNOWN` | Insufficient information to determine the claim | Do not fabricate an answer |

## 3. Evidence Record

A logical evidence record should preserve, where available:

```text
Evidence ID
Source / Provenance
Acquisition Time
Claim Supported
Evidence Type
Reliability Assessment
Relevance Assessment
Contradicting Evidence
Verification State
Confidence Score
Scope / Limitations
```

## 4. Evidence Lifecycle

```text
Claim
 ↓
Evidence Discovery
 ↓
Source / Provenance Capture
 ↓
Relevance Assessment
 ↓
Reliability Assessment
 ↓
Contradiction Check
 ↓
Confidence Assessment
 ↓
Verification Decision
 ↓
Decision Intelligence Output
```

## 5. Core Epistemic Rules

### No Evidence = No Fact

A claim without adequate supporting evidence must not be represented as a verified fact.

### Plausible ≠ True

Fluent or internally coherent model output is not sufficient evidence of truth.

### Absence of Evidence ≠ Evidence of Absence

Failure to locate evidence should normally be represented as an epistemic gap unless the search context justifies a stronger conclusion.

## 6. Confidence

Confidence is an assessment of evidentiary support and reasoning quality. In the current project, confidence values are heuristic unless independently calibrated against an appropriate benchmark.

A confidence value must therefore not be described as a statistically calibrated probability without supporting validation evidence.

## 7. Contradictory Evidence

Contradictory evidence should be retained rather than silently discarded. Where material conflicts exist, the system should expose competing interpretations and identify what additional evidence could resolve the conflict.

## 8. Verification States

```text
NOT_VERIFIED
IMPLEMENTED
VERIFIED
NOT_PROVISIONED
THEORETICAL
```

A verification state describes the status of the capability or evidence process; it is separate from confidence in an individual claim.

## 9. Decision Boundary

The evidence model informs recommendations but does not grant the AI autonomous authority to make consequential decisions. The final decision remains subject to the applicable human approval and governance process.

## 10. Audit Expectations

Evidence-related records should be traceable to their source or provenance where technically and legally appropriate. Sensitive credentials and secrets must not be embedded in evidence or audit records.

## 11. Verification Requirements

Claims about empirical accuracy, calibration, benchmark performance, or certification require corresponding evidence. Architectural intent alone is insufficient.
