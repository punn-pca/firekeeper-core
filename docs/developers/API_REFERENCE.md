# FIRE KEEPER Developer Documentation

Version: 1.1
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

The implemented HTTP subset is described in [`openapi.yaml`](openapi.yaml). It covers health, conversations, PCA streaming, decision audit, decision-approval requests, account-scoped security events, and the billing portal. Other routes remain implementation details until documented and versioned.

Conversation isolation events record the acting account, action, result, SHA-256 of the requested conversation ID, and timestamp. Raw conversation content, the raw ID, and the other account's identity are not part of the event. Hosted writes are attempted before responding; if storage fails, the server logs a warning. This is operational visibility, not a guarantee of durable delivery or immutable storage. The existing PCA audit stream covers completed analysis; isolation events cover only the instrumented conversation paths.

Do not infer webhook contracts or SDK methods from the conceptual architecture. Authentication uses server-accepted bearer tokens; credentials and deployment hosts depend on the deployment.

### Account policy and approvals

PCA checks the authenticated account's stored policy before inference. Policies are account-scoped, not inherited from a workspace. Provider routing and custom endpoints must be permitted; a denied DeepSeek supplemental resolver falls back to deterministic resolution. Restricted topics are literal normalized phrases, not semantic detection or image DLP. A failed policy read returns 503.

PCA generation stays advisory and reports `accountPolicy` in its completion event. When `approvalRequired` is true, submit the Decision Object with `decisionId` to the workspace approvals endpoint. A reviewer/owner reviews its content. Send the resulting `workspaceId` and `approvalId` with the identical Decision Object to `/api/audit/decision`. A changed or ID-only decision approval, a removed reviewer, or a nonmember cannot satisfy the gate. Client `human_decision` assertions cannot satisfy server approval.

Hosted conversation writes return success only after their transaction commits. Read/delete ownership cannot fall back to local caches during storage failures. Conversation ID collision on save/stream still creates an isolated session; direct foreign read/delete is denied.

### Hosted analysis request lifecycle

For `/api/pca/stream`, ownership, provider/plan entitlement, account policy, restricted input, and attachment parsing are evaluated before hosted analysis quota is reserved. The quota reservation is transactional and occurs before memory/retrieval/provider work. New web clients send a stable UUID `analysisRequestId`; the same ID is reused by the client's authentication retry path.

When an ID is supplied, the server persists one of these request states:

- `RESERVED`: quota has been consumed and pipeline work may begin.
- `COMPLETED`: canonical audit, required completion usage, and request finalization succeeded before the governed completion event.
- `FAILED_CONSUMED`: the pipeline failed after reservation; quota is retained because provider or other costly work may already have begun.

A duplicate ID returns HTTP 409 rather than starting another analysis. Current behavior does not replay a stored response. Clients that omit the ID remain supported, but request-level deduplication is unavailable for those calls.

Hosted governed completion is fail-closed with respect to the canonical Firestore audit: the runtime does not emit the terminal `complete` event until that audit write succeeds. Secondary audit export and aggregate telemetry are best-effort and are outside the governed completion boundary.

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
