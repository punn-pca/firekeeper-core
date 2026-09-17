# FIRE KEEPER Developer Portal

## Developer contract map

| Resource | Purpose | Stability |
|---|---|---|
| `/developers` | Human-readable developer portal | Public |
| `API_REFERENCE.md` | Typed runtime/decision contract | Versioned |
| `decision.schema.json` | Machine-readable Decision Object schema | Versioned |
| `src/shared/contracts/decision.ts` | Implementation source of truth | Internal source |

## Contract lifecycle

`Request → Runtime → Decision Object → Deterministic Validation → Publication / Escalation`

## Validation outcomes

- **PASS** — contract and governance checks pass.
- **REPAIR_REQUIRED** — output is structurally or semantically repairable before publication.
- **ESCALATE** — the runtime must stop autonomous progression and defer to the appropriate human authority.

## Epistemic integrity

Integrations must preserve the distinction between facts, evidence, user claims, model knowledge, inference, hypotheses, estimates, scenarios, uncertainty, unknowns, contradictions, assumptions, constraints, trade-offs and decision gaps.

An integration must never silently downgrade an epistemic state into a stronger claim.

## Human agency

FIRE KEEPER is advisory infrastructure. A developer integration must not represent an AI recommendation as an irreversible or exclusively machine-authorized decision.

## API publication rule

Only implemented and versioned endpoints may be documented as public API endpoints. Conceptual architecture is explicitly separated from endpoint guarantees.

## Schema

The current public Decision Object schema is:

`docs/developers/decision.schema.json`

Schema identifier:

`https://firekeeper.site/developers/schemas/decision-v1.json`
