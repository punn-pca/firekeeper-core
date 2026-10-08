import assert from 'assert';
import fs from 'node:fs';
import { estimatePromptTelemetry, resolveConversationContext } from '../src/server/services/conversationPromptBoundary';

console.log('Starting Conversation Prompt Boundary Tests...');

const hosted = resolveConversationContext({
  contextIdentityMatches: true,
  requestHistory: [{ role: 'user', content: 'CLIENT-TAMPERED' }],
  requestCompressedContext: { summary: 'CLIENT-TAMPERED' },
  persistedConversationExists: true,
  persistedConversationAuthorized: true,
  persistedConversation: {
    turns: [
      { role: 'user', content: 'canonical question' },
      { role: 'assistant', content: 'canonical answer' },
    ],
    compressedContext: { summary: 'canonical summary' },
  },
});
assert.strictEqual(hosted.source, 'server');
assert.deepStrictEqual(hosted.history, [
  { role: 'user', content: 'canonical question' },
  { role: 'assistant', content: 'canonical answer' },
]);
assert.deepStrictEqual(hosted.compressedContext, { summary: 'canonical summary' });
assert(!JSON.stringify(hosted).includes('CLIENT-TAMPERED'));

const fresh = resolveConversationContext({
  contextIdentityMatches: true,
  requestHistory: [{ role: 'user', content: 'must be dropped for a new session' }],
  persistedConversationExists: false,
});
assert.strictEqual(fresh.source, 'empty');
assert.deepStrictEqual(fresh.history, []);
assert.strictEqual(fresh.compressedContext, null);

const quarantined = resolveConversationContext({
  contextIdentityMatches: false,
  requestHistory: [{ role: 'user', content: 'cross-session' }],
  requestCompressedContext: { summary: 'cross-session' },
});
assert.strictEqual(quarantined.source, 'empty');
assert.deepStrictEqual(quarantined.history, []);
assert.strictEqual(quarantined.compressedContext, null);

const secretQuestion = 'PRIVATE-QUESTION-CONTENT';
const secretSystem = 'PRIVATE-SYSTEM-CONTENT';
const telemetry = estimatePromptTelemetry({
  systemPrompt: secretSystem,
  history: [{ role: 'user', content: 'PRIVATE-HISTORY-CONTENT' }],
  contextParts: [{ text: 'PRIVATE-CONTEXT-CONTENT' }],
  question: secretQuestion,
  conversationContextSource: 'server',
});
const serializedTelemetry = JSON.stringify(telemetry);
assert.strictEqual(telemetry.conversationContextSource, 'server');
assert.strictEqual(telemetry.historyTurns, 1);
assert(telemetry.totalEstimatedTokens > 0);
assert.strictEqual(telemetry.version, 2);
assert.strictEqual(telemetry.historyTurnsIncludedInEstimate, 1);
assert.strictEqual(telemetry.historyTurnsExcludedFromEstimate, 0);
const longHistoryTelemetry = estimatePromptTelemetry({
  systemPrompt: 'system',
  history: Array.from({ length: 200 }, (_, index) => ({ role: 'user', content: `turn ${index}` })),
  contextParts: [],
  question: 'continue',
  conversationContextSource: 'server',
});
assert.strictEqual(longHistoryTelemetry.historyTurns, 200);
assert.strictEqual(longHistoryTelemetry.historyTurnsIncludedInEstimate, 6);
assert.strictEqual(longHistoryTelemetry.historyTurnsExcludedFromEstimate, 194);

assert(!serializedTelemetry.includes('PRIVATE-'), 'Telemetry must never contain prompt content');
assert(!('systemPrompt' in telemetry));
assert(!('question' in telemetry));
assert(!('history' in telemetry));
assert(!('contextParts' in telemetry));

console.log('All Conversation Prompt Boundary tests passed!');


const serverSource = fs.readFileSync(new URL('../server.ts', import.meta.url), 'utf8');
const boundaryCalls = serverSource.match(/resolveConversationContext\s*\(/g) || [];
assert(
  boundaryCalls.length >= 2,
  'server.ts must use the shared conversation context boundary for initial and persisted context resolution'
);
assert(
  !serverSource.includes("const persistedTurns = Array.isArray(check.conversation.turns)"),
  'server.ts must not duplicate persisted-turn normalization outside the boundary helper'
);
