import assert from 'node:assert/strict';
import { deleteOwnedMemory } from '../src/server/services/memoryPersistence';

const records = new Map([['m1', { userId: 'alice' }], ['m2', { userId: 'bob' }]]);
let fail = false;
const db = {
  collection: () => ({ doc: (id: string) => ({ id }) }),
  runTransaction: async (fn: (tx: any) => Promise<boolean>) => {
    if (fail) throw new Error('Firestore unavailable');
    return fn({
      get: async (ref: { id: string }) => ({ exists: records.has(ref.id), data: () => records.get(ref.id) }),
      delete: (ref: { id: string }) => records.delete(ref.id)
    });
  }
};

assert.equal(await deleteOwnedMemory(db, 'alice', 'm2'), false);
assert.equal(records.has('m2'), true, 'another user cannot delete this record');
assert.equal(await deleteOwnedMemory(db, 'alice', 'missing'), false);
fail = true;
await assert.rejects(deleteOwnedMemory(db, 'alice', 'm1'));
assert.equal(records.has('m1'), true, 'remote failures must not be reported as deletion');
fail = false;
assert.equal(await deleteOwnedMemory(db, 'alice', 'm1'), true);
assert.equal(records.has('m1'), false);
console.log('Memory ownership and atomic deletion tests passed.');
