import SHA256 from 'crypto-js/sha256';

export function calculateRecordHash(payload: any, previousHash: string): string {
  const canonicalPayload = JSON.stringify(payload, Object.keys(payload).sort());
  return SHA256(canonicalPayload + previousHash).toString();
}

export function sanitizeAutonomousAudit(audit: any): any {
  // Deep copy to avoid mutating original
  const sanitized = JSON.parse(JSON.stringify(audit));
  
  // Explicitly remove potential sensitive fields
  const sensitiveFields = ['apiKey', 'apiSecret', 'accessToken', 'refreshToken', 'authToken', 'password', 'authorization'];
  
  const redactAndClean = (obj: any) => {
    if (typeof obj !== 'object' || obj === null) return;
    
    if (Array.isArray(obj)) {
      for (const item of obj) {
        redactAndClean(item);
      }
      return;
    }
    
    for (const key in obj) {
      if (sensitiveFields.includes(key) || key.toLowerCase().includes('secret') || key.toLowerCase().includes('token')) {
        obj[key] = '[REDACTED]';
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        redactAndClean(obj[key]);
      }
    }
  };
  
  redactAndClean(sanitized);
  return sanitized;
}

export function verifyAutonomousAuditIntegrity(logs: any[]): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  if (!logs || logs.length === 0) {
    return { isValid: true, errors };
  }

  // Sort logs by tickNumber ascending to verify chain from start to end
  const sortedLogs = [...logs].sort((a, b) => {
    return (a.tickNumber || 0) - (b.tickNumber || 0);
  });

  let previousHash = 'INITIAL';

  for (let i = 0; i < sortedLogs.length; i++) {
    const log = sortedLogs[i];
    const metadata = log.integrity;

    if (!metadata) {
      errors.push(`Log tick ${log.tickNumber} is missing integrity metadata.`);
      continue;
    }

    if (!metadata.record_hash) {
      errors.push(`Log tick ${log.tickNumber} is missing record_hash.`);
    }

    if (metadata.previous_record_hash !== previousHash) {
      errors.push(`Log tick ${log.tickNumber} has broken chain. Expected previous_record_hash '${previousHash}', got '${metadata.previous_record_hash}'.`);
    }

    // Verify current hash by recreating the payload without integrity
    const { integrity, ...payloadToHash } = log;
    const sanitized = sanitizeAutonomousAudit(payloadToHash);
    const recalculatedHash = calculateRecordHash(sanitized, previousHash);
    
    if (recalculatedHash !== metadata.record_hash) {
      errors.push(`Log tick ${log.tickNumber} has invalid record_hash. Expected '${recalculatedHash}', got '${metadata.record_hash}'.`);
    }

    previousHash = metadata.record_hash;
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}