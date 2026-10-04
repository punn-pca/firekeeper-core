import crypto from 'crypto';
import type { Express, Request, Response, NextFunction, RequestHandler } from 'express';

type AdminDb = any;

type RegisterOptions = {
  adminDb: AdminDb;
  firestoreAvailable: () => boolean;
  requireAuth: RequestHandler;
};

type DecisionStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
type ExecutionStatus = 'SUCCEEDED' | 'FAILED' | 'CANCELLED';

function workspaceRole(workspace: any, userId: string): 'owner' | 'reviewer' | 'analyst' | 'viewer' | null {
  if (!workspace || !userId) return null;
  if (workspace.ownerId === userId) return 'owner';
  const member = Array.isArray(workspace.members) ? workspace.members.find((entry: any) => entry?.userId === userId) : null;
  return member && ['reviewer', 'analyst', 'viewer'].includes(member.role) ? member.role : null;
}

function canReviewWorkspace(workspace: any, userId: string): boolean {
  const role = workspaceRole(workspace, userId);
  return role === 'owner' || role === 'reviewer';
}

function deterministicDecisionId(workspaceId: string, workflowId: string, eventId: string): string {
  return crypto.createHash('sha256').update(`${workspaceId}\u0000${workflowId}\u0000${eventId}`).digest('hex');
}

function serviceToken(req: Request): string {
  const header = String(req.headers.authorization || '');
  return header.startsWith('Bearer ') ? header.slice(7).trim() : '';
}

function timingSafeTokenEqual(actual: string, expected: string): boolean {
  if (!actual || !expected) return false;
  const a = Buffer.from(actual);
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function requireN8nService(req: Request, res: Response, next: NextFunction) {
  const expected = String(process.env.N8N_SERVICE_TOKEN || '').trim();
  if (!expected) return res.status(503).json({ error: 'N8N_INTEGRATION_NOT_CONFIGURED' });
  if (!timingSafeTokenEqual(serviceToken(req), expected)) {
    return res.status(401).json({ error: 'N8N_SERVICE_UNAUTHORIZED' });
  }
  next();
}

function cleanString(value: unknown, max = 4000): string {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

function cleanStringArray(value: unknown, maxItems = 20): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => cleanString(item, 256)).filter(Boolean).slice(0, maxItems);
}

export function registerN8nGovernanceGateway(app: Express, options: RegisterOptions): void {
  const { adminDb, firestoreAvailable, requireAuth } = options;

  const storageReady = () => Boolean(adminDb && firestoreAvailable());
  const decisions = () => adminDb.collection('n8n_decisions');

  app.get('/api/integrations/n8n/health', requireN8nService, (_req, res) => {
    res.json({
      ok: true,
      integration: 'n8n',
      governance: 'human-approval-required',
      storage: storageReady() ? 'available' : 'unavailable'
    });
  });

  // n8n submits an already-produced FIREKEEPER decision proposal here.
  // This endpoint NEVER authorizes execution. Execution remains blocked until
  // a human listed in allowedApproverUids explicitly approves the record.
  app.post('/api/integrations/n8n/decisions', requireN8nService, async (req, res) => {
    if (!storageReady()) return res.status(503).json({ error: 'N8N_STORAGE_UNAVAILABLE' });

    const workflowId = cleanString(req.body?.workflowId, 256);
    const eventId = cleanString(req.body?.eventId, 256);
    const workspaceId = cleanString(req.body?.workspaceId, 256);
    const summary = cleanString(req.body?.summary, 12000);

    if (!workflowId || !eventId || !workspaceId || !summary || workspaceId.includes('/')) {
      return res.status(400).json({ error: 'INVALID_N8N_DECISION', required: ['workflowId', 'eventId', 'workspaceId', 'summary'] });
    }

    const workspace = await adminDb.collection('workspaces').doc(workspaceId).get();
    if (!workspace.exists) return res.status(404).json({ error: 'N8N_WORKSPACE_NOT_FOUND' });
    const workspaceData = workspace.data() || {};
    const hasReviewer = Boolean(workspaceData.ownerId) || (Array.isArray(workspaceData.members) && workspaceData.members.some((entry: any) => entry?.role === 'reviewer'));
    if (!hasReviewer) return res.status(409).json({ error: 'N8N_WORKSPACE_REVIEWER_REQUIRED' });

    const id = deterministicDecisionId(workspaceId, workflowId, eventId);
    const existing = await decisions().doc(id).get();
    if (existing.exists) {
      const data = existing.data() || {};
      return res.status(200).json({ decisionId: id, status: data.status, executionAuthorized: data.executionAuthorized === true, approvalRequired: data.status === 'PENDING', idempotentReplay: true });
    }
    const now = new Date().toISOString();
    const record = {
      id,
      source: 'n8n',
      workflowId,
      eventId,
      workspaceId,
      summary,
      confidence: Number.isFinite(Number(req.body?.confidence)) ? Math.max(0, Math.min(1, Number(req.body.confidence))) : null,
      risk: cleanString(req.body?.risk, 64) || 'unknown',
      decisionRecordId: cleanString(req.body?.decisionRecordId, 256) || null,
      status: 'PENDING' as DecisionStatus,
      executionAuthorized: false,
      createdAt: now,
      updatedAt: now,
      reviewedAt: null,
      reviewedBy: null,
      execution: null
    };

    await decisions().doc(id).set(record);
    return res.status(201).json({
      decisionId: id,
      status: record.status,
      executionAuthorized: false,
      approvalRequired: true
    });
  });

  app.get('/api/integrations/n8n/decisions/:decisionId', requireN8nService, async (req, res) => {
    if (!storageReady()) return res.status(503).json({ error: 'N8N_STORAGE_UNAVAILABLE' });
    const snap = await decisions().doc(String(req.params.decisionId)).get();
    if (!snap.exists) return res.status(404).json({ error: 'N8N_DECISION_NOT_FOUND' });
    const data = snap.data();
    return res.json({
      decisionId: snap.id,
      status: data?.status,
      executionAuthorized: data?.status === 'APPROVED' && data?.executionAuthorized === true,
      reviewedAt: data?.reviewedAt || null
    });
  });

  // n8n must call this immediately before every side effect. A PENDING or
  // REJECTED decision can never receive an execution grant.
  app.post('/api/integrations/n8n/decisions/:decisionId/authorize-execution', requireN8nService, async (req, res) => {
    if (!storageReady()) return res.status(503).json({ error: 'N8N_STORAGE_UNAVAILABLE' });
    const snap = await decisions().doc(String(req.params.decisionId)).get();
    if (!snap.exists) return res.status(404).json({ error: 'N8N_DECISION_NOT_FOUND' });
    const data = snap.data() || {};
    const authorized = data.status === 'APPROVED' && data.executionAuthorized === true;
    if (!authorized) {
      return res.status(409).json({
        error: 'HUMAN_APPROVAL_REQUIRED',
        status: data.status || 'PENDING',
        executionAuthorized: false
      });
    }
    return res.json({ decisionId: snap.id, status: 'APPROVED', executionAuthorized: true, workspaceId: data.workspaceId });
  });

  app.post('/api/integrations/n8n/decisions/:decisionId/execution-result', requireN8nService, async (req, res) => {
    if (!storageReady()) return res.status(503).json({ error: 'N8N_STORAGE_UNAVAILABLE' });
    const executionStatus = cleanString(req.body?.status, 32).toUpperCase() as ExecutionStatus;
    if (!['SUCCEEDED', 'FAILED', 'CANCELLED'].includes(executionStatus)) return res.status(400).json({ error: 'INVALID_N8N_EXECUTION_STATUS' });
    const ref = decisions().doc(String(req.params.decisionId));
    const result = await adminDb.runTransaction(async (tx: any) => {
      const snap = await tx.get(ref);
      if (!snap.exists) return 'NOT_FOUND';
      const data = snap.data() || {};
      if (data.status !== 'APPROVED' || data.executionAuthorized !== true) return 'NOT_AUTHORIZED';
      if (data.execution) return 'ALREADY_RECORDED';
      const now = new Date().toISOString();
      tx.update(ref, { execution: { status: executionStatus, summary: cleanString(req.body?.summary, 4000) || null, recordedAt: now }, updatedAt: now });
      return 'OK';
    });
    if (result === 'NOT_FOUND') return res.status(404).json({ error: 'N8N_DECISION_NOT_FOUND' });
    if (result === 'NOT_AUTHORIZED') return res.status(409).json({ error: 'N8N_EXECUTION_NOT_AUTHORIZED' });
    if (result === 'ALREADY_RECORDED') return res.status(409).json({ error: 'N8N_EXECUTION_RESULT_ALREADY_RECORDED' });
    return res.status(201).json({ decisionId: req.params.decisionId, executionStatus });
  });

  const review = (status: 'APPROVED' | 'REJECTED') => [
    requireAuth,
    async (req: Request, res: Response) => {
      if (!storageReady()) return res.status(503).json({ error: 'N8N_STORAGE_UNAVAILABLE' });
      const userId = cleanString((req as any).userId, 256);
      const ref = decisions().doc(String(req.params.decisionId));
      const result = await adminDb.runTransaction(async (tx: any) => {
        const snap = await tx.get(ref);
        if (!snap.exists) return 'NOT_FOUND';
        const data = snap.data() || {};
        if (data.status !== 'PENDING') return 'ALREADY_REVIEWED';
        const workspace = await tx.get(adminDb.collection('workspaces').doc(String(data.workspaceId || '')));
        if (!workspace.exists || !canReviewWorkspace(workspace.data(), userId)) return 'FORBIDDEN';
        const now = new Date().toISOString();
        tx.update(ref, {
          status,
          executionAuthorized: status === 'APPROVED',
          reviewedAt: now,
          reviewedBy: userId,
          updatedAt: now
        });
        return 'OK';
      });
      if (result === 'NOT_FOUND') return res.status(404).json({ error: 'N8N_DECISION_NOT_FOUND' });
      if (result === 'ALREADY_REVIEWED') return res.status(409).json({ error: 'N8N_DECISION_ALREADY_REVIEWED' });
      if (result === 'FORBIDDEN') return res.status(403).json({ error: 'N8N_WORKSPACE_REVIEWER_REQUIRED' });
      return res.json({ decisionId: req.params.decisionId, status, executionAuthorized: status === 'APPROVED' });
    }
  ] as RequestHandler[];

  app.post('/api/integrations/n8n/decisions/:decisionId/approve', ...review('APPROVED'));
  app.post('/api/integrations/n8n/decisions/:decisionId/reject', ...review('REJECTED'));
}
