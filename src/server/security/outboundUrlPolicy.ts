import dns from 'node:dns/promises';
import net from 'node:net';

const BLOCKED_HOSTNAMES = new Set([
  'localhost',
  'metadata',
  'metadata.google.internal',
  'metadata.aws.internal',
  'metadata.azure.internal',
]);

function isBlockedIpv4(address: string): boolean {
  const octets = address.split('.').map(Number);
  if (octets.length !== 4 || octets.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) {
    return true;
  }

  const [a, b, c] = octets;
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 0 && c === 0) ||
    (a === 192 && b === 0 && c === 2) ||
    (a === 192 && b === 168) ||
    (a === 198 && (b === 18 || b === 19)) ||
    (a === 198 && b === 51 && c === 100) ||
    (a === 203 && b === 0 && c === 113) ||
    a >= 224
  );
}

function isBlockedIpv6(address: string): boolean {
  const normalized = address.toLowerCase().split('%')[0];
  if (
    normalized === '::' ||
    normalized === '::1' ||
    normalized.startsWith('fc') ||
    normalized.startsWith('fd') ||
    /^fe[89ab]/.test(normalized)
  ) {
    return true;
  }

  const mappedIpv4 = normalized.match(/::ffff:(\d+\.\d+\.\d+\.\d+)$/)?.[1];
  return mappedIpv4 ? isBlockedIpv4(mappedIpv4) : false;
}

export function isBlockedNetworkAddress(address: string): boolean {
  const version = net.isIP(address);
  if (version === 4) return isBlockedIpv4(address);
  if (version === 6) return isBlockedIpv6(address);
  return true;
}

/**
 * Validate a user-controlled outbound base URL before it reaches any HTTP client.
 * Hosted mode intentionally permits HTTPS public endpoints only. Local/private
 * Ollama must be used from offline mode instead of being proxied by the server.
 */
export async function validateOutboundBaseUrl(rawUrl: string, fieldName = 'baseUrl'): Promise<string> {
  if (typeof rawUrl !== 'string' || rawUrl.trim().length === 0 || rawUrl.length > 2048) {
    throw new Error(`${fieldName} must be a non-empty HTTPS URL`);
  }

  let parsed: URL;
  try {
    parsed = new URL(rawUrl.trim());
  } catch {
    throw new Error(`${fieldName} is not a valid URL`);
  }

  if (parsed.protocol !== 'https:') {
    throw new Error(`${fieldName} must use HTTPS`);
  }
  if (parsed.username || parsed.password) {
    throw new Error(`${fieldName} must not contain embedded credentials`);
  }

  const hostname = parsed.hostname.toLowerCase().replace(/\.$/, '');
  if (
    BLOCKED_HOSTNAMES.has(hostname) ||
    hostname.endsWith('.localhost') ||
    hostname.endsWith('.local') ||
    hostname.endsWith('.internal')
  ) {
    throw new Error(`${fieldName} points to a blocked host`);
  }

  const literalVersion = net.isIP(hostname);
  if (literalVersion && isBlockedNetworkAddress(hostname)) {
    throw new Error(`${fieldName} points to a private or reserved network`);
  }

  let resolved: Array<{ address: string; family: number }>;
  try {
    resolved = await dns.lookup(hostname, { all: true, verbatim: true });
  } catch {
    throw new Error(`${fieldName} hostname could not be resolved`);
  }

  if (resolved.length === 0 || resolved.some(({ address }) => isBlockedNetworkAddress(address))) {
    throw new Error(`${fieldName} resolves to a private or reserved network`);
  }

  parsed.hash = '';
  return parsed.toString().replace(/\/+$/, '');
}

export async function secureOutboundFetch(
  input: string,
  init: RequestInit = {},
  fieldName = 'baseUrl'
): Promise<Response> {
  const validatedUrl = await validateOutboundBaseUrl(input, fieldName);
  return fetch(validatedUrl, {
    ...init,
    redirect: 'error',
  });
}
