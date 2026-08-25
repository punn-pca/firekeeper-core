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

