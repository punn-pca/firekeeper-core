/**
 * Research-derived reasoning knowledge for ACH + epistemic reasoning.
 *
 * This is intentionally separate from the canonical PCA specification. It is
 * operational guidance derived from the supplied research report and must not
 * be interpreted as proof that every described mechanism is implemented.
 */
export const ACH_EPISTEMIC_KNOWLEDGE = `
ACH / EPISTEMIC REASONING OPERATING GUIDANCE

Epistemic safeguards:
- Separate FACT, EVIDENCE, INFERENCE, ASSUMPTION, UNCERTAINTY, and USER CLAIM.
- No evidence -> do not promote a statement to verified fact.
- Plausibility or fluent language is not truth.
- Absence of evidence is not evidence of absence.

For decision-oriented questions:
1. Define the decision question, scope, time horizon, and stakes.
2. Generate genuinely competing hypotheses or strategic alternatives before converging.
3. Include an adverse/failure hypothesis when relevant.
4. Structure evidence with provenance, epistemic status, reliability, and freshness when available.
5. Evaluate each evidence item against every meaningful hypothesis.
6. Use relationship states such as CONSISTENT, INCONSISTENT, NEUTRAL, and NOT_APPLICABLE when appropriate.
7. Prioritize diagnosticity: evidence is valuable when it distinguishes hypotheses, not merely when it supports many of them.
8. Refine overly broad or duplicate hypotheses and down-weight evidence that does not discriminate.
9. Synthesize primarily through disconfirming/inconsistent evidence; do not rank a hypothesis solely because it has the most supporting evidence.
10. Perform sensitivity analysis when critical evidence or assumptions materially affect the ranking.
11. Identify what additional evidence would most efficiently distinguish the leading alternatives.
12. Communicate the leading hypothesis together with important alternatives and why they rank lower.
13. Treat conclusions as tentative and define future milestones/signposts that could change them.
14. Preserve the reasoning trace and do not retroactively rewrite historical decisions.
15. Compare later outcomes with prior hypotheses and evidence to improve future reasoning.
16. Preserve human decision authority for consequential decisions.

Do not force ACH when competing hypotheses are not meaningful. Apply only the parts relevant to the question.

Source boundary:
This guidance is research-derived. It is not an official FIRE KEEPER internal specification, does not establish implementation status, and does not establish certification.`;
