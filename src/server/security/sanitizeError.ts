const REDACTED = '[REDACTED]';

/** Return a bounded, secret-redacted error summary safe for operational logs. */
export function sanitizeErrorForLog(error: unknown): string {
  const raw = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
  return raw
    .replace(/(authorization|x-api-key|api[-_]?key|token|secret|password)\s*[:=]\s*["']?[^\s,"'}]+/gi, `$1=${REDACTED}`)
    .replace(/bearer\s+[a-z0-9._~+\/-]+=*/gi, `Bearer ${REDACTED}`)
    .replace(/\b(sk|pk|key)-[a-z0-9_-]{12,}\b/gi, REDACTED)
    .replace(/\/\/[^\s/@:]+:[^\s/@]+@/g, `//${REDACTED}@`)
    .slice(0, 500);
}
