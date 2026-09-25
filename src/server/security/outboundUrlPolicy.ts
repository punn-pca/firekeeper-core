import dns from 'node:dns/promises';
import net from 'node:net';
import tls from 'node:tls';
import { Agent, fetch as undiciFetch } from 'undici';

// Node's DOM fetch declarations and Undici's bundled declarations describe the
// same runtime Web APIs with nominally different stream types. Keep that bridge
// local to the dispatcher call rather than spreading unsafe casts through the
// application.
const fetchWithDispatcher = undiciFetch as unknown as (
  input: string,
  init: RequestInit & { dispatcher: Agent }
) => Promise<Response>;

const BLOCKED_HOSTNAMES = new Set([
  'localhost',
  'metadata',
  'metadata.google.internal',
  'metadata.aws.internal',
  'metadata.azure.internal',
]);

export interface OutboundUrlPolicyOptions {
  allowPrivateNetwork?: boolean;
}

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

  const dottedMapped = normalized.match(/::ffff:(\d+\.\d+\.\d+\.\d+)$/)?.[1];
  if (dottedMapped) return isBlockedIpv4(dottedMapped);

  const hexMapped = normalized.match(/::ffff:([0-9a-f]{1,4}):([0-9a-f]{1,4})$/);
  if (hexMapped) {
    const high = Number.parseInt(hexMapped[1], 16);
    const low = Number.parseInt(hexMapped[2], 16);
    return isBlockedIpv4([
      (high >> 8) & 0xff,
      high & 0xff,
      (low >> 8) & 0xff,
      low & 0xff,
    ].join('.'));
  }

  return false;
}

export function isBlockedNetworkAddress(address: string): boolean {
  const version = net.isIP(address);
  if (version === 4) return isBlockedIpv4(address);
  if (version === 6) return isBlockedIpv6(address);
  return true;
}

interface ResolvedOutboundUrl {
  url: string;
  hostname: string;
  addresses: Array<{ address: string; family: number }>;
}

async function resolveOutboundUrl(
  rawUrl: string,
  fieldName: string,
  options: OutboundUrlPolicyOptions
): Promise<ResolvedOutboundUrl> {
  if (typeof rawUrl !== 'string' || rawUrl.trim().length === 0 || rawUrl.length > 2048) {
    throw new Error(`${fieldName} must be a non-empty URL`);
  }

  let parsed: URL;
  try {
    parsed = new URL(rawUrl.trim());
  } catch {
    throw new Error(`${fieldName} is not a valid URL`);
  }

  const allowPrivate = options.allowPrivateNetwork === true;
  if (parsed.protocol !== 'https:' && !(allowPrivate && parsed.protocol === 'http:')) {
    throw new Error(`${fieldName} must use HTTPS`);
  }
  if (parsed.username || parsed.password) {
    throw new Error(`${fieldName} must not contain embedded credentials`);
  }

  const hostname = parsed.hostname.toLowerCase().replace(/^\[|\]$/g, '').replace(/\.$/, '');
  if (!allowPrivate && (
    BLOCKED_HOSTNAMES.has(hostname) ||
    hostname.endsWith('.localhost') ||
    hostname.endsWith('.local') ||
    hostname.endsWith('.internal')
  )) {
    throw new Error(`${fieldName} points to a blocked host`);
  }

  let addresses: Array<{ address: string; family: number }>;
  const literalVersion = net.isIP(hostname);
  if (literalVersion) {
    addresses = [{ address: hostname, family: literalVersion }];
  } else {
    try {
      addresses = await dns.lookup(hostname, { all: true, verbatim: true });
    } catch {
      throw new Error(`${fieldName} hostname could not be resolved`);
    }
  }

  if (addresses.length === 0 || (!allowPrivate && addresses.some(({ address }) => isBlockedNetworkAddress(address)))) {
    throw new Error(`${fieldName} resolves to a private or reserved network`);
  }

  parsed.hash = '';
  return {
    url: parsed.toString().replace(/\/+$/, ''),
    hostname,
    addresses,
  };
}

export async function validateOutboundBaseUrl(
  rawUrl: string,
  fieldName = 'baseUrl',
  options: OutboundUrlPolicyOptions = {}
): Promise<string> {
  return (await resolveOutboundUrl(rawUrl, fieldName, options)).url;
}

/**
 * Resolve once, reject every unsafe answer, then pin the HTTP client's DNS lookup
 * to the already-approved address set. This closes the validate/fetch DNS-rebinding
 * window. Redirects are rejected instead of being followed to an unvalidated host.
 */
export async function secureOutboundFetch(
  input: string,
  init: RequestInit = {},
  fieldName = 'baseUrl',
  options: OutboundUrlPolicyOptions = {}
): Promise<Response> {
  const resolved = await resolveOutboundUrl(input, fieldName, options);
  // Pin the connection at the socket layer. Replacing the URL hostname with an
  // IP breaks CDN virtual hosts; a TLS connector retains the original host/SNI
  // while dialing only the pre-validated address.
  const pinnedAddress = resolved.addresses[0];
  const dispatcher = new Agent({
    connect: (connectOptions, callback) => {
      if (connectOptions.protocol !== 'https:') {
        callback(new Error(`${fieldName} requires HTTPS for secure outbound fetch`), null);
        return;
      }
      const socket = tls.connect({
        host: pinnedAddress.address,
        port: Number(connectOptions.port) || 443,
        servername: resolved.hostname,
        ALPNProtocols: ['http/1.1'],
      });
      const onError = (error: Error) => callback(error, null);
      socket.once('error', onError);
      socket.once('secureConnect', () => {
        socket.removeListener('error', onError);
        callback(null, socket);
      });
    },
  });

  let cleanupTimer: ReturnType<typeof setTimeout> | undefined;
  const closeDispatcher = () => {
    if (cleanupTimer) clearTimeout(cleanupTimer);
    void dispatcher.close();
  };

  try {
    // Use Undici's fetch with its matching Agent. Node's global fetch may be
    // backed by a different Undici version, which ignores or misreads this
    // dispatcher's DNS-pinning lookup and makes every outbound request fail.
    const response = await fetchWithDispatcher(resolved.url, {
      ...init,
      redirect: 'error',
      dispatcher,
    } as RequestInit & { dispatcher: Agent });

    cleanupTimer = setTimeout(closeDispatcher, 5 * 60 * 1000);
    cleanupTimer.unref?.();

    if (!response.body) {
      closeDispatcher();
      return response;
    }

    const monitoredBody = response.body.pipeThrough(new TransformStream({
      flush: closeDispatcher,
    }));

    return new Response(monitoredBody, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
    });
  } catch (error) {
    closeDispatcher();
    throw error;
  }
}
