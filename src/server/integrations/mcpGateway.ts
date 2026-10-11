import type { Express, Request, Response } from 'express';
import crypto from 'node:crypto';
import { secureOutboundFetch } from '../security/outboundUrlPolicy';
import { requireAuth, requireAdmin } from '../middleware/auth';

/** Stateless MCP JSON-RPC bridge. No arbitrary remote URL or write tools are exposed. */
const VERSION = '2025-03-26';
const tools = [
  { name: 'firekeeper_capabilities', description: 'Read public Firekeeper capabilities (no private user data).', inputSchema: { type: 'object', properties: {}, additionalProperties: false } },
];
const reply = (id: unknown, result: unknown) => ({ jsonrpc: '2.0', id, result });
const error = (id: unknown, code: number, message: string) => ({ jsonrpc: '2.0', id: id ?? null, error: { code, message } });
const isId = (id: unknown) => typeof id === 'string' || typeof id === 'number';
const isObject = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value);

export function handleMcpRequest(body: unknown): { status: number; body?: unknown } {
  if (!isObject(body) || body.jsonrpc !== '2.0' || typeof body.method !== 'string') return { status: 400, body: error(null, -32600, 'Invalid Request') };
  if (!isId(body.id)) return { status: 202 }; // notifications have no response
  switch (body.method) {
    case 'initialize':
      return { status: 200, body: reply(body.id, { protocolVersion: VERSION, capabilities: { tools: { listChanged: false } }, serverInfo: { name: 'firekeeper-core', version: '1.0.0' } }) };
    case 'ping': return { status: 200, body: reply(body.id, {}) };
    case 'tools/list': return { status: 200, body: reply(body.id, { tools }) };
    case 'tools/call': {
      const params = body.params;
      if (!isObject(params) || params.name !== 'firekeeper_capabilities') return { status: 200, body: error(body.id, -32602, 'Unknown or invalid tool') };
      return { status: 200, body: reply(body.id, { content: [{ type: 'text', text: JSON.stringify({ name: 'Firekeeper', architecture: 'PCA v3.0', principle: 'AI assists. Humans decide.', access: 'read-only' }) }] }) };
    }
    default: return { status: 200, body: error(body.id, -32601, 'Method not found') };
  }
}

export async function callRemoteMcp(url: string, method: 'initialize' | 'tools/list' | 'tools/call', params?: Record<string, unknown>) {
  if (typeof url !== 'string' || url.length > 2048) throw new Error('Invalid MCP URL');
  if (method === 'tools/call' && (!params || typeof params.name !== 'string')) throw new Error('Tool name required');
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000);
  try {
    const response = await secureOutboundFetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json', accept: 'application/json, text/event-stream', 'mcp-protocol-version': VERSION },
      body: JSON.stringify({ jsonrpc: '2.0', id: crypto.randomUUID(), method, ...(params ? { params } : method === 'initialize' ? { params: { protocolVersion: VERSION, capabilities: {}, clientInfo: { name: 'firekeeper-core', version: '1.0.0' } } } : {}) }),
      signal: controller.signal,
    }, 'mcpServerUrl');
    if (!response.ok) throw new Error('MCP upstream returned HTTP ' + response.status);
    const type = response.headers.get('content-type') || '';
    if (!type.includes('application/json')) throw new Error('MCP upstream must return JSON in this initial transport');
    const raw = await response.text();
    if (raw.length > 256000) throw new Error('MCP response too large');
    const data: unknown = JSON.parse(raw);
    if (!isObject(data) || data.jsonrpc !== '2.0') throw new Error('Invalid MCP response');
    return data;
  } finally { clearTimeout(timer); }
}

export function registerMcpIntegration(app: Express): void {
  // Protected server endpoint: existing Firebase/session authentication.
  app.post('/api/mcp', requireAuth, (req: Request, res: Response) => {
    const result = handleMcpRequest(req.body);
    if (result.status === 202) { res.status(202).end(); return; }
    res.status(result.status).json(result.body);
  });
  // Admin-only client bridge; no persistent credentials and no automatic tool execution.
  app.post('/api/admin/mcp/client', requireAuth, requireAdmin, async (req: Request, res: Response) => {
    const { url, method, params } = req.body || {};
    if (typeof url !== 'string' || !['initialize', 'tools/list'].includes(method)) {
      res.status(400).json({ error: 'Only MCP initialize and tools/list are enabled. Tool calls require a separate approval workflow.' });
      return;
    }
    try { res.json(await callRemoteMcp(url, method)); }
    catch { res.status(502).json({ error: 'MCP upstream connection failed or was blocked by security policy' }); }
  });
}
