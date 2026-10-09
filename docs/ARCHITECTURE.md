# FIRE KEEPER Architecture Specification

**Version:** 1.1
**Status date:** 25 September 2026  
**Status:** Engineering Specification  
**Scope:** FIRE KEEPER Core / PUNN Predictive Cognitive Architecture (PCA) (PCA)

## 1. Purpose

FIRE KEEPER is the governance and decision-intelligence layer of the PUNN Predictive Cognitive Architecture (PCA) (PCA). Its purpose is to structure AI-assisted reasoning, expose evidence and uncertainty, validate reasoning stages, and preserve human decision authority.

This document describes the logical architecture. It does not imply that every described capability is production-ready or independently verified.

## 2. System Positioning

```text
PUNN Predictive Cognitive Architecture (PCA) (PCA)
            │
            ▼
      FIRE KEEPER Core
            │
   ┌────────┼────────┐
   ▼        ▼        ▼
Reasoning  Evidence  Governance
Validation Trace      Controls
   │        │        │
   └────────┼────────┘
            ▼
     Decision Intelligence
            │
            ▼
     Human Approval Gate
            │
            ▼
      Decision / Action
```

## 3. Architectural Layers (PCA v3.1)

PCA v3.1 operates as a three-layered governance framework with current pre-output evidence, consistency, Decision Record, and human-approval controls:

### 3.1 Orchestration Layer
A 12-stage application pipeline coordinates evidence handling, deterministic controls, model calls, validation, and human approval.
- **Stages**: Observation, Understanding, Purpose, Memory, Mental Model, Evidence Evaluation, Hypothesis, Critique, Decision, Communication, Reflection, Learning.
- **Boundary**: A stage is an orchestration/control stage. The design does not claim that the LLM performs twelve separate hidden reasoning passes.

### 3.2 Epistemic Layer
The layer for identifying and separating information states.
- **States**: FACT, EVIDENCE, INFERENCE, ASSUMPTION, UNCERTAINTY, UNKNOWN.
- **Goals**: Distinguish between verified data, logical leaps, and admitted gaps.

### 3.3 Governance Layer
The control and safety perimeter.
- **Controls**: Claim-to-evidence checks, self-audit, recommendation consistency, risk/conflict handling, Human Agency Gate, escalation, Decision Record, and deterministic validation.

---

## 4. Logical Architecture Diagram

```text
                    PUNN PCA
                       │
        ┌──────────────┼──────────────┐
        │              │              │
   COGNITIVE       EPISTEMIC     GOVERNANCE
     LAYER           LAYER          LAYER
        │              │              │
 Observation       Evidence         Risk
 Understanding     Uncertainty      Conflict
 Hypothesis        Assumption       Override
 Critique          Inference        Human Gate
 Decision          Unknown          Escalation
 Reflection
 Learning
        │              │              │
        └──────────────┼──────────────┘
                       ↓
                DECISION OBJECT
                       ↓
             DETERMINISTIC VALIDATOR
                       ↓
                      LLM
                       ↓
              STRUCTURED RESPONSE
                       ↓
                HUMAN DECISION
                       ↓
                RED TEAM / AUDIT
```

---

## 4.1 Dual-Mode Architecture (Option B: Two Independent Execution Paths)

FIRE KEEPER implements an independent **Dual-Mode Architecture** designed as **One Platform, Two Independent Execution Paths**:
- **Normal Mode (Direct AI)**: An independent, high-speed conversational pipeline that bypasses the 12-stage cognitive engine and epistemic tagging, directly generating fluent output while preserving core safety policies and streaming tokens.
- **Governed Mode (PUNN PCA)**: The full-assurance decision governance engine executing through the 12 PCA stages, Epistemic Claims Taxonomy, Evidence Grounding, Adversarial Verification, and Bayesian ACH.

```text
Chat Request (Question + Context + Attachments)
                    │
                    ▼
          Chat Mode Router (server.ts)
          [Default: Governed]
                    │
       ┌────────────┴────────────┐
       ▼                         ▼
 [NORMAL MODE]             [GOVERNED MODE]
Direct AI Service         PUNN PCA 12 Stages
Direct System Prompt      Adaptive Response Depth
No Epistemic Tags         Evidence Grounding & Graph
Fast Token Streaming      Adversarial Verification Gate
       │                         │
       └────────────┬────────────┘
                    ▼
          Shared LLM Runtime Engine
          (callUnifiedLlmContent)
                    │
       ┌────────────┴────────────┐
       ▼                         ▼
 Direct AI Response        Governed Decision Output
 Operational Log           Tiered PCA Audit Log
 (chat_logs: cost/tokens)  (pca_audit_logs: hash chain)
```

### Architectural Guarantees:
1. **Pipeline Isolation**: Normal mode does not evaluate PCA stages or introduce `if (mode === "normal")` branches inside the PCA Engine.
2. **Contract Safety**: Incoming requests missing explicit mode specification default strictly to `governed`.
3. **Uniform Security Perimeter**: Auth, account policy boundaries, rate limiting, and request quotas apply identically across both execution paths.
4. **Distinct Audit Targets**: Normal mode records operational cost/usage logs, while Governed mode maintains immutable cryptographic audit hash chains.

---

## 5. Architectural Invariants

1. AI recommendations do not automatically become decisions.
2. Human decision authority remains explicit at the approval boundary.
3. Unsupported claims must not be represented as verified facts.
4. Uncertainty and epistemic gaps must remain visible.
5. Implementation status must not be represented as independent verification.
6. Governance controls must be auditable where implemented.

## 6. Capability State Model

```text
THEORETICAL
    ↓
IMPLEMENTED
    ↓
VERIFIED
    ↓
CERTIFIED (only with independent certification evidence)
```

These states are not interchangeable.

## 7. External Dependencies

The system may depend on language models, retrieval systems, external standards, application services, databases, authentication, and cryptographic services. Dependency availability does not itself establish correctness or verification of the resulting decision.

## 8. Failure Boundaries

FIRE KEEPER must treat missing evidence, conflicting evidence, unavailable external anchors, low confidence, unsupported capabilities, and failed validation as explicit system states rather than silently converting them into certainty.

## 9. Human Authority Boundary

The final approval boundary is a governance control, not merely a UI element. The system may prepare, compare, critique, and recommend; authorized humans retain responsibility for consequential decisions.

## 10. Verification Boundary

Architecture documentation defines intended behavior. Verification requires implementation evidence, test results, benchmarks, operational evidence, or other appropriate validation artifacts. Certification requires independent certification evidence where applicable.