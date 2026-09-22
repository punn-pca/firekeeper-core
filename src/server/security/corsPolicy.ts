export interface CorsPolicyOptions {
  isProduction: boolean;
  configuredOrigin?: string;
}

const DEVELOPMENT_ORIGIN_PATTERNS = [
  /^http:\/\/localhost(:\d+)?$/,
  /^http:\/\/127\.0\.0\.1(:\d+)?$/,
  /^https:\/\/.*\.run\.app(:\d+)?$/,
  /^https:\/\/ai\.studio(:\d+)?$/,
  /^https:\/\/.*\.aistudio\.google\.com(:\d+)?$/,
  /^https:\/\/firekeeper\.site(:\d+)?$/,
  /^https:\/\/.*\.firekeeper\.site(:\d+)?$/,
];

function normalizeConfiguredOrigin(rawOrigin?: string): string | undefined {
  if (!rawOrigin) return undefined;
  const value = rawOrigin.trim();
  if (!value) return undefined;
  if (value === '*') return value;

  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error('SECURITY_CONFIGURATION_ERROR: APP_ORIGIN must be an absolute origin');
  }

  if (parsed.origin !== value.replace(/\/$/, '')) {
    throw new Error('SECURITY_CONFIGURATION_ERROR: APP_ORIGIN must not contain a path, query, or fragment');
  }
  return parsed.origin;
}

export function createCorsOriginPolicy(options: CorsPolicyOptions): (origin?: string) => boolean {
  const configuredOrigin = normalizeConfiguredOrigin(options.configuredOrigin);

  if (options.isProduction) {
    if (!configuredOrigin || configuredOrigin === '*') {
      throw new Error('SECURITY_CONFIGURATION_ERROR: production requires one exact HTTPS APP_ORIGIN');
    }
    if (!configuredOrigin.startsWith('https://')) {
      throw new Error('SECURITY_CONFIGURATION_ERROR: production APP_ORIGIN must use HTTPS');
    }

    return (origin?: string) => !origin || origin === configuredOrigin;
  }

  return (origin?: string) => {
    if (!origin) return true;
    if (configuredOrigin === '*' || origin === configuredOrigin) return true;
    return DEVELOPMENT_ORIGIN_PATTERNS.some((pattern) => pattern.test(origin));
  };
}
