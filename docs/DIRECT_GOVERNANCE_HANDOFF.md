# Direct → Governance guided handoff (implementation contract)

## Goal
Keep the existing two execution paths distinct. Direct helps users discover and refine a decision question; Governance evaluates it through PCA. Never silently change modes.

## Existing invariant
`scripts/testDualModeIsolation.ts` asserts Direct messages have no Firekeeper system prompt, and governed processing stays separate. Do not inject guided behavior into Direct's system messages or route Direct through PCA.

## User flow
1. User starts in Direct with an unclear goal. Offer a short, optional clarifying question, at most one at a time; always allow an ordinary answer.
2. Capture only user-confirmed facts, objectives, constraints, alternatives and unknowns. Do not infer missing financial details.
3. Offer (never automatically trigger) Governance when any of: high-impact decision, contradictory/insufficient evidence, complex alternatives, auditability request, or explicit user request.
4. Explain the trigger in plain language and show two actions: "วิเคราะห์เชิงลึก" and "คุยต่อแบบปกติ".
5. On explicit consent, transfer a structured summary and the original user conversation context to governed processing. Mark each summary item as user-stated vs assistant-suggested and preserve unknowns; do not ask known questions again.
6. Log the handoff offer, reason, user choice and timestamp, without logging unnecessary sensitive conversation content. A declined offer keeps Direct active.
7. Governance must distinguish evidence from hypotheses, support "insufficient evidence", and not imply a confidence percentage is empirically calibrated without validation.

## Guardrails
- No hidden automatic switch, no new third mode.
- User can manually select either mode at any time.
- Do not represent a preliminary Direct suggestion as governed or evidence-verified.
- Preserve current provider/BYOK routing and existing language safeguards.
- Handoff context must be authenticated/authorized, size-bounded, and sanitized as untrusted user input; never convert user content to system instructions.
- The UI must make the active mode and pending handoff explicit, on mobile and desktop.

## Acceptance tests
- Ambiguous question: Direct asks one neutral clarification; user can skip.
- High-impact investment question: Governance offered with reason; no automatic switch.
- Decline: stays Direct and can continue.
- Accept: exact mode changes only after explicit action; known constraints transfer, unknowns remain unknown.
- Prompt-injection in conversation summary cannot override Governance system instructions.
- Refresh/retry must not duplicate a handoff or approval event.
- Direct/Governance isolation regression remains green.
- Governance with missing evidence says it cannot conclude.
- Thai/English responses preserve user's language.
