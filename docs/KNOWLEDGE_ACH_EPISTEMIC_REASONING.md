# FIRE KEEPER Knowledge Module — ACH & Epistemic Reasoning

**Source:** `การเจาะลึก-12-stage-epistemic-reasoning-และ-ach-matrix-ของ-fire-keeper-แผนการค้นคว้า(1).pdf`
**Purpose:** Convert the supplied research report into operational reasoning guidance for FIRE KEEPER.
**Classification:** Research-derived knowledge / conceptual guidance — NOT canonical product specification.

> Important epistemic boundary: the source report explicitly describes its FIRE KEEPER 12-stage mapping as a conceptual model derived from Epistemic Eigen, OIDA, and ACH because public information did not provide the official internal definition of every FIRE KEEPER stage. Therefore this document augments the canonical PCA stages; it does not replace them.

## 1. Core principles

1. Separate facts, evidence, inference, assumptions, uncertainty, and user claims.
2. Do not promote unsupported information into fact.
3. Plausibility is not truth.
4. Absence of evidence is not evidence of absence.
5. For decision questions, generate genuinely competing hypotheses before converging.
6. Evaluate each evidence item against every competing hypothesis, not only the preferred hypothesis.
7. Prefer evidence that can discriminate between hypotheses (`diagnosticity`) over evidence that merely supports many hypotheses equally.
8. In ACH synthesis, emphasize inconsistency / falsification signals rather than counting supporting evidence alone.
9. Treat conclusions as tentative and define future milestones/signposts that could change them.
10. Preserve human decision authority.
11. Record material reasoning state so decisions can be inspected and revisited.
12. Feed observed outcomes back into later reasoning without rewriting the historical decision record.

## 2. Canonical PCA alignment

The repository's canonical PCA pipeline remains authoritative:

1. Context Understanding / Intent Definition
2. Stakeholder Assessment / Context Understanding
3. Logical Chain Analysis / Purpose & Scope
4. Logical Conflict Identification / Data Structuring & LTM
5. External Anchoring & Standards Verification / Relationship Modelling
6. Multi-Hypothesis / ACH Analysis
7. Evidence & Confidence Scoring
8. Vulnerability Critique / Risk & Adversarial Analysis
9. Strategic Recommendation / Strategic Options
10. Concrete Action Plan / Analysis Communication
11. Meta-Reflection / Review & Verification
12. Human Approval Gate / Continuous Improvement & Human Gate

The research-derived ACH workflow is mapped onto this canonical pipeline rather than creating a second incompatible 12-stage architecture.

## 3. Operational ACH workflow

### Stage 1 — Frame the question
Define the decision question, scope, time horizon, affected domain, and decision stakes. A vague question should be narrowed enough to support meaningful competing hypotheses.

### Stage 2 — Generate competing hypotheses
Construct multiple mutually meaningful explanations or strategic alternatives. Include at least one failure / adverse hypothesis where relevant. Do not optimize for the hypothesis already favored by the user.

### Stage 3 — Structure evidence
Represent evidence with explicit epistemic status and provenance. Evidence may include quantitative data, expert interpretation, assumptions, estimates, field observations, or external reporting. Do not collapse these into a single undifferentiated evidence class.

### Stage 4 — Evaluate the matrix
For each evidence item, evaluate its relationship to every hypothesis. Use a consistent relation vocabulary such as `CONSISTENT`, `INCONSISTENT`, `NEUTRAL`, and `NOT_APPLICABLE`; stronger variants may be used when the implementation supports them.

### Stage 5 — Refine
Remove or down-weight evidence that has little diagnostic value because it affects all hypotheses similarly. Split overly broad hypotheses and merge duplicates where necessary. Preserve removed evidence in the trace rather than silently deleting it.

### Stage 6 — Synthesize by falsification
Rank hypotheses primarily by the severity and weight of evidence inconsistent with them. A hypothesis with many supporting items can still be weak if critical evidence contradicts it.

### Stage 7 — Sensitivity analysis
Identify evidence and assumptions that materially change the ranking. Flag critical evidence with weak provenance, low reliability, or single-source dependence. Where appropriate, specify what additional evidence would most efficiently distinguish the leading hypotheses.

### Stage 8 — Communicate conclusion and scenarios
Report the leading hypothesis together with meaningful alternatives and why they rank lower. Where useful, express base / favorable / adverse scenarios and the evidence-dependent conditions behind them.

### Stage 9 — Milestones and signposts
Define observable future events or measurements that would increase, decrease, or otherwise change the relative plausibility of competing hypotheses. These are monitoring triggers, not promises about the future.

### Stage 10 — Decision trace / commitment
Preserve the reasoning state and evidence context used for the decision. A later change should be represented as a new decision state linked to new evidence or a milestone, not as retroactive rewriting of history.

### Stage 11 — Outcome learning
Compare predicted hypotheses, evidence interpretations, and decision outcomes with what actually happened. Use the result to improve future reasoning while retaining the original decision record.

### Stage 12 — Human governance
Use the accumulated analysis to support the authorized human decision maker. The system may analyze, compare, critique, recommend, and plan; it must not represent the AI output as replacing human authority for consequential decisions.

## 4. ACH data model guidance

Conceptually, an ACH matrix contains hypotheses as columns and evidence as rows. Each cell expresses the relationship between one evidence item and one hypothesis. This can also be represented as a bipartite graph with evidence nodes and hypothesis nodes connected by support / contradiction relations.

Recommended conceptual fields:

- `hypothesis.id`
- `hypothesis.statement`
- `evidence.id`
- `evidence.statement`
- `evidence.epistemicStatus`
- `evidence.provenance`
- `evidence.reliability`
- `evidence.freshness`
- `relation.type`
- `relation.strength`
- `relation.rationale`
- `diagnosticity`
- `criticality`
- `sensitivity`

These fields are guidance for implementation; they do not assert that every field is already implemented in FIRE KEEPER.

## 5. Evidence weighting rules

Evidence quality should not be reduced to the number of positive cells. When supported by the implementation, weighting may account for:

- source reliability
- epistemic status
- freshness
- provenance quality
- diagnosticity
- contradiction severity
- dependence / corroboration

Do not convert a heuristic weighted score into a statistically calibrated probability unless empirical calibration evidence exists.

## 6. Reasoning safeguards

When the query is decision-oriented, the governed reasoning process should attempt to detect:

- anchoring on the first plausible hypothesis
- confirmation bias
- selective evidence collection
- over-weighting fluent narratives
- treating shared evidence as highly diagnostic
- ignoring disconfirming evidence
- excessive confidence caused by weak or single-source evidence

The system should surface these as reasoning risks rather than silently correcting the user's conclusion.

## 7. Output contract for governed generation

For a decision analysis using this knowledge module, the generation model should:

1. State the decision question and scope.
2. Identify competing hypotheses when applicable.
3. Separate evidence from inference and assumptions.
4. Explain important evidence relationships across hypotheses.
5. Highlight disconfirming / inconsistent evidence.
6. Identify high-diagnosticity evidence and critical uncertainties.
7. Perform sensitivity analysis when the ranking depends on critical evidence.
8. Give a tentative conclusion, not synthetic certainty.
9. State what future evidence or milestones could change the conclusion.
10. Preserve human decision authority.

## 8. Source-boundary rule

This module is research-derived. It must never be used to claim that the supplied report is an official FIRE KEEPER specification, that every described mechanism is implemented, or that references to external standards constitute certification.
