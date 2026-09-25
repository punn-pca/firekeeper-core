import crypto from 'node:crypto';
import type { PunnAuditLogEntry } from './auditLogger';

type AzureLogsConfig = {
  tenantId: string;
  clientId: string;
  clientSecret: string;
  endpoint: string;
  dcrImmutableId: string;
  streamName: string;
};

let cachedToken: { value: string; expiresAt: number } | null = null;

function getConfig(): AzureLogsConfig | null {
  const tenantId = process.env.AZURE_TENANT_ID?.trim() || '';
  const clientId = process.env.AZURE_CLIENT_ID?.trim() || '';
  const clientSecret = process.env.AZURE_CLIENT_SECRET?.trim() || '';
  const endpoint = process.env.AZURE_LOGS_INGESTION_ENDPOINT?.trim().replace(/\/$/, '') || '';
  const dcrImmutableId = process.env.AZURE_LOGS_DCR_IMMUTABLE_ID?.trim() || '';
  const streamName = process.env.AZURE_LOGS_STREAM_NAME?.trim() || '';
  return tenantId && clientId && clientSecret && endpoint && dcrImmutableId && streamName
    ? { tenantId, clientId, clientSecret, endpoint, dcrImmutableId, streamName }
    : null;
}

async function getAccessToken(config: AzureLogsConfig): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) return cachedToken.value;
  const body = new URLSearchParams({
    client_id: config.clientId,
    client_secret: config.clientSecret,
    grant_type: 'client_credentials',
    scope: 'https://monitor.azure.com//.default',
  });
  const response = await fetch(`https://login.microsoftonline.com/${encodeURIComponent(config.tenantId)}/oauth2/v2.0/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
    signal: AbortSignal.timeout(8_000),
  });
  if (!response.ok) throw new Error(`Azure token request failed (${response.status})`);
  const payload = await response.json() as { access_token?: string; expires_in?: number };
  if (!payload.access_token) throw new Error('Azure token response did not contain an access token');
  cachedToken = { value: payload.access_token, expiresAt: Date.now() + Math.max(60, Number(payload.expires_in || 300) - 60) * 1000 };
  return payload.access_token;
}

/**
 * Exports metadata-only audit telemetry to Azure Monitor Logs. User prompts,
 * model responses, emails, and raw audit payloads never leave Firekeeper here.
 */
export async function exportAuditEventToAzure(log: PunnAuditLogEntry, userId: string): Promise<void> {
  const config = getConfig();
  if (!config) return;
  try {
    const token = await getAccessToken(config);
    const event = {
      TimeGenerated: log.timestamp || new Date().toISOString(),
      EventType: 'pca_analysis_completed',
      Severity: log.governance.hard_stop_triggered || log.counts.conflicts_count > 0 ? 'Warning' : 'Informational',
      ExecutionId: log.execution_id,
      TraceId: log.trace_id,
      UserIdHash: crypto.createHash('sha256').update(userId).digest('hex'),
      Model: log.model,
      LogLevel: log.logging_level,
      DurationMs: Math.round(Number(log.duration_ms) || 0),
      EvidenceCount: Math.round(Number(log.counts.evidence_count) || 0),
      ConflictCount: Math.round(Number(log.counts.conflicts_count) || 0),
      RiskCount: Math.round(Number(log.counts.risk_count) || 0),
      GovernanceStatus: log.governance.status,
      IntegrityHash: log.integrity.trace_hash,
    };
    const url = `${config.endpoint}/dataCollectionRules/${encodeURIComponent(config.dcrImmutableId)}/streams/${encodeURIComponent(config.streamName)}?api-version=2023-01-01`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify([event]),
      signal: AbortSignal.timeout(8_000),
    });
    if (!response.ok) console.warn(`[Azure Logs] Ingestion rejected event (${response.status}).`);
  } catch (error) {
    // Telemetry must never interrupt an analysis response or expose credentials.
    console.warn('[Azure Logs] Audit export failed:', error instanceof Error ? error.message : 'unknown error');
  }
}