# FIRE KEEPER Developer Documentation

Version: 1.0  
Contract status: Public Developer Contract  
Canonical runtime: PUNN Predictive Cognitive Architecture (PCA)

## 1. Documentation boundary

- `/docs` describes the cognitive architecture, epistemology and information taxonomy.
- `/developers` describes developer-facing contracts, runtime boundaries and integration concepts.
- Implementation details are not automatically public contracts.

## 2. Runtime contract

The public conceptual flow is:

`User Request → Orchestration → PCA Runtime → Model Inference → Epistemic/Governance Processing → Deterministic Validation → Response`

The model layer is not the authority for validation. Runtime validation and governance remain separate boundaries.

## 3. Decision Object

The current canonical shared contract is implemented by `src/shared/contracts/decision.ts`.

Required top-level fields:

| Field | Type | Required |
|---|---|---|
| options | Option[] | yes |
| risks | Risk[] | yes |
| uncertainties | Uncertainty[] | yes |
| consequences | Consequence[] | yes |
| evidence | Evidence[] | yes |
| assumptions | string[] | yes |
| recommendation | Recommendation | no |
| confidence | Confidence | yes |
| applicable_policies | Policy[] | yes |
| policy_conflicts | PolicyConflict[] | yes |
| escalation_required | boolean | yes |
| controlLevel | LOW\|MEDIUM\|HIGH\|CRITICAL | yes |

### Option

- `id: string`
- `text: string`
- `rationale: string`
- `isRecommended: boolean`

### Risk

- `id: string`
- `text: string`
- `severity: LOW | MEDIUM | HIGH | CRITICAL`
- `relatedOptionIds?: string[]`

### Uncertainty

- `id: string`
- `text: string`
- `importance: LOW | MEDIUM | HIGH`

### Evidence

- `id: string`
- `text: string`
- `sourceId: string`

### Recommendation

Optional object:

`{ optionId: string, rationale: string }`

### Confidence

`{ score: number | null, label: LOW | MEDIUM | HIGH, breakdown: Record<string, number> }`

### Policy conflict

`{ policyId1: string, policyId2: string, severity: Severity, rationale: string }`

## 4. Validation contract

The deterministic validator returns:

`PASS | REPAIR_REQUIRED | ESCALATE`

Validation includes:

1. Schema validation.
2. Recommendation → option referential integrity.
3. Critical policy-conflict escalation.
4. Explicit escalation handling.

A `CRITICAL` policy conflict always produces `ESCALATE`.

## 5. Runtime trace

The runtime trace contract contains:

- requestId
- timestamp
- model requested/resolved/provider/decisionAuthority
- language routing
- classification scores
- responseMode
- processDepth
- memory retrieval/acceptance/rejection
- policies and conflicts
- validation trace
- duration and token/word metrics

Response modes:

- `DIRECT`
- `BRIEF`
- `STRUCTURED`
- `DEEP`

Process depths:

- `L0_DIRECT`
- `L1_ANALYTICAL`
- `L2_STRUCTURED`
- `L3_DEEP_AUDIT`

## 6. API status

This repository currently defines the shared decision contract and runtime interfaces. It does **not** declare an OpenAPI document or guarantee public HTTP endpoint names in this document.

Do not invent endpoint paths, authentication schemes, webhook contracts or SDK methods. Those should be added only when implemented and versioned.

## 7. Integration rules

A conforming integration should:

- Treat Decision Object fields as typed contract data.
- Preserve epistemic status rather than converting inference into fact.
- Respect escalation boundaries.
- Never treat model output alone as authoritative validation.
- Preserve human decision authority.
- Handle `REPAIR_REQUIRED` and `ESCALATE` explicitly.

## 8. Source of truth

Canonical source files:

- `src/shared/contracts/decision.ts`
- `src/server/services/pcaRuntimeController.ts`

Generated/public JSON Schema:

- `docs/developers/decision.schema.json`

When the implementation contract changes, update the versioned developer documentation and schema together.
