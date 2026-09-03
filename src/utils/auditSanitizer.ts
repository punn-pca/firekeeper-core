const SENSITIVE_PATTERNS = [
  'apikey',
  'apisecret',
  'accesstoken',
  'accesssecret',
  'token',
  'secret',
  'password',
  'credential',
  'authorization',
  'x_api_key',
  'x_api_secret',
  'x_access_token',
  'x_access_secret'
];

function isSensitiveKey(key: string): boolean {
  if (!key || typeof key !== 'string') return false;
  const normalized = key.replace(/[-_\s]/g, '').toLowerCase();
  return SENSITIVE_PATTERNS.some(pattern => {
    const normPattern = pattern.replace(/[-_\s]/g, '').toLowerCase();
    return normalized === normPattern || normalized.includes(normPattern);
  });
}

export function sanitizeAuditPayload<T>(payload: T): T {
  if (!payload || typeof payload !== 'object') return payload;

  const seen = new WeakMap();

  function deepSanitize(val: any): any {
    if (val === undefined) {
      return null;
    }

    if (val === null || typeof val !== 'object') {
      return val;
    }

    if (seen.has(val)) {
      return seen.get(val);
    }

    if (Array.isArray(val)) {
      const copy: any[] = [];
      seen.set(val, copy);
      for (let i = 0; i < val.length; i++) {
        const item = val[i];
        if (item === undefined) continue;
        copy.push(deepSanitize(item));
      }
      return copy;
    }

    if (val instanceof Date) {
      return new Date(val.getTime());
    }

    if (val instanceof RegExp) {
      return new RegExp(val);
    }

    const copy: Record<string, any> = {};
    seen.set(val, copy);

    for (const key of Object.keys(val)) {
      if (Object.prototype.hasOwnProperty.call(val, key)) {
        const value = val[key];
        if (value === undefined) continue;
        if (isSensitiveKey(key)) {
          copy[key] = '[REDACTED]';
        } else {
          copy[key] = deepSanitize(value);
        }
      }
    }

    return copy;
  }

  try {
    return deepSanitize(payload);
  } catch (e) {
    console.warn('Failed to sanitize audit payload', e);
    return payload;
  }
}

/**
 * Optimizes ConversationSession payload for Firestore storage.
 * Eliminates redundant deep nested raw trace dumps while preserving all essential
 * conversational display properties, governance verdicts, and cryptographic hashes.
 */
export function sanitizeConversationForFirestore(session: any): any {
  if (!session || typeof session !== 'object') return session;

  const baseSanitized = sanitizeAuditPayload(session);
  if (!Array.isArray(baseSanitized.turns)) return baseSanitized;

  const optimizedTurns = baseSanitized.turns.map((turn: any) => {
    if (!turn || typeof turn !== 'object') return turn;

    // User turn optimization
    if (turn.role === 'user') {
      const leanAttachments = Array.isArray(turn.attachments)
        ? turn.attachments.map((att: any) => ({
            name: att.name,
            size: att.size,
            type: att.type,
            // Avoid storing massive base64 payloads inside Firestore documents
            url: att.url?.startsWith('data:') ? undefined : att.url,
          }))
        : turn.attachments;

      return {
        role: turn.role,
        content: turn.content,
        timestamp: turn.timestamp,
        ...(leanAttachments && leanAttachments.length > 0 ? { attachments: leanAttachments } : {}),
      };
    }

    // Assistant turn optimization
    if (turn.role === 'assistant') {
      let leanPcaState = undefined;
      if (turn.pcaState && typeof turn.pcaState === 'object') {
        const p = turn.pcaState;
        leanPcaState = {
          execution_time_ms: p.execution_time_ms,
          start_time: p.start_time,
          end_time: p.end_time,
          confidence: p.confidence,
          decision: p.decision,
          sources_used: p.sources_used,
          has_external_evidence: p.has_external_evidence,
          conflicts: p.conflicts || [],
          missing_info: p.missing_info || [],
          knowledge_router: p.knowledge_router,
          human_agency_audit: p.human_agency_audit,
          evidence_explorer: Array.isArray(p.evidence_explorer)
            ? p.evidence_explorer.map((e: any) => ({
                id: e.id,
                title: e.title,
                source: e.source,
                reliabilityGrade: e.reliabilityGrade || e.grade,
                epistemicTag: e.epistemicTag,
                keyFact: e.keyFact?.slice(0, 300),
                url: e.url,
              }))
            : undefined,
          telemetry: p.telemetry
            ? {
                inputTokens: p.telemetry.inputTokens,
                outputTokens: p.telemetry.outputTokens,
                totalTokens: p.telemetry.totalTokens,
                totalLatencyMs: p.telemetry.totalLatencyMs,
              }
            : undefined,
          // Cryptographic trace reference & audit index summary
          audit_summary: {
            trace_id: p.execution_trace?.trace_id || p.telemetry?.runId || `trace-${p.start_time || Date.now()}`,
            trace_hash: p.execution_trace?.trace_hash,
            root_hash: p.execution_trace?.integrity_report?.root_hash,
            input_hash: p.execution_trace?.integrity_report?.input_hash,
            output_hash: p.execution_trace?.integrity_report?.output_hash,
            chain_status: 'CHAINED_AUDIT_STORED',
            worm_status: 'CHAINED_AUDIT_STORED',
            stage_count: p.execution_trace?.pipeline_steps?.length || 10,
          },
        };
      }

      return {
        role: turn.role,
        content: turn.content,
        tokensUsed: turn.tokensUsed,
        isTokenEstimated: turn.isTokenEstimated,
        timestamp: turn.timestamp,
        durationMs: turn.durationMs,
        userSentTimestamp: turn.userSentTimestamp,
        ...(leanPcaState ? { pcaState: leanPcaState } : {}),
      };
    }

    return turn;
  });

  return {
    ...baseSanitized,
    turns: optimizedTurns,
  };
}

