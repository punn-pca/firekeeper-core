# Firekeeper to Microsoft Sentinel

Firekeeper exports a metadata-only event for every completed PCA analysis to the `FirekeeperSecurity_CL` custom table through the Azure Monitor Logs Ingestion API.

## Data protection

The exporter never sends prompts, model responses, user emails, file contents, API keys, or raw audit payloads. The user identifier is SHA-256 hashed before export.

## Azure setup

1. In Microsoft Entra ID, create a single-tenant app registration named `Firekeeper Sentinel Ingestion`.
2. Create a client secret and store its **Value** in Google Cloud Secret Manager. Grant the Cloud Run runtime service account `roles/secretmanager.secretAccessor`, then expose it to Cloud Run as the `AZURE_CLIENT_SECRET` secret reference. Do not create a plaintext environment variable or commit the value.
3. Open Data collection rules > `firekeeper-security-ingestion-dcr` > Access control (IAM).
4. Add a role assignment for the app service principal: `Monitoring Metrics Publisher`.
5. Configure these server-only settings; `AZURE_CLIENT_SECRET` must be a Secret Manager reference:

```text
AZURE_TENANT_ID=<tenant ID>
AZURE_CLIENT_ID=<app registration client ID>
AZURE_CLIENT_SECRET=<Secret Manager reference, not plaintext>
AZURE_LOGS_INGESTION_ENDPOINT=https://firekeeper-security-dce-kjr7.eastus-1.ingest.monitor.azure.com
AZURE_LOGS_DCR_IMMUTABLE_ID=dcr-ecbeb68b78d94e939f5ce72aa1bcf34f
AZURE_LOGS_STREAM_NAME=Custom-FirekeeperSecurity_CL
```

Deploy Firekeeper after setting the variables. Run one analysis, then query:

```kusto
FirekeeperSecurity_CL
| order by TimeGenerated desc
```

## Exported fields

`TimeGenerated`, `EventType`, `Severity`, `ExecutionId`, `TraceId`, `UserIdHash`, `Model`, `LogLevel`, `DurationMs`, `EvidenceCount`, `ConflictCount`, `RiskCount`, `GovernanceStatus`, and `IntegrityHash`.