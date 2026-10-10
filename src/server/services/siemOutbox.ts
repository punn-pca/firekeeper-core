import crypto from 'node:crypto';
import type { AzureAuditEvent } from './azureLogsIngestion';

type OutboxRecord = {
  event: AzureAuditEvent;
  status: 'PENDING' | 'DELIVERING' | 'RETRY' | 'DELIVERED' | 'FAILED';
  attempts: number;
  createdAt: string;
  nextAttemptAt?: string;
  leaseUntil?: string;
};

const MAX_ATTEMPTS = 12;
const LEASE_MS = 60_000;
const MAX_BACKOFF_MS = 60 * 60_000;

export function siemOutboxId(event: AzureAuditEvent): string {
  return crypto.createHash('sha256')
    .update(`${event.ExecutionId}:${event.IntegrityHash}`)
    .digest('hex');
}

export async function enqueueSiemEvent(db: any, event: AzureAuditEvent): Promise<void> {
  const ref = db.collection('siem_outbox').doc(siemOutboxId(event));
  await db.runTransaction(async (transaction: any) => {
    const existing = await transaction.get(ref);
    if (existing.exists) return;
    const now = new Date().toISOString();
    transaction.create(ref, {
      event,
      status: 'PENDING',
      attempts: 0,
      createdAt: now,
      nextAttemptAt: now,
    } satisfies OutboxRecord);
  });
}

export async function dispatchSiemOutbox(
  db: any,
  send: (event: AzureAuditEvent) => Promise<void>,
  batchSize = 25,
): Promise<{ delivered: number; retried: number; failed: number }> {
  const snapshot = await db.collection('siem_outbox')
    .where('status', 'in', ['PENDING', 'RETRY', 'DELIVERING'])
    .limit(Math.max(1, Math.min(100, batchSize)))
    .get();
  const counts = { delivered: 0, retried: 0, failed: 0 };

  for (const doc of snapshot.docs) {
    const ref = doc.ref;
    const claimed = await db.runTransaction(async (transaction: any) => {
      const current = await transaction.get(ref);
      if (!current.exists) return null;
      const record = current.data() as OutboxRecord;
      const nowMs = Date.now();
      if (record.status === 'DELIVERED' || record.status === 'FAILED') return null;
      if (record.status === 'DELIVERING' && Date.parse(record.leaseUntil || '') > nowMs) return null;
      if (Date.parse(record.nextAttemptAt || '') > nowMs) return null;
      transaction.update(ref, { status: 'DELIVERING', leaseUntil: new Date(nowMs + LEASE_MS).toISOString() });
      return record.event;
    });
    if (!claimed) continue;

    try {
      await send(claimed);
      await ref.update({ status: 'DELIVERED', deliveredAt: new Date().toISOString(), leaseUntil: null, lastErrorCode: null });
      counts.delivered += 1;
    } catch (error) {
      const retry = await db.runTransaction(async (transaction: any) => {
        const current = await transaction.get(ref);
        if (!current.exists) return 'FAILED';
        const attempts = Number(current.data()?.attempts || 0) + 1;
        const failed = attempts >= MAX_ATTEMPTS;
        const delayMs = Math.min(MAX_BACKOFF_MS, 1000 * 2 ** Math.min(attempts, 12));
        transaction.update(ref, {
          status: failed ? 'FAILED' : 'RETRY',
          attempts,
          nextAttemptAt: failed ? null : new Date(Date.now() + delayMs).toISOString(),
          leaseUntil: null,
          lastErrorCode: error instanceof Error ? error.message.slice(0, 100) : 'UNKNOWN_DELIVERY_ERROR',
          ...(failed ? { failedAt: new Date().toISOString() } : {}),
        });
        return failed ? 'FAILED' : 'RETRY';
      });
      counts[retry === 'FAILED' ? 'failed' : 'retried'] += 1;
    }
  }
  return counts;
}
