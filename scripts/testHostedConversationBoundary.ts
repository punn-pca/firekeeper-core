import assert from 'node:assert/strict';
import { ConversationPersistenceError, readConversationOwnership, saveOwnedConversation, deleteOwnedConversation } from '../src/server/services/conversationPersistence';

// Tests actual hosted helpers with transaction retries and injected storage failures.
// These checks do not replace live Firestore or Security Rules integration tests.
const records = new Map<string, any>();
let version = 0, failRead = false, failCommit = false;
const ref = (id: string) => ({ id, get: async () => {
  if (failRead) throw new Error('Read failed');
  return { exists: records.has(id), data: () => records.get(id) };
} });
const db = {
  collection: () => ({ doc: ref }),
  runTransaction: async (fn: (tx: any) => Promise<any>) => {
    for (let attempt = 0; attempt < 10; attempt++) {
      const readVersion = version;
      const writes: Array<() => void> = [];
      const result = await fn({ get: async (r: any) => r.get(),
        set: (r: any, value: any) => writes.push(() => records.set(r.id, value)),
        create: (r: any, value: any) => writes.push(() => { assert(!records.has(r.id)); records.set(r.id, value); }),
        delete: (r: any) => writes.push(() => records.delete(r.id)) });
      if (readVersion !== version) continue;
      if (failCommit) throw new Error('Commit failed');
      writes.forEach(write => write()); version++;
      return result;
    }
    throw new Error('Retry limit');
  }
};
const deadline = new Date(Date.now() + 86400000);
await saveOwnedConversation(db, 'alice', { id: 'private', userId: 'spoofed', title: 'Alice secret' }, deadline);
assert.equal(records.get('private').userId, 'alice');
assert.equal((await readConversationOwnership(db, 'bob', 'private')).authorized, false);
assert.equal((await readConversationOwnership(db, 'alice', 'private')).conversation.title, 'Alice secret');
const bob = await saveOwnedConversation(db, 'bob', { id: 'private', title: 'Bob' }, deadline);
assert.equal(bob.reassigned, true); assert.notEqual(bob.conversation.id, 'private');
assert.equal(records.get('private').title, 'Alice secret');
await assert.rejects(deleteOwnedConversation(db, 'bob', 'private'), (e: any) => e.code === 'CONVERSATION_FORBIDDEN');
assert(records.has('private'));
const [a, b] = await Promise.all([
  saveOwnedConversation(db, 'alice', { id: 'contended', title: 'A' }, deadline),
  saveOwnedConversation(db, 'bob', { id: 'contended', title: 'B' }, deadline) ]);
assert.notEqual(a.conversation.id, b.conversation.id, 'retry must isolate simultaneous claims');
assert.equal(records.get(a.conversation.id).userId, 'alice');
assert.equal(records.get(b.conversation.id).userId, 'bob');
failRead = true;
await assert.rejects(readConversationOwnership(db, 'alice', 'private'), ConversationPersistenceError);
await assert.rejects(saveOwnedConversation(db, 'alice', { id: 'new' }, deadline), ConversationPersistenceError);
failRead = false; failCommit = true;
await assert.rejects(saveOwnedConversation(db, 'alice', { id: 'failed-save' }, deadline), ConversationPersistenceError);
assert(!records.has('failed-save'), 'failed commit cannot be acknowledged');
await assert.rejects(deleteOwnedConversation(db, 'alice', 'private'), ConversationPersistenceError);
assert(records.has('private'));
failCommit = false;
records.set('expired', { userId: 'alice', expiresAt: new Date(0) });
assert.equal((await readConversationOwnership(db, 'alice', 'expired')).exists, false);
assert.equal((await readConversationOwnership(db, 'bob', 'expired')).authorized, false);
await deleteOwnedConversation(db, 'alice', 'private'); assert(!records.has('private'));
await assert.rejects(readConversationOwnership(null, 'alice', 'private'), ConversationPersistenceError);
console.log('Hosted conversation isolation, concurrent claim, and storage fault tests passed.');
