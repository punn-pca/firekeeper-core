import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const server = readFileSync(new URL('../server.ts', import.meta.url), 'utf8');

const persistMarker = "await auditRef.set(stripUndefinedFields({ ...tieredAuditLog, ...retentionFields(userPlan, 'auditLogs') }))";
const completeMarker = "sendSSE('complete', {";
const persistIndex = server.indexOf(persistMarker);
const completeIndex = server.indexOf(completeMarker);

assert.ok(persistIndex >= 0, 'Hosted completion must await canonical audit persistence');
assert.ok(completeIndex >= 0, 'Stream must still expose a completion event');
assert.ok(persistIndex < completeIndex, 'Canonical audit persistence must occur before successful completion is emitted');
assert.match(server, /throw new Error\('AUDIT_PERSISTENCE_UNAVAILABLE'\)/, 'Unavailable hosted audit storage must fail closed');
assert.match(server, /throw new Error\('AUDIT_PERSISTENCE_FAILED'\)/, 'Failed hosted audit write must fail closed');
assert.match(server, /auditPersistenceStatus: 'PERSISTED' \| 'NOT_REQUIRED'/, 'Completion must expose audit persistence status');
assert.match(server, /void exportAuditEventToAzure\(tieredAuditLog, userId\)/, 'Secondary audit export remains non-blocking');

console.log('Audit completion durability boundary passed.');
