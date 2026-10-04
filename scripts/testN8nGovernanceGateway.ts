import assert from 'node:assert/strict';
import express from 'express';
import { registerN8nGovernanceGateway } from '../src/server/integrations/n8nGateway';

type RecordMap = Map<string, any>;

function createFakeDb() {
  const records: RecordMap = new Map();
  const workspaces: RecordMap = new Map([['ws-1', { ownerId: 'owner-1', members: [{ userId: 'reviewer-1', role: 'reviewer' }] }]]);
  const doc = (id: string) => ({
    async set(value: any) { records.set(id, structuredClone(value)); },
    async get() {
      const value = records.get(id);
      return { exists: value !== undefined, id, data: () => structuredClone(value) };
    }
  });
  return {
    records,
    collection(name: string) { if (name === 'workspaces') return { doc: (id: string) => ({ __id: `workspace:${id}`, async get() { const value = workspaces.get(id); return { exists: value !== undefined, id, data: () => structuredClone(value) }; } }) }; return { doc }; },
    async runTransaction(fn: any) {
      return fn({
        async get(ref: any) { return ref.get(); },
        update(ref: any, patch: any) {
          const current = records.get(ref.__id);
          records.set(ref.__id, { ...current, ...structuredClone(patch) });
        }
      });
    }
  };
}

async function main() {
  process.env.N8N_SERVICE_TOKEN = 'test-service-secret';
  const db: any = createFakeDb();

  // Decorate refs so the transaction fake can identify records.
  db.collection = (name: string) => ({
    doc(id: string) {
      if (name === 'workspaces') return { __id: `workspace:${id}`, async get() { const value = workspaces.get(id); return { exists: value !== undefined, id, data: () => structuredClone(value) }; } };

      const ref: any = {
        __id: id,
        async set(value: any) { db.records.set(id, structuredClone(value)); },
        async get() {
          const value = db.records.get(id);
          return { exists: value !== undefined, id, data: () => structuredClone(value) };
        }
      };
      return ref;
    }
  });

  const app = express();
  app.use(express.json());
  const requireAuth: any = (req: any, res: any, next: any) => {
    const uid = String(req.headers['x-test-user'] || '');
    if (!uid) return res.status(401).json({ error: 'Unauthorized' });
    req.userId = uid;
    next();
  };
  registerN8nGovernanceGateway(app, {
    adminDb: db,
    firestoreAvailable: () => true,
    requireAuth
  });

  const server = app.listen(0);
  await new Promise<void>((resolve) => server.once('listening', resolve));
  const address: any = server.address();
  const base = `http://127.0.0.1:${address.port}`;

  try {
    let response = await fetch(`${base}/api/integrations/n8n/health`, {
      headers: { Authorization: 'Bearer wrong' }
    });
    assert.equal(response.status, 401, 'wrong service token must be rejected');

    response = await fetch(`${base}/api/integrations/n8n/decisions`, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer test-service-secret',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        workflowId: 'wf-1',
        eventId: 'evt-1',
        summary: 'Human review required',
        confidence: 0.99,
        risk: 'high',
        workspaceId: 'ws-1'
      })
    });
    assert.equal(response.status, 201);
    const created: any = await response.json();
    assert.equal(created.status, 'PENDING');
    assert.equal(created.executionAuthorized, false);
    assert.equal(created.approvalRequired, true);
    const decisionId = created.decisionId;

    response = await fetch(`${base}/api/integrations/n8n/decisions`, { method: 'POST', headers: { Authorization: 'Bearer test-service-secret', 'Content-Type': 'application/json' }, body: JSON.stringify({ workflowId: 'wf-1', eventId: 'evt-1', workspaceId: 'ws-1', summary: 'Human review required' }) });
    assert.equal(response.status, 200, 'retry must be idempotent');
    assert.equal((await response.json() as any).decisionId, decisionId);

    response = await fetch(`${base}/api/integrations/n8n/decisions/${decisionId}/authorize-execution`, {
      method: 'POST',
      headers: { Authorization: 'Bearer test-service-secret' }
    });
    assert.equal(response.status, 409, 'pending decision must not execute');
    assert.equal((await response.json() as any).error, 'HUMAN_APPROVAL_REQUIRED');

    response = await fetch(`${base}/api/integrations/n8n/decisions/${decisionId}/approve`, {
      method: 'POST',
      headers: { 'x-test-user': 'intruder' }
    });
    assert.equal(response.status, 403, 'unlisted human must not approve');

    response = await fetch(`${base}/api/integrations/n8n/decisions/${decisionId}/approve`, {
      method: 'POST',
      headers: { 'x-test-user': 'reviewer-1' }
    });
    assert.equal(response.status, 200);
    const approved: any = await response.json();
    assert.equal(approved.status, 'APPROVED');
    assert.equal(approved.executionAuthorized, true);

    response = await fetch(`${base}/api/integrations/n8n/decisions/${decisionId}/authorize-execution`, {
      method: 'POST',
      headers: { Authorization: 'Bearer test-service-secret' }
    });
    assert.equal(response.status, 200);
    assert.equal((await response.json() as any).executionAuthorized, true);

    response = await fetch(`${base}/api/integrations/n8n/decisions/${decisionId}/execution-result`, { method: 'POST', headers: { Authorization: 'Bearer test-service-secret', 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'SUCCEEDED', summary: 'side effect completed' }) });
    assert.equal(response.status, 201, 'authorized execution result must be recorded');

    response = await fetch(`${base}/api/integrations/n8n/decisions/${decisionId}/execution-result`, { method: 'POST', headers: { Authorization: 'Bearer test-service-secret', 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'SUCCEEDED' }) });
    assert.equal(response.status, 409, 'execution result must be immutable');

    response = await fetch(`${base}/api/integrations/n8n/decisions/${decisionId}/reject`, {
      method: 'POST',
      headers: { 'x-test-user': 'reviewer-1' }
    });
    assert.equal(response.status, 409, 'reviewed decision must be immutable');

    console.log('n8n governance gateway boundary tests passed');
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
