import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync('src/App.tsx', 'utf8');
assert.match(source, /let governedCompletionReceived = false;/, 'Client must track governed completion separately from transport completion');
const completeHandler = source.indexOf("eventName === 'complete'");
const governedFlag = source.indexOf('governedCompletionReceived = true', completeHandler);
const persistGuard = source.indexOf('if (governedCompletionReceived && accumulatedText', governedFlag);
const addTurn = source.indexOf('addTurnToActive(', persistGuard);
assert.ok(completeHandler >= 0 && governedFlag > completeHandler, 'Only complete event may establish governed completion');
assert.ok(persistGuard > governedFlag, 'Conversation persistence must be guarded by governed completion');
assert.ok(addTurn > persistGuard, 'Assistant turn persistence must occur inside governed-completion guard');
assert.doesNotMatch(source, /NEVER delete or hide completed\/accumulated answers/, 'Legacy partial-answer persistence policy must be removed');

console.log('Client governed completion boundary passed.');
