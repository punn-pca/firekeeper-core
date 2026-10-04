# n8n Governance Gateway

FIREKEEPER remains the decision/governance layer. n8n is the trigger and execution layer.

## Contract

All n8n service calls use:

```
Authorization: Bearer <N8N_SERVICE_TOKEN>
Content-Type: application/json
```

1. n8n obtains a FIREKEEPER Decision Record from the normal PCA flow.
2. n8n creates a governed proposal with `POST /api/integrations/n8n/decisions`.
3. The proposal always starts as `PENDING` and cannot authorize execution.
4. The proposal is bound to an existing FIREKEEPER `workspaceId`; reviewer authority is derived server-side from workspace roles.
5. An authenticated workspace owner/reviewer calls `/:decisionId/approve` or `/:decisionId/reject`.
6. Immediately before a side effect, n8n calls `/:decisionId/authorize-execution`.
7. After the side effect, n8n writes one immutable result to `/:decisionId/execution-result`.
8. Retries with the same `workspaceId + workflowId + eventId` return the existing decision instead of creating duplicates.

## Create proposal

```json
{
  "workspaceId": "workspace-123",
  "workflowId": "customer-complaint",
  "eventId": "gmail-message-123",
  "decisionRecordId": "firekeeper-decision-123",
  "summary": "Refund should be reviewed because...",
  "confidence": 0.82,
  "risk": "medium"
}
```

## Recommended n8n flow

Trigger -> normalize input -> FIREKEEPER PCA -> create proposal -> wait/poll -> human approval -> authorize execution -> side effect -> execution-result.

Never connect a side-effect node directly to model output. The authorize-execution endpoint is the final deterministic gate.
