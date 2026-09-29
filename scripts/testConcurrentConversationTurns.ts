import assert from 'node:assert/strict';
import type { ConversationSession, ConversationTurn } from '../src/types';
import { appendTurnPair } from '../src/utils/conversationTurnMerge';
import { sanitizeConversationForFirestore } from '../src/utils/auditSanitizer';

const session: ConversationSession = {
  id: 'session-1', userId: 'user-1', title: 'Initial', created_at: '2026-01-01', updated_at: '2026-01-01', turns: [],
};
const pair = (prefix: string): [ConversationTurn, ConversationTurn] => [
  { id: `${prefix}-user`, role: 'user', content: prefix },
  { id: `${prefix}-assistant`, role: 'assistant', content: `${prefix}-reply` },
];
const [aUser, aAssistant] = pair('device-a');
const [bUser, bAssistant] = pair('device-b');
const afterA = appendTurnPair(session, aUser, aAssistant, 'First');
const afterB = appendTurnPair(afterA, bUser, bAssistant, 'Second');
assert.deepEqual(afterB.turns.map(turn => turn.id), [aUser.id, aAssistant.id, bUser.id, bAssistant.id]);
assert.equal(afterB.title, 'First');
assert.equal(appendTurnPair(afterB, aUser, aAssistant, 'Duplicate'), afterB);
const stored = sanitizeConversationForFirestore(afterB) as ConversationSession;
assert.deepEqual(stored.turns.map(turn => turn.id), afterB.turns.map(turn => turn.id));
console.log('Concurrent conversation turn merge checks passed.');
