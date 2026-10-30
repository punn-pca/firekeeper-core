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

## Ready-to-Import Workflow Templates

The repository includes pre-built workflow templates ready for direct import into any n8n instance:

### 1. `firekeeper-n8n-template.json` (Governance & Google Workspace)
- **Path:** `firekeeper-n8n-template.json`
- **Features:** 
  - Manual Trigger / Event Ingestion
  - Calls `Firekeeper PCA Brain` (`http://127.0.0.1:3000/v1/chat/completions`) for epistemic analysis and risk tagging (`[FACT]`, `[HYPOTHESIS]`, `[RISK]`)
  - Submits proposal to `Firekeeper Governance Gate` (`/api/integrations/n8n/decisions`)
  - Side effects: Google Calendar event creation and Gmail confirmation notification

### 2. `firekeeper-executive-suite.json` (3-in-1 Executive Automation Suite)
- **Path:** `firekeeper-executive-suite.json`
- **Track 1: Morning Executive Briefing (08:00 AM Cron)**
  - Daily trigger at 08:00 AM
  - Ingests today's schedule from Google Calendar
  - Synthesizes schedule priorities and risk flags via Firekeeper PCA Brain
  - Dispatches synthesized executive briefing to Gmail
- **Track 2: On-Demand Task & Schedule Ingestion (LINE / External Webhook)**
  - Webhook endpoint (`/webhook/firekeeper-task`) and Manual Trigger
  - Firekeeper Task Parser extracts schedule date, time, and metadata from natural language text
  - Creates Google Calendar event and dispatches Gmail confirmation
- **Track 3: Immutable Google Sheets Audit & Activity Log**
  - Appends structured execution records (`Timestamp`, `Summary`, `Type`, `Epistemic_Status`, `Execution_Status`, `Calendar_Link`) directly to a Google Sheets document on Google Drive

### Expression Tip for Multilingual / Unicode Content
When passing Thai or multiline model outputs between nodes, wrap the payload in `JSON.stringify(...)` within the n8n expression to prevent syntax errors:
```javascript
={{ JSON.stringify({
  model: 'firekeeper-pca',
  messages: [
    { role: 'system', content: '...' },
    { role: 'user', content: $json.task }
  ]
}) }}
```
