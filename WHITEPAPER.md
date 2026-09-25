# FIRE KEEPER & PUNN Predictive Cognitive Architecture (PCA)
## Public Design Specification v3.1

**Status date:** 25 September 2026
**Classification:** Public implementation statement and governance reference
**Citation:** Firekeeper Project — Design Specification v3.1 (2026)

---

## Executive summary

FIRE KEEPER is a decision-quality control layer for AI-assisted work. It helps distinguish **Observed Fact**, **Source Claim**, **Interpretation**, **Hypothesis**, **Recommendation**, and **Decision**; links material claims to available evidence; exposes gaps and conflicts; and preserves human decision authority.

This specification describes current controls and their boundaries. It does not claim that every output is correct, that the system is certified, or that AI replaces a qualified human decision-maker.

## Current implementation status

The current implementation includes:

- claim-to-evidence checks and classification of epistemic states;
- self-audit for unsupported claims, causal overreach, unsupported superlatives, and recommendation framing;
- conditional recommendations with stated conditions, risks, and review triggers;
- recommendation-consistency checks and human-review boundaries for high-impact work;
- Decision Records with supporting and conflicting evidence, unresolved gaps, allowed actions, required approvals, and decision owner;
- action-impact records, sequential evidence plans, hypothesis-separation checks, and recommendation change tracking;
- audit trace identifiers, governance/evidence/risk/conflict summaries, and SHA-256 integrity hashes.

## Evidence, confidence, and probability

Confidence is not a universal probability. When measured evidence, source reliability, quality, and a stated calibration method are available, the runtime may calculate a bounded evidence score. When they are absent or evidence is conflicted, the correct output is `N/A` / `null`, not a fabricated percentage.

Probability values such as prior, likelihood, or posterior require explicit provenance, for example a documented source, a calibration method, or a scoped expert elicitation. Heuristic scores may help prioritize review but must not be represented as statistical probability.

## Human authority and domain boundary

FIRE KEEPER supports analysis; it does not approve consequential actions. Recommendations are conditional and may require an authorized human, policy owner, or domain specialist. A decision record must distinguish:

- actions allowed now;
- actions requiring approval;
- evidence that could change the recommendation; and
- the review trigger and decision owner.

## Auditability and deployment boundaries

Runtime traces can include execution identifiers, summaries of evidence/risk/conflict/governance state, Decision Record metadata, and SHA-256 integrity hashes. These controls are **tamper-evident within their configured deployment boundary**: they help reveal an inconsistent trace but do not prove that every storage layer is immutable or that the underlying content is true.

Azure Monitor / Log Analytics export is optional and configuration-dependent. It exports audit metadata only; it does not export prompts, full model responses, user emails, file contents, API keys, secrets, or raw audit payloads.

The project does **not** currently claim storage-enforced WORM, RFC 3161 trusted timestamps from an external TSA, external certification, or cross-organization cryptographic verification as implemented capabilities.

## Standards references

The system design may reference NIST AI RMF, NIST CSF, ISO/IEC 42001, ISO/IEC 27001, privacy requirements, and related practices. Reference or design alignment is not certification. Certification requires a separate external assessment.

## Direction under evaluation

Future work may include multi-modal evidence anchoring, graph-based retrieval, storage-enforced immutability, trusted timestamping, cross-organization verification, and industry governance templates. These are directions under evaluation, not delivery promises.

## Legal and operational notice

FIRE KEEPER outputs are decision support. They do not replace legal, medical, financial, security, or other professional advice. Organizations remain responsible for configuration, access control, evidence selection, approvals, deployment controls, and the decisions they make.

*Copyright © 2026 Firekeeper Project. All rights reserved.*