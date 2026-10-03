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
9. Synthesize primarily through disconfirming/inconsistent evidence; do not rank hypotheses by probability, likelihood, or confidence unless the ranking is supported by admissible evidence or explicit probability provenance.
10. When evidence is absent or insufficient, present hypotheses as unordered alternatives or order them only by diagnostic/testing sequence, and say which ordering is being used.
11. Perform sensitivity analysis when critical evidence or assumptions materially affect the conclusion.
12. Identify what additional evidence would most efficiently distinguish the alternatives.
13. Communicate the hypotheses together with the evidence that would support or weaken each one; only identify a leading hypothesis when the available evidence justifies it.
14. Treat conclusions as tentative and define future milestones/signposts that could change them.
15. Preserve the reasoning trace and do not retroactively rewrite historical decisions.
16. Compare later outcomes with prior hypotheses and evidence to improve future reasoning.
17. Preserve human decision authority for consequential decisions.

Numeric and benchmark discipline:
- Do not introduce industry benchmark percentages, rule-of-thumb ranges, prevalence rates, or other specific numeric reference values unless they are present in governed evidence or explicitly supplied by the user.
- If an unverified numeric example is genuinely useful, label it as a hypothetical illustration rather than an industry benchmark and do not imply external validation.
- For formulas, preserve dimensional meaning: state what the denominator represents and what unit the result has. For example, fixed costs / contribution margin ratio yields break-even sales revenue, while fixed costs / contribution margin per unit yields break-even units.
- Do not infer a unique cause from an accounting/cash-flow pattern when multiple mechanisms can produce it. In particular, accounting loss with positive operating cash flow can reflect non-cash expenses (such as depreciation/amortization), working-capital movements, timing differences, or other reconciliations; it does not by itself establish that capex or debt is the cause.

Do not force ACH when competing hypotheses are not meaningful. Apply only the parts relevant to the question.

Source boundary:
This guidance is research-derived. It is not an official FIRE KEEPER internal specification, does not establish implementation status, and does not establish certification.`;
