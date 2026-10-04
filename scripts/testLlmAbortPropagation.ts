import assert from 'node:assert/strict';
import { callUnifiedLlmContent } from '../src/server/services/unifiedLlm';

const originalFetch = globalThis.fetch;
const controller = new AbortController();
let requests = 0;

try {
  globalThis.fetch = (async (_url: unknown, init?: RequestInit) => {
    requests++;
    assert.ok(init?.signal, 'Provider request must receive an abort signal');
    assert.notEqual(init?.signal, controller.signal, 'Provider signal should compose caller cancellation with the provider deadline');
    return new Promise<Response>((_resolve, reject) => {
      init?.signal?.addEventListener('abort', () => reject(init.signal?.reason), { once: true });
    });
  }) as typeof fetch;
  const request = callUnifiedLlmContent('test', {
    provider: 'deepseek', model: 'deepseek-chat', apiKey: 'test-key', signal: controller.signal,
  });
  controller.abort(new DOMException('Client disconnected', 'AbortError'));
  await assert.rejects(request, { name: 'AbortError' });
  assert.equal(requests, 1, 'An aborted upstream call must not be retried');
  await assert.rejects(callUnifiedLlmContent('test', {
    provider: 'deepseek', model: 'deepseek-chat', apiKey: 'test-key', signal: controller.signal,
  }), { name: 'AbortError' });
  assert.equal(requests, 1, 'An already-aborted request must not reach the provider');
} finally {
  globalThis.fetch = originalFetch;
}

console.log('Unified LLM abort propagation passed.');
