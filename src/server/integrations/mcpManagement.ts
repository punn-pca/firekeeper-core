import type { Express, Request, Response } from 'express';
import crypto from 'node:crypto';
import { requireAuth, requireAdmin } from '../middleware/auth';
import { adminDb } from '../infrastructure/firebase';
import { secureOutboundFetch, validateOutboundBaseUrl } from '../security/outboundUrlPolicy';

type Permission = 'read' | 'write' | 'execute';
type Entry = { id: string; name: string; url: string; enabled: boolean; permissions: Permission[]; createdAt: string };
const collection = () => adminDb?.collection('mcp_server_configs');
const clean = (v: any): Entry => ({ id: String(v.id), name: String(v.name), url: String(v.url), enabled: v.enabled === true, permissions: (['read','write','execute'] as Permission[]).filter(p => v.permissions?.includes(p)), createdAt: String(v.createdAt) });
export function registerMcpManagement(app: Express): void {
  const guard = [requireAuth, requireAdmin];
  app.get('/api/admin/mcp/servers', ...guard, async (_req: Request, res: Response) => {
    try { const db = collection(); if (!db) return res.status(503).json({ error: 'MCP_STORAGE_UNAVAILABLE' });
      const snap = await db.limit(100).get(); return res.json({ servers: snap.docs.map(d => clean({ ...d.data(), id: d.id })) }); }
    catch { return res.status(503).json({ error: 'MCP_STORAGE_UNAVAILABLE' }); }
  });
  app.post('/api/admin/mcp/servers', ...guard, async (req: Request, res: Response) => {
    try {
      const { name, url, permissions } = req.body || {};
      if (typeof name !== 'string' || !name.trim() || name.length > 80 || !Array.isArray(permissions) || permissions.some(p => !['read','write','execute'].includes(p))) return res.status(400).json({ error: 'INVALID_MCP_CONFIG' });
      const safeUrl = await validateOutboundBaseUrl(url, 'mcpUrl');
      const db = collection(); if (!db) return res.status(503).json({ error: 'MCP_STORAGE_UNAVAILABLE' });
      const id = crypto.randomUUID(); const entry: Entry = { id, name: name.trim(), url: safeUrl, enabled: false, permissions: [...new Set(permissions)] as Permission[], createdAt: new Date().toISOString() };
      await db.doc(id).set(entry); return res.status(201).json({ server: entry });
    } catch { return res.status(400).json({ error: 'INVALID_OR_UNSAFE_MCP_URL' }); }
  });
  app.patch('/api/admin/mcp/servers/:id', ...guard, async (req: Request, res: Response) => {
    try { const db = collection(); if (!db) return res.status(503).json({ error: 'MCP_STORAGE_UNAVAILABLE' });
      const doc = db.doc(req.params.id); const snap = await doc.get(); if (!snap.exists) return res.status(404).json({ error: 'NOT_FOUND' });
      const changes: Partial<Entry> = {};
      if ('enabled' in req.body) { if (typeof req.body.enabled !== 'boolean') return res.status(400).json({ error: 'INVALID_ENABLED' }); changes.enabled = req.body.enabled; }
      if ('permissions' in req.body) { if (!Array.isArray(req.body.permissions) || req.body.permissions.some((p: unknown) => !['read','write','execute'].includes(String(p)))) return res.status(400).json({ error: 'INVALID_PERMISSIONS' }); changes.permissions = [...new Set(req.body.permissions)] as Permission[]; }
      await doc.update(changes); return res.json({ server: clean({ ...snap.data(), ...changes, id: snap.id }) });
    } catch { return res.status(503).json({ error: 'MCP_UPDATE_FAILED' }); }
  });
  app.delete('/api/admin/mcp/servers/:id', ...guard, async (req: Request, res: Response) => {
    try { const db = collection(); if (!db) return res.status(503).json({ error: 'MCP_STORAGE_UNAVAILABLE' }); await db.doc(req.params.id).delete(); return res.json({ ok: true }); }
    catch { return res.status(503).json({ error: 'MCP_DELETE_FAILED' }); }
  });
  app.post('/api/admin/mcp/servers/:id/test', ...guard, async (req: Request, res: Response) => {
    try { const db = collection(); if (!db) return res.status(503).json({ error: 'MCP_STORAGE_UNAVAILABLE' });
      const snap = await db.doc(req.params.id).get(); if (!snap.exists) return res.status(404).json({ error: 'NOT_FOUND' });
      const entry = clean({ ...snap.data(), id: snap.id });
      const response = await secureOutboundFetch(entry.url, { method: 'POST', redirect: 'manual', signal: AbortSignal.timeout(8000), headers: { 'Content-Type': 'application/json', 'Accept': 'application/json, text/event-stream', 'MCP-Protocol-Version': '2025-06-18' }, body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'firekeeper', version: '1.0' } } }) }, 'mcpUrl');
      // Test only: never expose remote body or automatically grant tool execution.
      return res.json({ ok: response.ok, status: response.status, contentType: response.headers.get('content-type') || '' });
    } catch { return res.status(502).json({ ok: false, error: 'MCP_CONNECTION_FAILED' }); }
  });
}
