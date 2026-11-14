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

// Strict mode boundary: persisted turns from another mode and legacy turns
// without mode metadata are excluded. Untagged session summaries are quarantined.
const modeScopedHosted = resolveConversationContext({
  contextIdentityMatches: true,
  mode: 'normal',
  requestHistory: [
    { role: 'user', content: 'client normal', mode: 'normal' },
    { role: 'assistant', content: 'client governed', mode: 'governed' },
  ],
  requestCompressedContext: { summary: 'unscoped client summary' },
  persistedConversationExists: true,
  persistedConversationAuthorized: true,
  persistedConversation: {
    turns: [
      { role: 'user', content: 'normal question', mode: 'normal' },
      { role: 'assistant', content: 'normal answer', mode: 'normal' },
      { role: 'user', content: 'governed question', mode: 'governed' },
      { role: 'assistant', content: 'governed answer', mode: 'governed' },
      { role: 'user', content: 'legacy untagged turn' },
    ],
    compressedContext: { summary: 'mixed mode summary' },
  },
});
assert.deepStrictEqual(modeScopedHosted.history, [
  { role: 'user', content: 'normal question' },
  { role: 'assistant', content: 'normal answer' },
]);
assert.strictEqual(modeScopedHosted.compressedContext, null, 'Untagged mixed-mode summaries must not enter either model path');

const modeScopedClient = resolveConversationContext({
  contextIdentityMatches: true,
  mode: 'governed',
  requestHistory: [
    { role: 'user', content: 'normal turn', mode: 'normal' },
    { role: 'user', content: 'governed turn', mode: 'governed' },
  ],
  requestCompressedContext: { mode: 'governed', summary: 'governed-only summary' },
});
assert.deepStrictEqual(modeScopedClient.history, [{ role: 'user', content: 'governed turn' }]);
assert.deepStrictEqual(modeScopedClient.compressedContext, { mode: 'governed', summary: 'governed-only summary' });

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
