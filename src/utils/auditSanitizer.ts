export function sanitizeAuditPayload<T>(payload: T): T {
  if (!payload) return payload;
  
  try {
    const sanitized = JSON.parse(JSON.stringify(payload));
    
    const deepClean = (obj: any) => {
      if (typeof obj !== 'object' || obj === null) return;
      
      if (Array.isArray(obj)) {
        for (const item of obj) {
          deepClean(item);
        }
        return;
      }
      
      for (const key in obj) {
        if (typeof obj[key] === 'object') {
          deepClean(obj[key]);
        }
      }
    };
    
    deepClean(sanitized);
    return sanitized;
  } catch (e) {
    console.warn('Failed to sanitize audit payload', e);
    return payload;
  }
}
