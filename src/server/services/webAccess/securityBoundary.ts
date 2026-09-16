/**
 * Web Access Security Boundary
 * 
 * Enforces strict isolation: Webpage content is UNTRUSTED DATA.
 * It cannot provide system instructions, execute commands, access secrets,
 * or override agent reasoning policies.
 */

const INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?(previous|prior)\s+instructions/gi,
  /you\s+are\s+now\s+(in\s+)?(developer|admin|god|debug)\s+mode/gi,
  /system\s*:\s*override/gi,
  /\[system\]/gi,
  /\[instructions?\]/gi,
  /<\|im_start\|>/gi,
  /<\|im_end\|>/gi,
  /<\/s>/gi,
  /\[\/inst\]/gi,
  /\[inst\]/gi,
  /assistant\s*:\s*you\s+must/gi,
  /exfiltrate\s+(api\s*key|secret|token|password)/gi,
  /send\s+(api\s*key|secret|credentials)\s+to/gi,
  /reveal\s+(system\s+prompt|instructions)/gi,
  /bypass\s+governance/gi,
];

/**
 * Sanitizes untrusted web content to neutralize prompt injection,
 * malicious instruction tags, and executable script payloads.
 */
export function sanitizeWebContent(rawText: string): { sanitized: string; injectionDetected: boolean } {
  if (!rawText || typeof rawText !== 'string') {
    return { sanitized: '', injectionDetected: false };
  }

  let text = rawText;
  let injectionDetected = false;

  // Check and neutralize common prompt injection vectors
  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(text)) {
      injectionDetected = true;
      text = text.replace(pattern, '[SECURITY_SCRUBBED_PROMPT_INJECTION]');
    }
  }

  // Remove control characters except standard whitespace / newlines
  text = text.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g, '');

  // Normalize excessive newlines
  text = text.replace(/\n{4,}/g, '\n\n\n');

  return {
    sanitized: text.trim(),
    injectionDetected
  };
}

/**
 * Wraps extracted web evidence into a safe, bounded passive data container.
 */
export function wrapInEvidenceEnvelope(content: string, sourceUrl: string, publisher: string): string {
  const { sanitized, injectionDetected } = sanitizeWebContent(content);
  const warning = injectionDetected
    ? '\n[SECURITY NOTICE: Potentially unsafe instruction pattern detected and neutralized in untrusted source content]\n'
    : '';

  return `<!-- UNTRUSTED_WEB_EVIDENCE_START [Publisher: ${publisher} | URL: ${sourceUrl}] -->${warning}\n${sanitized}\n<!-- UNTRUSTED_WEB_EVIDENCE_END -->`;
}
