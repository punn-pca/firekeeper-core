import assert from 'node:assert/strict';
import { createProviderDeadlineSignal, DEFAULT_LLM_TIMEOUT_MS } from '../src/server/services/unifiedLlm';

assert.equal(DEFAULT_LLM_TIMEOUT_MS, 60_000, 'Default provider deadline must remain bounded at 60 seconds');

const parent = new AbortController();
const composed = createProviderDeadlineSignal(parent.signal, 1_000);
assert.equal(composed.signal.aborted, false);
parent.abort(new Error('CLIENT_ABORT'));
await new Promise((resolve) => setTimeout(resolve, 0));
assert.equal(composed.signal.aborted, true, 'Caller abort must propagate into provider signal');
composed.cleanup();

const deadline = createProviderDeadlineSignal(undefined, 10);
assert.equal(deadline.signal.aborted, false);
await new Promise((resolve) => setTimeout(resolve, 25));
assert.equal(deadline.signal.aborted, true, 'Provider signal must abort when deadline expires');
assert.match(String(deadline.signal.reason?.message || deadline.signal.reason), /LLM_PROVIDER_TIMEOUT/);
deadline.cleanup();

const alreadyAborted = new AbortController();
alreadyAborted.abort(new Error('ALREADY_ABORTED'));
assert.throws(() => createProviderDeadlineSignal(alreadyAborted.signal, 1_000), /ALREADY_ABORTED/);

console.log('Unified LLM provider deadline boundary passed.');
